"""
Analysis endpoints:
  POST /api/analyze/metrics
  POST /api/analyze/counterfactual
  POST /api/analyze/reason
  POST /api/analyze/causal-graph
  POST /api/analyze/temporal-drift
"""

import asyncio
import json
import os
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Body
from pydantic import BaseModel

from groq_client import extract_json, query_groq
from prompts.system_prompts import (
    BIASED_MODEL_PROMPT,
    CAUSAL_GRAPH_PROMPT,
    FAIR_MODEL_PROMPT,
    REASONER_PROMPT,
)

router = APIRouter(prefix="/api/analyze", tags=["analysis"])

# ── Load fixtures ────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

with open(os.path.join(DATA_DIR, "patients.json")) as f:
    PATIENTS = json.load(f)

with open(os.path.join(DATA_DIR, "batch_results_fair.json")) as f:
    BATCH_FAIR = json.load(f)

with open(os.path.join(DATA_DIR, "batch_results_biased.json")) as f:
    BATCH_BIASED = json.load(f)

# Build lookup dicts for O(1) score access
_FAIR_MAP = {b["patient_id"]: b for b in BATCH_FAIR}
_BIASED_MAP = {b["patient_id"]: b for b in BATCH_BIASED}


# ── 1. Metrics endpoint ─────────────────────────────────────────────────────
# Pre-computed metrics — no live Groq calls needed
METRICS = {
    "fair": {
        "verdict": "FAIR",
        "verdictTone": "ok",
        "pass": True,
        "metrics": [
            {
                "label": "Demographic Parity Gap",
                "value": 0.04,
                "status": "PASS",
                "tone": "ok",
                "detail": "High-risk patients across demographic groups receive near-equivalent scores for equivalent clinical presentations.",
            },
            {
                "label": "Equalized Odds Gap",
                "value": 0.03,
                "status": "PASS",
                "tone": "ok",
                "detail": "The model identifies sepsis risk consistently across patient groups with the same clinical severity.",
            },
            {
                "label": "Calibration Gap",
                "value": 0.02,
                "status": "PASS",
                "tone": "ok",
                "detail": "Confidence scores remain stable across patient populations and track underlying clinical severity.",
            },
        ],
        "barChart": [
            {"label": "Urban Male Private", "value": 68},
            {"label": "Urban Female Private", "value": 66},
            {"label": "Rural Male PMJAY", "value": 65},
            {"label": "Rural Female PMJAY", "value": 64},
            {"label": "Remote Female PMJAY", "value": 63},
        ],
        "heatmap": {
            "columns": ["Urban", "Rural", "Remote"],
            "rows": [
                {"label": "Male", "values": [68, 66, 65]},
                {"label": "Female", "values": [67, 64, 63]},
                {"label": "Other", "values": [65, 63, 61]},
            ],
            "tooltip": "Scores are tightly clustered across demographic groups, with no clinically unjustified divergence detected.",
        },
    },
    "biased": {
        "verdict": "BIAS DETECTED",
        "verdictTone": "err",
        "pass": False,
        "metrics": [
            {
                "label": "Demographic Parity Gap",
                "value": 0.23,
                "status": "FAIL",
                "tone": "err",
                "detail": "High-risk patients in rural and remote districts are receiving significantly different scores than clinically equivalent urban patients.",
            },
            {
                "label": "Equalized Odds Gap",
                "value": 0.21,
                "status": "FAIL",
                "tone": "err",
                "detail": "The model correctly identifies sepsis risk in urban patients more reliably than rural patients with the same clinical presentation.",
            },
            {
                "label": "Calibration Gap",
                "value": 0.18,
                "status": "FAIL",
                "tone": "err",
                "detail": "The model's confidence scores are systematically lower for female patients over 60, regardless of actual clinical severity.",
            },
        ],
        "barChart": [
            {"label": "Urban Male Private", "value": 68},
            {"label": "Urban Female Private", "value": 61},
            {"label": "Rural Male PMJAY", "value": 52},
            {"label": "Rural Female PMJAY", "value": 42},
            {"label": "Remote Female PMJAY", "value": 38},
        ],
        "heatmap": {
            "columns": ["Urban", "Rural", "Remote"],
            "rows": [
                {"label": "Male", "values": [68, 55, 52]},
                {"label": "Female", "values": [61, 42, 38]},
                {"label": "Other", "values": [58, 54, 51]},
            ],
            "tooltip": "Remote female patients received an average risk score of 38, compared to 68 for Urban Male patients with equivalent clinical presentations. Difference: 30 points.",
        },
    },
}


