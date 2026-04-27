# PULSE Backend

Medical AI Bias Audit Platform — FastAPI Backend

## Quick Start

```bash
cd Backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Generate dataset (already done, but can re-run)
python generate_data.py

# Run the server
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/dataset/profile` | Dataset demographic profile |
| `GET` | `/api/dataset/patients` | Full 500-patient dataset |
| `GET` | `/api/dataset/patients/{id}` | Single patient record |
| `POST` | `/api/analyze/metrics` | Bias metrics (pre-computed) |
| `POST` | `/api/analyze/counterfactual` | Counterfactual analysis |
| `POST` | `/api/analyze/reason` | Medical Bias Reasoner |
| `POST` | `/api/analyze/causal-graph` | Causal decision graph data |
| `POST` | `/api/analyze/temporal-drift` | Temporal drift chart data |
| `POST` | `/api/translate` | Multilingual translation |
| `POST` | `/api/report/generate` | Audit report generation |
| `GET` | `/api/views/{role}/{model_id}` | Role-specific view data |

## Architecture

- **FastAPI** server with async support
- **Groq SDK** for live AI calls (counterfactual, reasoner, translation, report)
- **Pre-computed data** for instant demo response (metrics, heatmap, patient table)
- **500 synthetic patients** with realistic Indian healthcare demographics
- **Two model personas**: Fair (clinically grounded) and Biased (historical patterns)

## Interactive API Docs

Once running, visit: `http://127.0.0.1:8000/docs`
