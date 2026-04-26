export const landingStats = [
  {
    label: "Benchmark pass rate",
    value: "92%",
    detail: "of medical AI models pass standard Western fairness benchmarks",
  },
  {
    label: "Observed harm pattern",
    value: "43%",
    detail: "show significant risk score depression for rural elderly women",
  },
  {
    label: "Current framework fit",
    value: "0",
    detail: "existing frameworks account for India-specific structural inequities",
  },
];

export const sampleDatasetProfile = {
  totalRecords: 500,
  demographicBreakdown: {
    gender: [
      { label: "Male", value: 55 },
      { label: "Female", value: 43 },
      { label: "Other", value: 2 },
    ],
    districtType: [
      { label: "Urban", value: 40 },
      { label: "Rural", value: 35 },
      { label: "Remote", value: 25 },
    ],
    insurance: [
      { label: "Private", value: 30 },
      { label: "PMJAY", value: 45 },
      { label: "State", value: 15 },
      { label: "None", value: 10 },
    ],
  },
  alert:
    "Representation gap detected: Remote elderly female patients (age 60+, district type Remote) make up 6.2% of this dataset. Models trained on datasets with this level of underrepresentation often show reduced reliability for this group.",
};

export const models = {
  fair: {
    id: "fair",
    name: "Model A — Clinically Grounded System",
    shortName: "Model A",
    headerTone: "success",
    tag: "Control Model",
    verdict: "FAIR",
    verdictTone: "success",
    description:
      "Trained to evaluate clinical factors only. Demographic-blind scoring.",
    metrics: [
      {
        label: "Demographic Parity Gap",
        value: 0.04,
        status: "PASS",
        tone: "success",
        detail:
          "High-risk patients across demographic groups receive near-equivalent scores for equivalent clinical presentations.",
      },
      {
        label: "Equalized Odds Gap",
        value: 0.03,
        status: "PASS",
        tone: "success",
        detail:
          "The model identifies sepsis risk consistently across patient groups with the same clinical severity.",
      },
      {
        label: "Calibration Gap",
        value: 0.02,
        status: "PASS",
        tone: "success",
        detail:
          "Confidence scores remain stable across patient populations and track underlying clinical severity.",
      },
    ],
    barChart: [
      { label: "Urban Male Private", value: 68 },
      { label: "Urban Female Private", value: 66 },
      { label: "Rural Male PMJAY", value: 65 },
      { label: "Rural Female PMJAY", value: 64 },
      { label: "Remote Female PMJAY", value: 63 },
    ],
    heatmap: {
      columns: ["Urban", "Rural", "Remote"],
      rows: [
        { label: "Male", values: [68, 66, 65] },
        { label: "Female", values: [67, 64, 63] },
        { label: "Other", values: [65, 63, 61] },
      ],
      tooltip:
        "Scores are tightly clustered across demographic groups, with no clinically unjustified divergence detected.",
    },
    doctorView: {
      watch:
        "This model appears clinically consistent across patient groups. Continue to apply standard clinical judgment.",
      patient:
        "Priya, 67, remote Tamil Nadu, PMJAY — the model scored her 64/100. Her vitals indicate high risk and the score remains appropriately elevated.",
      prompt:
        "Clinical variables such as lactate, WBC, respiratory rate, and hypotension remain the strongest drivers of consistent outputs.",
    },
    builderView: {
      diagnosis:
        "No material demographic divergence detected. Score variation remains within acceptable bounds for the sampled counterfactual set.",
      confidence:
        "Confidence remains stable across remote, rural, and urban cohorts with similar clinical severity.",
      action:
        "Continue monitoring calibration and representation coverage as new districts are onboarded.",
    },
    adminView: {
      riskRating: "LOW",
      affectedPopulation:
        "No patient group crosses the current internal threshold for fairness-related escalation.",
      action:
        "Maintain routine audit cadence and retain the model in approved decision-support status.",
      compliance:
        "This analysis has been documented and timestamped for audit trail purposes.",
    },
    drift: [
      { quarter: "Q1 2022", value: 0.90 },
      { quarter: "Q2 2022", value: 0.89 },
      { quarter: "Q3 2022", value: 0.91 },
      { quarter: "Q4 2022", value: 0.90 },
      { quarter: "Q1 2023", value: 0.88 },
      { quarter: "Q2 2023", value: 0.89 },
      { quarter: "Q3 2023", value: 0.90 },
    ],
    counterfactual: {
      baselineScore: 64,
      baselineLabel: "Model A Risk Score",
      cards: [
        {
          title: "Variant 1",
          profile: "Male, 67, Remote, PMJAY",
          score: 66,
          delta: "+2",
        },
        {
          title: "Variant 2",
          profile: "Female, 67, Urban, Private",
          score: 66,
          delta: "+2",
        },
        {
          title: "Variant 3",
          profile: "Male, 38, Urban, Private",
          score: 67,
          delta: "+3",
        },
      ],
    },
    reasoner: {
      classification: "NO CLINICALLY UNJUSTIFIED DISPARITY",
      tone: "success",
      reasoning:
        "No clinically unjustified disparity detected. Score differences are within acceptable variance and remain consistent with minor stochastic variation in model output rather than demographic weighting.",
      recommendation:
        "Retain the model in standard use while continuing periodic fairness monitoring against representative incoming data.",
    },
    graph: {
      clinical: [
        { label: "pain_score", weight: "Medium weight" },
        { label: "hr", weight: "High weight" },
        { label: "bp", weight: "High weight" },
        { label: "lactate", weight: "High weight" },
        { label: "wbc", weight: "High weight" },
      ],
      demographic: [],
    },
  },
  biased: {
    id: "biased",
    name: "Model B — Historical Pattern System",
    shortName: "Model B",
    headerTone: "danger",
    tag: "Audit Target",
    verdict: "BIAS DETECTED",
    verdictTone: "danger",
    description:
      "Trained on historical hospital records. May reflect systemic patterns from training data.",
    metrics: [
      {
        label: "Demographic Parity Gap",
        value: 0.23,
        status: "FAIL",
        tone: "danger",
        detail:
          "High-risk patients in rural and remote districts are receiving significantly different scores than clinically equivalent urban patients.",
      },
      {
        label: "Equalized Odds Gap",
        value: 0.21,
        status: "FAIL",
        tone: "danger",
        detail:
          "The model correctly identifies sepsis risk in urban patients more reliably than rural patients with the same clinical presentation.",
      },
      {
        label: "Calibration Gap",
        value: 0.18,
        status: "FAIL",
        tone: "danger",
        detail:
          "The model's confidence scores are systematically lower for female patients over 60, regardless of actual clinical severity.",
      },
    ],
    barChart: [
      { label: "Urban Male Private", value: 68 },
      { label: "Urban Female Private", value: 61 },
      { label: "Rural Male PMJAY", value: 52 },
      { label: "Rural Female PMJAY", value: 42 },
      { label: "Remote Female PMJAY", value: 38 },
    ],
    heatmap: {
      columns: ["Urban", "Rural", "Remote"],
      rows: [
        { label: "Male", values: [68, 55, 52] },
        { label: "Female", values: [61, 42, 38] },
        { label: "Other", values: [58, 54, 51] },
      ],
      tooltip:
        "Remote female patients received an average risk score of 38, compared to 68 for Urban Male patients with equivalent clinical presentations. Difference: 30 points.",
    },
    doctorView: {
      watch:
        "This model may under-estimate risk for elderly rural female patients. Exercise additional clinical judgment for this group.",
      patient:
        "Priya, 67, remote Tamil Nadu, PMJAY — the model scored her 38/100. Her vitals indicate high risk. Do not rely on this score alone.",
      prompt:
        "Including specific lab values (lactate, WBC) explicitly in your query for elderly female patients improves output consistency for this model by approximately 20%.",
    },
    builderView: {
      diagnosis:
        "Your model shows 34% lower confidence for female patients over 60 in remote districts. This is consistent with significant underrepresentation of this demographic in training data.",
      confidence:
        "34% lower confidence for female patients over 60 in remote districts. Estimated additional data required: approximately 800 records for the remote elderly female cohort.",
      action:
        "Acquire additional records for the remote elderly female cohort. Suggested sources: HMIS data from Tamil Nadu and Uttar Pradesh district hospitals.",
    },
    adminView: {
      riskRating: "HIGH",
      affectedPopulation:
        "Approximately 15.6% of patients in your deployment context fall into the highest-risk demographic group for this model.",
      action:
        "Mandatory human review for all remote elderly female patients over 60 until model is retrained. Flag this model for the next procurement review.",
      compliance:
        "This analysis has been documented and timestamped for audit trail purposes.",
    },
    drift: [
      { quarter: "Q1 2022", value: 0.85 },
      { quarter: "Q2 2022", value: 0.83 },
      { quarter: "Q3 2022", value: 0.81 },
      { quarter: "Q4 2022", value: 0.79 },
      { quarter: "Q1 2023", value: 0.62, note: "New district data onboarded" },
      { quarter: "Q2 2023", value: 0.54 },
      { quarter: "Q3 2023", value: 0.48 },
    ],
    counterfactual: {
      baselineScore: 38,
      baselineLabel: "Model B Risk Score",
      cards: [
        {
          title: "Variant 1",
          profile: "Male, 67, Remote, PMJAY",
          score: 52,
          delta: "+14",
        },
        {
          title: "Variant 2",
          profile: "Female, 67, Urban, Private",
          score: 61,
          delta: "+23",
        },
        {
          title: "Variant 3",
          profile: "Male, 38, Urban, Private",
          score: 71,
          delta: "+33",
        },
      ],
    },
    reasoner: {
      classification: "STRUCTURALLY HARMFUL",
      tone: "danger",
      reasoning:
        "The 33-point disparity between identical clinical presentations cannot be justified by any clinical evidence. Elderly female patients do not have a lower biological susceptibility to sepsis. The observed pattern is consistent with a model that has learned from historical hospital data in which rural elderly women were systematically undertriaged, arriving with more advanced disease and receiving less aggressive early intervention despite equivalent physiological severity. The model has learned the consequences of unequal care and is now replicating them.",
      recommendation:
        "Flag all sepsis risk assessments for female patients over 60 in remote districts for mandatory human clinical review. Do not use Model B as a primary decision-support tool for this demographic until retrained with representative data.",
    },
    graph: {
      clinical: [
        { label: "pain_score", weight: "Medium weight" },
        { label: "hr", weight: "High weight" },
        { label: "bp", weight: "High weight" },
        { label: "lactate", weight: "High weight" },
        { label: "wbc", weight: "High weight" },
      ],
      demographic: [
        {
          label: "gender",
          weight: "Medium weight",
          detail: "Female identity reduced the score without clinical basis.",
        },
        {
          label: "district_type",
          weight: "High weight",
          detail:
            "'Remote' district type reduced the risk score by approximately 18 points. No clinical basis for this adjustment.",
        },
        {
          label: "insurance_type",
          weight: "High weight",
          detail:
            "PMJAY status reduced the risk score through a documentation-quality proxy rather than patient physiology.",
        },
      ],
    },
  },
};

