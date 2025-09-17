import { useState } from "react";

export default function Report() {
  const [report, setReport] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Report submitted: " + report);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Describe your side effect:
        <textarea 
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Type your side effect..."
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
