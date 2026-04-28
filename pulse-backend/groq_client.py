"""
Shared Groq API clients — primary (key 1) and secondary (key 2 for language-bias feature).
"""

import asyncio
import json
import os
import re
from typing import Dict

_groq_client = None
_groq_client_2 = None


def get_groq():
    """Return primary Groq client singleton (GROQ_API_KEY)."""
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        _groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    return _groq_client


def get_groq_secondary():
    """Return secondary Groq client singleton (GROQ_API_KEY_2) for language-bias feature.
    Falls back to primary key if secondary not configured."""
    global _groq_client_2
    if _groq_client_2 is None:
        from groq import Groq
        key = os.environ.get("GROQ_API_KEY_2") or os.environ.get("GROQ_API_KEY")
        _groq_client_2 = Groq(api_key=key)
    return _groq_client_2


async def query_groq(
    system_prompt: str,
    user_message: str,
    model: str = "llama-3.3-70b-versatile",
    max_tokens: int = 1024,
    temperature: float = 0.3,
) -> str:
    """Run a synchronous Groq call in a thread so we don't block the event loop."""
    def _call():
        client = get_groq()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content

    return await asyncio.to_thread(_call)


async def query_groq_secondary(
    system_prompt: str,
    user_message: str,
    model: str = "llama-3.3-70b-versatile",
    max_tokens: int = 2048,
    temperature: float = 0.3,
) -> str:
    """Run a call using the secondary Groq key with llama-3.3-70b for multilingual tasks."""
    def _call():
        client = get_groq_secondary()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content

    return await asyncio.to_thread(_call)


def extract_json(text: str) -> Dict:
    """Try to extract a JSON object from LLM response that may contain markdown fences."""
    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", text)
    cleaned = cleaned.strip()
    # Find the outermost JSON object
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"raw_response": text}
