# LegisDoc - Dashboard de Análise SUS & UEQ 📊✨

Este projeto é uma ferramenta interativa e dinâmica baseada em **Python Flask**, **Pandas** e **Chart.js** projetada para analisar e exibir os resultados de usabilidade de formulários de avaliação utilizando as metodologias **SUS (System Usability Scale)** e **UEQ-S (User Experience Questionnaire Short)**.

Desenvolvido especialmente para o Trabalho de Conclusão de Curso (TCC), o dashboard fornece um painel contemporâneo, responsivo e rico em dados para justificar cientificamente a qualidade da experiência do usuário no sistema **LegisDoc**.

---

## 🚀 Recursos Principais

* **Visual Premium e Responsivo:** Painel moderno com design sofisticado (estilo Slate/Indigo) utilizando as fontes *Outfit* e *Inter*, cards dinâmicos com sombras suaves e layouts adaptáveis para qualquer tela.
* **Métricas SUS Avançadas:**
  * Escore individual e classificação de faixa automática (*Excelente*, *Aceitável*, *Marginal* ou *Baixa Usabilidade*).
  * Média geral robusta exibida em KPI card com badge colorido indicativo de satisfação.
* **Divisão de Qualidade do UEQ:**
  * Consolidação das 8 perguntas em 5 dimensões (*Clareza*, *Eficiência*, *Confiabilidade*, *Estimulação* e *Novidade*).
  * Agrupamento oficial das macro-dimensões: **Qualidade Pragmática** (relação com a tarefa) e **Qualidade Hedônica** (relação com a empolgação do usuário).
* **Análise de Perfil Demográfico:**
  * Mapeamento da maturidade tecnológica dos respondentes através de gráficos interativos (pizza, rosca e barras) cobrando experiência digital geral e frequência de uso do sistema atual.
* **Análise Cruzada de Dados (Maturidade vs. Usabilidade):**
  * Gráfico interativo com **duplo eixo Y** correlacionando o nível de maturidade do participante com as notas médias do SUS e UEQ, provando a intuitividade do sistema para diferentes públicos.
* **Feedbacks Qualitativos Estruturados:**
  * Exibição elegante dos pontos positivos observados e sugestões de melhoria em formato de painel de feedbacks dinâmico.
* **Upload de CSV Dinâmico (Tempo Real):**
  * Zona de arrastar e soltar (Drag & Drop) para importar novos arquivos CSV. A interface recalcula e atualiza **todos** os gráficos e tabelas instantaneamente no frontend via requisições assíncronas in-memory, sem necessidade de recarregar a página!
* **Transparência de Cálculos:**
  * Seção dedicada exibindo detalhadamente a lógica matemática adotada e tabelas coloridas mostrando o dado bruto da resposta do participante comparado ao valor ajustado no cálculo.

---

## 🛠️ Como Usar

### Pré-requisitos
Certifique-se de ter o **Python 3.8+** instalado.

### Configuração e Execução (Windows PowerShell)

```powershell
# 1. Criar ambiente virtual
python -m venv .venv

# 2. Ativar o ambiente virtual
.venv\Scripts\Activate.ps1

# 3. Instalar as dependências
pip install -r requirements.txt

# 4. Executar o servidor
python app.py
```

### Configuração e Execução (macOS / Linux)

```bash
# 1. Criar ambiente virtual
python3 -m venv .venv

# 2. Ativar o ambiente virtual
source .venv/bin/activate

# 3. Instalar as dependências
pip install -r requirements.txt

# 4. Executar o servidor
python app.py
```

O servidor iniciará automaticamente em modo de desenvolvimento na porta `5000`. Acesse:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

*Nota: Cabeçalhos de desativação de cache estão ativos no servidor Flask para evitar a retenção de dados antigos no navegador durante o desenvolvimento.*

---

## 📖 Entendimento das Fórmulas de Cálculo

### System Usability Scale (SUS)
* Consiste em 10 perguntas de escala linear (1 a 5).
* **Ajuste de Valência:** Como o formulário adotou todas as respostas positivas alinhadas ao lado direito da escala (5), o cálculo adota o fator de compatibilidade **`resposta - 1`** para todas as questões.
* A soma dos valores ajustados é multiplicada por `2.5` para gerar a nota individual do participante (escala de 0 a 100).
* A média geral do SUS é a média aritmética simples dos escores individuais.

### User Experience Questionnaire (UEQ)
* Consiste em 8 perguntas de escala linear (1 a 7).
* Cada resposta é convertida para a escala padrão do UEQ de `-3 a +3` subtraindo-se `4` de cada valor (`resposta - 4`).
* A média por pergunta é calculada considerando todas as respostas.
* As dimensões são formadas por:
  * **Clareza** (Perguntas 1 e 2)
  * **Eficiência** (Pergunta 3)
  * **Confiabilidade** (Pergunta 4)
  * **Estimulação** (Perguntas 5 e 6)
  * **Novidade** (Perguntas 7 e 8)
* A **Qualidade Pragmática** corresponde à média das dimensões *Clareza*, *Eficiência* e *Confiabilidade*.
* A **Qualidade Hedônica** corresponde à média das dimensões *Estimulação* e *Novidade*.

---

## 📂 Estrutura do Projeto

```text
├── .gitignore               # Configurações de ignorados do Git
├── README.md                # Documentação do projeto
├── requirements.txt         # Pacotes necessários
├── app.py                   # Servidor Flask com rotas de API e upload
├── data_processing.py       # Módulo Python com lógicas de análise e conversão
├── static/
│   ├── css/
│   │   └── style.css        # Estilos premium do Dashboard (Slate/Indigo)
│   └── js/
│       ├── charts.js        # Controlador do frontend (Gráficos, tabelas e upload)
│       └── main.js          # Arquivo auxiliar
└── templates/
    └── index.html           # Template da interface principal do Dashboard
```

---

## 🎓 Créditos e Licença
Desenvolvido sob encomenda para validação empírica do protótipo **LegisDoc**. Destinado para fins acadêmicos e científicos (TCC).
