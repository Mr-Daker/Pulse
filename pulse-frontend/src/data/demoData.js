/* ─── Models ─────────────────────────────────────────────────────────────── */
export const MODELS = {
  fair: {
    id: 'fair',
    name: 'FairSepsis v2 (Google Health AI)',
    short: 'Model A',
    verdict: 'FAIR',
    tone: 'ok',
    pass: true,
    metrics: [
      { label: 'Demographic Parity Gap', value: 0.04, max: 0.30, status: 'PASS', tone: 'ok', detail: 'High-risk patients across all groups receive near-equivalent scores for equivalent clinical presentations.' },
      { label: 'Equalized Odds Gap',     value: 0.03, max: 0.30, status: 'PASS', tone: 'ok', detail: 'Sepsis risk is identified consistently across all demographic groups with equal clinical severity.' },
      { label: 'Calibration Gap',        value: 0.02, max: 0.30, status: 'PASS', tone: 'ok', detail: 'Confidence scores are stable and well-calibrated across all patient demographics.' },
    ],
    bar: [
      { label: 'Urban Male Private',     value: 68 },
      { label: 'Urban Female Private',   value: 66 },
      { label: 'Rural Male PMJAY',       value: 65 },
      { label: 'Rural Female PMJAY',     value: 64 },
      { label: 'Remote Female PMJAY',    value: 63 },
    ],
    heatmap: {
      cols: ['Urban', 'Rural', 'Remote'],
      rows: [
        { label: 'Male',   values: [68, 66, 65] },
        { label: 'Female', values: [67, 64, 63] },
        { label: 'Other',  values: [65, 63, 61] },
      ],
    },
    drift: [0.90, 0.89, 0.91, 0.90, 0.88, 0.89, 0.90],
    cf: {
      original: { score: 64, profile: 'Female, 67, Remote, PMJAY' },
      variants: [
        { title: 'Gender Counterfactual',   profile: 'Male, 67, Remote, PMJAY',    score: 66, delta: '+2' },
        { title: 'Age Counterfactual',      profile: 'Female, 38, Remote, PMJAY',  score: 65, delta: '+1' },
        { title: 'Income Counterfactual',   profile: 'Female, 67, Remote, Private', score: 66, delta: '+2' },
      ],
    },
    doctor: {
      watch:  'This model performs consistently across all patient groups. No systematic underscoring detected for any demographic.',
      patient:'Priya, 67, Remote Tamil Nadu, PMJAY — model scored 64/100. Score reflects actual clinical severity.',
      prompt: 'Lab values (lactate, WBC) are appropriately weighted. Standard clinical documentation applies.',
    },
    builder: {
      diagnosis:  'Training data shows balanced representation across district types and demographics. No proxy variables detected.',
      confidence: 'Confidence scores are well-calibrated. No systematic over- or under-confidence detected for any subgroup.',
      action:     'Approved for clinical use. Schedule re-evaluation quarterly as new district data is onboarded.',
    },
    admin: {
      risk:       'Low — no clinically unjustified disparity detected.',
      pop:        'No group at elevated risk from model predictions.',
      action:     'Maintain in standard use. Routine quarterly monitoring recommended.',
      compliance: 'Meets clinical AI fairness standards. No escalation required.',
    },
    reasoning: `Analyzing Model A (FairSepsis v2)...

STEP 1 — Metric review
  Demographic Parity Gap : 0.04  ✓ (threshold: 0.10)
  Equalized Odds Gap     : 0.03  ✓ (threshold: 0.10)
  Calibration Gap        : 0.02  ✓ (threshold: 0.10)
  → All metrics within acceptable bounds.

STEP 2 — Counterfactual check
  Patient P-0142 (Female, 67, Remote, PMJAY)
  Original score       : 64 / 100
  Variant — gender     : 66  (+2)   within stochastic variance ✓
  Variant — age        : 65  (+1)   within stochastic variance ✓
  Variant — income     : 66  (+2)   within stochastic variance ✓
  → No demographic amplification detected.

STEP 3 — Causal pathway analysis
  Clinical inputs (HR, BP, Lactate, WBC) : dominant weight ✓
  Demographic inputs                     : no significant weight ✓

VERDICT: NO_CLINICALLY_UNJUSTIFIED_DISPARITY
  Model A scores patients based on clinical evidence alone.
  Cleared for decision-support use.
  Recommendation: maintain in standard deployment.`,
  },

  biased: {
    id: 'biased',
    name: 'SepsisScore v1 (Legacy System)',
    short: 'Model B',
    verdict: 'BIAS DETECTED',
    tone: 'err',
    pass: false,
    metrics: [
      { label: 'Demographic Parity Gap', value: 0.23, max: 0.30, status: 'FAIL', tone: 'err', detail: 'Rural/remote patients receive significantly lower scores than clinically equivalent urban patients.' },
      { label: 'Equalized Odds Gap',     value: 0.21, max: 0.30, status: 'FAIL', tone: 'err', detail: 'Model misses high-risk rural patients at a much higher rate than urban patients with identical presentations.' },
      { label: 'Calibration Gap',        value: 0.18, max: 0.30, status: 'FAIL', tone: 'err', detail: 'Confidence scores are systematically lower for elderly female PMJAY patients regardless of clinical severity.' },
    ],
    bar: [
      { label: 'Urban Male Private',     value: 68 },
      { label: 'Urban Female Private',   value: 61 },
      { label: 'Rural Male PMJAY',       value: 52 },
      { label: 'Rural Female PMJAY',     value: 42 },
      { label: 'Remote Female PMJAY',    value: 38 },
    ],
    heatmap: {
      cols: ['Urban', 'Rural', 'Remote'],
      rows: [
        { label: 'Male',   values: [68, 55, 52] },
        { label: 'Female', values: [61, 42, 38] },
        { label: 'Other',  values: [58, 54, 51] },
      ],
    },
    drift: [0.85, 0.83, 0.81, 0.79, 0.62, 0.54, 0.48],
    cf: {
      original: { score: 38, profile: 'Female, 67, Remote, PMJAY' },
      variants: [
        { title: 'Gender Counterfactual',   profile: 'Male, 67, Remote, PMJAY',      score: 52, delta: '+14' },
        { title: 'Age Counterfactual',      profile: 'Female, 38, Remote, PMJAY',    score: 55, delta: '+17' },
        { title: 'Income Counterfactual',   profile: 'Female, 67, Remote, Private',  score: 59, delta: '+21' },
      ],
    },
    doctor: {
      watch:  'This model underscores rural elderly women. A score below 50 for this demographic may be artificially low — apply clinical judgment and escalate if in doubt.',
      patient:'Priya, 67, Remote Tamil Nadu, PMJAY — model scored 38/100. Her vitals indicate HIGH risk. Do not rely on this score alone.',
      prompt: 'Documenting lactate, WBC and onset time clearly will partially offset the demographic bias in this case.',
    },
    builder: {
      diagnosis:  'Training data underrepresents remote elderly female patients. The model has learned documentation quality as a proxy for clinical severity.',
      confidence: 'Confidence scores are 30% lower for female patients over 60 with PMJAY insurance in remote districts — no clinical basis for this.',
      action:     'Retrain with representative district data. Apply post-processing fairness constraint for remote elderly female subgroup.',
    },
    admin: {
      risk:       'HIGH — statistically significant disparity for remote elderly female patients.',
      pop:        'Remote elderly women (~12% of PMJAY patient base in affected districts).',
      action:     'Remove from primary decision-support for affected demographic. Mandatory human review required.',
      compliance: 'Does not meet fairness standards. Escalation required under DISHA/NHP AI guidelines.',
    },
    reasoning: `Analyzing Model B (SepsisScore v1)...

STEP 1 — Metric review
  Demographic Parity Gap : 0.23  ✗ EXCEEDS threshold (0.10)
  Equalized Odds Gap     : 0.21  ✗ EXCEEDS threshold (0.10)
  Calibration Gap        : 0.18  ✗ EXCEEDS threshold (0.10)
  → ALL THREE METRICS FAIL.

STEP 2 — Counterfactual check
  Patient P-0142 (Female, 67, Remote, PMJAY)
  Original score        : 38 / 100
  Variant — gender      : 52  (+14)   +37% for gender change alone
  Variant — age         : 55  (+17)   +45% for age change alone
  Variant — income      : 59  (+21)   +55% for insurance change alone
  → Score varies by up to 21 points on IDENTICAL clinical vitals.
  → THIS CANNOT BE JUSTIFIED BY CLINICAL EVIDENCE.

STEP 3 — Causal pathway analysis
  Clinical inputs (HR, BP, Lactate): moderate weight ⚠
  Demographic inputs:
    district_type   → HIGH weight  (−18 pts for "remote")    ✗
    gender          → MEDIUM weight (−8 pts for "female")    ✗
    insurance_type  → HIGH weight  (proxy: documentation quality) ✗

VERDICT: STRUCTURALLY_HARMFUL
  Model B has learned the consequences of unequal care delivery.
  Rural elderly women were historically undertriaged in training data.
  The model is now replicating systemic discrimination at scale.

  RECOMMENDATION:
  → Suspend clinical use for: Female, 60+, Remote/Rural, PMJAY
  → Apply mandatory human review flag for all matching patients
  → Retrain with representative district data before redeployment`,
  },
};

