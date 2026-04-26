import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";
import Badge from "../components/Badge";
import { models } from "../data/demoData";
import { useAppContext } from "../context/AppContext";

export default function ModelSelectPage() {
  const navigate = useNavigate();
  const { selectedModel, setSelectedModel } = useAppContext();

  return (
    <Shell
      currentStep="Step 2 of 3 - Select Model"
      title="Model Selector"
      subtitle="Choose the model you want to audit first. You can switch models later."
    >
      <div className="two-column">
        {Object.values(models).map((model) => (
          <button
            className={`model-card ${selectedModel === model.id ? "model-card-selected" : ""}`}
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
          >
            <div className={`model-card-header tone-${model.headerTone}`}>
              <div>
                <h3>{model.name}</h3>
                <p>{model.description}</p>
              </div>
              <Badge tone={model.headerTone}>{model.tag}</Badge>
            </div>
            {selectedModel === model.id ? <span className="selected-mark">Selected</span> : null}
          </button>
        ))}
      </div>
      <button className="button" onClick={() => navigate("/analyze")}>
        Analyze
      </button>
    </Shell>
  );
}
