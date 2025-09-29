import { useState } from "react";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("light");

  return (
    <div>
      <h2>Settings</h2>

      <div>
        <label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
          Enable notifications
        </label>
      </div>

      <div>
        <label>
          Theme: 
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <p>
        Current preferences: Notifications {notifications ? "On" : "Off"},{" "}
        Theme: {theme}.
      </p>
    </div>
  );
}
