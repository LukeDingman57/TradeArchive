export default function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    {
      label: "Dashboard",
      page: "dashboard",
      icon: "▦",
      sub: "Overview",
    },
    {
      label: "Journal",
      page: "journal",
      icon: "↗",
      sub: "Trade notes",
    },
    {
      label: "Pricing",
      page: "pricing",
      icon: "◈",
      sub: "Plans",
    },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.topGlow} />
      <div style={styles.content}>
        <button
          type="button"
          onClick={() => setActivePage("dashboard")}
          style={styles.logoButton}
        >
          <div style={styles.logoMark}>TA</div>
          <div>
            <h1 style={styles.logo}>
              <span style={styles.logoWhite}>Trade</span>
              <span style={styles.logoBlue}>Archive</span>
            </h1>
            <div style={styles.logoSub}>Trading journal</div>
          </div>
        </button>

        <div style={styles.sectionLabel}>Main</div>

        <nav style={styles.menuGroup}>
          {navItems.map((item) => {
            const isActive = activePage === item.page;

            return (
              <button
                key={item.page}
                onClick={() => setActivePage(item.page)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.activeNavItem : {}),
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

                <div style={styles.textWrap}>
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

                {isActive && <div style={styles.activePill} />}
              </button>
            );
          })}
        </nav>

        <div style={styles.spacer} />

        <button
          type="button"
          onClick={() => setActivePage("pricing")}
          style={styles.upgradeCard}
        >
          <div style={styles.upgradeTop}>
            <div style={styles.upgradeIcon}>★</div>
            <div style={styles.upgradeArrow}>→</div>
          </div>
          <div style={styles.upgradeTitle}>Essential</div>
          <div style={styles.upgradeText}>Unlock screenshots, analytics, and unlimited journal entries.</div>
        </button>

        <div style={styles.footerCard}>
          <div style={styles.footerAvatar}>TA</div>
          <div style={styles.footerTextWrap}>
            <div style={styles.footerTitle}>TradeArchive</div>
            <div style={styles.footerSub}>Build consistency</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "248px",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 34%), linear-gradient(180deg, #030817 0%, #020713 58%, #000711 100%)",
    borderRight: "1px solid rgba(148,163,184,0.10)",
    boxSizing: "border-box",
    flexShrink: 0,
  },

  topGlow: {
    position: "absolute",
    top: "-90px",
    left: "-70px",
    width: "220px",
    height: "220px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.14)",
    filter: "blur(54px)",
    pointerEvents: "none",
  },

  content: {
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "22px 14px 18px",
    boxSizing: "border-box",
  },

  logoButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: "0 4px 20px",
    margin: 0,
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  logoMark: {
    width: "38px",
    height: "38px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(180deg, rgba(59,130,246,0.30), rgba(37,99,235,0.16))",
    border: "1px solid rgba(96,165,250,0.24)",
    color: "#dbeafe",
    fontSize: "13px",
    fontWeight: 850,
    boxShadow: "0 12px 28px rgba(37,99,235,0.14)",
    flexShrink: 0,
  },

  logo: {
    margin: 0,
    fontSize: "23px",
    fontWeight: 800,
    letterSpacing: "-0.045em",
    lineHeight: 1,
  },

  logoWhite: {
    color: "#ffffff",
  },

  logoBlue: {
    color: "#60a5fa",
  },

  logoSub: {
    marginTop: "5px",
    color: "rgba(148,163,184,0.72)",
    fontSize: "12px",
    fontWeight: 550,
  },

  sectionLabel: {
    margin: "2px 8px 9px",
    color: "rgba(148,163,184,0.55)",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
  },

  menuGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  navItem: {
    width: "100%",
    minHeight: "68px",
    border: "1px solid rgba(148,163,184,0.06)",
    background: "rgba(15,23,42,0.24)",
    borderRadius: "18px",
    padding: "10px 11px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.18s ease",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.025)",
  },

  activeNavItem: {
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.28), rgba(15,23,42,0.78) 62%, rgba(8,15,28,0.92))",
    border: "1px solid rgba(96,165,250,0.32)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 32px rgba(37,99,235,0.16)",
  },

  iconWrap: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "rgba(148,163,184,0.08)",
    color: "rgba(203,213,225,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },

  activeIconWrap: {
    background: "linear-gradient(180deg, rgba(59,130,246,0.42), rgba(37,99,235,0.24))",
    color: "#dbeafe",
    boxShadow: "0 10px 22px rgba(37,99,235,0.20)",
  },

  textWrap: {
    flex: 1,
    minWidth: 0,
  },

  navTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "rgba(248,250,252,0.82)",
    marginBottom: "4px",
    letterSpacing: "-0.01em",
  },

  activeNavTitle: {
    color: "#ffffff",
    fontWeight: 760,
  },

  navSub: {
    fontSize: "12px",
    lineHeight: 1.3,
    color: "rgba(148,163,184,0.68)",
    fontWeight: 500,
  },

  activeNavSub: {
    color: "rgba(191,219,254,0.82)",
  },

  activePill: {
    position: "absolute",
    right: "11px",
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    background: "#60a5fa",
    boxShadow: "0 0 16px rgba(96,165,250,0.95)",
  },

  spacer: {
    flex: 1,
    minHeight: "28px",
  },

  upgradeCard: {
    width: "100%",
    border: "1px solid rgba(96,165,250,0.16)",
    background:
      "linear-gradient(145deg, rgba(37,99,235,0.14), rgba(15,23,42,0.44) 56%, rgba(2,6,23,0.76))",
    borderRadius: "20px",
    padding: "15px",
    textAlign: "left",
    cursor: "pointer",
    color: "white",
    boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
    marginBottom: "14px",
  },

  upgradeTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  upgradeIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "12px",
    background: "rgba(59,130,246,0.18)",
    border: "1px solid rgba(96,165,250,0.18)",
    color: "#93c5fd",
    display: "grid",
    placeItems: "center",
    fontSize: "17px",
  },

  upgradeArrow: {
    color: "rgba(191,219,254,0.80)",
    fontSize: "18px",
  },

  upgradeTitle: {
    fontSize: "15px",
    fontWeight: 760,
    marginBottom: "6px",
  },

  upgradeText: {
    color: "rgba(203,213,225,0.70)",
    fontSize: "12.5px",
    lineHeight: 1.45,
    fontWeight: 500,
  },

  footerCard: {
    borderTop: "1px solid rgba(148,163,184,0.10)",
    padding: "14px 6px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  footerAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(180deg, #3b82f6, #1d4ed8)",
    color: "white",
    fontSize: "12px",
    fontWeight: 850,
    flexShrink: 0,
  },

  footerTextWrap: {
    minWidth: 0,
  },

  footerTitle: {
    color: "rgba(248,250,252,0.88)",
    fontSize: "13px",
    fontWeight: 720,
    lineHeight: 1.25,
  },

  footerSub: {
    color: "rgba(148,163,184,0.64)",
    fontSize: "12px",
    lineHeight: 1.3,
  },
};
