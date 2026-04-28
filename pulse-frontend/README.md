# PULSE Frontend

React + Vite frontend for the PULSE Medical AI Bias Audit Platform.

## Quick Start

```bash
cd pulse-frontend
npm install
copy .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

The local backend default is:

```text
http://localhost:8000
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | FastAPI backend base URL, no trailing slash |

For Vercel, set `VITE_API_URL` to the deployed backend URL.

## Vercel Deployment

Use these Vercel settings:

- Root directory: `pulse-frontend`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

The existing `vercel.json` rewrites all routes to `index.html`, so React Router deep links work after deployment.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## App Routes

```text
/          Landing page and role selection
/doctor    Clinician view
/builder   ML builder view
/auditor   Administrator/auditor view
```

## Backend Integration

The frontend calls the backend through `VITE_API_URL` and falls back to demo data where supported. Backend-dependent features include:

- Counterfactual analysis
- Model metrics
- Doctor chat analysis
- Temporal drift analysis
- Governance report generation
- Translation and language-bias checks