export const patientCase = {
  id: "P-0142",
  name: "Priya Venkataraman",
  gender: "Female",
  age: 67,
  district: "Remote — Tirunelveli District",
  insurance: "PMJAY",
  vitals: "HR: 118 | BP: 94/62 | Temp: 38.9°C | RR: 24 | SpO2: 94%",
  labs: "WBC: 14.2 | Lactate: 2.8 | Pain Score: 7/10 | Onset: 6 hours",
};

export const patientRows = [
  {
    id: "P-0142",
    age: 67,
    gender: "Female",
    districtType: "Remote",
    insurance: "PMJAY",
    scores: { biased: 38, fair: 64 },
    flagged: true,
  },
  {
    id: "P-0114",
    age: 64,
    gender: "Female",
    districtType: "Rural",
    insurance: "PMJAY",
    scores: { biased: 42, fair: 63 },
    flagged: true,
  },
  {
    id: "P-0022",
    age: 58,
    gender: "Male",
    districtType: "Urban",
    insurance: "Private",
    scores: { biased: 68, fair: 68 },
    flagged: false,
  },
  {
    id: "P-0097",
    age: 71,
    gender: "Female",
    districtType: "Remote",
    insurance: "State",
    scores: { biased: 44, fair: 62 },
    flagged: true,
  },
  {
    id: "P-0061",
    age: 49,
    gender: "Male",
    districtType: "Urban",
    insurance: "Private",
    scores: { biased: 63, fair: 64 },
    flagged: false,
  },
  {
    id: "P-0204",
    age: 55,
    gender: "Female",
    districtType: "Urban",
    insurance: "Private",
    scores: { biased: 61, fair: 66 },
    flagged: false,
  },
  {
    id: "P-0310",
    age: 62,
    gender: "Female",
    districtType: "Rural",
    insurance: "PMJAY",
    scores: { biased: 45, fair: 63 },
    flagged: true,
  },
  {
    id: "P-0277",
    age: 37,
    gender: "Male",
    districtType: "Rural",
    insurance: "None",
    scores: { biased: 54, fair: 62 },
    flagged: false,
  },
  {
    id: "P-0408",
    age: 66,
    gender: "Other",
    districtType: "Remote",
    insurance: "State",
    scores: { biased: 51, fair: 61 },
    flagged: false,
  },
  {
    id: "P-0191",
    age: 73,
    gender: "Female",
    districtType: "Rural",
    insurance: "PMJAY",
    scores: { biased: 43, fair: 64 },
    flagged: true,
  },
];

