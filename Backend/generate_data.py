"""
Generate synthetic patient dataset (patients.json) and pre-computed batch results
for the PULSE Medical AI Bias Audit demo.

Run once:  python generate_data.py
Outputs:
  data/patients.json
  data/batch_results_fair.json
  data/batch_results_biased.json
"""

import json
import random
import os

random.seed(42)

# ── Indian names corpus ──────────────────────────────────────────────────────
MALE_FIRST = [
    "Arun", "Rajesh", "Suresh", "Vikram", "Manoj", "Deepak", "Ramesh", "Sandeep",
    "Karthik", "Anand", "Prabhu", "Mohan", "Ganesh", "Ashok", "Srinivas", "Ravi",
    "Venkat", "Harish", "Naveen", "Sachin", "Ajay", "Prakash", "Girish", "Dinesh",
    "Amit", "Rohit", "Mukesh", "Sunil", "Vijay", "Sanjay",
]
FEMALE_FIRST = [
    "Priya", "Lakshmi", "Anitha", "Kavitha", "Meena", "Radha", "Saroja", "Divya",
    "Pooja", "Swathi", "Deepa", "Nirmala", "Padma", "Saraswathi", "Geetha", "Kamala",
    "Revathi", "Sudha", "Bhavani", "Usha", "Rani", "Jayanthi", "Lalitha", "Vasanthi",
    "Mythili", "Janaki", "Sumathi", "Vani", "Mala", "Shanti",
]
OTHER_FIRST = [
    "Arjun", "Kiran", "Neel", "Jyoti", "Nandini", "Sai", "Akash", "Rohan",
]
LAST_NAMES = [
    "Venkataraman", "Sharma", "Patel", "Reddy", "Nair", "Iyer", "Kumar", "Singh",
    "Das", "Mukherjee", "Rao", "Pillai", "Menon", "Choudhary", "Gupta", "Joshi",
    "Bhat", "Naidu", "Devi", "Pandey", "Mishra", "Verma", "Chauhan", "Shetty",
    "Kulkarni", "Deshmukh", "Patil", "Kaur", "Chatterjee", "Banerjee",
]

URBAN_DISTRICTS = [
    "Chennai", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Kolkata",
    "Pune", "Ahmedabad", "Jaipur", "Lucknow",
]
RURAL_DISTRICTS = [
    "Thanjavur", "Madurai (Rural)", "Varanasi (Rural)", "Allahabad",
    "Guntur", "Nellore", "Kurnool", "Raichur", "Bellary", "Dhanbad",
]
REMOTE_DISTRICTS = [
    "Tirunelveli", "Bastar", "Chamoli", "Kinnaur", "Leh", "Dhalai",
    "Malkangiri", "Dantewada", "Kalahandi", "Kandhamal",
]

AGE_GROUPS = {
    "18-29": (18, 29),
    "30-45": (30, 45),
    "46-59": (46, 59),
    "60+": (60, 85),
}

INSURANCE_TYPES = ["private", "PMJAY", "state", "none"]

# ── Distribution targets ─────────────────────────────────────────────────────
TOTAL = 500
# Gender distribution: 55% Male, 43% Female, 2% Other
GENDER_WEIGHTS = {"Male": 0.55, "Female": 0.43, "Other": 0.02}
# District type: 40% Rural, 35% Urban, 25% Remote  (note: plan says 40 rural, 35 urban, 25 remote)
DISTRICT_WEIGHTS = {"urban": 0.35, "rural": 0.40, "remote": 0.25}
# Insurance: 30% private, 45% PMJAY, 15% state, 10% none
INSURANCE_WEIGHTS = {"private": 0.30, "PMJAY": 0.45, "state": 0.15, "none": 0.10}
# Age group distribution
AGE_WEIGHTS = {"18-29": 0.15, "30-45": 0.30, "46-59": 0.25, "60+": 0.30}

# Sepsis prevalence: 22% overall, 28% in rural/remote elderly female
SEPSIS_RATE_GENERAL = 0.22
SEPSIS_RATE_VULNERABLE = 0.28


def weighted_choice(weights_dict):
    """Pick a key from a dict of {key: probability}."""
    keys = list(weights_dict.keys())
    probs = list(weights_dict.values())
    return random.choices(keys, weights=probs, k=1)[0]


