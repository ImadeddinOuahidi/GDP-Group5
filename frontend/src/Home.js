import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to SafeMed ADR</h1>
        <p>
          Report medicine side effects quickly and securely.  
          Help doctors identify urgent cases and keep patients safe.
        </p>
      </header>

      <div className="home-buttons">
        <Link to="/report">
          <button className="btn-primary">📝 Report a Side Effect</button>
        </Link>
        <Link to="/settings">
          <button className="btn-secondary">⚙️ Settings</button>
        </Link>
      </div>

      <footer className="home-footer">
        <p>SafeMed ADR © 2025 - Group Project</p>
      </footer>
    </div>
  );
}
