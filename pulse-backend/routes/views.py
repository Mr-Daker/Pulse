"""
GET /api/views/doctor/{model_id}
GET /api/views/builder/{model_id}
GET /api/views/admin/{model_id}

Pre-computed role-specific view data — no Groq calls needed.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/views", tags=["views"])

VIEWS = {
    "biased": {
        "doctor": {
            "watch": (
                "This model may under-estimate risk for elderly rural female patients. "
                "Exercise additional clinical judgment for this group."
            ),
            "patient": (
                "Priya, 67, remote Tamil Nadu, PMJAY — the model scored her 38/100. "
                "Her vitals indicate high risk. Do not rely on this score alone."
            ),
            "prompt": (
                "Including specific lab values (lactate, WBC) explicitly in your query "
                "for elderly female patients improves output consistency for this model "
                "by approximately 20%."
            ),
        },
        "builder": {
            "diagnosis": (
                "Your model shows 34% lower confidence for female patients over 60 in "
                "remote districts. This is consistent with significant underrepresentation "
                "of this demographic in training data."
            ),
            "confidence": (
                "34% lower confidence for female patients over 60 in remote districts. "
                "Estimated additional data required: approximately 800 records for the "
                "remote elderly female cohort."
            ),
            "action": (
                "Acquire additional records for the remote elderly female cohort. "
                "Suggested sources: HMIS data from Tamil Nadu and Uttar Pradesh "
                "district hospitals."
            ),
        },
        "admin": {
            "riskRating": "HIGH",
            "affectedPopulation": (
                "Approximately 15.6% of patients in your deployment context fall into "
                "the highest-risk demographic group for this model."
            ),
            "action": (
                "Mandatory human review for all remote elderly female patients over 60 "
                "until model is retrained. Flag this model for the next procurement review."
            ),
            "compliance": (
                "This analysis has been documented and timestamped for audit trail purposes."
            ),
        },
    },
    "fair": {
        "doctor": {
            "watch": (
                "This model appears clinically consistent across patient groups. "
                "Continue to apply standard clinical judgment."
            ),
            "patient": (
                "Priya, 67, remote Tamil Nadu, PMJAY — the model scored her 64/100. "
                "Her vitals indicate high risk and the score remains appropriately elevated."
            ),
            "prompt": (
                "Clinical variables such as lactate, WBC, respiratory rate, and hypotension "
                "remain the strongest drivers of consistent outputs."
            ),
        },
        "builder": {
            "diagnosis": (
                "No material demographic divergence detected. Score variation remains "
                "within acceptable bounds for the sampled counterfactual set."
            ),
            "confidence": (
                "Confidence remains stable across remote, rural, and urban cohorts "
                "with similar clinical severity."
            ),
            "action": (
                "Continue monitoring calibration and representation coverage as "
                "new districts are onboarded."
            ),
        },
        "admin": {
            "riskRating": "LOW",
            "affectedPopulation": (
                "No patient group crosses the current internal threshold for "
                "fairness-related escalation."
            ),
            "action": (
                "Maintain routine audit cadence and retain the model in approved "
                "decision-support status."
            ),
            "compliance": (
                "This analysis has been documented and timestamped for audit trail purposes."
            ),
        },
    },
}


@router.get("/doctor/{model_id}")
async def get_doctor_view(model_id: str):
    if model_id not in VIEWS:
        return {"error": f"Unknown model_id: {model_id}"}
    return VIEWS[model_id]["doctor"]


@router.get("/builder/{model_id}")
async def get_builder_view(model_id: str):
    if model_id not in VIEWS:
        return {"error": f"Unknown model_id: {model_id}"}
    return VIEWS[model_id]["builder"]


@router.get("/admin/{model_id}")
async def get_admin_view(model_id: str):
    if model_id not in VIEWS:
        return {"error": f"Unknown model_id: {model_id}"}
    return VIEWS[model_id]["admin"]
