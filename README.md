# Local PDF AI Chatbot

Flask + LangChain + Chroma + Ollama + Hugging Face embeddings. PDF question answering with local inference and session-aware follow-up rewriting.

## Windows 11 installation (PowerShell)

1. Install Python 3.11 or 3.12 and Ollama. Check `py -3.11 --version` and `ollama --version`.
2. In PowerShell, from this folder:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
ollama pull llama3.2
python app.py
```

3. Open http://127.0.0.1:5000 and upload a text-based PDF. Keep Ollama running (the installed Ollama app normally runs its service automatically).

If PowerShell blocks activation, use `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` and `.\.venv\Scripts\python.exe app.py` without activating.

## API

- `GET /api/documents` list indexed PDFs
- `POST /api/upload` multipart field `file` (PDF, default max 20 MB)
- `POST /api/chat` JSON `{ "message": "...", "session_id": "optional" }`
- `POST /api/reset` JSON `{ "session_id": "..." }`
- `DELETE /api/documents/<document_id>` remove a PDF from the vector index

## Notes

- This app is for **trusted local use only**. Do not expose the Flask development server to the public internet.
- Uploaded PDF files are deleted after indexing. Extracted document chunks remain in `chroma_db/` until deleted through the UI. This directory can contain sensitive document text.
- Conversation history is in memory and is lost when the app restarts. Index data persists.
- Scanned/image-only PDFs need OCR and are not supported out of the box.
- Source labels identify retrieved passages; verify generated claims against actual PDF pages.
- Model and dependency downloads require internet the first time. Subsequent inference can run locally.
- LangChain packages evolve; dependency version ranges are intentionally bounded by major version but may require adjustments on a future install.
