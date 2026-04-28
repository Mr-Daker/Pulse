# PULSE — Medical AI Bias Audit Platform

PULSE (Platform for Unified Learning and Safety Evaluation) detects, explains, and prescribes fixes for hidden demographic harm in clinical AI systems. Built for the Google Solution Challenge, PULSE audits sepsis risk scoring models for bias against vulnerable populations in Indian healthcare — specifically remote elderly women, PMJAY patients, and rural communities.

## Live Demo

> **Frontend:** [https://pulse-demo.vercel.app](https://pulse-demo.vercel.app)
> **Backend API:** Deployed on Railway / Google Cloud Run

## How to Run Locally

### Frontend (React + Vite)

```bash
cd pulse-frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

### Backend (FastAPI + Groq)

```bash
cd pulse-backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend runs at `http://localhost:8000`.

### Environment Variables

| Variable | Location | Description |
|---|---|---|
| `GROQ_API_KEY` | Backend `.env` | Groq API key for LLM calls (reasoning, chat, translation) |
| `VITE_API_URL` | Frontend `.env` | Full URL of deployed backend (e.g. `http://localhost:8000`), no trailing slash |

Copy `.env.example` to `.env` in both `pulse-frontend/` and `pulse-backend/` directories and fill in the values.

## Project Structure

```
pulse-frontend/     → React/Vite frontend (deploy to Vercel)
pulse-backend/      → FastAPI backend (deploy to Railway/Cloud Run)
```

## Features

- **Three Role-Specific Views:** Clinician (Doctor), ML Engineer (Builder), Administrator (Auditor)
- **Live Chat Bias Audit:** Doctors chat with the AI, PULSE audits every response for demographic bias in real time
- **Counterfactual Analysis:** Gender, Age, and Income as three independent demographic axes
- **Interactive Causal Graph:** React Flow-based visualization of model decision pathways
- **Multilingual Support:** Bias alerts in English, Tamil, Hindi, Telugu, Bengali, and Kannada
- **Governance Reports:** PDF-exportable audit reports with vulnerability summary
- **Temporal Drift Monitoring:** Track fairness score degradation over time

## Tech Stack

- **Frontend:** React 18, Vite, React Router, React Flow, jsPDF
- **Backend:** FastAPI, Groq API (Gemma 2 9B), Python
- **Deployment:** Vercel (frontend), Railway/Cloud Run (backend)
