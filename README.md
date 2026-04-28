# PULSE

PULSE is a Medical AI Bias Audit Platform for sepsis-risk model review. It helps clinicians, ML builders, and auditors inspect demographic fairness, counterfactual behavior, language bias, temporal drift, and governance reports for healthcare AI workflows.

## Live Deployment

Frontend deployment target:

- Live URL: `https://pulse-frontend-wheat.vercel.app`
- Vercel project root: `pulse-frontend`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Required environment variable: `VITE_API_URL`

Backend deployment target:

- FastAPI app root: `pulse-backend`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Required environment variable: `GROQ_API_KEY`

The frontend can be deployed on Vercel for free on the Hobby plan for personal/demo usage. The backend should run on a Python-capable serverless/container host such as Cloud Run, Railway, Render, or Firebase Cloud Functions/Cloud Run.

## Firebase Backend Notes

This repo currently contains a Python FastAPI backend, not a Firebase-native Functions project. Firebase backend deployment is possible, but it is not a zero-config deploy:

- Firebase Hosting is a good fit for static frontend hosting.
- Firebase Cloud Functions or Cloud Run can host backend logic, but this normally requires the Firebase Blaze plan with a billing account.
- Blaze includes no-cost monthly quotas for Cloud Functions, but usage beyond those quotas can be billed.
- The current FastAPI backend can be deployed more directly to Cloud Run, Railway, or Render without rewriting routes.

For the fastest demo path, deploy `pulse-frontend` to Vercel and deploy `pulse-backend` to a Python backend host, then set `VITE_API_URL` in Vercel to the backend URL.

This repo also includes a Firebase deployment config:

- `firebase.json` deploys `pulse-frontend/dist` to Firebase Hosting.
- `/api/**` is rewritten to the Firebase HTTPS function named `api`.
- `pulse-backend/main.py` exposes the FastAPI app through that `api` function.

Deploy with:

```bash
cd pulse-frontend
npm install
npm run build
cd ..
npx firebase-tools deploy --only hosting,functions --project YOUR_FIREBASE_PROJECT_ID
```

Before deploying functions, the Firebase project must be on the Blaze plan and the Firebase CLI must be authenticated.

Set the backend secret once before the first functions deploy:

```bash
npx firebase-tools functions:secrets:set GROQ_API_KEY --project YOUR_FIREBASE_PROJECT_ID
npx firebase-tools functions:secrets:set GROQ_API_KEY_2 --project YOUR_FIREBASE_PROJECT_ID
```

## Local Setup

### Backend

```bash
cd pulse-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Backend docs open at:

```text
http://localhost:8000/docs
```

### Frontend

```bash
cd pulse-frontend
npm install
copy .env.example .env
npm run dev
```

Frontend opens at:

```text
http://localhost:5173
```

## Environment Variables

| Variable | App | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | Backend | Groq API key for live reasoning, chat, translation, and report generation |
| `GROQ_API_KEY_2` | Backend | Optional secondary Groq key for language-bias features |
| `VITE_API_URL` | Frontend | Public URL of the deployed backend, with no trailing slash |

Example frontend production value:

```text
VITE_API_URL=https://your-backend-url.example.com
```

## Project Structure

```text
pulse-frontend/   React + Vite frontend for Vercel
pulse-backend/    FastAPI backend with Groq integration
DOC/              Planning and implementation documents
```

## Core Features

- Role-specific flows for doctors, builders, and auditors
- Bias metrics and demographic subgroup analysis
- Counterfactual model comparison
- Causal graph visualization
- Doctor chat audit flow with language-bias detection
- Multilingual bias alerts and translation support
- Governance report generation
- Temporal drift monitoring

## Deploy Frontend To Vercel

From the Vercel dashboard:

1. Import the GitHub repository.
2. Set the project root directory to `pulse-frontend`.
3. Use the Vite framework preset.
4. Add `VITE_API_URL` in Project Settings -> Environment Variables.
5. Deploy.

From the CLI:

```bash
cd pulse-frontend
npx vercel
npx vercel --prod
```

## Deploy Backend

The backend is a FastAPI application. For most hosts, use:

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `GROQ_API_KEY` in the backend host environment. After deployment, update the Vercel frontend environment variable `VITE_API_URL` to point at the backend URL.
