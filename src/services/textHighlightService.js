export const saveTextHighlight = (
  bookId,
  highlight
) => {
  const key = `text-highlights-${bookId}`;

  const existing =
    JSON.parse(localStorage.getItem(key)) || [];

  existing.push(highlight);

  localStorage.setItem(
    key,
    JSON.stringify(existing)
  );
};

export const getTextHighlights = (
  bookId
) => {
  return (
    JSON.parse(
      localStorage.getItem(
        `text-highlights-${bookId}`
      )
    ) || []
  );
};