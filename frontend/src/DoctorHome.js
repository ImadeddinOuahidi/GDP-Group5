import { Link } from "react-router-dom";
import "./DoctorHome.css";

export default function DoctorHome() {
  return (
    <div className="doctor-home">
      <header className="doctor-header">
        <h1>SafeMed ADR - Doctor Portal</h1>
        <p>
          Review and manage patient ADR reports.  
          Prioritize urgent cases and improve patient safety.
        </p>
      </header>

      <div className="doctor-buttons">
        <Link to="/dashboard">
          <button className="btn-dashboard">📊 View Dashboard</button>
        </Link>
        <Link to="/settings">
          <button className="btn-settings">⚙️ Settings</button>
        </Link>
      </div>

      <footer className="doctor-footer">
        <p>SafeMed ADR © 2025 - Doctor Portal</p>
      </footer>
    </div>
  );
}
