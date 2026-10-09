function SelectionPopup({
  visible,
  x,
  y,
  onHighlight,
  onNote,
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,
        background: "#222",
        color: "#fff",
        borderRadius: "10px",
        padding: "10px",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <button
        onClick={onHighlight}
        style={{
          display: "block",
          width: "100%",
          marginBottom: "8px",
          border: "none",
          borderRadius: "6px",
          padding: "6px 12px",
          background: "#f59e0b",
          color: "white",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        🖍 Highlight
      </button>

      <button
        onClick={onNote}
        style={{
          display: "block",
          width: "100%",
          border: "none",
          borderRadius: "6px",
          padding: "6px 12px",
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        📝 Add Note
      </button>
    </div>
  );
}

export default SelectionPopup;