import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Mock user database
  const users = {
    patient1: { password: "1234", role: "patient" },
    doctor1: { password: "abcd", role: "doctor" },
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (users[username] && users[username].password === password) {
      const role = users[username].role;
      localStorage.setItem("userRole", role);
      if (role === "patient") {
        navigate("/patient");
      } else {
        navigate("/doctor");
      }
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <h2>SafeMed ADR Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
