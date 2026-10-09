function DarkModeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      style={{
        padding: "10px 20px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        marginBottom: "20px",
      }}
    >
      {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}

export default DarkModeToggle;5