export const translations = {
  en: {
    label: "English",
    short: "EN",
  },
  ta: {
    label: "Tamil",
    short: "TA",
    watch:
      "இந்த மாடல் கிராமப்புற வயதான பெண் நோயாளிகளுக்கு குறைவான ஆபத்து மதிப்பீட்டை வழங்குகிறது.",
    patient:
      "பிரியா, 67, தொலைதூர தமிழ்நாடு, PMJAY — இந்த மாடல் 38/100 என்ற மதிப்பீட்டை அளித்தது. இவரின் உயிரியல் அளவுகள் அதிக ஆபத்தை காட்டுகின்றன.",
    prompt:
      "லாக்டேட் மற்றும் WBC போன்ற ஆய்வக மதிப்புகளை தெளிவாக சேர்ப்பது இந்த மாடலின் நிலைத்தன்மையை மேம்படுத்துகிறது.",
  },
  hi: {
    label: "Hindi",
    short: "HI",
    watch:
      "यह मॉडल ग्रामीण बुजुर्ग महिला रोगियों के लिए जोखिम को कम आंक सकता है।",
    patient:
      "प्रिया, 67, दूरस्थ तमिलनाडु, PMJAY — मॉडल ने 38/100 स्कोर दिया। उनके संकेत उच्च जोखिम दिखाते हैं।",
    prompt:
      "लैक्टेट और WBC जैसे लैब मान स्पष्ट रूप से जोड़ने से इस मॉडल की स्थिरता बेहतर होती है।",
  },
  te: {
    label: "Telugu",
    short: "TE",
    watch:
      "ఈ మోడల్ గ్రామీణ వృద్ధ మహిళా రోగుల ప్రమాదాన్ని తక్కువగా అంచనా వేయవచ్చు.",
    patient:
      "ప్రియా, 67, దూర ప్రాంత తమిళనాడు, PMJAY — మోడల్ 38/100 స్కోర్ ఇచ్చింది.",
    prompt:
      "లాక్టేట్, WBC వంటి ల్యాబ్ విలువలను స్పష్టంగా ఇవ్వడం ఈ మోడల్ స్థిరత్వాన్ని మెరుగుపరుస్తుంది.",
  },
  bn: {
    label: "Bengali",
    short: "BN",
    watch:
      "এই মডেল গ্রামীণ বয়স্ক মহিলা রোগীদের ঝুঁকি কম দেখাতে পারে।",
    patient:
      "প্রিয়া, ৬৭, দূরবর্তী তামিলনাড়ু, PMJAY — মডেল ৩৮/১০০ স্কোর দিয়েছে।",
    prompt:
      "ল্যাকটেট এবং WBC-এর মতো ল্যাব মান স্পষ্টভাবে দিলে মডেলের সামঞ্জস্য বাড়ে।",
  },
};

