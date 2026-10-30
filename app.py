import os
import uuid
from pathlib import Path
from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()
from worker import index_pdf, ask, clear_session, documents, delete_document

ROOT = Path(__file__).resolve().parent
UPLOADS = ROOT / 'uploads'
UPLOADS.mkdir(exist_ok=True)
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_UPLOAD_MB', '20')) * 1024 * 1024

@app.get('/')
def home():
    return render_template('index.html')

@app.get('/api/documents')
def list_documents():
    try:
        return jsonify({'documents': documents()})
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500

@app.post('/api/upload')
def upload():
    f = request.files.get('file')
    if not f or not f.filename or Path(f.filename).suffix.lower() != '.pdf':
        return jsonify({'error': 'Please select a PDF file.'}), 400
    filename = secure_filename(f.filename)
    path = UPLOADS / f'{uuid.uuid4().hex}.pdf'
    try:
        f.save(path)
        if path.read_bytes()[:5] != b'%PDF-':
            return jsonify({'error': 'Invalid PDF file.'}), 400
        return jsonify(index_pdf(path, filename))
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500
    finally:
        path.unlink(missing_ok=True)

@app.post('/api/chat')
def chat():
    data = request.get_json(silent=True) or {}
    question = str(data.get('message', '')).strip()
    session_id = str(data.get('session_id') or uuid.uuid4().hex)
    if not question or len(question) > 4000:
        return jsonify({'error': 'Question must be between 1 and 4000 characters.'}), 400
    try:
        return jsonify(ask(question, session_id))
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    except Exception as exc:
        return jsonify({'error': f'Unable to answer: {exc}'}), 500

@app.post('/api/reset')
def reset():
    clear_session(str((request.get_json(silent=True) or {}).get('session_id', '')))
    return jsonify({'ok': True})

@app.delete('/api/documents/<doc_id>')
def remove(doc_id):
    return jsonify({'deleted': delete_document(doc_id)})

@app.errorhandler(413)
def too_large(_):
    return jsonify({'error': 'PDF exceeds upload size limit.'}), 413

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
