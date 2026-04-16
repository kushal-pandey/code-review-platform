import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      console.log("Token found! Saving...");

      // Use a tiny timeout to ensure localStorage is written
      // before the navigation kicks in
      setTimeout(() => {
        window.location.replace("/"); // Force a hard reload to the dashboard
      }, 300);
    } else {
      console.error("No token found in URL!");
      navigate("/login");
    }
  }, [navigate]);
  return (
    <div
      style={{
        color: "#e6edf3",
        textAlign: "center",
        marginTop: "50px",
        background: "#0d1117",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>
        <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
        <p>Authenticating with GitHub...</p>
      </div>
    </div>
  );
}
