"""
POST /api/report/generate
"""

import json

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional

from groq_client import query_groq
from prompts.system_prompts import REPORT_PROMPT

router = APIRouter(prefix="/api/report", tags=["report"])


# ── Pre-computed report for instant demo ─────────────────────────────────────
REPORT_PRECOMPUTED = {
    "biased": {
        "sections": [
            {
                "title": "Executive Summary",
                "body": (
                    "PULSE audited Model B (Historical Pattern System) for sepsis risk "
                    "scoring across Indian healthcare demographics and found clinically "
                    "unjustified disparity concentrated in remote and rural elderly female "
                    "populations. The overall verdict is BIAS DETECTED, with the most severe "
                    "under-scoring observed for remote female PMJAY patients. Approximately "
                    "15.6% of patients in the deployment context fall into the highest-risk "
                    "demographic group for this model."
                ),
            },
            {
                "title": "Bias Findings",
                "body": (
                    "Demographic Parity Gap: 0.23 (FAIL — threshold 0.10). High-risk patients "
                    "in rural and remote districts receive significantly different scores than "
                    "clinically equivalent urban patients.\n\n"
                    "Equalized Odds Gap: 0.21 (FAIL — threshold 0.10). The model correctly "
                    "identifies sepsis risk in urban patients more reliably than rural patients "
                    "with the same clinical presentation.\n\n"
                    "Calibration Gap: 0.18 (FAIL — threshold 0.10). The model's confidence scores "
                    "are systematically lower for female patients over 60, regardless of actual "
                    "clinical severity.\n\n"
                    "Counterfactual analysis on patient P-0142 showed a 33-point score increase "
                    "when demographics were changed to a younger urban privately insured male "
                    "while clinical presentation remained identical."
                ),
            },
            {
                "title": "Affected Populations",
                "body": (
                    "Highest-risk cohort: Remote elderly female patients over 60, especially "
                    "those covered under PMJAY. Average risk score: 38/100 (vs 68/100 for "
                    "clinically equivalent urban male patients).\n\n"
                    "Secondary concern: Rural elderly female patients with equivalent sepsis-level "
                    "vitals. Average risk score: 42/100.\n\n"
                    "Remote female patients of all ages received scores approximately 23 points "
                    "lower than urban male patients with matched clinical severity."
                ),
            },
            {
                "title": "Recommendations",
                "body": (
                    "1. Mandate human clinical review for all sepsis risk assessments involving "
                    "remote and rural elderly female patients (age 60+) until model retraining "
                    "is complete.\n\n"
                    "2. Retrain Model B with materially improved representation for remote and "
                    "rural elderly women. Target: acquire approximately 800 additional records "
                    "for this cohort.\n\n"
                    "3. Prioritize data acquisition from HMIS records at Tamil Nadu and Uttar "
                    "Pradesh district hospital systems.\n\n"
                    "4. Do not use Model B as a primary decision-support tool for the affected "
                    "demographic until retrained.\n\n"
                    "5. Flag this model for the next procurement review cycle and document this "
                    "audit for regulatory compliance purposes."
                ),
            },
            {
                "title": "Methodology",
                "body": (
                    "PULSE combines three complementary bias detection approaches:\n\n"
                    "1. Intersectional metric analysis: Demographic Parity, Equalized Odds, and "
                    "Calibration metrics computed across gender × district_type × insurance "
                    "intersections.\n\n"
                    "2. Patient-level counterfactual testing: Individual patient records re-evaluated "
                    "with only demographic attributes changed, clinical features held constant.\n\n"
                    "3. PULSE Medical Bias Reasoner: An AI system grounded in Indian healthcare "
                    "context that classifies detected disparities as clinically justified, "
                    "structurally harmful, statistically ambiguous, or population-context mismatched.\n\n"
                    "Results were reviewed across three role-specific surfaces: clinician view, "
                    "model builder view, and governance/administrator view."
                ),
            },
        ],
    },
    "fair": {
        "sections": [
            {
                "title": "Executive Summary",
                "body": (
                    "PULSE audited Model A (Clinically Grounded System) for sepsis risk scoring "
                    "across Indian healthcare demographics and found no clinically unjustified "
                    "disparity. The overall verdict is FAIR. Score variation across demographic "
                    "groups remains within acceptable clinical bounds."
                ),
            },
            {
                "title": "Bias Findings",
                "body": (
                    "Demographic Parity Gap: 0.04 (PASS). Equalized Odds Gap: 0.03 (PASS). "
                    "Calibration Gap: 0.02 (PASS). All metrics are within acceptable thresholds. "
                    "Counterfactual analysis showed score deltas of +2 to +3 across demographic "
                    "variants — consistent with minor stochastic variation."
                ),
            },
            {
                "title": "Affected Populations",
                "body": (
                    "No patient group crosses the fairness-related escalation threshold. "
                    "Scores are tightly clustered between 61-69 across all demographic intersections."
                ),
            },
            {
                "title": "Recommendations",
                "body": (
                    "Maintain routine audit cadence. Retain Model A in approved decision-support "
                    "status. Continue monitoring calibration and representation coverage as new "
                    "districts are onboarded."
                ),
            },
            {
                "title": "Methodology",
                "body": (
                    "Same methodology as above: intersectional metric analysis, counterfactual "
                    "testing, and PULSE Medical Bias Reasoner evaluation."
                ),
            },
        ],
    },
}


class ReportRequest(BaseModel):
    model_id: str = "biased"
    analysis_results: Optional[Dict[str, Any]] = None
    use_precomputed: bool = True


@router.post("/generate")
async def generate_report(req: ReportRequest):
    """
    Generate a structured audit report.
    Returns pre-computed for demo speed, or makes a live Groq call.
    """
    model_id = req.model_id if req.model_id in ("fair", "biased") else "biased"

    if req.use_precomputed or req.analysis_results is None:
        return REPORT_PRECOMPUTED.get(model_id, REPORT_PRECOMPUTED["biased"])

    # Live Groq call with provided analysis results
    try:
        findings_text = json.dumps(req.analysis_results, indent=2)
        raw = await query_groq(
            REPORT_PROMPT,
            f"Model audited: {'Model B (Historical Pattern System)' if model_id == 'biased' else 'Model A (Clinically Grounded System)'}\n\nFindings:\n{findings_text}",
            max_tokens=4096,
        )
        return {
            "sections": [{"title": "Full Report", "body": raw}],
            "source": "live",
        }
    except Exception as e:
        return {
            **REPORT_PRECOMPUTED.get(model_id, REPORT_PRECOMPUTED["biased"]),
            "error": str(e),
        }