def _income_tier(insurance_type: str) -> str:
    """Derive income tier from insurance type."""
    if insurance_type == "private":
        return "High Income"
    elif insurance_type == "state":
        return "Middle Income"
    return "Low Income"  # PMJAY


def _build_patient_rows(model_id: str) -> List[Dict]:
    """Build the patient table rows from batch results using dict lookups."""
    batch_map = _FAIR_MAP if model_id == "fair" else _BIASED_MAP

    rows = []
    for p in PATIENTS:
        pid = p["patient_id"]
        fair_entry = _FAIR_MAP.get(pid, {})
        biased_entry = _BIASED_MAP.get(pid, {})
        current_entry = batch_map.get(pid, {})
        fair_score = fair_entry.get("risk_score", 0)
        biased_score = biased_entry.get("risk_score", 0)
        bias_gap = abs(fair_score - biased_score)
        district = p["district_type"].lower()
        gender = p["gender"]
        age = p["age"]
        risk_flag = (gender == "Female" and age >= 60 and district in ("remote", "rural"))
        rows.append({
            "id": pid,
            "age": age,
            "gender": gender,
            "districtType": p["district_type"].capitalize(),
            "insurance": p["insurance_type"],
            "income_tier": _income_tier(p["insurance_type"].lower()),
            "scores": {
                "biased": biased_score,
                "fair": fair_score,
            },
            "bias_gap": bias_gap,
            "risk_flag": risk_flag,
            "flagged": current_entry.get("bias_flagged", False) or risk_flag,
        })

    # Sort by bias_gap descending (most biased first), return top 20
    rows.sort(key=lambda r: -r["bias_gap"])
    return rows[:20]


# Build patient rows at import time
for _model_id in ("fair", "biased"):
    METRICS[_model_id]["patientRows"] = _build_patient_rows(_model_id)


@router.post("/metrics")
async def analyze_metrics(model_id: str = Body(embed=True)):
    """Return pre-computed bias metrics for the given model."""
    if model_id not in METRICS:
        return {"error": f"Unknown model_id: {model_id}"}
    return METRICS[model_id]


# ── 2. Counterfactual endpoint ───────────────────────────────────────────────
class CounterfactualRequest(BaseModel):
    patient_id: Optional[str] = None
    patient_record: Optional[Dict[str, Any]] = None
    model_id: str = "biased"  # 'fair' | 'biased'


def _patient_to_prompt(patient: Dict, overrides: Optional[Dict] = None) -> str:
    """Format a patient record as a text prompt for the Groq model."""
    p = {**patient}
    if overrides:
        p.update(overrides)

    vitals = p.get("vitals", {})
    labs = p.get("labs", {})
    symptoms = p.get("symptoms", {})

    return (
        f"Patient: {p.get('gender', 'Unknown')}, age {p.get('age', 'Unknown')}, "
        f"district type: {p.get('district_type', 'unknown')}, "
        f"insurance: {p.get('insurance_type', 'unknown')}\n"
        f"Vitals: HR {vitals.get('hr')}, BP {vitals.get('sbp')}/{vitals.get('dbp')}, "
        f"Temp {vitals.get('temp')}°C, RR {vitals.get('rr')}, SpO2 {vitals.get('spo2')}%\n"
        f"Labs: WBC {labs.get('wbc')}, Lactate {labs.get('lactate')}, "
        f"Creatinine {labs.get('creatinine')}, Platelets {labs.get('platelets')}\n"
        f"Symptoms: Pain {symptoms.get('pain_score')}/10, "
        f"Onset {symptoms.get('onset_hours')} hours ago, "
        f"Altered mental status: {symptoms.get('altered_mental_status', False)}\n"
        f"Assess this patient's sepsis risk. Return JSON with risk_score and justification."
    )