def generate_vitals(has_sepsis, age):
    """Generate realistic vital signs. Sepsis patients get more extreme values."""
    if has_sepsis:
        hr = random.randint(100, 135)
        sbp = random.randint(75, 100)
        dbp = random.randint(45, 65)
        temp = round(random.uniform(38.3, 40.2), 1)
        rr = random.randint(22, 34)
        spo2 = random.randint(88, 96)
    else:
        hr = random.randint(60, 100)
        sbp = random.randint(110, 145)
        dbp = random.randint(65, 90)
        temp = round(random.uniform(36.2, 37.8), 1)
        rr = random.randint(12, 20)
        spo2 = random.randint(95, 100)
    return {"hr": hr, "sbp": sbp, "dbp": dbp, "temp": temp, "rr": rr, "spo2": spo2}


def generate_labs(has_sepsis):
    """Generate lab values. Sepsis patients have elevated markers."""
    if has_sepsis:
        wbc = round(random.uniform(12.0, 22.0), 1)
        lactate = round(random.uniform(2.0, 6.0), 1)
        creatinine = round(random.uniform(1.5, 4.0), 1)
        platelets = random.randint(60, 150)
    else:
        wbc = round(random.uniform(4.0, 11.0), 1)
        lactate = round(random.uniform(0.5, 1.8), 1)
        creatinine = round(random.uniform(0.6, 1.2), 1)
        platelets = random.randint(150, 400)
    return {
        "wbc": wbc,
        "lactate": lactate,
        "creatinine": creatinine,
        "platelets": platelets,
    }


def generate_symptoms(has_sepsis):
    pain_score = random.randint(5, 9) if has_sepsis else random.randint(1, 5)
    onset_hours = random.randint(2, 12) if has_sepsis else random.randint(12, 72)
    altered_mental_status = has_sepsis and random.random() < 0.35
    return {
        "pain_score": pain_score,
        "onset_hours": onset_hours,
        "altered_mental_status": altered_mental_status,
    }


def get_district_name(district_type):
    if district_type == "urban":
        return random.choice(URBAN_DISTRICTS)
    elif district_type == "rural":
        return random.choice(RURAL_DISTRICTS)
    else:
        return random.choice(REMOTE_DISTRICTS)


def get_name(gender):
    if gender == "Male":
        first = random.choice(MALE_FIRST)
    elif gender == "Female":
        first = random.choice(FEMALE_FIRST)
    else:
        first = random.choice(OTHER_FIRST)
    last = random.choice(LAST_NAMES)
    return f"{first} {last}"


def compute_clinical_severity(vitals, labs, symptoms):
    """
    Compute a 0-100 clinical severity score based purely on clinical factors.
    This is what a FAIR model should approximate.
    """
    score = 0.0

    # Heart rate contribution (normal 60-100, sepsis 100-135)
    if vitals["hr"] > 120:
        score += 18
    elif vitals["hr"] > 100:
        score += 12
    elif vitals["hr"] > 90:
        score += 5

    # Blood pressure (low SBP is worse)
    if vitals["sbp"] < 85:
        score += 18
    elif vitals["sbp"] < 100:
        score += 12
    elif vitals["sbp"] < 110:
        score += 5

    # Temperature
    if vitals["temp"] > 39.5:
        score += 14
    elif vitals["temp"] > 38.5:
        score += 10
    elif vitals["temp"] > 38.0:
        score += 5

    # Respiratory rate
    if vitals["rr"] > 28:
        score += 12
    elif vitals["rr"] > 22:
        score += 8

    # SpO2
    if vitals["spo2"] < 90:
        score += 12
    elif vitals["spo2"] < 94:
        score += 8
    elif vitals["spo2"] < 96:
        score += 4

    # WBC
    if labs["wbc"] > 15:
        score += 10
    elif labs["wbc"] > 12:
        score += 6

    # Lactate
    if labs["lactate"] > 4.0:
        score += 14
    elif labs["lactate"] > 2.0:
        score += 10
    elif labs["lactate"] > 1.5:
        score += 4

    # Creatinine
    if labs["creatinine"] > 2.0:
        score += 6
    elif labs["creatinine"] > 1.5:
        score += 3

    # Platelets (low is worse)
    if labs["platelets"] < 100:
        score += 8
    elif labs["platelets"] < 150:
        score += 4

    # Pain score
    if symptoms["pain_score"] >= 7:
        score += 6
    elif symptoms["pain_score"] >= 5:
        score += 3

    # Altered mental status
    if symptoms["altered_mental_status"]:
        score += 10

    # Onset (shorter = more acute)
    if symptoms["onset_hours"] <= 6:
        score += 6
    elif symptoms["onset_hours"] <= 12:
        score += 3

    # Clamp to 0-100
    return max(0, min(100, int(score)))


