import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";
import { sampleDatasetProfile } from "../data/demoData";
import { useAppContext } from "../context/AppContext";

const SAMPLE_PROFILE = {
  ...sampleDatasetProfile,
  sourceName: "Sample Indian Healthcare Dataset",
};

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  const [headers = [], ...records] = rows;

  return records.map((record) =>
    headers.reduce((accumulator, header, index) => {
      accumulator[header] = record[index] ?? "";
      return accumulator;
    }, {})
  );
}

function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getField(record, possibleKeys) {
  const entries = Object.entries(record);
  const normalizedKeys = possibleKeys.map(normalizeKey);
  const match = entries.find(([key]) => normalizedKeys.includes(normalizeKey(key)));
  return match?.[1] ?? "";
}

function normalizeBucket(value, type) {
  const cleanValue = String(value || "").trim().toLowerCase();

  if (type === "gender") {
    if (["m", "male"].includes(cleanValue)) return "Male";
    if (["f", "female"].includes(cleanValue)) return "Female";
    return cleanValue ? "Other" : "Unknown";
  }

  if (type === "district") {
    if (cleanValue.includes("remote")) return "Remote";
    if (cleanValue.includes("rural")) return "Rural";
    if (cleanValue.includes("urban")) return "Urban";
    return cleanValue ? "Other" : "Unknown";
  }

  if (type === "insurance") {
    if (cleanValue.includes("private")) return "Private";
    if (cleanValue.includes("pmjay")) return "PMJAY";
    if (cleanValue.includes("state")) return "State";
    if (cleanValue.includes("none") || cleanValue.includes("no insurance")) return "None";
    return cleanValue ? "Other" : "Unknown";
  }

  return cleanValue || "Unknown";
}

function ageLooksElderly(record) {
  const age = Number(getField(record, ["age"]));
  const ageGroup = String(getField(record, ["age_group", "ageGroup", "age band", "ageBand"])).toLowerCase();

  return age >= 60 || ageGroup.includes("60") || ageGroup.includes("elderly") || ageGroup.includes("senior");
}

function formatBreakdown(items) {
  return items.map((item) => `${item.value}% ${item.label}`).join(", ");
}

function BreakdownChart({ title, items }) {
  return (
    <article className="breakdown-chart">
      <h4>{title}</h4>
      <div className="breakdown-bar" aria-label={`${title} breakdown`}>
        {items.map((item) => (
          <span
            key={item.label}
            style={{ width: `${Math.max(item.value, 3)}%` }}
            title={`${item.label}: ${item.value}%`}
          />
        ))}
      </div>
      <div className="breakdown-legend">
        {items.map((item) => (
          <span key={item.label}>
            <i />
            {item.label} {item.value}%
          </span>
        ))}
      </div>
    </article>
  );
}