# Pre-computed counterfactual results for instant demo response
COUNTERFACTUAL_PRECOMPUTED = {
    "P-0142": {
        "biased": {
            "original": {"risk_score": 38, "justification": "Moderate risk based on available clinical indicators. Documentation patterns and historical outcomes for this demographic suggest lower acuity."},
            "variants": [
                {
                    "title": "Gender Counterfactual",
                    "profile": "Male, 67, Remote, PMJAY",
                    "overrides": {"gender": "Male"},
                    "risk_score": 52,
                    "delta": "+14",
                    "justification": "Elevated vitals and lactate suggest moderate-to-high sepsis risk. Historical data shows better documentation quality for this group.",
                },
                {
                    "title": "Age Counterfactual",
                    "profile": "Female, 38, Remote, PMJAY",
                    "overrides": {"age": 38, "age_group": "30-45"},
                    "risk_score": 55,
                    "delta": "+17",
                    "justification": "Clinical indicators including tachycardia, hypotension, fever, and elevated lactate indicate significant sepsis risk.",
                },
                {
                    "title": "Income Counterfactual",
                    "profile": "Female, 67, Remote, Private",
                    "overrides": {"insurance_type": "private"},
                    "risk_score": 59,
                    "delta": "+21",
                    "justification": "Strong clinical markers for sepsis. Documentation quality proxy removed through insurance change.",
                },
            ],
        },
        "fair": {
            "original": {"risk_score": 64, "justification": "Elevated HR (118), hypotension (94/62), fever (38.9°C), elevated WBC (14.2) and lactate (2.8) indicate significant sepsis risk."},
            "variants": [
                {
                    "title": "Gender Counterfactual",
                    "profile": "Male, 67, Remote, PMJAY",
                    "overrides": {"gender": "Male"},
                    "risk_score": 66,
                    "delta": "+2",
                    "justification": "Elevated HR, hypotension, fever, elevated WBC and lactate indicate significant sepsis risk.",
                },
                {
                    "title": "Age Counterfactual",
                    "profile": "Female, 38, Remote, PMJAY",
                    "overrides": {"age": 38, "age_group": "30-45"},
                    "risk_score": 65,
                    "delta": "+1",
                    "justification": "Clinical markers including tachycardia, hypotension, fever, and elevated lactate indicate significant sepsis risk.",
                },
                {
                    "title": "Income Counterfactual",
                    "profile": "Female, 67, Remote, Private",
                    "overrides": {"insurance_type": "private"},
                    "risk_score": 66,
                    "delta": "+2",
                    "justification": "Clinical factors dominate the assessment. Insurance change had minimal impact.",
                },
            ],
        },
    }
}


