"""
POST /api/dataset/profile
POST /api/dataset/patients
"""

import json
import os
from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

# ── Load patients from fixture ───────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

with open(os.path.join(DATA_DIR, "patients.json")) as f:
    PATIENTS: List[Dict[str, Any]] = json.load(f)


# ── Pre-computed profile for the sample dataset ──────────────────────────────
SAMPLE_PROFILE = {
    "totalRecords": 500,
    "sourceName": "Sample Indian Healthcare Dataset",
    "demographicBreakdown": {
        "gender": [
            {"label": "Male", "value": 55},
            {"label": "Female", "value": 43},
            {"label": "Other", "value": 2},
        ],
        "districtType": [
            {"label": "Urban", "value": 35},
            {"label": "Rural", "value": 40},
            {"label": "Remote", "value": 25},
        ],
        "insurance": [
            {"label": "Private", "value": 30},
            {"label": "PMJAY", "value": 45},
            {"label": "State", "value": 15},
            {"label": "None", "value": 10},
        ],
    },
    "alert": (
        "Representation gap detected: Remote elderly female patients (age 60+, "
        "district type Remote) make up 6.2% of this dataset. Models trained on "
        "datasets with this level of underrepresentation often show reduced "
        "reliability for this group."
    ),
    "alertTone": "warning",
    "missingDataRates": {
        "vitals": 0.0,
        "labs": 0.02,
        "demographics": 0.0,
    },
    "representationGaps": [
        {
            "group": "Remote elderly female (60+)",
            "percentage": 6.2,
            "flag": True,
        }
    ],
}


def _compute_profile(records: List[Dict]) -> Dict[str, Any]:
    """Compute a demographic profile from uploaded patient records."""
    total = len(records)
    if total == 0:
        return {"error": "No records provided"}

    # Count demographics
    genders: Dict[str, int] = {}
    districts: Dict[str, int] = {}
    insurances: Dict[str, int] = {}
    remote_elderly_female = 0

    for r in records:
        g = r.get("gender", "Unknown")
        genders[g] = genders.get(g, 0) + 1

        d = r.get("district_type", r.get("districtType", "Unknown"))
        districts[d] = districts.get(d, 0) + 1

        ins = r.get("insurance_type", r.get("insuranceType", "Unknown"))
        insurances[ins] = insurances.get(ins, 0) + 1

        age = r.get("age", 0)
        if g == "Female" and d in ("remote", "Remote") and age >= 60:
            remote_elderly_female += 1

    def to_breakdown(counts):
        return [
            {"label": k, "value": round(v / total * 100, 1)}
            for k, v in sorted(counts.items(), key=lambda x: -x[1])
        ]

    ref_share = round(remote_elderly_female / total * 100, 1)
    has_gap = ref_share < 10

    return {
        "totalRecords": total,
        "demographicBreakdown": {
            "gender": to_breakdown(genders),
            "districtType": to_breakdown(districts),
            "insurance": to_breakdown(insurances),
        },
        "alert": (
            f"Representation gap detected: Remote elderly female patients "
            f"(age 60+, district type Remote) make up {ref_share}% of this "
            f"dataset. Models trained on datasets with this level of "
            f"underrepresentation often show reduced reliability for this group."
            if has_gap
            else f"No critical representation gap detected. Remote elderly female "
            f"patients make up {ref_share}% of this dataset."
        ),
        "alertTone": "warning" if has_gap else "success",
    }


class ProfileRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    use_sample: bool = True


@router.post("/profile")
async def dataset_profile(req: ProfileRequest = Body(default=ProfileRequest())):
    """
    Return demographic profile of a dataset.
    If use_sample=True (default), returns the pre-computed sample profile.
    Otherwise computes from the provided records array.
    """
    if req.use_sample or req.records is None:
        return SAMPLE_PROFILE
    return _compute_profile(req.records)


@router.get("/patients")
async def get_patients():
    """Return the full 500-record patient dataset."""
    return PATIENTS


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Return a single patient by ID."""
    for p in PATIENTS:
        if p["patient_id"] == patient_id:
            return p
    raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
