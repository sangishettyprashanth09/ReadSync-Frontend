import UploadBook from "../components/UploadBook";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBooks } from "../services/bookService";
import axios from "axios";

function Home() {
  const [books, setBooks] = useState([]);
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const data = await getBooks();
      setBooks(data);

      const progressData = {};

      for (const book of data) {
        try {
          const res = await axios.get(
            `http://localhost:8080/api/progress/${book.id}`
          );

          progressData[book.id] =
            res.data?.currentPage || 1;
        } catch {
          progressData[book.id] = 1;
        }
      }

      setProgressMap(progressData);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBook = async (id, title) => {
    const confirmDelete = window.confirm(
      `Delete "${title}"?`
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://localhost:8080/api/books/${id}`
      );

      setBooks((prevBooks) =>
        prevBooks.filter((book) => book.id !== id)
      );

    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "4rem",
          marginBottom: "40px",
        }}
      >
        ReadSync
      </h1>

      <h2
        style={{
          marginBottom: "30px",
        }}
      >
        Your Library
      </h2>

      <UploadBook />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "25px",
          maxWidth: "1200px",
          margin: "40px auto 0",
        }}
      >
        {books.map((book) => {
          const currentPage =
            progressMap[book.id] || 1;

          const percentage = Math.round(
            (currentPage * 100) / book.totalPages
          );

          return (
            <div
              key={book.id}
              style={{
                position: "relative",
              }}
            >
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  deleteBook(
                    book.id,
                    book.title
                  );
                }}
                title="Delete Book"
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  zIndex: 10,
                  width: "32px",
                  height: "32px",
                  border: "none",
                  borderRadius: "50%",
                  background:
                    "rgba(0,0,0,0.7)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>

              <Link
                to={`/reader/${book.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    border: "1px solid #333",
                    borderRadius: "14px",
                    padding: "15px",
                    cursor: "pointer",
                    transition: "0.3s",
                  }}
                >
                  <img
                    src={`http://localhost:8080/api/books/cover/${book.id}`}
                    alt={book.title}
                    style={{
                      width: "100%",
                      height: "300px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    }}
                  />

                  <h3
                    style={{
                      marginTop: "15px",
                      marginBottom: "10px",
                    }}
                  >
                    {book.title}
                  </h3>

                  <p>
                    {percentage}% Complete
                  </p>

                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "#333",
                      borderRadius: "10px",
                      overflow: "hidden",
                      marginTop: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: "#4CAF50",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      marginTop: "12px",
                      fontSize: "14px",
                    }}
                  >
                    Page {currentPage} / {book.totalPages}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Home;