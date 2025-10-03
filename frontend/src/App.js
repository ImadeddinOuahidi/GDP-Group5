import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Home from "./Home";
import Report from "./Report";
import Settings from "./Settings";
import DoctorHome from "./DoctorHome";
import Dashboard from "./Dashboard";

export default function App() {
  // temporary role state (replace with login/auth later)
  const [role, setRole] = useState("patient"); 

  return (
    <Router>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setRole("patient")}>Login as Patient</button>
        <button onClick={() => setRole("doctor")}>Login as Doctor</button>
      </div>

      <nav>
        {role === "patient" ? (
          <>
            <Link to="/">Home</Link> | 
            <Link to="/report">Report</Link> | 
            <Link to="/settings">Settings</Link>
          </>
        ) : (
          <>
            <Link to="/doctor">Doctor Home</Link> | 
            <Link to="/dashboard">Dashboard</Link> | 
            <Link to="/settings">Settings</Link>
          </>
        )}
      </nav>

      <Routes>
        {role === "patient" ? (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/settings" element={<Settings />} />
          </>
        ) : (
          <>
            <Route path="/doctor" element={<DoctorHome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
