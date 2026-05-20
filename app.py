from flask import Flask, render_template, jsonify, request
from pathlib import Path
import io
import data_processing as dp

app = Flask(__name__, template_folder='templates', static_folder='static')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/data')
def api_data():
    summary = dp.process_csv(Path('Formulário - Avaliação do Protótipo 2.csv'))
    return jsonify(summary)


@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    if file and file.filename.endswith('.csv'):
        try:
            # Read file stream as string buffer
            content = file.stream.read().decode('utf-8-sig', errors='ignore')
            stream = io.StringIO(content)
            summary = dp.process_csv(stream)
            return jsonify(summary)
        except Exception as e:
            return jsonify({'error': f'Erro ao processar CSV: {str(e)}'}), 500
    return jsonify({'error': 'Apenas arquivos CSV são permitidos'}), 400


# Disable caching for static files to prevent old JS/CSS loads
@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


if __name__ == '__main__':
    app.run(debug=True)
