export default function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    {
      label: "Dashboard",
      page: "dashboard",
      icon: "▦",
      sub: "Overview and stats",
    },
    {
      label: "Replay",
      page: "backtesting",
      icon: "↻",
      sub: "Review market sessions",
    },
    {
      label: "Journal",
      page: "journal",
      icon: "↗",
      sub: "Notes, trades, mistakes",
    },
    {
      label: "Pricing",
      page: "pricing",
      icon: "◈",
      sub: "Plans and upgrades",
    },
  ];

  return (
    <div style={styles.sidebar}>
      <div>
        <button
          type="button"
          onClick={() => setActivePage("dashboard")}
          style={styles.logoButton}
        >
          <h1 style={styles.logo}>
            <span style={styles.logoWhite}>Trade</span>
            <span style={styles.logoBlue}>Archive</span>
          </h1>
        </button>

        <div style={styles.menuGroup}>
          {navItems.map((item, index) => {
            const isActive = activePage === item.page;

            return (
              <button
                key={index}
                onClick={() => setActivePage(item.page)}
                style={{
                  ...styles.navCard,
                  ...(isActive ? styles.activeNavCard : {}),
                }}
              >
                <div
                  style={{
                    ...styles.iconWrap,
                    ...(isActive ? styles.activeIconWrap : {}),
                  }}
                >
                  {item.icon}
                </div>

                <div style={styles.navTextWrap}>
                  <div
                    style={{
                      ...styles.navTitle,
                      ...(isActive ? styles.activeNavTitle : {}),
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      ...styles.navSub,
                      ...(isActive ? styles.activeNavSub : {}),
                    }}
                  >
                    {item.sub}
                  </div>
                </div>

                <div
                  style={{
                    ...styles.navArrow,
                    ...(isActive ? styles.activeNavArrow : {}),
                  }}
                >
                  {isActive ? "•" : "−"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.priceCard}>
        <p style={styles.priceLabel}>ESSENTIAL PLAN</p>

        <div style={styles.priceHeaderRow}>
          <h3 style={styles.priceTitle}>Upgrade</h3>
          <div style={styles.priceBadge}>$9.99</div>
        </div>

        <p style={styles.priceText}>
          Unlock deeper analytics, backtesting tools, and structured reviews.
        </p>

        <button
          style={styles.priceButton}
          onClick={() => setActivePage("pricing")}
        >
          View Pricing
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "230px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #020617 0%, #010817 55%, #000814 100%)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: "22px 16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  logoButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    cursor: "pointer",
    textAlign: "left",
  },

  logo: {
    margin: "0 0 26px 2px",
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.03em",
  },

  logoWhite: {
    color: "#ffffff",
  },

  logoBlue: {
    color: "#3b82f6",
  },

  menuGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  navCard: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(135deg, rgba(18,28,52,0.92), rgba(7,12,24,0.95))",
    borderRadius: "20px",
    padding: "16px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.18)",
  },

  activeNavCard: {
    background:
      "linear-gradient(135deg, rgba(248,250,252,0.96), rgba(226,232,240,0.94))",
    border: "1px solid rgba(255,255,255,0.75)",
  },

  iconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "rgba(37,99,235,0.14)",
    color: "#93c5fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },

  activeIconWrap: {
    background: "rgba(37,99,235,0.12)",
    color: "#2563eb",
  },

  navTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  navTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: "4px",
  },

  activeNavTitle: {
    color: "#0f172a",
  },

  navSub: {
    fontSize: "12px",
    lineHeight: "1.35",
    color: "rgba(255,255,255,0.58)",
  },

  activeNavSub: {
    color: "rgba(15,23,42,0.7)",
  },

  navArrow: {
    color: "rgba(255,255,255,0.26)",
    fontSize: "18px",
    flexShrink: 0,
  },

  activeNavArrow: {
    color: "#0f172a",
  },

  priceCard: {
    marginTop: "18px",
    background:
      "linear-gradient(180deg, rgba(9,15,28,0.96), rgba(5,10,20,0.98))",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
  },

  priceLabel: {
    margin: "0 0 10px 0",
    fontSize: "11px",
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.58)",
  },

  priceHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  priceTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#ffffff",
  },

  priceBadge: {
    background: "rgba(37,99,235,0.18)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.25)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  priceText: {
    margin: "0 0 16px 0",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "rgba(255,255,255,0.72)",
  },

  priceButton: {
    width: "100%",
    border: "1px solid rgba(59,130,246,0.22)",
    borderRadius: "14px",
    background: "linear-gradient(180deg, #16345f 0%, #0f2747 100%)",
    color: "#ffffff",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(37,99,235,0.2)",
  },
};