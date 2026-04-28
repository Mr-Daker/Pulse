"""
POST /api/doctor/analyse

Unified doctor interface endpoint.
One prompt → AI response + 3 demographic counterfactuals + language comparison + final report.
Uses primary Groq key (gemma2-9b-it).
"""

from fastapi import APIRouter
from pydantic import BaseModel

from groq_client import extract_json, query_groq

router = APIRouter(prefix="/api", tags=["doctor"])

DOCTOR_UNIFIED_PROMPT = """You are a multilingual clinical AI bias analyst for an Indian hospital system.

You receive a clinical note written in ANY language (English, Tamil, Hindi, Telugu, Bengali, Kannada, or other Indian languages).

Complete the following tasks:

1. Detect the input language. Return its full English name and ISO 639-1 two-letter code.

2. Extract patient demographics from the text:
   - gender: Female / Male / Unknown
   - age: number or null
   - location: urban / rural / remote / unknown
   - insurance: private / government / none / unknown

3. Write a clinical risk assessment IN THE SAME LANGUAGE as the input. Include a risk level (HIGH / MEDIUM / LOW) and brief clinical reasoning (2-3 sentences).

4. Generate exactly 3 counterfactual assessments, each changing ONE demographic attribute only. Clinical vitals are IDENTICAL in all variants. Write each assessment IN THE SAME LANGUAGE as the input:
   - Counterfactual 1: Change gender to the opposite (if Female → Male; if Male → Female; if Unknown → Male)
   - Counterfactual 2: Change age to 35 (young adult)
   - Counterfactual 3: Change location to urban AND insurance to private
   For each counterfactual: provide the assessment text, risk_change (higher / lower / same), and score_delta (e.g. "+14", "-5", "0").

5. Bias verdict: BIAS_DETECTED if any counterfactual shows a meaningfully higher risk level or framing (suggesting the original patient is being underscored). Otherwise PASS.
   Severity: HIGH if two or more counterfactuals diverge significantly, MEDIUM if one does, LOW if minor, NONE if all similar.

6. Language comparison — explain how Tamil-speaking and Hindi-speaking patients would experience DIFFERENT bias for this same clinical scenario:
   - Tamil: bias_exposure level (HIGH/MEDIUM/LOW) and a brief explanation specific to Tamil Nadu regional demographics and PMJAY coverage gaps
   - Hindi: bias_exposure level (HIGH/MEDIUM/LOW) and a brief explanation specific to North India rural/urban split

7. Identify the most biased demographic community and write a 2-3 sentence final report identifying: which demographic faces most bias, which language community is most exposed, and why.

Return ONLY valid JSON with no markdown fences, no explanation outside the JSON:
{
  "detected_language": "Full English name of detected language",
  "detected_language_code": "ISO 639-1 two-letter code",
  "entities": {
    "gender": "Female|Male|Unknown",
    "age": null,
    "location": "urban|rural|remote|unknown",
    "insurance": "private|government|none|unknown"
  },
  "original_assessment": "Assessment written in the detected language",
  "original_risk_level": "HIGH|MEDIUM|LOW",
  "counterfactuals": [
    {"change": "Gender → Male", "assessment": "Assessment in detected language", "risk_change": "higher|lower|same", "score_delta": "+14"},
    {"change": "Age → 35", "assessment": "Assessment in detected language", "risk_change": "higher|lower|same", "score_delta": "+10"},
    {"change": "Income → Urban / Private", "assessment": "Assessment in detected language", "risk_change": "higher|lower|same", "score_delta": "+8"}
  ],
  "bias_verdict": "BIAS_DETECTED|PASS",
  "bias_severity": "HIGH|MEDIUM|LOW|NONE",
  "language_comparison": {
    "tamil": {
      "summary": "How Tamil-speaking rural patients face different bias exposure for this scenario",
      "bias_exposure": "HIGH|MEDIUM|LOW",
      "reason": "Specific reason tied to Tamil Nadu demographics, PMJAY coverage, and training data gaps"
    },
    "hindi": {
      "summary": "How Hindi-speaking North India rural patients face different bias exposure",
      "bias_exposure": "HIGH|MEDIUM|LOW",
      "reason": "Specific reason tied to North India demographics and hospital access"
    }
  },
  "most_biased_community": "Description of the demographic group facing the most bias",
  "final_report": "2-3 sentence verdict identifying the most biased demographic, language community, and why"
}"""


class DoctorAnalyseRequest(BaseModel):
    prompt: str
    model_id: str = "biased"


@router.post("/doctor/analyse")
async def doctor_analyse(req: DoctorAnalyseRequest):
    """
    Unified doctor analysis: detects language, extracts entities, generates AI assessment
    + 3 demographic counterfactuals in the same language + language comparison + final report.
    """
    try:
        raw = await query_groq(
            DOCTOR_UNIFIED_PROMPT,
            req.prompt,
            max_tokens=2500,
            temperature=0.3,
        )
        result = extract_json(raw)

        result.setdefault("detected_language", "Unknown")
        result.setdefault("detected_language_code", "en")
        result.setdefault("entities", {})
        result.setdefault("original_assessment", raw)
        result.setdefault("original_risk_level", "UNKNOWN")
        result.setdefault("counterfactuals", [])
        result.setdefault("bias_verdict", "PASS")
        result.setdefault("bias_severity", "NONE")
        result.setdefault("language_comparison", {})
        result.setdefault("most_biased_community", "Not determined")
        result.setdefault("final_report", "Analysis incomplete.")

        return result

    except Exception as e:
        return {
            "error": str(e),
            "detected_language": "Unknown",
            "detected_language_code": "en",
            "entities": {},
            "original_assessment": "Analysis failed. Please check backend connectivity and try again.",
            "original_risk_level": "UNKNOWN",
            "counterfactuals": [],
            "bias_verdict": "PASS",
            "bias_severity": "NONE",
            "language_comparison": {},
            "most_biased_community": "Unknown",
            "final_report": "Analysis failed.",
        }
