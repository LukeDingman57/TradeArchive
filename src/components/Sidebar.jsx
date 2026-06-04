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

              {isActive && <div style={styles.activeDot} />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "230px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #020617 0%, #020b1a 55%, #000814 100%)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: "22px 14px",
    boxSizing: "border-box",
    flexShrink: 0,
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
    margin: "0 0 28px 4px",
    fontSize: "24px",
    fontWeight: "900",
    letterSpacing: "-0.04em",
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
    gap: "8px",
  },

  navItem: {
    width: "100%",
    minHeight: "62px",
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: "16px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.18s ease",
  },

  activeNavItem: {
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.88))",
    border: "1px solid rgba(96,165,250,0.24)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 26px rgba(37,99,235,0.14)",
  },

  iconWrap: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    background: "rgba(148,163,184,0.08)",
    color: "rgba(203,213,225,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
  },

  activeIconWrap: {
    background: "rgba(59,130,246,0.22)",
    color: "#93c5fd",
  },

  textWrap: {
    flex: 1,
    minWidth: 0,
  },

  navTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "rgba(248,250,252,0.84)",
    marginBottom: "3px",
  },

  activeNavTitle: {
    color: "#ffffff",
  },

  navSub: {
    fontSize: "12px",
    lineHeight: "1.25",
    color: "rgba(148,163,184,0.72)",
  },

  activeNavSub: {
    color: "rgba(191,219,254,0.82)",
  },

  activeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "999px",
    background: "#60a5fa",
    boxShadow: "0 0 14px rgba(96,165,250,0.9)",
    flexShrink: 0,
  },
};
