import axios from "axios";

const API_URL = "http://localhost:8080/api/progress";

export const getProgress = async (bookId) => {
  const response = await axios.get(`${API_URL}/${bookId}`);
  return response.data;
};