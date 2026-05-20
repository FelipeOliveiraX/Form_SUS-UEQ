import json
import numpy as np
import pandas as pd
from pathlib import Path

CSV_FILE = Path('Formulário - Avaliação do Protótipo 2.csv')

SUS_COLS = [
    'Você acredita que poderia usar esse sistema frequentemente?',
    'Você considera que o sistema possui muita complexidade?',
    'Você acredita que o sistema é fácil de usar?',
    'Você imagina que precisará de suporte técnico para conseguir usar o sistema?',
    'Você percebe que as funções do sistema são bem integradas?',
    'Você considera que o sistema é consistente?',
    'Você acredita que a maioria das pessoas podem aprender a usar o sistema rapidamente?',
    'Você acha que o fluxo de trabalho torna o sistema muito complicado de usar?',
    'Você se sentiu confiante ao utilizar o sistema?',
    'Você acredita que precisa aprender muitas coisas antes de conseguir utilizar o sistema?'
]

UEQ_COLS = [
    'Os botões e comandos do sistema são claros/intuitivos?',
    'A execução das funcionalidades do sistema é complicada ou fácil de entender?',
    'O sistema permite que você realize tarefas de forma rápida?',
    'Os recursos do sistema atrapalham ou ajudam você a realizar suas tarefas?',
    'O uso do sistema é interessante para você?',
    'A interação com o sistema gera empolgação?',
    'Você classifica o sistema como comum/convencional ou como inovador?',
    'Você considera o sistema comum ou tecnologicamente avançado?'
]

UEQ_DIMENSIONS = {
    'Os botões e comandos do sistema são claros/intuitivos?': 'Clareza',
    'A execução das funcionalidades do sistema é complicada ou fácil de entender?': 'Clareza',
    'O sistema permite que você realize tarefas de forma rápida?': 'Eficiência',
    'Os recursos do sistema atrapalham ou ajudam você a realizar suas tarefas?': 'Confiabilidade',
    'O uso do sistema é interessante para você?': 'Estimulação',
    'A interação com o sistema gera empolgação?': 'Estimulação',
    'Você classifica o sistema como comum/convencional ou como inovador?': 'Novidade',
    'Você considera o sistema comum ou tecnologicamente avançado?': 'Novidade'
}


def to_numeric(df: pd.DataFrame, cols):
    for col in cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df


def calculate_sus_score(row):
    adjusted = []
    for i, col in enumerate(SUS_COLS, start=1):
        value = row.get(col, np.nan)
        if pd.isna(value):
            adjusted.append(np.nan)
        else:
            # Formulário possui todas as boas notas à direita (5).
            # Para compatibilidade, aplicamos `resposta - 1` a todas as perguntas SUS.
            # (Isto é equivalente a inverter respostas pares e então aplicar 5 - invertido.)
            adjusted.append(value - 1)
    return np.nansum(adjusted) * 2.5


def convert_ueq_value(v):
    if pd.isna(v):
        return np.nan
    v = float(v)
    if 1 <= v <= 7:
        return v - 4
    return np.nan


def interpret_sus(score):
    if pd.isna(score):
        return 'Sem dados'
    if score < 50:
        return 'Baixa usabilidade'
    if score < 70:
        return 'Usabilidade marginal'
    if score < 80:
        return 'Aceitável'
    return 'Excelente / alta usabilidade'


def interpret_ueq(score):
    if pd.isna(score):
        return 'Sem dados'
    if score < -0.8:
        return 'Negativo'
    if score <= 0.8:
        return 'Neutro'
    return 'Positivo'


