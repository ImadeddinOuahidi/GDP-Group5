import { useState } from "react";

export default function Report() {
  const [report, setReport] = useState("");
  const [photo, setPhoto] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Report: ${report}\nPhoto: ${photo ? photo.name : "No photo uploaded"}`);
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
      <br /><br />
      <label>
        Upload a photo:
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0])}
        />
      </label>
      <br /><br />
      <button
        type="button"
        onClick={() => alert("Voice input coming soon!")}
      >
        🎤 Record Voice
      </button>
      <br /><br />
      <button type="submit">Submit</button>
    </form>
  );
}
