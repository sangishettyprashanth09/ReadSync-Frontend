import { useState, useEffect } from "react";
import {
  getHighlights,
  deleteHighlight,
} from "../services/highlightService";

function NotesDrawer({ bookId, pageNumber, refresh }) {
  const [open, setOpen] = useState(false);

  const noteKey = `book-notes-${bookId}`;

  const [note, setNote] = useState(
    localStorage.getItem(noteKey) || ""
  );

  // Sync note state when book changes
  useEffect(() => {
    setNote(localStorage.getItem(noteKey) || "");
  }, [bookId]);

  const saveNote = () => {
    localStorage.setItem(noteKey, note);
    alert("Note saved!");
  };

  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    setHighlights(getHighlights(bookId));
  }, [bookId, refresh]);

  const [selectedQuote, setSelectedQuote] = useState("");

  useEffect(() => {
    const handleSelectedText = (e) => {
      setOpen(true);
      setSelectedQuote(e.detail);

      // Inserts only the selected sentence without "Selected Text:"
      setNote((prev) => {
        return prev ? prev + "\n\n" + e.detail : e.detail;
      });
    };

    window.addEventListener("selectedText", handleSelectedText);

    return () =>
      window.removeEventListener("selectedText", handleSelectedText);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          top: "120px",
          right: open ? "370px" : "20px",
          transition: "0.3s",
          zIndex: 1000,
          padding: "12px 18px",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "bold",
          background: "#f59e0b",
          color: "white",
        }}
      >
        📒 Notes
      </button>

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: open ? 0 : "-380px",
          width: "350px",
          height: "100vh",
          background: "#1e1e1e",
          color: "white",
          transition: "0.3s",
          padding: "25px",
          zIndex: 999,
          boxShadow: "-5px 0 20px rgba(0,0,0,0.3)",
          boxSizing: "border-box",
        }}
      >
        <h3>⭐ Highlights</h3>

        {highlights.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No highlights yet</p>
        ) : (
          <div
            style={{
              maxHeight: "250px",
              overflowY: "auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              paddingRight: "5px",
            }}
          >
            {highlights.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("jumpToPage", {
                      detail: {
                        page: item.page,
                        text: item.text,
                      }
                    })
                  );
                }}
                style={{
                  width: "100%",
                  background: "#2d2d2d",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  marginBottom: "10px",
                  fontSize: "15px",
                  lineHeight: "1.5",
                }}
              >
                <strong>Page {item.page}</strong>

                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "13px",
                  }}
                >
                  {item.text}
                </p>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHighlight(bookId, index);
                    setHighlights(getHighlights(bookId));
                  }}
                  style={{
                    marginTop: "10px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: "25px" }}>📒 Notes</h2>

        <p
          style={{
            opacity: 0.7,
            margin: "5px 0",
          }}
        >
          Page {pageNumber}
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your thoughts..."
          style={{
            width: "100%",
            height: "230px",
            marginTop: "10px",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid #444",
            background: "#2a2a2a",
            color: "white",
            resize: "none",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={saveNote}
          style={{
            marginTop: "15px",
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            background: "#2563eb",
            color: "white",
          }}
        >
          Save Note
        </button>
      </div>
    </>
  );
}

export default NotesDrawer;