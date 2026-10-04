export const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : typeof window !== "undefined" &&
      (window.location.hostname.startsWith("192.168.") ||
        window.location.hostname.startsWith("10.") ||
        window.location.hostname.startsWith("172."))
    ? `http://${window.location.hostname}:5000`
    : typeof window !== "undefined" &&
      window.location.hostname.includes("loca.lt")
    ? "https://irshad-chat-api.loca.lt"
    : "https://real-time-application-35ha.onrender.com");


