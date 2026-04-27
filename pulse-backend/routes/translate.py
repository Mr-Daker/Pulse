"""
POST /api/translate
"""


from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from groq_client import query_groq
from prompts.system_prompts import LANGUAGE_MAP, TRANSLATION_PROMPT_TEMPLATE

router = APIRouter(prefix="/api", tags=["translate"])


# ── Pre-translated fixtures ─────────────────────────────────────────────────
PRE_TRANSLATED = {
    "ta": {
        "watch": "இந்த மாடல் கிராமப்புற வயதான பெண் நோயாளிகளுக்கு குறைவான ஆபத்து மதிப்பீட்டை வழங்குகிறது.",
        "patient": "பிரியா, 67, தொலைதூர தமிழ்நாடு, PMJAY — இந்த மாடல் 38/100 என்ற மதிப்பீட்டை அளித்தது. இவரின் உயிரியல் அளவுகள் அதிக ஆபத்தை காட்டுகின்றன.",
        "prompt": "லாக்டேட் மற்றும் WBC போன்ற ஆய்வக மதிப்புகளை தெளிவாக சேர்ப்பது இந்த மாடலின் நிலைத்தன்மையை மேம்படுத்துகிறது.",
    },
    "hi": {
        "watch": "यह मॉडल ग्रामीण बुजुर्ग महिला रोगियों के लिए जोखिम को कम आंक सकता है।",
        "patient": "प्रिया, 67, दूरस्थ तमिलनाडु, PMJAY — मॉडल ने 38/100 स्कोर दिया। उनके संकेत उच्च जोखिम दिखाते हैं।",
        "prompt": "लैक्टेट और WBC जैसे लैब मान स्पष्ट रूप से जोड़ने से इस मॉडल की स्थिरता बेहतर होती है।",
    },
    "te": {
        "watch": "ఈ మోడల్ గ్రామీణ వృద్ధ మహిళా రోగుల ప్రమాదాన్ని తక్కువగా అంచనా వేయవచ్చు.",
        "patient": "ప్రియా, 67, దూర ప్రాంత తమిళనాడు, PMJAY — మోడల్ 38/100 స్కోర్ ఇచ్చింది.",
        "prompt": "లాక్టేట్, WBC వంటి ల్యాబ్ విలువలను స్పష్టంగా ఇవ్వడం ఈ మోడల్ స్థిరత్వాన్ని మెరుగుపరుస్తుంది.",
    },
    "bn": {
        "watch": "এই মডেল গ্রামীণ বয়স্ক মহিলা রোগীদের ঝুঁকি কম দেখাতে পারে।",
        "patient": "প্রিয়া, ৬৭, দূরবর্তী তামিলনাড়ু, PMJAY — মডেল ৩৮/১০০ স্কোর দিয়েছে।",
        "prompt": "ল্যাকটেট এবং WBC-এর মতো ল্যাব মান স্পষ্টভাবে দিলে মডেলের সামঞ্জস্য বাড়ে।",
    },
}


class TranslateRequest(BaseModel):
    text: str
    target_language: str  # 'ta', 'hi', 'te', 'bn'
    field: Optional[str] = None  # optional: 'watch', 'patient', 'prompt' for cached lookup


@router.post("/translate")
async def translate_text(req: TranslateRequest):
    """
    Translate English medical text to an Indian language.
    Uses pre-translated fixtures for known fields, Groq API for custom text.
    """
    lang = req.target_language
    language_name = LANGUAGE_MAP.get(lang)

    if not language_name:
        return {"error": f"Unsupported language: {lang}. Supported: {list(LANGUAGE_MAP.keys())}"}

    # Check pre-translated cache
    if lang in PRE_TRANSLATED and req.field and req.field in PRE_TRANSLATED[lang]:
        return {
            "translated_text": PRE_TRANSLATED[lang][req.field],
            "language": language_name,
            "source": "cached",
        }

    # Live Groq translation
    try:
        prompt = TRANSLATION_PROMPT_TEMPLATE.format(language=language_name, text=req.text)
        translated = await query_groq(
            "You are a professional medical translator.",
            prompt,
            max_tokens=2048,
            temperature=0.2,
        )
        return {
            "translated_text": translated.strip(),
            "language": language_name,
            "source": "live",
        }
    except Exception as e:
        # Fallback to cached if available
        if lang in PRE_TRANSLATED:
            return {
                "translated_text": PRE_TRANSLATED[lang].get("watch", req.text),
                "language": language_name,
                "source": "fallback",
                "error": str(e),
            }
        return {"error": str(e)}