def compute_biased_score(clinical_score, patient):
    """
    Apply the biased model's demographic adjustments.
    Rural/remote → reduce by 10-20 points
    Elderly female → reduce further
    PMJAY/state insurance → reduce further
    Urban male private → boost
    """
    score = clinical_score
    gender = patient["gender"]
    district_type = patient["district_type"]
    insurance = patient["insurance_type"]
    age = patient["age"]

    # District penalty
    if district_type == "remote":
        score -= random.randint(14, 20)
    elif district_type == "rural":
        score -= random.randint(8, 15)

    # Elderly female penalty
    if gender == "Female" and age >= 60:
        score -= random.randint(6, 12)
    elif gender == "Female":
        score -= random.randint(2, 6)

    # Insurance penalty
    if insurance in ("PMJAY", "state"):
        score -= random.randint(3, 8)
    elif insurance == "none":
        score -= random.randint(5, 10)

    # Urban male private boost
    if gender == "Male" and district_type == "urban" and insurance == "private":
        score += random.randint(2, 6)

    # Add some noise
    score += random.randint(-3, 3)

    return max(5, min(100, int(score)))


def compute_fair_score(clinical_score):
    """Fair model: clinical score + small random noise only."""
    noise = random.randint(-4, 4)
    return max(5, min(100, int(clinical_score + noise)))


