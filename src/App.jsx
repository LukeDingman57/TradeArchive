import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Backtesting from "./components/Backtesting";
import Journal from "./Journal";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a1320" }}>
      
      {/* Sidebar */}
      <div
        style={{
          width: "230px",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          padding: "20px",
          color: "white",
        }}
      >
        <h2 style={{ fontWeight: "800", fontSize: "22px" }}>
          Trade<span style={{ color: "#60a5fa" }}>Archive</span>
        </h2>

        {/* 🔥 NEW STYLED BUTTONS */}
        <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "16px" }}>

          <button onClick={() => setPage("dashboard")} style={cardStyle(page === "dashboard")}>
            <div style={iconBox(page === "dashboard")}>📊</div>
            <span>Dashboard</span>
            <span style={arrow}>›</span>
          </button>

          <button onClick={() => setPage("backtest")} style={cardStyle(page === "backtest")}>
            <div style={iconBox(page === "backtest")}>⟳</div>
            <span>Replay</span>
            <span style={arrow}>›</span>
          </button>

          <button onClick={() => setPage("journal")} style={cardStyle(page === "journal")}>
            <div style={iconBox(page === "journal")}>📓</div>
            <span>Journal</span>
            <span style={arrow}>›</span>
          </button>

        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {page === "dashboard" && <Dashboard />}
        {page === "journal" && <Journal />}
        {page === "backtest" && <Backtesting />}
      </div>
    </div>
  );
}

/* 🔥 STYLES */

const cardStyle = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "16px",
  borderRadius: "20px",
  border: active
    ? "1px solid rgba(96,165,250,0.6)"
    : "1px solid rgba(255,255,255,0.08)",
  background: active
    ? "linear-gradient(180deg, rgba(96,165,250,0.25), rgba(37,99,235,0.15))"
    : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  color: "#fff",
  fontWeight: "600",
  fontSize: "16px",
  cursor: "pointer",
  justifyContent: "space-between",
  boxShadow: active
    ? "0 0 20px rgba(96,165,250,0.35)"
    : "0 6px 18px rgba(0,0,0,0.25)",
  transition: "all 0.25s ease",
});

const iconBox = (active) => ({
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  background: active
    ? "linear-gradient(180deg, #60a5fa, #2563eb)"
    : "rgba(255,255,255,0.08)",
  boxShadow: active
    ? "0 0 15px rgba(96,165,250,0.6)"
    : "none",
});

const arrow = {
  marginLeft: "auto",
  opacity: 0.6,
  fontSize: "20px",
};