export const reportSections = [
  {
    title: "Executive Summary",
    body:
      "PULSE audited Model B for sepsis risk scoring across Indian healthcare demographics and found clinically unjustified disparity concentrated in remote and rural elderly female populations. The overall verdict is BIAS DETECTED, with the most severe under-scoring observed for remote female PMJAY patients.",
  },
  {
    title: "Bias Findings",
    body:
      "Demographic Parity Gap: 0.23. Equalized Odds Gap: 0.21. Calibration Gap: 0.18. Counterfactual analysis on patient P-0142 showed a 33-point score increase when demographics were changed to a younger urban privately insured male while clinical presentation remained identical.",
  },
  {
    title: "Affected Populations",
    body:
      "Highest-risk cohort: remote elderly female patients over 60, especially PMJAY-covered patients. Secondary concern: rural elderly female patients with equivalent sepsis-level vitals.",
  },
  {
    title: "Recommendations",
    body:
      "Mandate human review for all sepsis risk assessments involving remote elderly female patients. Retrain the model with materially improved representation for remote and rural elderly women. Prioritize data acquisition from Tamil Nadu and Uttar Pradesh district hospital systems.",
  },
  {
    title: "Methodology",
    body:
      "PULSE combines intersectional metric analysis, patient-level counterfactual testing, and a Medical Bias Reasoner grounded in Indian healthcare context. Results were reviewed across role-specific surfaces for clinicians, builders, and administrators.",
  },
];