/* ─── Translations ───────────────────────────────────────────────────────── */
export const TRANSLATIONS = {
  en: {
    label: 'English',
    watch:  MODELS.biased.doctor.watch,
    patient: MODELS.biased.doctor.patient,
    prompt:  MODELS.biased.doctor.prompt,
  },
  ta: {
    label: 'தமிழ்',
    watch:  'இந்த மாடல் கிராமப்புற வயதான பெண் நோயாளிகளுக்கு குறைவான ஆபத்து மதிப்பீட்டை வழங்குகிறது. 50-க்கு கீழே மதிப்பெண் பெற்றவர்களுக்கு மருத்துவ தீர்ப்பை நம்பவும்.',
    patient: 'பிரியா, 67, தொலைதூர தமிழ்நாடு, PMJAY — மாடல் 38/100 என்று கணித்தது. அவரின் உயிரியல் அளவுகள் உயர் ஆபத்தை காட்டுகின்றன. இந்த மதிப்பெண்ணை மட்டும் நம்பாதீர்கள்.',
    prompt:  'லாக்டேட் மற்றும் WBC போன்ற ஆய்வக மதிப்புகளை தெளிவாக பதிவு செய்வது இந்த மாடலின் தாக்கத்தை குறைக்கும்.',
  },
  hi: {
    label: 'हिंदी',
    watch:  'यह मॉडल ग्रामीण वृद्ध महिला रोगियों के जोखिम को कम आंकता है। 50 से नीचे स्कोर वाले रोगियों के लिए नैदानिक निर्णय लागू करें।',
    patient: 'प्रिया, 67, दूरस्थ तमिलनाडु, PMJAY — मॉडल ने 38/100 स्कोर दिया। उनके संकेत उच्च जोखिम दिखाते हैं। इस स्कोर पर अकेले भरोसा न करें।',
    prompt:  'लैक्टेट और WBC जैसे लैब मान स्पष्ट रूप से दस्तावेज करने से इस मॉडल के प्रभाव को कम किया जा सकता है।',
  },
  te: {
    label: 'తెలుగు',
    watch:  'ఈ మోడల్ గ్రామీణ వృద్ధ మహిళా రోగుల ప్రమాదాన్ని తక్కువగా అంచనా వేస్తుంది. 50 కంటే తక్కువ స్కోర్ ఉన్న రోగులకు వైద్య నిర్ణయాన్ని వర్తింపజేయండి.',
    patient: 'ప్రియా, 67, దూర ప్రాంతం, PMJAY — మోడల్ 38/100 స్కోర్ ఇచ్చింది. ఆమె వైద్య సంకేతాలు అధిక ప్రమాదాన్ని చూపిస్తున్నాయి.',
    prompt:  'లాక్టేట్, WBC వంటి ల్యాబ్ విలువలను స్పష్టంగా నమోదు చేయడం ఈ మోడల్ ప్రభావాన్ని తగ్గిస్తుంది.',
  },
  bn: {
    label: 'বাংলা',
    watch:  'এই মডেল গ্রামীণ বয়স্ক মহিলা রোগীদের ঝুঁকি কম মূল্যায়ন করে। ৫০-এর নিচে স্কোরের রোগীদের জন্য ক্লিনিক্যাল বিচার প্রয়োগ করুন।',
    patient: 'প্রিয়া, ৬৭, দূরবর্তী তামিলনাড়ু, PMJAY — মডেল ৩৮/১০০ স্কোর দিয়েছে। তার ভাইটালস উচ্চ ঝুঁকি দেখাচ্ছে।',
    prompt:  'ল্যাকটেট এবং WBC-এর মতো ল্যাব মান স্পষ্টভাবে নথিভুক্ত করলে এই মডেলের প্রভাব কমানো যায়।',
  },
  kn: {
    label: 'ಕನ್ನಡ',
    watch:  'ಈ ಮಾದರಿ ಗ್ರಾಮೀಣ ವೃದ್ಧ ಮಹಿಳಾ ರೋಗಿಗಳ ಅಪಾಯವನ್ನು ಕಡಿಮೆ ಅಂದಾಜು ಮಾಡಬಹುದು. 50ಕ್ಕಿಂತ ಕಡಿಮೆ ಸ್ಕೋರ್ ಇರುವ ರೋಗಿಗಳಿಗೆ ವೈದ್ಯಕೀಯ ತೀರ್ಪನ್ನು ಅನ್ವಯಿಸಿ.',
    patient: 'ಪ್ರಿಯಾ, 67, ದೂರದ ತಮಿಳುನಾಡು, PMJAY — ಮಾದರಿ 38/100 ಸ್ಕೋರ್ ನೀಡಿದೆ. ಅವಳ ವೈಟಲ್ಸ್ ಹೆಚ್ಚಿನ ಅಪಾಯವನ್ನು ತೋರಿಸುತ್ತವೆ.',
    prompt:  'ಲ್ಯಾಕ್ಟೇಟ್ ಮತ್ತು WBC ಯಂತಹ ಲ್ಯಾಬ್ ಮೌಲ್ಯಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ದಾಖಲಿಸುವುದು ಈ ಮಾದರಿಯ ಪ್ರಭಾವವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.',
  },
};