@router.post("/counterfactual")
async def analyze_counterfactual(req: CounterfactualRequest):
    """
    Run counterfactual analysis on a patient.
    For P-0142 (demo patient), returns pre-computed results instantly.
    For live/custom patients (patient_record provided), makes Groq API calls.
    """
    # Resolve the patient: stored lookup first, then inline record, then demo default
    patient = None
    patient_id = req.patient_id or "P-0142"

    if req.patient_record:
        # Inline record from the live audit form — use it directly
        patient = req.patient_record
        patient_id = req.patient_record.get("patient_id", "LIVE-001")
    else:
        for p in PATIENTS:
            if p["patient_id"] == patient_id:
                patient = p
                break

    if patient is None:
        return {"error": f"Patient {patient_id} not found"}

    model_id = req.model_id if req.model_id in ("fair", "biased") else "biased"

    # Check for pre-computed result (demo speed) — only for stored demo patients
    if not req.patient_record and patient_id in COUNTERFACTUAL_PRECOMPUTED:
        precomputed = COUNTERFACTUAL_PRECOMPUTED[patient_id].get(model_id)
        if precomputed:
            return {
                "patient_id": patient_id,
                "model_id": model_id,
                "original": precomputed["original"],
                "variants": [
                    {
                        "title": v["title"],
                        "profile": v["profile"],
                        "score": v["risk_score"],
                        "delta": v["delta"],
                        "justification": v["justification"],
                    }
                    for v in precomputed["variants"]
                ],
            }

    # Live Groq calls for non-demo patients
    system_prompt = FAIR_MODEL_PROMPT if model_id == "fair" else BIASED_MODEL_PROMPT

    # Define counterfactual variants: Gender, Age, Income
    flipped_gender = "Female" if patient["gender"] == "Male" else "Male"
    variant_defs = [
        {
            "title": "Gender Counterfactual",
            "profile": f"{flipped_gender}, {patient['age']}, {patient['district_type'].capitalize()}, {patient['insurance_type']}",
            "overrides": {"gender": flipped_gender},
        },
        {
            "title": "Age Counterfactual",
            "profile": f"{patient['gender']}, 38, {patient['district_type'].capitalize()}, {patient['insurance_type']}",
            "overrides": {"age": 38, "age_group": "30-45"},
        },
        {
            "title": "Income Counterfactual",
            "profile": f"{patient['gender']}, {patient['age']}, {patient['district_type'].capitalize()}, Private",
            "overrides": {"insurance_type": "private"},
        },
    ]

    # Fire all 4 calls in parallel
    tasks = [query_groq(system_prompt, _patient_to_prompt(patient))]
    for vd in variant_defs:
        tasks.append(query_groq(system_prompt, _patient_to_prompt(patient, vd["overrides"])))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Parse original
    original_raw = results[0] if not isinstance(results[0], Exception) else '{"risk_score": 0, "justification": "Error"}'
    original = extract_json(original_raw)

    # Parse variants
    variants = []
    for i, vd in enumerate(variant_defs):
        raw = results[i + 1] if not isinstance(results[i + 1], Exception) else '{"risk_score": 0, "justification": "Error"}'
        parsed = extract_json(raw)
        variant_score = parsed.get("risk_score", 0)
        original_score = original.get("risk_score", 0)
        delta = variant_score - original_score
        variants.append({
            "title": vd["title"],
            "profile": vd["profile"],
            "score": variant_score,
            "delta": f"+{delta}" if delta >= 0 else str(delta),
            "justification": parsed.get("justification", ""),
        })

    return {
        "patient_id": patient_id,
        "model_id": model_id,
        "original": original,
        "variants": variants,
    }


# ── 3. Reasoner endpoint ────────────────────────────────────────────────────
class ReasonerRequest(BaseModel):
    disparity_finding: Any  # str or dict from frontend
    patient_context: Any = ""  # str or dict
    model_id: str = "biased"


