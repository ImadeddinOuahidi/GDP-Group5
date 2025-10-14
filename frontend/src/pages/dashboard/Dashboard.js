import "./Dashboard.css";

export default function Dashboard() {
  // Dummy data for now
  const reports = [
    { id: 1, patient: "John Doe", drug: "Drug A", symptom: "Headache", severity: "High", date: "2025-09-20" },
    { id: 2, patient: "Maria Lopez", drug: "Drug B", symptom: "Rash", severity: "Critical", date: "2025-09-21" },
    { id: 3, patient: "Ali Khan", drug: "Drug C", symptom: "Dizziness", severity: "Medium", date: "2025-09-22" },
  ];

  return (
    <div className="dashboard">
      <h2>Doctor Dashboard</h2>
      <p>Review patient ADR reports, sorted by severity.</p>

      <table>
        <thead>
          <tr>
            <th>Report ID</th>
            <th>Patient</th>
            <th>Drug</th>
            <th>Symptom</th>
            <th>Severity</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.patient}</td>
              <td>{report.drug}</td>
              <td>{report.symptom}</td>
              <td className={`severity ${report.severity.toLowerCase()}`}>
                {report.severity}
              </td>
              <td>{report.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