/* ─── Patients ───────────────────────────────────────────────────────────── */
export const PATIENTS = [
  { id: 'P-0142', age: 67, gender: 'Female', district: 'Remote', ins: 'PMJAY',   fair: 64, biased: 38, flag: true  },
  { id: 'P-0177', age: 72, gender: 'Female', district: 'Remote', ins: 'PMJAY',   fair: 77, biased: 41, flag: true  },
  { id: 'P-0523', age: 61, gender: 'Female', district: 'Rural',  ins: 'PMJAY',   fair: 69, biased: 45, flag: true  },
  { id: 'P-0218', age: 54, gender: 'Male',   district: 'Rural',  ins: 'PMJAY',   fair: 71, biased: 55, flag: true  },
  { id: 'P-0091', age: 45, gender: 'Female', district: 'Rural',  ins: 'State',   fair: 58, biased: 44, flag: true  },
  { id: 'P-0334', age: 38, gender: 'Male',   district: 'Urban',  ins: 'Private', fair: 62, biased: 68, flag: false },
  { id: 'P-0456', age: 29, gender: 'Male',   district: 'Urban',  ins: 'Private', fair: 55, biased: 58, flag: false },
  { id: 'P-0089', age: 42, gender: 'Male',   district: 'Rural',  ins: 'State',   fair: 61, biased: 53, flag: false },
];