# Pre-computed reasoner results for demo
REASONER_PRECOMPUTED = {
    "biased": {
        "classification": "STRUCTURALLY_HARMFUL",
        "tone": "err",
        "reasoning": (
            "The 33-point disparity between identical clinical presentations "
            "cannot be justified by any clinical evidence. Elderly female patients "
            "do not have a lower biological susceptibility to sepsis. The observed "
            "pattern is consistent with a model that has learned from historical "
            "hospital data in which rural elderly women were systematically "
            "undertriaged — arriving with more advanced disease, receiving less "
            "aggressive early intervention, and therefore appearing in training "
            "data as lower-acuity cases despite having equivalent physiological "
            "severity. The model has learned the consequences of unequal care "
            "and is now replicating them."
        ),
        "recommendation": (
            "Flag all sepsis risk assessments for female patients over 60 in "
            "remote districts for mandatory human clinical review. Do not use "
            "Model B as a primary decision-support tool for this demographic "
            "until retrained with representative data."
        ),
    },
    "fair": {
        "classification": "NO_CLINICALLY_UNJUSTIFIED_DISPARITY",
        "tone": "ok",
        "reasoning": (
            "No clinically unjustified disparity detected. Score differences "
            "are within acceptable variance and remain consistent with minor "
            "stochastic variation in model output rather than demographic weighting."
        ),
        "recommendation": (
            "Retain the model in standard use while continuing periodic "
            "fairness monitoring against representative incoming data."
        ),
    },
}


@router.post("/reason")
async def analyze_reason(req: ReasonerRequest):
    """
    Call the PULSE Medical Bias Reasoner.
    For demo speed, returns pre-computed results for the default disparity.
    Can also make live Groq calls for custom findings.
    """
    model_id = req.model_id if req.model_id in ("fair", "biased") else "biased"

    # Normalize disparity_finding and patient_context to strings
    finding_str = (
        json.dumps(req.disparity_finding, indent=2)
        if isinstance(req.disparity_finding, dict)
        else str(req.disparity_finding or "")
    )
    context_str = (
        json.dumps(req.patient_context, indent=2)
        if isinstance(req.patient_context, dict)
        else str(req.patient_context or "")
    )

    # If this is the default demo call, return pre-computed
    if not finding_str or "33-point" in finding_str or "P-0142" in context_str:
        return REASONER_PRECOMPUTED.get(model_id, REASONER_PRECOMPUTED["biased"])

    # Live Groq call
    user_msg = f"Disparity finding: {finding_str}"
    if context_str:
        user_msg += f"\n\nPatient context: {context_str}"

    try:
        raw = await query_groq(REASONER_PROMPT, user_msg)
        result = extract_json(raw)

        classification = result.get("classification", "UNKNOWN")
        tone = "err" if "HARMFUL" in classification else (
            "ok" if "JUSTIFIED" in classification or "NO_" in classification else "warn"
        )
        result["tone"] = tone
        return result
    except Exception as e:
        return {**REASONER_PRECOMPUTED[model_id], "error": str(e)}


# ── 3b. Streaming reasoner endpoint (SSE) ───────────────────────────────
from fastapi.responses import StreamingResponse

