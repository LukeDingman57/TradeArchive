import React from "react";

export default function ComingSoon() {
  const features = [
    {
      title: "Advanced TradingView Charts",
      text: "Full charting tools with cleaner replay and deeper trade review.",
    },
    {
      title: "Broker Sync",
      text: "Automatically import trades and reduce manual journaling.",
    },
    {
      title: "Strategy Analytics",
      text: "Track which setups, sessions, and strategies perform best.",
    },
    {
      title: "Replay Improvements",
      text: "Better market replay tools for reviewing and practicing trades.",
    },
    {
      title: "Multi-Account Tracking",
      text: "Track personal, funded, and eval accounts in one place.",
    },
    {
      title: "Mobile App",
      text: "Cleaner mobile experience for reviewing and logging trades.",
    },
    {
      title: "Trade Export",
      text: "Export your journal data for deeper analysis and record keeping.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08111f",
        color: "white",
        padding: "50px 30px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            marginBottom: "14px",
          }}
        >
          Coming Soon
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "18px",
            marginBottom: "40px",
            lineHeight: 1.6,
            maxWidth: "700px",
          }}
        >
          TradeArchive is actively being developed with new tools focused on
          helping traders review performance, improve consistency, and simplify
          their workflow.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "22px",
                padding: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  marginBottom: "12px",
                  color: "#93c5fd",
                }}
              >
                {feature.title}
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,0.68)",
                  lineHeight: 1.6,
                  fontSize: "15px",
                }}
              >
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}