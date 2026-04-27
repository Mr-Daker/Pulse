# PULSE Frontend

Redesigned frontend for the PULSE Medical AI Bias Audit Platform.

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PULSE Backend running (see `/Backend/README.md`)

### 2. Install & run

```bash
cd pulse-frontend
cp .env.example .env          # edit VITE_API_URL if backend is not on :8000
npm install
npm run dev
```

Open **http://localhost:5173**

### 3. Backend (FastAPI)

In a separate terminal from the repo root:

```bash
cd Backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

---

## App Flow

```
Landing  →  Pick a role
  ├── Doctor   /doctor   — Translated bias alerts + voice playback
  ├── Builder  /builder  — Metrics, counterfactuals, live AI reasoning
  └── Auditor  /auditor  — Compliance, drift chart, governance report
```

The **Model A / Model B** toggle in the topbar switches between the fair model
(FairSepsis v2) and the biased model (SepsisScore v1) across all views.

---

## File Structure

```
src/
  App.jsx                    Route definitions
  main.jsx                   Entry point
  styles.css                 Full design system
  context/
    AppContext.jsx            Global state (model, language, tab)
  data/
    demoData.js              All demo data, translations, API URL
  pages/
    LandingPage.jsx          Role selection
    DoctorPage.jsx           Doctor / clinician view
    BuilderPage.jsx          ML builder view (4 tabs)
    AuditorPage.jsx          Auditor / admin view
  components/
    Shell.jsx                Topbar + Badge
    Charts.jsx               Heatmap, BarChart, MetricCard,
                             CounterfactualCards, DriftChart
    PatientTable.jsx         Patient audit table
    ReasoningPanel.jsx       Live AI reasoning (typewriter + Groq)
```

---

## Environment Variables

| Variable        | Default                    | Description              |
|-----------------|----------------------------|--------------------------|
| `VITE_API_URL`  | `http://localhost:8000`    | FastAPI backend base URL |

---

## Build for production

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

---

## Live Reasoning

`ReasoningPanel` tries `POST /api/analyze/reason` first. If the backend is
unreachable it falls back to a typewriter animation of the pre-computed
reasoning text in `demoData.js` — so the UI always works for demos.

## Language Support

Doctor View supports 5 languages via the language selector:
- English, தமிழ் (Tamil), हिंदी (Hindi), తెలుగు (Telugu), বাংলা (Bengali)

Text-to-speech uses the Web Speech API with Indian-locale voices where available.
Live translation for custom text uses `POST /api/translate` (Groq-powered).
