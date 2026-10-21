
import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getBookById, deleteBook } from "../services/bookService";
import DarkModeToggle from "../components/DarkModeToggle";
import axios from "axios";
import NotesDrawer from "../components/NotesDrawer";
import SelectionPopup from "../components/SelectionPopup";
import { saveHighlight } from "../services/highlightService";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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
  const [zoom, setZoom] = useState(1);
  const [highlightRefresh, setHighlightRefresh] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const saveProgress = useCallback(
    async (page) => {
      try {
        await axios.post(`http://localhost:8080/api/progress/${id}`, {
          currentPage: page,
        });
      } catch (error) {
        console.error("Failed to save progress", error);
      }
    },
    [id]
  );

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const data = await getBookById(id);

        if (!data) {
          navigate("/");
          return;
        }

        setBook(data);
      } catch (error) {
        console.error("Failed to load book", error);
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
      } catch {
        console.log("No saved progress yet");
      }
    };

    fetchBook();
    fetchProgress();
  }, [id, navigate]);

  useEffect(() => {
    const handleJump = (event) => {
      const detail = event.detail;

      const targetPage =
        typeof detail === "number" ? detail : detail?.page;

      if (!targetPage || targetPage < 1) return;

      if (typeof detail === "object" && detail.text) {
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
  }, [saveProgress]);

  const nextPage = () => {
    if (pageNumber < numPages) {
      const next = pageNumber + 1;
      setPageNumber(next);
      saveProgress(next);
      setPopupVisible(false);
    }
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      const previous = pageNumber - 1;
      setPageNumber(previous);
      saveProgress(previous);
      setPopupVisible(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages: totalPages }) => {
    setNumPages(totalPages);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this book?"
    );

    if (!confirmed) return;

    try {
      await deleteBook(id);
      alert("Book deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Failed to delete book", error);
      alert("Failed to delete book");
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || !selection || selection.rangeCount === 0) {
      setPopupVisible(false);
      return;
    }

    setSelectedText(text);

    const rect = selection.getRangeAt(0).getBoundingClientRect();

    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: Math.max(10, rect.top - 60),
    });

    setPopupVisible(true);
  };

  const applySavedHighlight = useCallback((sentence) => {
    if (!sentence?.trim()) return false;

    const spans = Array.from(
      document.querySelectorAll(".react-pdf__Page__textContent span")
    );

    if (!spans.length) return false;

    // Clear the previous temporary saved-highlight display.
    spans.forEach((span) => {
      span.style.backgroundColor = "";
      span.style.color = "";
      span.style.borderRadius = "";
      span.style.boxShadow = "";
    });

    const normalize = (text) =>
      text.toLowerCase().match(/[a-z0-9]+/g) || [];

    const targetWords = normalize(sentence);

    if (!targetWords.length) return false;

    const allWords = [];

    spans.forEach((span, spanIndex) => {
      normalize(span.textContent).forEach((word) => {
        allWords.push({ word, spanIndex });
      });
    });

    let matchStart = -1;

    for (
      let i = 0;
      i <= allWords.length - targetWords.length;
      i++
    ) {
      const matches = targetWords.every(
        (word, offset) => allWords[i + offset]?.word === word
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
  }, []);

  useEffect(() => {
    if (!pendingHighlight || pendingHighlight.page !== pageNumber) {
      return;
    }

    let attempts = 0;
    let timer;

    const tryHighlight = () => {
      attempts += 1;

      const found = applySavedHighlight(pendingHighlight.text);

      if (found || attempts >= 20) {
        clearInterval(timer);
        setPendingHighlight(null);
      }
    };

    timer = setInterval(tryHighlight, 150);

    return () => clearInterval(timer);
  }, [pageNumber, pendingHighlight, applySavedHighlight]);

  const zoomIn = () => {
    setZoom((current) => Math.min(1.6, +(current + 0.1).toFixed(1)));
  };

  const zoomOut = () => {
    setZoom((current) => Math.max(0.6, +(current - 0.1).toFixed(1)));
  };

  const resetZoom = () => setZoom(1);

  const actionButton = {
    border: "none",
    borderRadius: "9px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    transition: "background 0.2s, opacity 0.2s",
    color: "#fff",
  };

  const disabledButton = {
    opacity: 0.45,
    cursor: "not-allowed",
  };

  if (!book) {
    return (
      <div className="reader-loading">
        <p>Loading your book...</p>
      </div>
    );
  }

  return (
    <div
      className={`reader-shell ${darkMode ? "reader-dark" : "reader-light"}`}
      onMouseUp={handleTextSelection}
    >
      <header className="reader-header">
        <button
          onClick={() => navigate("/")}
          style={{ ...actionButton, background: "#374151" }}
        >
          ← Library
        </button>

        <h2 className="reader-title">
          {book.title?.replace(/\.pdf$/i, "").replaceAll("-", " ")}
        </h2>

        <div className="reader-page-count">
          Page {pageNumber} / {numPages || "..."}
        </div>

        <div className="reader-theme-toggle">
          <DarkModeToggle
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        </div>
      </header>

      <div className="reader-toolbar">
        <button
          onClick={() => {
            saveHighlight(book.id, pageNumber);
            setHighlightRefresh((previous) => previous + 1);
          }}
          style={{ ...actionButton, background: "#f59e0b" }}
        >
          🖍 Highlight Page
        </button>

        <button
          onClick={previousPage}
          disabled={pageNumber <= 1}
          style={{
            ...actionButton,
            background: "#374151",
            ...(pageNumber <= 1 ? disabledButton : {}),
          }}
        >
          ← Previous
        </button>

        <button
          onClick={nextPage}
          disabled={!numPages || pageNumber >= numPages}
          style={{
            ...actionButton,
            background: "#2563eb",
            ...(!numPages || pageNumber >= numPages
              ? disabledButton
              : {}),
          }}
        >
          Next →
        </button>

        <div className="zoom-controls">
          <button
            onClick={zoomOut}
            disabled={zoom <= 0.6}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>

          <button
            onClick={resetZoom}
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={zoomIn}
            disabled={zoom >= 1.6}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <button
          onClick={handleDelete}
          style={{ ...actionButton, background: "#dc2626" }}
        >
          Delete Book
        </button>
      </div>

      <main className="reader-main">
        <div className="pdf-scroll-area">
          <Document
            file={`http://localhost:8080/api/books/file/${id}`}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<p className="pdf-loading">Loading PDF...</p>}
            error={
              <p className="pdf-loading">
                Unable to load this PDF. Check that your backend is running.
              </p>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={700 * zoom}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className={darkMode ? "pdf-page-dark" : "pdf-page-light"}
            />
          </Document>
        </div>

        <NotesDrawer
          bookId={book.id}
          pageNumber={pageNumber}
          refresh={highlightRefresh}
        />
      </main>

      <SelectionPopup
        visible={popupVisible}
        x={popupPosition.x}
        y={popupPosition.y}
        onHighlight={() => {
          saveHighlight(book.id, pageNumber, selectedText);
          setHighlightRefresh((previous) => previous + 1);
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

      <style>{`
        .reader-shell {
          min-height: 100vh;
          padding: 22px;
          box-sizing: border-box;
          transition: background 0.25s, color 0.25s;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
        }

        .reader-dark {
          background: #111318;
          color: #f3f4f6;
        }

        .reader-light {
          background: #f3f4f6;
          color: #1f2937;
        }

        .reader-header {
          max-width: 1250px;
          margin: 0 auto 22px;
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          align-items: center;
          gap: 16px;
          position: relative;
        }

        .reader-title {
          margin: 0;
          text-align: center;
          font-size: 23px;
          font-weight: 700;
          overflow-wrap: anywhere;
          color: inherit;
        }

        .reader-page-count {
          text-align: right;
          font-weight: 600;
          font-size: 14px;
        }

        .reader-theme-toggle {
          position: absolute;
          top: 48px;
          right: 0;
          z-index: 10;
        }

        .reader-toolbar {
          max-width: 1000px;
          margin: 0 auto 22px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        .zoom-controls {
          display: inline-flex;
          align-items: center;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #64748b;
          background: #374151;
        }

        .zoom-controls button {
          min-width: 40px;
          height: 38px;
          border: none;
          padding: 0 10px;
          background: transparent;
          color: white;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
        }

        .zoom-controls button:nth-child(2) {
          min-width: 58px;
          font-size: 13px;
        }

        .zoom-controls button:hover:not(:disabled) {
          background: #4b5563;
        }

        .zoom-controls button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .reader-main {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 20px;
          max-width: 1450px;
          margin: 0 auto;
        }

        .pdf-scroll-area {
          flex: 1;
          min-width: 0;
          overflow: auto;
          padding: 4px 10px 28px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .pdf-scroll-area .react-pdf__Document {
          margin: 0 auto;
          flex: 0 0 auto;
        }

        .pdf-scroll-area .react-pdf__Page {
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.24);
          background: white;
        }

        .pdf-scroll-area .react-pdf__Page canvas {
          display: block;
          height: auto !important;
          max-width: none;
        }

        .pdf-page-dark canvas {
          filter: invert(0.88) hue-rotate(180deg);
        }

        .pdf-page-light canvas {
          filter: none;
        }

        .reader-dark .pdf-scroll-area {
          background: #111318;
        }

        .reader-light .pdf-scroll-area {
          background: #f3f4f6;
        }

        .pdf-loading,
        .reader-loading {
          text-align: center;
          padding: 50px 20px;
          font-size: 16px;
        }

        .reader-loading {
          min-height: 100vh;
        }

        @media (max-width: 760px) {
          .reader-shell {
            padding: 14px 8px;
          }

          .reader-header {
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .reader-title {
            grid-column: 1 / -1;
            grid-row: 1;
            padding-top: 8px;
            font-size: 20px;
          }

          .reader-page-count {
            text-align: right;
          }

          .reader-theme-toggle {
            top: 55px;
            right: 0;
          }

          .reader-toolbar {
            padding-top: 42px;
            gap: 8px;
          }

          .reader-toolbar > button {
            padding: 9px 10px !important;
            font-size: 12px !important;
          }

          .reader-main {
            display: block;
          }

          .pdf-scroll-area {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default Reader;
