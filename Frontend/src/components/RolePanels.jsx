import { useEffect, useRef, useState } from "react";
import { translations } from "../data/demoData";

const speechLangMap = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  bn: "bn-IN",
};

function getPreferredVoice(language) {
  if (!window.speechSynthesis) {
    return null;
  }

  const targetLang = speechLangMap[language] || "en-IN";
  const voices = window.speechSynthesis.getVoices();

  return (
    voices.find((voice) => voice.lang === targetLang) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith(language)) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith(targetLang.slice(0, 2))) ||
    null
  );
}

export function DoctorPanel({ data, language, onLanguageChange }) {
  const [speechState, setSpeechState] = useState("idle");
  const utteranceRef = useRef(null);
  const translated = translations[language];
  const watchText = translated?.watch || data.watch;
  const patientText = translated?.patient || data.patient;
  const promptText = translated?.prompt || data.prompt;
  const speechSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!speechSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeechState("idle");

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [language, speechSupported, watchText]);

  const startSpeech = () => {
    if (!speechSupported) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(watchText);
    utterance.lang = speechLangMap[language] || "en-IN";
    utterance.rate = language === "ta" || language === "te" || language === "bn" ? 0.88 : 0.94;
    utterance.pitch = 1;
    utterance.voice = getPreferredVoice(language);
    utterance.onstart = () => setSpeechState("speaking");
    utterance.onpause = () => setSpeechState("paused");
    utterance.onresume = () => setSpeechState("speaking");
    utterance.onend = () => setSpeechState("idle");
    utterance.onerror = () => setSpeechState("idle");

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    if (!speechSupported) {
      return;
    }

    if (speechState === "speaking") {
      window.speechSynthesis.pause();
      setSpeechState("paused");
      return;
    }

    if (speechState === "paused") {
      window.speechSynthesis.resume();
      setSpeechState("speaking");
      return;
    }

    startSpeech();
  };

  const speechButtonLabel =
    speechState === "speaking" ? "Pause" : speechState === "paused" ? "Resume" : "Speak";

  return (
    <div className="role-panel">
      <div className="role-header">
        <div>
          <h3>What this means for your patients</h3>
          <p>Plain language summary of how this model performs in your context.</p>
        </div>
        <div className="language-tools">
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            {Object.entries(translations).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          {language !== "en" ? (
            <button
              className={`icon-button ${speechState === "speaking" ? "icon-button-active" : ""}`}
              onClick={toggleSpeech}
              title={`${speechButtonLabel} translated warning`}
              disabled={!speechSupported}
            >
              {speechButtonLabel}
            </button>
          ) : null}
        </div>
      </div>
      <div className="role-grid">
        <article className="info-card">
          <h4>What to watch for</h4>
          <p>{watchText}</p>
        </article>
        <article className="info-card">
          <h4>Patient example</h4>
          <p>{patientText}</p>
        </article>
        <article className="info-card">
          <h4>Prompt guidance</h4>
          <p>{promptText}</p>
        </article>
      </div>
    </div>
  );
}

export function BuilderPanel({ data }) {
  return (
    <div className="role-panel">
      <div className="role-grid">
        <article className="info-card">
          <h4>Training data diagnosis</h4>
          <p>{data.diagnosis}</p>
        </article>
        <article className="info-card">
          <h4>Confidence score diagnostic</h4>
          <p>{data.confidence}</p>
        </article>
        <article className="info-card">
          <h4>Recommended action</h4>
          <p>{data.action}</p>
        </article>
      </div>
    </div>
  );
}

export function AdminPanel({ data }) {
  return (
    <div className="role-panel">
      <div className="role-grid">
        <article className="info-card">
          <h4>Risk rating</h4>
          <p>{data.riskRating}</p>
        </article>
        <article className="info-card">
          <h4>Affected population</h4>
          <p>{data.affectedPopulation}</p>
        </article>
        <article className="info-card">
          <h4>Recommended action</h4>
          <p>{data.action}</p>
        </article>
      </div>
      <article className="info-card">
        <h4>Compliance note</h4>
        <p>{data.compliance}</p>
      </article>
    </div>
  );
}
