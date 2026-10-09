import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getBookById, deleteBook } from "../services/bookService";
import DarkModeToggle from "../components/DarkModeToggle";
import axios from "axios";
import NotesDrawer from "../components/NotesDrawer";
import SelectionPopup from "../components/SelectionPopup";
import { saveHighlight } from "../services/highlightService";

import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [highlightRefresh, setHighlightRefresh] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [pendingHighlight, setPendingHighlight] = useState(null);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleJump = (e) => {
      const detail = e.detail;

      // Support both the old page-number event
      // and the new page + sentence event.
      const targetPage =
        typeof detail === "number" ? detail : detail.page;

      if (!targetPage || targetPage < 1) return;

      if (typeof detail === "object") {
        setPendingHighlight({
          page: targetPage,
          text: detail.text,
        });
      } else {
        setPendingHighlight(null);
      }

      setPageNumber(targetPage);
      saveProgress(targetPage);
    };

    window.addEventListener("jumpToPage", handleJump);

    return () => {
      window.removeEventListener("jumpToPage", handleJump);
    };
  }, []);

  useEffect(() => {
    fetchBook();
    fetchProgress();
  }, [id]);

  const fetchBook = async () => {
    try {
      console.log("Book ID:", id);

      const data = await getBookById(id);

      console.log("Book Data:", data);

      if (!data) {
        navigate("/");
        return;
      }

      setBook(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/progress/${id}`
      );

      if (response.data?.currentPage) {
        setPageNumber(response.data.currentPage);
      }
    } catch (error) {
      console.log("No saved progress yet");
    }
  };

  const saveProgress = async (page) => {
    try {
      await axios.post(`http://localhost:8080/api/progress/${id}`, {
        currentPage: page,
      });
    } catch (error) {
      console.error("Failed to save progress", error);
    }
  };

  const nextPage = () => {
    const next = pageNumber + 1;

    if (next <= numPages) {
      setPageNumber(next);
      saveProgress(next);
    }
  };

  const previousPage = () => {
    const prev = pageNumber - 1;

    if (prev >= 1) {
      setPageNumber(prev);
      saveProgress(prev);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this book?"
    );

    if (!confirmDelete) return;

    try {
      await deleteBook(id);
      alert("Book deleted successfully");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Failed to delete book");
    }
  };

  const cleanTitle = (title) => {
    return title
      .replace(".pdf", "")
      .replaceAll("-", " ")
      .slice(0, 100);
  };

  const actionButton = {
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.2s",
  };

  const handleTextSelection = () => {
    const selection = window.getSelection().toString();

    if (!selection.trim()) {
      setPopupVisible(false);
      return;
    }

    setSelectedText(selection);

    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setPopupPosition({
      x: rect.left,
      y: rect.top - 60,
    });

    setPopupVisible(true);
  };

  const applySavedHighlight = (selectedSentence) => {
    if (!selectedSentence?.trim()) return false;

    const spans = Array.from(
      document.querySelectorAll(
        ".react-pdf__Page__textContent span"
      )
    );

    if (!spans.length) return false;

    // Remove the previous saved-highlight display.
    spans.forEach((span) => {
      span.style.backgroundColor = "";
      span.style.color = "";
      span.style.borderRadius = "";
      span.style.boxShadow = "";
    });

    const normalize = (text) =>
      text.toLowerCase().match(/[a-z0-9]+/g) || [];

    const targetWords = normalize(selectedSentence);

    if (!targetWords.length) return false;

    // Build an ordered list of words and their PDF spans.
    const allWords = [];

    spans.forEach((span, spanIndex) => {
      normalize(span.textContent).forEach((word) => {
        allWords.push({
          word,
          spanIndex,
        });
      });
    });

    // Find the saved sentence in the PDF text.
    let matchStart = -1;

    for (
      let i = 0;
      i <= allWords.length - targetWords.length;
      i++
    ) {
      const matches = targetWords.every(
        (word, offset) => allWords[i + offset].word === word
      );

      if (matches) {
        matchStart = i;
        break;
      }
    }

    if (matchStart === -1) return false;

    const firstSpanIndex = allWords[matchStart].spanIndex;
    const lastSpanIndex =
      allWords[matchStart + targetWords.length - 1].spanIndex;

    // Highlight every span containing the matched sentence.
    for (let i = firstSpanIndex; i <= lastSpanIndex; i++) {
      spans[i].style.backgroundColor = "#fde047";
      spans[i].style.color = "#111827";
      spans[i].style.borderRadius = "2px";
      spans[i].style.boxShadow = "0 0 0 1px #fde047";
    }

    spans[firstSpanIndex].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return true;
  };

  // Wait for PDF text layer to render when navigating
  useEffect(() => {
    if (
      !pendingHighlight ||
      pendingHighlight.page !== pageNumber
    ) {
      return;
    }

    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;

      const found = applySavedHighlight(pendingHighlight.text);

      if (found || attempts >= 20) {
        clearInterval(interval);
        setPendingHighlight(null);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [pageNumber, pendingHighlight]);

  if (!book) {
    return (
      <h2
        style={{
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Loading...
      </h2>
    );
  }

  return (
    <div
      onMouseUp={handleTextSelection}
      style={{
        position: "relative",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
        backgroundColor: darkMode ? "#111" : "#fff",
        color: darkMode ? "#fff" : "#000",
        transition: "0.3s",
      }}
    >
      {/* Dark Mode Toggle */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          right: "25px",
          zIndex: 100,
        }}
      >
        <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>

      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingRight: "10px",
          maxWidth: "1200px",
          margin: "0 auto 20px auto",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            ...actionButton,
            background: "#2d2d2d",
            color: "white",
          }}
        >
          ← Library
        </button>

        <h2 style={{ margin: 0, fontSize: "1.4rem" }}>
          {cleanTitle(book.title)}
        </h2>

        <p style={{ margin: 0, fontWeight: "500" }}>
          Page {pageNumber} / {numPages || "..."}
        </p>
      </div>

      {/* Control Buttons */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <button
          onClick={() => {
            saveHighlight(book.id, pageNumber);
            setHighlightRefresh((prev) => prev + 1);
          }}
          style={{
            ...actionButton,
            background: "#f59e0b",
            color: "white",
          }}
        >
          🖍 Highlight Page
        </button>

        <button
          onClick={previousPage}
          disabled={pageNumber <= 1}
          style={{
            ...actionButton,
            background: "#374151",
            color: "white",
            opacity: pageNumber <= 1 ? 0.5 : 1,
            cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        <button
          onClick={nextPage}
          disabled={pageNumber >= numPages}
          style={{
            ...actionButton,
            background: "#2563eb",
            color: "white",
            opacity: pageNumber >= numPages ? 0.5 : 1,
            cursor: pageNumber >= numPages ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>

        <button
          onClick={handleDelete}
          style={{
            ...actionButton,
            background: "#dc2626",
            color: "white",
          }}
        >
          Delete Book
        </button>
      </div>

      {/* PDF Viewport & Notes Drawer */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Document
          file={`http://localhost:8080/api/books/file/${id}`}
          onLoadSuccess={onDocumentLoadSuccess}
          loading="Loading PDF..."
        >
          <Page
            pageNumber={pageNumber}
            width={700}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>

        <NotesDrawer
          bookId={book.id}
          pageNumber={pageNumber}
          refresh={highlightRefresh}
        />
      </div>

      <SelectionPopup
        visible={popupVisible}
        x={popupPosition.x}
        y={popupPosition.y}
        onHighlight={() => {
          saveHighlight(book.id, pageNumber, selectedText);
          setHighlightRefresh((prev) => prev + 1);
          setPopupVisible(false);
        }}
        onNote={() => {
          window.dispatchEvent(
            new CustomEvent("selectedText", {
              detail: selectedText,
            })
          );
          setPopupVisible(false);
        }}
      />
    </div>
  );
}

export default Reader;