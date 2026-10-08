import axios from 'axios';

const Api = axios.create({
  baseURL: import.meta.env.VITE_ENDPOINT || 'http://127.0.0.1:4000',
  withCredentials: true,
  timeout: 15000
});
export const getApiError = error =>
  error.response?.data?.message ||
  (error.code === 'ECONNABORTED'
    ? 'The request timed out. Please try again.'
    : 'Could not reach the API. Check that the server is running.');
export default Api;
