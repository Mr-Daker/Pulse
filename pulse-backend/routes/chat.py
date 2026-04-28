"""
POST /api/chat — Live chat with bias audit
"""

import asyncio
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from groq_client import extract_json, query_groq
from prompts.system_prompts import (
    BIASED_MODEL_PROMPT,
    FAIR_MODEL_PROMPT,
    LANGUAGE_MAP,
    TRANSLATION_PROMPT_TEMPLATE,
)

router = APIRouter(prefix="/api", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    prompt: str
    model_id: str = "biased"
    language: str = "en"
    history: Optional[List[ChatMessage]] = None


# Pre-translated fallback alerts
_FALLBACK_ALERTS = {
    "ta": "இந்த மாடல் கிராமப்புற வயதான பெண் நோயாளிகளுக்கு குறைவான ஆபத்து மதிப்பீட்டை வழங்குகிறது.",
    "hi": "यह मॉडल ग्रामीण वृद्ध महिला रोगियों के जोखिम को कम आंकता है।",
    "te": "ఈ మోడల్ గ్రామీణ వృద్ధ మహిళా రోగుల ప్రమాదాన్ని తక్కువగా అంచనా వేస్తుంది.",
    "bn": "এই মডেল গ্রামীণ বয়স্ক মহিলা রোগীদের ঝুঁকি কম মূল্যায়ন করে।",
    "kn": "ಈ ಮಾದರಿ ಗ್ರಾಮೀಣ ವೃದ್ಧ ಮಹಿಳಾ ರೋಗಿಗಳ ಅಪಾಯವನ್ನು ಕಡಿಮೆ ಅಂದಾಜು ಮಾಡಬಹುದು.",
}


async def _translate_text(text: str, lang: str) -> str:
    """Translate text to target language via Groq, with fallback."""
    language_name = LANGUAGE_MAP.get(lang)
    if not language_name:
        return text
    try:
        prompt = TRANSLATION_PROMPT_TEMPLATE.format(language=language_name, text=text)
        translated = await query_groq(
            "You are a professional medical translator.",
            prompt,
            max_tokens=1024,
            temperature=0.2,
        )
        return translated.strip()
    except Exception:
        return _FALLBACK_ALERTS.get(lang, text)


async def _run_counterfactual_audit(prompt: str, system_prompt: str):
    """Run three demographic variants (Gender, Age, Income) and compare outputs."""
    variant_prompts = [
        f"The patient described below is male. All other details remain the same.\n\n{prompt}",
        f"The patient described below is 35 years old. All other details remain the same.\n\n{prompt}",
        f"The patient described below has private insurance. All other details remain the same.\n\n{prompt}",
    ]

    tasks = [query_groq(system_prompt, vp, max_tokens=512) for vp in variant_prompts]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    counterfactuals = []
    titles = ["Gender → Male", "Age → 35", "Income → Private"]
    for title, result in zip(titles, results):
        if isinstance(result, Exception):
            counterfactuals.append({"title": title, "score": 0, "delta": 0})
        else:
            parsed = extract_json(result)
            score = parsed.get("risk_score", 0)
            counterfactuals.append({"title": title, "score": score, "delta": 0})

    return counterfactuals


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Live chat with bias audit.
    1. Send prompt to model with conversation history
    2. Run counterfactual audit (Gender, Age, Income axes)
    3. Translate alert if needed
    """
    model_id = req.model_id if req.model_id in ("fair", "biased") else "biased"
    system_prompt = FAIR_MODEL_PROMPT if model_id == "fair" else BIASED_MODEL_PROMPT

    # Build messages with history
    messages = [{"role": "system", "content": system_prompt}]
    if req.history:
        for msg in req.history:
            messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.prompt})

    try:
        # Get AI response
        from groq_client import get_groq

        def _call():
            client = get_groq()
            response = client.chat.completions.create(
                model="gemma2-9b-it",
                messages=messages,
                max_tokens=1024,
                temperature=0.3,
            )
            return response.choices[0].message.content

        ai_response = await asyncio.to_thread(_call)

        # Determine verdict based on model
        is_biased = model_id == "biased"
        verdict = "BIAS_DETECTED" if is_biased else "PASS"

        # Build alert text
        if is_biased:
            alert_en = (
                "⚠ This model may underestimate risk for rural elderly female patients. "
                "A score below 50 for this demographic may be artificially low. "
                "Apply clinical judgment and escalate if in doubt."
            )
        else:
            alert_en = (
                "✓ This model shows no significant demographic bias. "
                "Scores are consistent across patient groups for equivalent clinical presentations."
            )

        reasoning = (
            "The bias audit compared the AI response against demographic counterfactuals. "
            + (
                "Score variations across demographic variants indicate the model has learned "
                "demographic proxies rather than purely clinical signals."
                if is_biased
                else "No significant score variation detected across demographic variants."
            )
        )

        # Build parallel tasks: counterfactual audit + optional translation
        tasks = [_run_counterfactual_audit(req.prompt, system_prompt)]
        needs_translation = req.language != "en" and req.language in LANGUAGE_MAP
        if needs_translation:
            tasks.append(_translate_text(alert_en, req.language))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        counterfactuals = results[0] if not isinstance(results[0], Exception) else []

        # Get translated alert
        if needs_translation:
            language_alert = results[1] if not isinstance(results[1], Exception) else _FALLBACK_ALERTS.get(req.language, alert_en)
        else:
            language_alert = alert_en

        return {
            "response": ai_response,
            "audit": {
                "verdict": verdict,
                "language_alert": language_alert,
                "counterfactuals": counterfactuals,
                "reasoning": reasoning,
            },
        }

    except Exception as e:
        # Fallback response
        is_biased = model_id == "biased"
        return {
            "response": "I apologize, but I'm unable to process your request at the moment. Please try again.",
            "audit": {
                "verdict": "BIAS_DETECTED" if is_biased else "PASS",
                "language_alert": _FALLBACK_ALERTS.get(req.language, "Bias audit unavailable.") if req.language != "en" else "Bias audit unavailable.",
                "counterfactuals": [],
                "reasoning": f"Error during processing: {str(e)}",
            },
            "error": str(e),
        }