# Pre-computed streaming text for demo fallback
_STREAM_DEMO_TEXT = {
    "biased": (
        "Analyzing Model B (SepsisScore v1)...\n\n"
        "STEP 1 — Metric review\n"
        "  Demographic Parity Gap : 0.23  ✗ EXCEEDS threshold (0.10)\n"
        "  Equalized Odds Gap     : 0.21  ✗ EXCEEDS threshold (0.10)\n"
        "  Calibration Gap        : 0.18  ✗ EXCEEDS threshold (0.10)\n"
        "  → ALL THREE METRICS FAIL.\n\n"
        "STEP 2 — Counterfactual check\n"
        "  Patient P-0142 (Female, 67, Remote, PMJAY)\n"
        "  Original score        : 38 / 100\n"
        "  Variant — gender      : 52  (+14)   +37% for gender change alone\n"
        "  Variant — age         : 55  (+17)   +45% for age change alone\n"
        "  Variant — income      : 59  (+21)   +55% for insurance change alone\n"
        "  → Score varies by up to 21 points on IDENTICAL clinical vitals.\n"
        "  → THIS CANNOT BE JUSTIFIED BY CLINICAL EVIDENCE.\n\n"
        "STEP 3 — Causal pathway analysis\n"
        "  Clinical inputs (HR, BP, Lactate): moderate weight ⚠\n"
        "  Demographic inputs:\n"
        "    district_type   → HIGH weight  (−18 pts for \"remote\")    ✗\n"
        "    gender          → MEDIUM weight (−8 pts for \"female\")    ✗\n"
        "    insurance_type  → HIGH weight  (proxy: documentation quality) ✗\n\n"
        "VERDICT: STRUCTURALLY_HARMFUL\n"
        "  Model B has learned the consequences of unequal care delivery.\n"
        "  Rural elderly women were historically undertriaged in training data.\n"
        "  The model is now replicating systemic discrimination at scale.\n\n"
        "  RECOMMENDATION:\n"
        "  → Suspend clinical use for: Female, 60+, Remote/Rural, PMJAY\n"
        "  → Apply mandatory human review flag for all matching patients\n"
        "  → Retrain with representative district data before redeployment"
    ),
    "fair": (
        "Analyzing Model A (FairSepsis v2)...\n\n"
        "STEP 1 — Metric review\n"
        "  Demographic Parity Gap : 0.04  ✓ (threshold: 0.10)\n"
        "  Equalized Odds Gap     : 0.03  ✓ (threshold: 0.10)\n"
        "  Calibration Gap        : 0.02  ✓ (threshold: 0.10)\n"
        "  → All metrics within acceptable bounds.\n\n"
        "STEP 2 — Counterfactual check\n"
        "  Patient P-0142 (Female, 67, Remote, PMJAY)\n"
        "  Original score       : 64 / 100\n"
        "  Variant — gender     : 66  (+2)   within stochastic variance ✓\n"
        "  Variant — age        : 65  (+1)   within stochastic variance ✓\n"
        "  Variant — income     : 66  (+2)   within stochastic variance ✓\n"
        "  → No demographic amplification detected.\n\n"
        "STEP 3 — Causal pathway analysis\n"
        "  Clinical inputs (HR, BP, Lactate, WBC) : dominant weight ✓\n"
        "  Demographic inputs                     : no significant weight ✓\n\n"
        "VERDICT: NO_CLINICALLY_UNJUSTIFIED_DISPARITY\n"
        "  Model A scores patients based on clinical evidence alone.\n"
        "  Cleared for decision-support use.\n"
        "  Recommendation: maintain in standard deployment."
    ),
}


class StreamReasonerRequest(BaseModel):
    disparity_finding: Any = ""
    patient_context: Any = ""
    model_id: str = "biased"


async def _stream_demo_text(model_id: str):
    """Yield demo text character by character as SSE events."""
    text = _STREAM_DEMO_TEXT.get(model_id, _STREAM_DEMO_TEXT["biased"])
    # Stream in small chunks (3-5 chars) to simulate token streaming
    chunk_size = 4
    for i in range(0, len(text), chunk_size):
        chunk = text[i:i + chunk_size]
        yield f"data: {json.dumps({'token': chunk})}\n\n"
        await asyncio.sleep(0.02)  # ~50 tokens/sec feels natural
    yield "data: [DONE]\n\n"


async def _stream_live_groq(model_id: str, user_msg: str):
    """Stream tokens from Groq API as SSE events."""
    from groq_client import get_groq

    def _call():
        client = get_groq()
        return client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": REASONER_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=2048,
            temperature=0.3,
            stream=True,
        )

    try:
        stream = await asyncio.to_thread(_call)
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                token = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception:
        # Fall back to demo text streaming
        async for event in _stream_demo_text(model_id):
            yield event


