import { PATIENTS, getIncomeTier } from '../data/demoData';

// Normalise a backend patientRow ({ id, age, gender, districtType, insurance, scores, flagged })
// or a demo row ({ id, age, gender, district, ins, fair, biased, flag }) into a common shape.
function normalise(row) {
  if (row.scores) {
    // backend format
    return {
      id:       row.id,
      age:      row.age,
      gender:   row.gender,
      district: row.districtType,
      ins:      row.insurance,
      incomeTier: row.income_tier || getIncomeTier(row.insurance),
      fair:     row.scores.fair,
      biased:   row.scores.biased,
      flag:     row.flagged,
    };
  }
  // demo format
  return {
    ...row,
    incomeTier: getIncomeTier(row.ins),
  };
}

export default function PatientTable({ modelId, rows }) {
  const displayRows = rows ? rows.map(normalise) : PATIENTS.map(normalise);

  return (
    <div className="scroll-x">
      <table className="pt-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Age</th>
            <th>Gender</th>
            <th>District</th>
            <th>Insurance</th>
            <th title="Income tier derived from insurance scheme — PMJAY is the government scheme for low-income households." style={{ cursor: 'help' }}>
              Income Tier ⓘ
            </th>
            <th>Model A</th>
            <th>Model B</th>
            <th>Δ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map(p => {
            const diff = p.biased - p.fair;
            return (
              <tr key={p.id}>
                <td>
                  <span className="font-mono text-xs" style={{ color: 'var(--t2)' }}>{p.id}</span>
                </td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{p.district}</td>
                <td>{p.ins}</td>
                <td>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: p.incomeTier === 'Low Income' ? 'var(--err)' : p.incomeTier === 'Middle Income' ? 'var(--warn)' : 'var(--ok)',
                  }}>
                    {p.incomeTier}
                  </span>
                </td>
                <td>
                  <span className="font-mono" style={{ color: 'var(--ok)', fontWeight: 600 }}>{p.fair}</span>
                </td>
                <td>
                  <span className="font-mono" style={{ color: p.biased < 50 ? 'var(--err)' : 'var(--t1)', fontWeight: 600 }}>
                    {p.biased}
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs" style={{ color: diff < -10 ? 'var(--err)' : diff > 5 ? 'var(--ok)' : 'var(--t2)' }}>
                    {diff > 0 ? '+' : ''}{diff}
                  </span>
                </td>
                <td>
                  {p.flag && <span className="pt-flag" title="Bias flagged — significant demographic disparity" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
