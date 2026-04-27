import { useNavigate } from "react-router-dom";

export default function PatientTable({ rows, modelId }) {
  const navigate = useNavigate();

  return (
    <div className="table-card">
      <div className="section-heading">
        <h3>Patient Cases</h3>
        <p>Highlighted cases are the fastest route into patient-level investigation.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age</th>
              <th>Gender</th>
              <th>District</th>
              <th>Insurance</th>
              <th>Risk Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.flagged && modelId === "biased" ? "table-flagged" : ""}>
                <td>{row.id}</td>
                <td>{row.age}</td>
                <td>{row.gender}</td>
                <td>{row.districtType}</td>
                <td>{row.insurance}</td>
                <td>{row.scores[modelId]}</td>
                <td>
                  {row.flagged && modelId === "biased" ? (
                    <button
                      className="button button-secondary"
                      onClick={() => navigate(`/patient/${row.id}`)}
                    >
                      Investigate
                    </button>
                  ) : (
                    "Normal"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
