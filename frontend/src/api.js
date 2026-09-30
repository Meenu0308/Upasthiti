import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// httpOnly cookies are attached automatically when withCredentials is true.
export const api = axios.create({ baseURL: API, withCredentials: true });