# ── Main generation ──────────────────────────────────────────────────────────
def generate():
    patients = []
    batch_fair = []
    batch_biased = []

    for i in range(TOTAL):
        patient_id = f"P-{i:04d}"

        # For P-0142, hardcode the featured patient
        if patient_id == "P-0142":
            patient = {
                "patient_id": "P-0142",
                "name": "Priya Venkataraman",
                "age": 67,
                "age_group": "60+",
                "gender": "Female",
                "district": "Tirunelveli",
                "district_type": "remote",
                "insurance_type": "PMJAY",
                "vitals": {
                    "hr": 118,
                    "sbp": 94,
                    "dbp": 62,
                    "temp": 38.9,
                    "rr": 24,
                    "spo2": 94,
                },
                "labs": {
                    "wbc": 14.2,
                    "lactate": 2.8,
                    "creatinine": 1.9,
                    "platelets": 128,
                },
                "symptoms": {
                    "pain_score": 7,
                    "onset_hours": 6,
                    "altered_mental_status": False,
                },
                "ground_truth_sepsis": True,
            }
            patients.append(patient)

            # Featured patient specific scores from the pitch
            batch_fair.append({
                "patient_id": "P-0142",
                "risk_score": 64,
                "clinical_justification": "Elevated HR (118), hypotension (94/62), fever (38.9°C), elevated WBC (14.2) and lactate (2.8) indicate significant sepsis risk.",
                "bias_flagged": False,
            })
            batch_biased.append({
                "patient_id": "P-0142",
                "risk_score": 38,
                "clinical_justification": "Moderate risk based on available clinical indicators. Documentation patterns and historical outcomes for this demographic suggest lower acuity.",
                "bias_flagged": True,
            })
            continue

        gender = weighted_choice(GENDER_WEIGHTS)
        district_type = weighted_choice(DISTRICT_WEIGHTS)
        insurance = weighted_choice(INSURANCE_WEIGHTS)
        age_group = weighted_choice(AGE_WEIGHTS)
        age_lo, age_hi = AGE_GROUPS[age_group]
        age = random.randint(age_lo, age_hi)

        # Determine sepsis
        is_vulnerable = (
            gender == "Female"
            and age >= 60
            and district_type in ("rural", "remote")
        )
        sepsis_rate = SEPSIS_RATE_VULNERABLE if is_vulnerable else SEPSIS_RATE_GENERAL
        has_sepsis = random.random() < sepsis_rate

        name = get_name(gender)
        district = get_district_name(district_type)
        vitals = generate_vitals(has_sepsis, age)
        labs = generate_labs(has_sepsis)
        symptoms = generate_symptoms(has_sepsis)

        patient = {
            "patient_id": patient_id,
            "name": name,
            "age": age,
            "age_group": age_group,
            "gender": gender,
            "district": district,
            "district_type": district_type,
            "insurance_type": insurance,
            "vitals": vitals,
            "labs": labs,
            "symptoms": symptoms,
            "ground_truth_sepsis": has_sepsis,
        }
        patients.append(patient)

        # Compute scores
        clinical = compute_clinical_severity(vitals, labs, symptoms)
        fair_score = compute_fair_score(clinical)
        biased_score = compute_biased_score(clinical, patient)

        # Bias flag logic: remote/rural female over 60 with sepsis-level vitals
        # who got a low biased score, OR any such patient where the score
        # depression vs fair model is >= 15 points
        bias_flagged = (
            gender == "Female"
            and age >= 60
            and district_type in ("rural", "remote")
            and (
                (vitals["hr"] > 100 and labs["lactate"] > 2.0 and biased_score < 50)
                or (fair_score - biased_score >= 15)
            )
        )

        batch_fair.append({
            "patient_id": patient_id,
            "risk_score": fair_score,
            "clinical_justification": f"Clinical severity score based on vitals (HR {vitals['hr']}, BP {vitals['sbp']}/{vitals['dbp']}), labs (WBC {labs['wbc']}, Lactate {labs['lactate']}), and symptoms.",
            "bias_flagged": False,
        })
        batch_biased.append({
            "patient_id": patient_id,
            "risk_score": biased_score,
            "clinical_justification": f"Risk assessment based on clinical indicators and historical outcome patterns for this patient profile.",
            "bias_flagged": bias_flagged,
        })

    # ── Write outputs ────────────────────────────────────────────────────────
    out_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(out_dir, exist_ok=True)

    with open(os.path.join(out_dir, "patients.json"), "w") as f:
        json.dump(patients, f, indent=2)

    with open(os.path.join(out_dir, "batch_results_fair.json"), "w") as f:
        json.dump(batch_fair, f, indent=2)

    with open(os.path.join(out_dir, "batch_results_biased.json"), "w") as f:
        json.dump(batch_biased, f, indent=2)

    # ── Summary stats ────────────────────────────────────────────────────────
    genders = {}
    districts = {}
    insurances = {}
    sepsis_count = 0
    for p in patients:
        genders[p["gender"]] = genders.get(p["gender"], 0) + 1
        districts[p["district_type"]] = districts.get(p["district_type"], 0) + 1
        insurances[p["insurance_type"]] = insurances.get(p["insurance_type"], 0) + 1
        if p["ground_truth_sepsis"]:
            sepsis_count += 1

    biased_flagged = sum(1 for b in batch_biased if b["bias_flagged"])

    print(f"Generated {len(patients)} patients → data/patients.json")
    print(f"  Gender: {genders}")
    print(f"  District: {districts}")
    print(f"  Insurance: {insurances}")
    print(f"  Sepsis cases: {sepsis_count} ({sepsis_count/len(patients)*100:.1f}%)")
    print(f"  Bias-flagged (biased model): {biased_flagged}")
    print(f"  Fair batch: data/batch_results_fair.json")
    print(f"  Biased batch: data/batch_results_biased.json")

    # Verify P-0142
    p142 = next(p for p in patients if p["patient_id"] == "P-0142")
    b142_fair = next(b for b in batch_fair if b["patient_id"] == "P-0142")
    b142_biased = next(b for b in batch_biased if b["patient_id"] == "P-0142")
    print(f"\n  P-0142: {p142['name']}, {p142['gender']}, age {p142['age']}, "
          f"{p142['district_type']} — {p142['district']}, {p142['insurance_type']}")
    print(f"    Fair score: {b142_fair['risk_score']}, Biased score: {b142_biased['risk_score']}")


if __name__ == "__main__":
    generate()
