import { useState } from "react";

function NotesPanel({ pageNumber }) {
  const [note, setNote] = useState("");

  const saveNote = () => {
    localStorage.setItem(
      `note-page-${pageNumber}`,
      note
    );

    alert("Note Saved");
  };

  return (
    <div
      style={{
        marginTop: "30px",
        maxWidth: "700px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <h3>📝 Notes</h3>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Write notes for page ${pageNumber}`}
        rows={5}
        style={{
          width: "100%",
          padding: "10px",
        }}
      />

      <button
        onClick={saveNote}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
        }}
      >
        Save Note
      </button>
    </div>
  );
}

export default NotesPanel;