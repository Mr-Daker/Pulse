# PULSE Backend

FastAPI backend for the PULSE Medical AI Bias Audit Platform.

## Quick Start

```bash
cd pulse-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Open the interactive API docs:

```text
http://localhost:8000/docs
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Groq API key for live AI calls |
| `GROQ_API_KEY_2` | No | Optional secondary Groq key for language-bias features |

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Service status |
| `GET` | `/health` | Health check |
| `POST` | `/api/dataset/profile` | Dataset demographic profile |
| `GET` | `/api/dataset/patients` | Full synthetic patient dataset |
| `GET` | `/api/dataset/patients/{id}` | Single patient record |
| `POST` | `/api/analyze/metrics` | Bias metrics |
| `POST` | `/api/analyze/counterfactual` | Counterfactual analysis |
| `POST` | `/api/analyze/reason` | Medical bias reasoning |
| `POST` | `/api/analyze/causal-graph` | Causal graph data |
| `POST` | `/api/analyze/temporal-drift` | Temporal drift data |
| `POST` | `/api/translate` | Translation |
| `POST` | `/api/report/generate` | Governance report generation |
| `GET` | `/api/views/{role}/{model_id}` | Role-specific view data |
| `POST` | `/api/chat` | General chat flow |
| `POST` | `/api/doctor/analyse` | Doctor chat analysis |
| `POST` | `/api/language-bias/check` | Language-bias check |

## Deployment

Use a Python-capable backend host. A typical production command is:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `GROQ_API_KEY` in the host environment. After deployment, set the frontend `VITE_API_URL` to this backend URL.

## Firebase Notes

Firebase can host backend code through Cloud Functions or Cloud Run, but this FastAPI backend is not currently packaged as a Firebase Functions project. Deploying it through Firebase would require adding a Firebase/Google Cloud deployment wrapper and using a Blaze billing project.