/* ─── Income tier derivation ─────────────────────────────────────────────── */
export function getIncomeTier(insurance) {
  if (insurance === 'Private') return 'High Income';
  if (insurance === 'State')   return 'Middle Income';
  return 'Low Income'; // PMJAY
}

export const QUARTERS = ['Q1 22', 'Q2 22', 'Q3 22', 'Q4 22', 'Q1 23', 'Q2 23', 'Q3 23'];

export const SPEECH_LANG_MAP = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN', bn: 'bn-IN', kn: 'kn-IN' };

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

/* ─── Causal Graph Data (for React Flow) ─────────────────────────────────── */
export const CAUSAL_GRAPH_DATA = {
  fair: {
    nodes: [
      { id: 'hr',        label: 'Heart Rate (HR)',  type: 'clinical', weight: 'High',   justified: true },
      { id: 'bp',        label: 'Blood Pressure',   type: 'clinical', weight: 'High',   justified: true },
      { id: 'temp',      label: 'Temperature',      type: 'clinical', weight: 'Medium', justified: true },
      { id: 'lactate',   label: 'Lactate',          type: 'clinical', weight: 'High',   justified: true },
      { id: 'wbc',       label: 'WBC Count',        type: 'clinical', weight: 'High',   justified: true },
      { id: 'pain',      label: 'Pain Score',       type: 'clinical', weight: 'Medium', justified: true },
      { id: 'district',  label: 'District Type',    type: 'demographic', weight: 'Low', justified: false, detail: 'district_type has minimal weight — no learned geographic proxy detected.' },
      { id: 'gender',    label: 'Gender',            type: 'demographic', weight: 'Low', justified: false, detail: 'Gender has no significant influence on the risk score.' },
      { id: 'insurance', label: 'Insurance Type',   type: 'demographic', weight: 'Low', justified: false, detail: 'Insurance type has no significant influence on the risk score.' },
      { id: 'model',     label: 'Sepsis Risk Model', type: 'model' },
      { id: 'output',    label: 'Risk Score',        type: 'output' },
    ],
    edges: [
      { from: 'hr',       to: 'model', strokeWidth: 4, color: '#16A34A' },
      { from: 'bp',       to: 'model', strokeWidth: 4, color: '#16A34A' },
      { from: 'temp',     to: 'model', strokeWidth: 3, color: '#16A34A' },
      { from: 'lactate',  to: 'model', strokeWidth: 5, color: '#16A34A' },
      { from: 'wbc',      to: 'model', strokeWidth: 4, color: '#16A34A' },
      { from: 'pain',     to: 'model', strokeWidth: 3, color: '#16A34A' },
      { from: 'district', to: 'model', strokeWidth: 1, color: '#94A3B8' },
      { from: 'gender',   to: 'model', strokeWidth: 1, color: '#94A3B8' },
      { from: 'insurance',to: 'model', strokeWidth: 1, color: '#94A3B8' },
      { from: 'model',    to: 'output', strokeWidth: 3, color: '#2563EB' },
    ],
  },
  biased: {
    nodes: [
      { id: 'hr',        label: 'Heart Rate (HR)',  type: 'clinical', weight: 'High',   justified: true },
      { id: 'bp',        label: 'Blood Pressure',   type: 'clinical', weight: 'High',   justified: true },
      { id: 'temp',      label: 'Temperature',      type: 'clinical', weight: 'Medium', justified: true },
      { id: 'lactate',   label: 'Lactate',          type: 'clinical', weight: 'High',   justified: true },
      { id: 'wbc',       label: 'WBC Count',        type: 'clinical', weight: 'Medium', justified: true },
      { id: 'pain',      label: 'Pain Score',       type: 'clinical', weight: 'Medium', justified: true },
      { id: 'district',  label: 'District Type',    type: 'demographic', weight: 'High',   justified: false, detail: 'district_type has High weight with no clinical justification — this is a learned proxy for documentation quality disparities in the training data.' },
      { id: 'gender',    label: 'Gender',            type: 'demographic', weight: 'Medium', justified: false, detail: 'Gender has Medium weight — female identity reduces scores without clinical basis.' },
      { id: 'insurance', label: 'Insurance Type',   type: 'demographic', weight: 'High',   justified: false, detail: 'insurance_type (PMJAY) has High weight — acts as a socioeconomic proxy, not a clinical variable.' },
      { id: 'model',     label: 'Sepsis Risk Model', type: 'model' },
      { id: 'output',    label: 'Risk Score',        type: 'output' },
    ],
    edges: [
      { from: 'hr',       to: 'model', strokeWidth: 4, color: '#16A34A' },
      { from: 'bp',       to: 'model', strokeWidth: 4, color: '#16A34A' },
      { from: 'temp',     to: 'model', strokeWidth: 3, color: '#16A34A' },
      { from: 'lactate',  to: 'model', strokeWidth: 4, color: '#16A34A' },
      { from: 'wbc',      to: 'model', strokeWidth: 3, color: '#16A34A' },
      { from: 'pain',     to: 'model', strokeWidth: 3, color: '#16A34A' },
      { from: 'district', to: 'model', strokeWidth: 8, color: '#DC2626' },
      { from: 'gender',   to: 'model', strokeWidth: 5, color: '#EA580C' },
      { from: 'insurance',to: 'model', strokeWidth: 7, color: '#DC2626' },
      { from: 'model',    to: 'output', strokeWidth: 3, color: '#2563EB' },
    ],
  },
};
