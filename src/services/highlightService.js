export const saveHighlight = (
  bookId,
  pageNumber,
  text
) => {
  const key = `highlights-${bookId}`;

  const existing =
    JSON.parse(localStorage.getItem(key)) || [];

  existing.push({
    page: pageNumber,
    text: text,
  });

  localStorage.setItem(
    key,
    JSON.stringify(existing)
  );
};

export const getHighlights = (bookId) => {
  return (
    JSON.parse(
      localStorage.getItem(
        `highlights-${bookId}`
      )
    ) || []
  );
};
export const deleteHighlight = (
  bookId,
  highlightIndex
) => {
  const key = `highlights-${bookId}`;

  const highlights =
    JSON.parse(localStorage.getItem(key)) || [];

  highlights.splice(highlightIndex, 1);

  localStorage.setItem(
    key,
    JSON.stringify(highlights)
  );
};