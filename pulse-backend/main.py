"""
PULSE Backend — FastAPI Server
===============================
Medical AI Bias Audit Platform for Indian Healthcare

Run:  uvicorn main:app --reload --port 8000
"""

import os

from a2wsgi import ASGIMiddleware
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_functions import https_fn
from werkzeug.wrappers import Response

# Load environment variables from .env
load_dotenv()

# ── Create app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="PULSE API",
    description="Medical AI Bias Audit Platform — Backend API",
    version="0.1.0",
)

# ── CORS — allow the Vite dev server and Vercel frontend ─────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",       # Vite dev server
        "http://localhost:5174",       # Vite fallback port
        "http://localhost:3000",       # Alternate dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        # Add exact deployed Vercel URL before demo:
        # "https://pulse-demo.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Any Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register route modules ──────────────────────────────────────────────────
from routes.dataset import router as dataset_router
from routes.analyze import router as analyze_router
from routes.translate import router as translate_router
from routes.report import router as report_router
from routes.views import router as views_router
from routes.chat import router as chat_router
from routes.language_bias import router as language_bias_router
from routes.doctor import router as doctor_router

app.include_router(dataset_router)
app.include_router(analyze_router)
app.include_router(translate_router)
app.include_router(report_router)
app.include_router(views_router)
app.include_router(chat_router)
app.include_router(language_bias_router)
app.include_router(doctor_router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "service": "PULSE API",
        "status": "running",
        "version": "0.1.0",
        "groq_configured": bool(os.environ.get("GROQ_API_KEY")),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


# Firebase Cloud Functions HTTPS entrypoint.
# Local development still uses `uvicorn main:app`.
firebase_wsgi_app = ASGIMiddleware(app)


@https_fn.on_request(region="asia-south1", timeout_sec=300, cors=True, secrets=["GROQ_API_KEY"])
def api(req: https_fn.Request) -> https_fn.Response:
    return Response.from_app(firebase_wsgi_app, req.environ)
