import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function Home() {
  return <h2>Home</h2>;
}
function Report() {
  return <h2>Report Side Effect</h2>;
}
function Settings() {
  return <h2>Settings</h2>;
}

export default function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> | 
        <Link to="/report">Report</Link> | 
        <Link to="/settings">Settings</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
