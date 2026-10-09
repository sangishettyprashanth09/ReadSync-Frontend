import { useRef } from "react";
import axios from "axios";

function UploadBook() {
  const fileInputRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        "http://localhost:8080/api/books/upload",
        formData
      );

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  return (
    <div
      style={{
        marginBottom: "40px",
      }}
    >
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileInputRef.current.click()}
        style={{
          padding: "14px 28px",
          fontSize: "16px",
          fontWeight: "600",
          border: "none",
          borderRadius: "12px",
          background:
            "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "white",
          cursor: "pointer",
          boxShadow:
            "0 10px 25px rgba(99,102,241,0.4)",
        }}
      >
        📚 Add Book
      </button>
    </div>
  );
}

export default UploadBook;