function makeBreakdown(records, keys, type) {
  const counts = records.reduce((accumulator, record) => {
    const bucket = normalizeBucket(getField(record, keys), type);
    accumulator[bucket] = (accumulator[bucket] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .sort((first, second) => second[1] - first[1])
    .map(([label, count]) => ({
      label,
      value: Number(((count / records.length) * 100).toFixed(1)),
      count,
    }));
}

function buildProfile(records, sourceName) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("The uploaded file does not contain any patient records.");
  }

  const remoteElderlyFemaleCount = records.filter((record) => {
    const gender = normalizeBucket(getField(record, ["gender", "sex"]), "gender");
    const district = normalizeBucket(
      getField(record, ["district_type", "districtType", "district type", "district_category"]),
      "district"
    );

    return gender === "Female" && district === "Remote" && ageLooksElderly(record);
  }).length;
  const remoteElderlyFemaleShare = Number(((remoteElderlyFemaleCount / records.length) * 100).toFixed(1));
  const hasRepresentationGap = remoteElderlyFemaleShare < 10;

  return {
    sourceName,
    totalRecords: records.length,
    demographicBreakdown: {
      gender: makeBreakdown(records, ["gender", "sex"], "gender"),
      districtType: makeBreakdown(
        records,
        ["district_type", "districtType", "district type", "district_category"],
        "district"
      ),
      insurance: makeBreakdown(
        records,
        ["insurance_type", "insuranceType", "insurance", "payer"],
        "insurance"
      ),
    },
    alert: hasRepresentationGap
      ? `Representation gap detected: Remote elderly female patients make up ${remoteElderlyFemaleShare}% of this dataset. Models trained on datasets with this level of underrepresentation often show reduced reliability for this group.`
      : `No critical representation gap detected for remote elderly female patients. This cohort makes up ${remoteElderlyFemaleShare}% of the uploaded dataset.`,
    alertTone: hasRepresentationGap ? "warning" : "success",
  };
}

function extractJsonRecords(parsedJson) {
  if (Array.isArray(parsedJson)) {
    return parsedJson;
  }

  if (Array.isArray(parsedJson.records)) {
    return parsedJson.records;
  }

  if (Array.isArray(parsedJson.patients)) {
    return parsedJson.patients;
  }

  if (Array.isArray(parsedJson.data)) {
    return parsedJson.data;
  }

  return [];
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { datasetLoaded, setDatasetLoaded, datasetProfile, setDatasetProfile } = useAppContext();
  const [uploadError, setUploadError] = useState("");
  const activeProfile = datasetProfile || SAMPLE_PROFILE;

  const loadSampleDataset = () => {
    setUploadError("");
    setDatasetProfile(SAMPLE_PROFILE);
    setDatasetLoaded(true);
  };

  const handleDatasetUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadError("");
      const text = await file.text();
      const extension = file.name.split(".").pop()?.toLowerCase();
      const records =
        extension === "json"
          ? extractJsonRecords(JSON.parse(text))
          : extension === "csv"
            ? parseCsv(text)
            : [];

      const profile = buildProfile(records, file.name);
      setDatasetProfile(profile);
      setDatasetLoaded(true);
    } catch (error) {
      setDatasetLoaded(false);
      setDatasetProfile(null);
      setUploadError(error.message || "Could not read this dataset. Please upload a valid CSV or JSON file.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <Shell
      currentStep="Step 1 of 3 - Load Dataset"
      title="Dataset Upload"
      subtitle="Start with the sample dataset so the demo story stays consistent."
    >
      <div className="two-column">
        <button className="choice-card choice-card-active" onClick={loadSampleDataset}>
          <h3>Use Sample Indian Healthcare Dataset</h3>
          <p>Pre-loaded 500-record synthetic dataset tailored to the demo walkthrough.</p>
        </button>
        <label className="choice-card upload-card">
          <h3>Upload Your Own Dataset</h3>
          <p>Choose a `.csv` or `.json` file. PULSE will profile demographics directly in the browser.</p>
          <span className="upload-card-action">Choose file</span>
          <input
            className="upload-input"
            type="file"
            accept=".csv,.json,application/json,text/csv"
            onChange={handleDatasetUpload}
          />
        </label>
      </div>

      {uploadError ? (
        <div className="alert-card alert-card-error">
          <strong>Upload failed</strong>
          <p>{uploadError}</p>
        </div>
      ) : null}

      {datasetLoaded ? (
        <section className="content-card">
          <div className="section-heading">
            <h3>Dataset loaded: {activeProfile.totalRecords} patient records</h3>
            <p>{activeProfile.sourceName}</p>
            <p>The system is already surfacing representation risk before the audit starts.</p>
          </div>
          <div className="profile-grid">
            <article className="info-card">
              <h4>Gender</h4>
              <p>{formatBreakdown(activeProfile.demographicBreakdown.gender)}</p>
            </article>
            <article className="info-card">
              <h4>District type</h4>
              <p>{formatBreakdown(activeProfile.demographicBreakdown.districtType)}</p>
            </article>
            <article className="info-card">
              <h4>Insurance</h4>
              <p>{formatBreakdown(activeProfile.demographicBreakdown.insurance)}</p>
            </article>
          </div>
          <div className="breakdown-grid">
            <BreakdownChart title="Gender" items={activeProfile.demographicBreakdown.gender} />
            <BreakdownChart title="District Type" items={activeProfile.demographicBreakdown.districtType} />
            <BreakdownChart title="Insurance" items={activeProfile.demographicBreakdown.insurance} />
          </div>
          <div className={`alert-card ${activeProfile.alertTone === "success" ? "alert-card-success" : ""}`}>
            <strong>
              {activeProfile.alertTone === "success"
                ? "Representation check passed"
                : "Representation gap detected"}
            </strong>
            <p>{activeProfile.alert}</p>
          </div>
          <button className="button" onClick={() => navigate("/select")}>
            Continue
          </button>
        </section>
      ) : null}
    </Shell>
  );
}