def process_csv(path_or_buffer=CSV_FILE):
    # Support path, string, or file-like buffer
    if isinstance(path_or_buffer, (str, Path)):
        df = pd.read_csv(path_or_buffer, encoding='utf-8', sep=',')
    else:
        df = pd.read_csv(path_or_buffer, encoding='utf-8', sep=',')
        
    # Strip whitespaces from column headers to prevent matching issues
    df.columns = df.columns.str.strip()
    
    df = to_numeric(df, SUS_COLS + UEQ_COLS)

    # SUS
    df['SUS'] = df.apply(calculate_sus_score, axis=1)
    df['SUS_faixa'] = df['SUS'].apply(interpret_sus)

    # SUS adjusted values for transparency
    for i, col in enumerate(SUS_COLS, start=1):
        if col in df.columns:
            # use resposta - 1 for all SUS items (formulario uses positive to the right for all)
            df[f'{col} - SUS ajustado'] = df[col].apply(lambda v: (v - 1) if pd.notna(v) else np.nan)

    # UEQ items converted
    for col in UEQ_COLS:
        if col in df.columns:
            df[f'{col} - UEQ convertido'] = df[col].apply(convert_ueq_value)

    ueq_converted = [f'{col} - UEQ convertido' for col in UEQ_COLS if f'{col} - UEQ convertido' in df.columns]
    df['UEQ_media_geral'] = df[ueq_converted].mean(axis=1) if ueq_converted else np.nan
    df['UEQ_faixa'] = df['UEQ_media_geral'].apply(interpret_ueq)

    # UEQ mean by question across all participants
    ueq_question_means = {}
    for col in UEQ_COLS:
        converted_col = f'{col} - UEQ convertido'
        if converted_col in df.columns:
            ueq_question_means[col] = float(df[converted_col].mean(skipna=True))

    # UEQ mean by dimension from question means
    dimension_means = {}
    for dim in set(UEQ_DIMENSIONS.values()):
        questions = [q for q, d in UEQ_DIMENSIONS.items() if d == dim]
        vals = [ueq_question_means[q] for q in questions if q in ueq_question_means]
        dimension_means[dim] = float(np.mean(vals)) if vals else np.nan

    # overall UEQ mean from all question means
    overall_ueq_mean = float(np.mean(list(ueq_question_means.values()))) if ueq_question_means else np.nan

    # UEQ Macro dimensions (Pragmatic Quality vs Hedonic Quality)
    PRAGMATIC_DIMENSIONS = ['Clareza', 'Eficiência', 'Confiabilidade']
    HEDONIC_DIMENSIONS = ['Estimulação', 'Novidade']

    pragmatic_vals = [dimension_means[d] for d in PRAGMATIC_DIMENSIONS if d in dimension_means and pd.notna(dimension_means[d])]
    hedonic_vals = [dimension_means[d] for d in HEDONIC_DIMENSIONS if d in dimension_means and pd.notna(dimension_means[d])]

    pragmatic_mean = float(np.mean(pragmatic_vals)) if pragmatic_vals else 0.0
    hedonic_mean = float(np.mean(hedonic_vals)) if hedonic_vals else 0.0

    # Demographics and usage profile
    demographics = {}
    
    # 1. Experience with digital systems
    exp_col = 'Qual seu nível de experiência geral com aplicativos e sistemas digitais?'
    if exp_col in df.columns:
        demographics['digital_experience'] = df[exp_col].value_counts().to_dict()
        
    # 2. Used current system?
    used_col = 'Você já utilizou o sistema atual de gestão de documentos?'
    if used_col in df.columns:
        demographics['used_current_system'] = df[used_col].value_counts().to_dict()
        
    # 3. Experience with current system
    exp_curr_col = 'Qual seu nível de experiência geral com o sistema atual de gestão dos documentos?'
    if exp_curr_col in df.columns:
        demographics['current_system_experience'] = df[exp_curr_col].value_counts().to_dict()
        
    # 4. Time using current system
    time_curr_col = 'Há quanto tempo você utiliza o sistema atual de gestão dos documentos?'
    if time_curr_col in df.columns:
        demographics['current_system_time'] = df[time_curr_col].value_counts().to_dict()
        
    # 5. Frequency of use
    freq_col = 'Com que frequência você utiliza o sistema atual de gestão dos documentos?'
    if freq_col in df.columns:
        demographics['use_frequency'] = df[freq_col].value_counts().to_dict()

    # Correlation between digital experience and SUS/UEQ
    experience_correlation = []
    if exp_col in df.columns:
        grouped = df.groupby(exp_col)
        for name, group in grouped:
            sus_m = group['SUS'].mean()
            ueq_m = group['UEQ_media_geral'].mean()
            experience_correlation.append({
                'experience': str(name),
                'sus_mean': float(sus_m) if pd.notna(sus_m) else 0.0,
                'ueq_mean': float(ueq_m) if pd.notna(ueq_m) else 0.0,
                'count': int(len(group))
            })

    # prepare summary
    summary = {
        'n_participants': len(df),
        'sus': {
            'scores': df['SUS'].fillna(None).tolist(),
            'faixas': df['SUS_faixa'].tolist(),
            'stats': df['SUS'].describe().to_dict(),
            'media_geral': float(df['SUS'].mean()) if len(df) else None
        },
        'ueq': {
            'items': {col: df[col].fillna(None).tolist() for col in ueq_converted},
            'media_geral': df['UEQ_media_geral'].fillna(None).tolist(),
            'question_order': UEQ_COLS,
            'question_means': ueq_question_means,
            'dimension_means': dimension_means,
            'pragmatic_mean': pragmatic_mean,
            'hedonic_mean': hedonic_mean,
            'overall_mean': overall_ueq_mean,
            'faixas': df['UEQ_faixa'].tolist(),
            'stats': df['UEQ_media_geral'].describe().to_dict()
        },
        'demographics': demographics,
        'experience_correlation': experience_correlation,
        'open_questions': {
            'positive': [{'index': i+1, 'text': text} for i, text in enumerate(df.get('Quais pontos positivos você percebeu no sistema proposto?', pd.Series(['']*len(df))).fillna('').tolist()) if text.strip() != ''],
            'improvements': [{'index': i+1, 'text': text} for i, text in enumerate(df.get('Quais melhorias você sugere para o sistema proposto?', pd.Series(['']*len(df))).fillna('').tolist()) if text.strip() != '']
        }
    }

    # include raw responses and adopted values for transparency
    raw_sus_headers = []
    for col in SUS_COLS:
        if col in df.columns:
            raw_sus_headers.append(col)
        adjusted_col = f'{col} - SUS ajustado'
        if adjusted_col in df.columns:
            raw_sus_headers.append(adjusted_col)
    raw_sus_headers.append('SUS')

    raw_ueq_headers = []
    for col in UEQ_COLS:
        if col in df.columns:
            raw_ueq_headers.append(col)
        converted_col = f'{col} - UEQ convertido'
        if converted_col in df.columns:
            raw_ueq_headers.append(converted_col)

    raw_sus = []
    raw_ueq = []
    for _, r in df.iterrows():
        sus_entry = {}
        for c in raw_sus_headers:
            sus_entry[c] = (None if pd.isna(r.get(c)) else r.get(c))
        raw_sus.append(sus_entry)

        ueq_entry = {}
        for c in raw_ueq_headers:
            ueq_entry[c] = (None if pd.isna(r.get(c)) else r.get(c))
        raw_ueq.append(ueq_entry)

    # human-readable description of calculations
    calculation_method = {
        'SUS': (
            'SUS (System Usability Scale) — 10 perguntas em escala 1..5. ' 
            'ATENÇÃO: o formulário foi construído com todas as respostas positivas no lado direito (5). '
            'Portanto, para compatibilidade, aplicamos `resposta - 1` a todas as 10 perguntas SUS. ' 
            'Isto é equivalente a inverter as questões pares e depois aplicar 5 - invertido. ' 
            'Somam-se os 10 valores ajustados do participante e multiplica-se por 2.5 para obter a pontuação SUS individual. ' 
            'A média geral de SUS é a média das pontuações individuais de todos os participantes.'
        ),
        'UEQ': (
            'UEQ (versão reduzida) — 8 perguntas em escala 1..7. ' 
            'Cada resposta é convertida para -3..+3 subtraindo 4. ' 
            'A média de cada pergunta é calculada considerando todas as respostas dos participantes. ' 
            'A média de cada dimensão é a média das médias das perguntas que pertencem à dimensão. ' 
            'As dimensões de Clareza, Eficiência e Confiabilidade constituem a Qualidade Pragmática. '
            'As dimensões de Estimulação e Novidade constituem a Qualidade Hedônica. '
            'A média geral de UEQ é a média de todas as médias por pergunta.'
        ),
        'UEQ_dimensions_mapping': UEQ_DIMENSIONS
    }

    summary['raw_sus'] = raw_sus
    summary['raw_sus_headers'] = raw_sus_headers
    summary['raw_ueq'] = raw_ueq
    summary['raw_ueq_headers'] = raw_ueq_headers
    summary['calculation_method'] = calculation_method

    return summary


if __name__ == '__main__':
    s = process_csv()
    print(json.dumps(s, indent=2, ensure_ascii=False))