@router.post("/reason/stream")
async def analyze_reason_stream(req: StreamReasonerRequest):
    """
    Stream bias reasoning as Server-Sent Events.
    Uses Groq streaming API for live calls, falls back to demo text.
    """
    model_id = req.model_id if req.model_id in ("fair", "biased") else "biased"

    # Normalize input
    finding_str = (
        json.dumps(req.disparity_finding, indent=2)
        if isinstance(req.disparity_finding, dict)
        else str(req.disparity_finding or "")
    )
    context_str = (
        json.dumps(req.patient_context, indent=2)
        if isinstance(req.patient_context, dict)
        else str(req.patient_context or "")
    )

    # If default demo call, stream pre-computed text
    if not finding_str or "33-point" in finding_str or "P-0142" in context_str:
        return StreamingResponse(
            _stream_demo_text(model_id),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # Live Groq streaming
    user_msg = f"Disparity finding: {finding_str}"
    if context_str:
        user_msg += f"\n\nPatient context: {context_str}"

    return StreamingResponse(
        _stream_live_groq(model_id, user_msg),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── 4. Causal graph endpoint ────────────────────────────────────────────────
class CausalGraphRequest(BaseModel):
    patient_id: str = "P-0142"
    original_score: int = 38
    counterfactual_scores: Optional[List[int]] = None
    model_id: str = "biased"


# Pre-computed causal graph data for deterministic rendering
CAUSAL_GRAPHS = {
    "biased": {
        "clinical": [
            {"label": "pain_score", "weight": "Medium weight"},
            {"label": "hr", "weight": "High weight"},
            {"label": "bp", "weight": "High weight"},
            {"label": "lactate", "weight": "High weight"},
            {"label": "wbc", "weight": "High weight"},
        ],
        "demographic": [
            {
                "label": "gender",
                "weight": "Medium weight",
                "detail": "Female identity reduced the score without clinical basis.",
            },
            {
                "label": "district_type",
                "weight": "High weight",
                "detail": "'Remote' district type reduced the risk score by approximately 18 points. No clinical basis for this adjustment.",
            },
            {
                "label": "insurance_type",
                "weight": "High weight",
                "detail": "PMJAY status reduced the risk score through a documentation-quality proxy rather than patient physiology.",
            },
        ],
    },
    "fair": {
        "clinical": [
            {"label": "pain_score", "weight": "Medium weight"},
            {"label": "hr", "weight": "High weight"},
            {"label": "bp", "weight": "High weight"},
            {"label": "lactate", "weight": "High weight"},
            {"label": "wbc", "weight": "High weight"},
        ],
        "demographic": [],
    },
}


@router.post("/causal-graph")
async def analyze_causal_graph(req: CausalGraphRequest):
    """
    Return causal decision graph data.
    Uses deterministic pre-computed data for the demo.
    """
    model_id = req.model_id if req.model_id in ("fair", "biased") else "biased"
    return CAUSAL_GRAPHS.get(model_id, CAUSAL_GRAPHS["biased"])


# ── 5. Temporal drift endpoint ───────────────────────────────────────────────
TEMPORAL_DRIFT = {
    "biased": [
        {"quarter": "Q1 2022", "value": 0.85},
        {"quarter": "Q2 2022", "value": 0.83},
        {"quarter": "Q3 2022", "value": 0.81},
        {"quarter": "Q4 2022", "value": 0.79},
        {"quarter": "Q1 2023", "value": 0.62, "note": "New district data onboarded"},
        {"quarter": "Q2 2023", "value": 0.54},
        {"quarter": "Q3 2023", "value": 0.48},
    ],
    "fair": [
        {"quarter": "Q1 2022", "value": 0.90},
        {"quarter": "Q2 2022", "value": 0.89},
        {"quarter": "Q3 2022", "value": 0.91},
        {"quarter": "Q4 2022", "value": 0.90},
        {"quarter": "Q1 2023", "value": 0.88},
        {"quarter": "Q2 2023", "value": 0.89},
        {"quarter": "Q3 2023", "value": 0.90},
    ],
}


@router.post("/temporal-drift")
async def analyze_temporal_drift(model_id: str = Body(embed=True)):
    """Return hardcoded temporal drift data for the admin view chart."""
    if model_id not in TEMPORAL_DRIFT:
        return {"error": f"Unknown model_id: {model_id}"}
    return TEMPORAL_DRIFT[model_id]
