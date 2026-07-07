import React from "react";

function useIsMobileDashboard() {
  const getIsMobile = () =>
    typeof window !== "undefined" ? window.innerWidth <= 900 : false;

  const [isMobile, setIsMobile] = React.useState(getIsMobile);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

const navItems = [
  { label: "Home", page: "dashboard", icon: "⌂" },
  { label: "Accounts", page: "accounts", icon: "▱" },
  { label: "Evaluations", page: "evaluations", icon: "↗" },
  { label: "Payouts", page: "payouts", icon: "▣" },
  { label: "Journal", page: "journal", icon: "☷" },
  { label: "Analytics", page: "analytics", icon: "⌁" },
  { label: "Tools", page: "tools", icon: "⌘" },
  { label: "Settings", page: "settings", icon: "⚙" },
];

const accounts = [
  {
    name: "Topstep 50K #1",
    firm: "Topstep",
    type: "Funded",
    logo: "TOP",
    status: "Healthy",
    balance: 51280,
    targetLabel: "To Payout",
    targetAmount: 720,
    progress: 64,
  },
  {
    name: "Alpha Zero",
    firm: "Alpha Futures",
    type: "Funded",
    logo: "ALPHA",
    status: "Warning",
    balance: 50640,
    targetLabel: "To Payout",
    targetAmount: 420,
    progress: 48,
  },
  {
    name: "Topstep Eval",
    firm: "Topstep",
    type: "Evaluation",
    logo: "TOP",
    status: "In Progress",
    balance: 47550,
    targetLabel: "To Pass",
    targetAmount: 2450,
    progress: 57,
  },
];

const trades = [
  { icon: "↑", tone: "green", setup: "A+ • Long", market: "NQ", result: "+$350", date: "Today" },
  { icon: "↓", tone: "red", setup: "A • Short", market: "ES", result: "BE", date: "Yesterday" },
  { icon: "↑", tone: "green", setup: "A+ • Long", market: "NQ", result: "+$310", date: "Jul 6" },
  { icon: "↓", tone: "red", setup: "B • Short", market: "ES", result: "-$200", date: "Jul 6" },
  { icon: "↑", tone: "green", setup: "A • Long", market: "MNQ", result: "+$280", date: "Jul 5" },
];

const tools = [
  { label: "Recovery Calculator", icon: "◎", page: "tools" },
  { label: "Risk Calculator", icon: "◇", page: "tools" },
  { label: "Economic Calendar", icon: "▣", page: "calendar" },
  { label: "Session Countdown", icon: "◷", page: "tools" },
];

const money = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function Dashboard({ setActivePage }) {
  const isMobile = useIsMobileDashboard();

  const goToPage = (page) => {
    if (typeof setActivePage === "function") {
      setActivePage(page);
    }
  };

  return (
    <div style={styles.appShell}>
      {!isMobile && <Sidebar goToPage={goToPage} />}

      <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <div style={styles.pageGlow} />

        {isMobile && (
          <div style={styles.mobileTopBar}>
            <Brand />
            <button style={styles.mobileMenuButton}>☰</button>
          </div>
        )}

        <header style={{ ...styles.header, ...(isMobile ? styles.headerMobile : {}) }}>
          <div>
            <h1 style={{ ...styles.heroTitle, ...(isMobile ? styles.heroTitleMobile : {}) }}>
              Good afternoon, Luke
            </h1>
            <p style={styles.heroText}>
              Here's your trading overview for Tuesday, July 7.
            </p>
          </div>

          <div style={{ ...styles.headerButtons, ...(isMobile ? styles.headerButtonsMobile : {}) }}>
            <button
              type="button"
              style={styles.outlineButton}
              onClick={() => goToPage("journal")}
            >
              <span style={styles.buttonIcon}>▤</span>
              View Journal
            </button>

            <button
              type="button"
              style={styles.blueButton}
              onClick={() => goToPage("journal")}
            >
              <span style={styles.buttonIcon}>＋</span>
              Log Trade
            </button>
          </div>
        </header>

        <section style={{ ...styles.statGrid, ...(isMobile ? styles.statGridMobile : {}) }}>
          <TopStat
            icon="盾"
            iconStyle={styles.greenOrb}
            label="Today's Status"
            value="Safe to Trade"
            detail="No account is past daily risk limits"
            valueStyle={styles.greenText}
          />

          <TopStat
            icon="↗"
            iconStyle={styles.blueOrb}
            label="Monthly P/L"
            value="+$4,280"
            detail="2 funded • 1 evaluation"
            valueStyle={styles.whiteText}
          />

          <TopStat
            icon="▰"
            iconStyle={styles.goldOrb}
            label="Daily Loss Left"
            value="$600"
            detail="Across all accounts"
            valueStyle={styles.whiteText}
          />

          <TopStat
            icon="□"
            iconStyle={styles.blueOrb}
            label="Next News"
            value="NFP Friday"
            detail="High impact event"
            valueStyle={styles.whiteText}
          />
        </section>

        <main style={{ ...styles.contentGrid, ...(isMobile ? styles.contentGridMobile : {}) }}>
          <section style={styles.leftColumn}>
            <Panel>
              <PanelHeader
                title="My Accounts"
                actionLabel="View all accounts →"
                onAction={() => goToPage("accounts")}
              />

              <div style={styles.accountRows}>
                {accounts.map((account) => (
                  <AccountRow key={account.name} account={account} onClick={() => goToPage("accounts")} />
                ))}
              </div>

              <button
                type="button"
                style={styles.addFirmRow}
                onClick={() => goToPage("accounts")}
              >
                <span style={styles.addCircle}>＋</span>
                <span>
                  <span style={styles.addFirmTitle}>Add Firm</span>
                  <span style={styles.addFirmText}>Track a new funded or evaluation account</span>
                </span>
              </button>
            </Panel>

            <Panel style={styles.quickToolsPanel}>
              <h2 style={styles.sectionTitle}>Quick Tools</h2>

              <div style={{ ...styles.toolGrid, ...(isMobile ? styles.toolGridMobile : {}) }}>
                {tools.map((tool) => (
                  <button
                    key={tool.label}
                    type="button"
                    style={styles.toolItem}
                    onClick={() => goToPage(tool.page)}
                  >
                    <span style={styles.toolIcon}>{tool.icon}</span>
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </section>

          <aside style={styles.rightColumn}>
            <Panel>
              <div style={styles.recoveryHeader}>
                <h2 style={styles.sectionTitle}>Recovery Goal</h2>

                <button type="button" style={styles.selectButton}>
                  Topstep Eval⌄
                </button>
              </div>

              <div style={styles.recoveryCard}>
                <p style={styles.mutedLabel}>Need to pass</p>

                <div style={styles.recoveryValueRow}>
                  <div style={styles.recoveryValue}>$2,450</div>
                  <div style={styles.recoveryPercent}>57%</div>
                </div>

                <div style={styles.recoveryTrack}>
                  <div style={styles.recoveryFill} />
                </div>

                <p style={styles.recoveryNote}>
                  ◎ At $200 risk and 1.5R avg, that's ~8 winning trades.
                </p>

                <button
                  type="button"
                  style={styles.recoveryButton}
                  onClick={() => goToPage("tools")}
                >
                  ▦ Open Recovery Calculator
                </button>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Recent Trades"
                actionLabel="View all →"
                onAction={() => goToPage("journal")}
              />

              <div style={styles.tradeList}>
                {trades.map((trade, index) => (
                  <button
                    key={`${trade.setup}-${index}`}
                    type="button"
                    style={styles.tradeRow}
                    onClick={() => goToPage("journal")}
                  >
                    <span
                      style={{
                        ...styles.tradeIcon,
                        ...(trade.tone === "green" ? styles.tradeIconGreen : styles.tradeIconRed),
                      }}
                    >
                      {trade.icon}
                    </span>

                    <span style={styles.tradeSetup}>{trade.setup}</span>
                    <span style={styles.tradeMarket}>{trade.market}</span>
                    <span
                      style={{
                        ...styles.tradeResult,
                        ...(trade.result.includes("+")
                          ? styles.tradeProfit
                          : trade.result.includes("-")
                          ? styles.tradeLoss
                          : {}),
                      }}
                    >
                      {trade.result}
                    </span>
                    <span style={styles.tradeDate}>{trade.date}</span>
                    <span style={styles.tradeChevron}>›</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                style={styles.goJournalButton}
                onClick={() => goToPage("journal")}
              >
                ▤ Go to Journal
              </button>
            </Panel>
          </aside>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ goToPage }) {
  return (
    <aside style={styles.sidebar}>
      <Brand />

      <nav style={styles.navList}>
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            style={{
              ...styles.navItem,
              ...(item.label === "Home" ? styles.navItemActive : {}),
            }}
            onClick={() => goToPage(item.page)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button type="button" style={styles.userCard} onClick={() => goToPage("settings")}>
        <span style={styles.userAvatar}>LD</span>
        <span style={styles.userInfo}>
          <span style={styles.userName}>Luke Dingman</span>
          <span style={styles.userPlan}>Essential Plan</span>
        </span>
        <span style={styles.userArrow}>›</span>
      </button>
    </aside>
  );
}

function Brand() {
  return (
    <div style={styles.brand}>
      <span style={styles.brandIcon}>▟</span>
      <span>
        <span style={styles.brandTrade}>Trade</span>
        <span style={styles.brandArchive}>Archive</span>
      </span>
    </div>
  );
}

function TopStat({ icon, iconStyle, label, value, detail, valueStyle }) {
  return (
    <article style={styles.topStat}>
      <div style={{ ...styles.topStatIcon, ...iconStyle }}>{icon}</div>

      <div>
        <p style={styles.topStatLabel}>{label}</p>
        <h3 style={{ ...styles.topStatValue, ...valueStyle }}>{value}</h3>
        <p style={styles.topStatDetail}>{detail}</p>
      </div>
    </article>
  );
}

function Panel({ children, style }) {
  return <section style={{ ...styles.panel, ...(style || {}) }}>{children}</section>;
}

function PanelHeader({ title, actionLabel, onAction }) {
  return (
    <div style={styles.panelHeader}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {actionLabel && (
        <button type="button" style={styles.linkButton} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function AccountRow({ account, onClick }) {
  const statusStyle =
    account.status === "Healthy"
      ? styles.statusHealthy
      : account.status === "Warning"
      ? styles.statusWarning
      : styles.statusProgress;

  return (
    <button type="button" style={styles.accountRow} onClick={onClick}>
      <div style={styles.accountIdentity}>
        <div style={styles.firmLogo}>{account.logo}</div>

        <div>
          <h3 style={styles.accountName}>{account.name}</h3>
          <div style={styles.accountTags}>
            <span style={styles.accountTag}>{account.firm}</span>
            <span style={styles.accountTag}>{account.type}</span>
          </div>
        </div>
      </div>

      <AccountMetric label="Balance" value={money(account.balance)} />
      <AccountMetric label={account.targetLabel} value={money(account.targetAmount)} />

      <div style={styles.accountProgressCell}>
        <span style={styles.metricLabel}>Progress</span>
        <span style={styles.progressNumber}>{account.progress}%</span>
        <div style={styles.smallProgressTrack}>
          <div style={{ ...styles.smallProgressFill, width: `${account.progress}%` }} />
        </div>
      </div>

      <span style={{ ...styles.statusPill, ...statusStyle }}>{account.status}</span>
      <span style={styles.rowChevron}>›</span>
    </button>
  );
}

function AccountMetric({ label, value }) {
  return (
    <div style={styles.accountMetric}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricValue}>{value}</span>
    </div>
  );
}

const styles = {
  appShell: {
    minHeight: "100vh",
    display: "flex",
    background: "#020813",
    color: "#ffffff",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  sidebar: {
    width: "260px",
    minHeight: "100vh",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    flexShrink: 0,
    borderRight: "1px solid rgba(148,163,184,0.15)",
    background:
      "linear-gradient(180deg, rgba(7,16,31,0.96), rgba(3,10,21,0.98))",
    padding: "34px 18px 20px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "42px",
    padding: "0 14px",
    color: "#ffffff",
    fontSize: "23px",
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },

  brandIcon: {
    color: "#2f7cff",
    fontSize: "29px",
    lineHeight: 1,
    transform: "translateY(-1px)",
  },

  brandTrade: {
    color: "#ffffff",
  },

  brandArchive: {
    color: "#ffffff",
  },

  navList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  navItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "rgba(241,245,249,0.82)",
    borderRadius: "10px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
  },

  navItemActive: {
    background:
      "linear-gradient(90deg, rgba(37,99,235,0.85), rgba(37,99,235,0.48))",
    color: "#ffffff",
    boxShadow: "0 16px 32px rgba(37,99,235,0.18)",
  },

  navIcon: {
    width: "22px",
    display: "inline-flex",
    justifyContent: "center",
    color: "inherit",
    fontSize: "20px",
  },

  userCard: {
    marginTop: "auto",
    width: "100%",
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(15,23,42,0.58)",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#ffffff",
    cursor: "pointer",
  },

  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    minWidth: 0,
  },

  userName: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 750,
  },

  userPlan: {
    color: "rgba(226,232,240,0.72)",
    fontSize: "12px",
    marginTop: "3px",
  },

  userArrow: {
    marginLeft: "auto",
    color: "rgba(255,255,255,0.72)",
    fontSize: "24px",
  },

  page: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    padding: "42px 38px 38px",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at 20% 0%, rgba(37,99,235,0.16), transparent 26%), radial-gradient(circle at 95% 8%, rgba(14,165,233,0.10), transparent 24%), #020813",
  },

  pageGlow: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.025), transparent 26%, rgba(37,99,235,0.04))",
  },

  mobileTopBar: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
  },

  mobileMenuButton: {
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.72)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "18px",
  },

  header: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "30px",
  },

  heroTitle: {
    margin: "0 0 10px",
    color: "#ffffff",
    fontSize: "46px",
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: "-0.055em",
  },

  heroText: {
    margin: 0,
    color: "rgba(241,245,249,0.78)",
    fontSize: "17px",
    lineHeight: 1.55,
  },

  headerButtons: {
    display: "flex",
    gap: "14px",
    flexShrink: 0,
  },

  outlineButton: {
    minHeight: "52px",
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(2,8,19,0.35)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "0 22px",
    fontSize: "15px",
    fontWeight: 750,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },

  blueButton: {
    minHeight: "52px",
    border: "none",
    background: "linear-gradient(180deg, #3483ff, #0f63e8)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "0 24px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 18px 36px rgba(37,99,235,0.24)",
  },

  buttonIcon: {
    fontSize: "17px",
    lineHeight: 1,
  },

  statGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  topStat: {
    minHeight: "140px",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(5,13,27,0.78))",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "13px",
    padding: "22px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 18px 52px rgba(0,0,0,0.20)",
  },

  topStatIcon: {
    width: "72px",
    height: "72px",
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    fontWeight: 850,
    color: "#ffffff",
  },

  greenOrb: {
    background: "radial-gradient(circle at 35% 25%, rgba(34,197,94,0.78), rgba(22,101,52,0.56))",
    color: "#86efac",
  },

  blueOrb: {
    background: "radial-gradient(circle at 35% 25%, rgba(59,130,246,0.75), rgba(29,78,216,0.46))",
    color: "#93c5fd",
  },

  goldOrb: {
    background: "radial-gradient(circle at 35% 25%, rgba(245,158,11,0.82), rgba(146,64,14,0.48))",
    color: "#fde68a",
  },

  topStatLabel: {
    margin: "0 0 8px",
    color: "#ffffff",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: "13px",
    fontWeight: 800,
  },

  topStatValue: {
    margin: "0 0 8px",
    fontSize: "25px",
    lineHeight: 1.08,
    fontWeight: 850,
    letterSpacing: "-0.035em",
  },

  topStatDetail: {
    margin: 0,
    color: "#ffffff",
    opacity: 0.82,
    fontSize: "14px",
    lineHeight: 1.45,
  },

  whiteText: {
    color: "#ffffff",
  },

  greenText: {
    color: "#ffffff",
  },

  contentGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "minmax(620px, 1.35fr) minmax(390px, 0.9fr)",
    gap: "18px",
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  panel: {
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.80), rgba(5,13,27,0.80))",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "13px",
    padding: "24px",
    boxSizing: "border-box",
    boxShadow: "0 18px 52px rgba(0,0,0,0.20)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
  },

  sectionTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 850,
    letterSpacing: "-0.04em",
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: "#4f9cff",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  },

  accountRows: {
    display: "flex",
    flexDirection: "column",
  },

  accountRow: {
    width: "100%",
    border: "none",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
    background: "transparent",
    color: "#ffffff",
    padding: "22px 0",
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1.45fr) minmax(100px, 0.7fr) minmax(100px, 0.7fr) minmax(120px, 0.8fr) auto 18px",
    alignItems: "center",
    gap: "18px",
    textAlign: "left",
    cursor: "pointer",
  },

  accountIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minWidth: 0,
  },

  firmLogo: {
    width: "58px",
    height: "58px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#000000",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },

  accountName: {
    margin: "0 0 8px",
    color: "#ffffff",
    fontSize: "18px",
    lineHeight: 1.15,
    fontWeight: 850,
    letterSpacing: "-0.035em",
  },

  accountTags: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  accountTag: {
    color: "#ffffff",
    background: "rgba(148,163,184,0.12)",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 600,
  },

  accountMetric: {
    paddingLeft: "18px",
    borderLeft: "1px solid rgba(148,163,184,0.14)",
  },

  metricLabel: {
    display: "block",
    color: "#ffffff",
    opacity: 0.78,
    textTransform: "uppercase",
    fontSize: "11px",
    letterSpacing: "0.04em",
    fontWeight: 800,
    marginBottom: "8px",
  },

  metricValue: {
    display: "block",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 850,
  },

  accountProgressCell: {
    paddingLeft: "18px",
    borderLeft: "1px solid rgba(148,163,184,0.14)",
  },

  progressNumber: {
    display: "block",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 850,
    marginBottom: "7px",
  },

  smallProgressTrack: {
    width: "94px",
    height: "6px",
    background: "rgba(148,163,184,0.18)",
    borderRadius: "999px",
    overflow: "hidden",
  },

  smallProgressFill: {
    height: "100%",
    background: "#2f7cff",
    borderRadius: "999px",
  },

  statusPill: {
    padding: "7px 10px",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  statusHealthy: {
    color: "#86efac",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.20)",
  },

  statusWarning: {
    color: "#facc15",
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.22)",
  },

  statusProgress: {
    color: "#60a5fa",
    background: "rgba(37,99,235,0.12)",
    border: "1px solid rgba(37,99,235,0.22)",
  },

  rowChevron: {
    color: "#ffffff",
    opacity: 0.75,
    fontSize: "26px",
    fontWeight: 300,
  },

  addFirmRow: {
    width: "100%",
    marginTop: "14px",
    border: "1px dashed rgba(148,163,184,0.20)",
    background: "rgba(2,8,19,0.30)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    cursor: "pointer",
  },

  addCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "1px solid rgba(148,163,184,0.20)",
    background: "rgba(15,23,42,0.8)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px",
    flexShrink: 0,
  },

  addFirmTitle: {
    display: "block",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    marginBottom: "4px",
  },

  addFirmText: {
    display: "block",
    color: "#ffffff",
    opacity: 0.78,
    fontSize: "14px",
  },

  quickToolsPanel: {
    paddingBottom: "20px",
  },

  toolGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 0,
    marginTop: "22px",
  },

  toolItem: {
    border: "none",
    borderRight: "1px solid rgba(148,163,184,0.14)",
    background: "transparent",
    color: "#ffffff",
    minHeight: "58px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: 750,
    textAlign: "left",
    cursor: "pointer",
    padding: "0 16px",
  },

  toolIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "9px",
    background: "rgba(148,163,184,0.12)",
    border: "1px solid rgba(148,163,184,0.13)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "20px",
    flexShrink: 0,
  },

  recoveryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "32px",
  },

  selectButton: {
    border: "1px solid rgba(148,163,184,0.17)",
    background: "rgba(2,8,19,0.35)",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  recoveryCard: {
    color: "#ffffff",
  },

  mutedLabel: {
    margin: "0 0 12px",
    color: "#ffffff",
    opacity: 0.8,
    fontSize: "14px",
  },

  recoveryValueRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "14px",
  },

  recoveryValue: {
    color: "#ffffff",
    fontSize: "42px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.06em",
  },

  recoveryPercent: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 800,
  },

  recoveryTrack: {
    width: "100%",
    height: "8px",
    background: "rgba(148,163,184,0.16)",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "22px",
  },

  recoveryFill: {
    width: "57%",
    height: "100%",
    background: "#2f7cff",
    borderRadius: "999px",
  },

  recoveryNote: {
    margin: "0 0 22px",
    color: "#ffffff",
    opacity: 0.82,
    fontSize: "14px",
    lineHeight: 1.55,
  },

  recoveryButton: {
    width: "100%",
    minHeight: "50px",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "linear-gradient(180deg, rgba(30,41,59,0.58), rgba(15,23,42,0.58))",
    color: "#ffffff",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tradeList: {
    display: "flex",
    flexDirection: "column",
    marginTop: "12px",
  },

  tradeRow: {
    width: "100%",
    border: "none",
    borderBottom: "1px solid rgba(148,163,184,0.13)",
    background: "transparent",
    color: "#ffffff",
    minHeight: "46px",
    display: "grid",
    gridTemplateColumns: "28px minmax(90px, 1fr) 46px 74px 80px 16px",
    alignItems: "center",
    gap: "10px",
    padding: "9px 0",
    textAlign: "left",
    cursor: "pointer",
  },

  tradeIcon: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "15px",
  },

  tradeIconGreen: {
    background: "rgba(34,197,94,0.72)",
  },

  tradeIconRed: {
    background: "rgba(239,68,68,0.78)",
  },

  tradeSetup: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
  },

  tradeMarket: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
  },

  tradeResult: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 850,
    textAlign: "right",
  },

  tradeProfit: {
    color: "#86efac",
  },

  tradeLoss: {
    color: "#ff5c5c",
  },

  tradeDate: {
    color: "#ffffff",
    opacity: 0.78,
    fontSize: "14px",
    textAlign: "right",
  },

  tradeChevron: {
    color: "#ffffff",
    opacity: 0.76,
    fontSize: "24px",
    fontWeight: 300,
  },

  goJournalButton: {
    width: "100%",
    minHeight: "50px",
    marginTop: "16px",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "linear-gradient(180deg, rgba(30,41,59,0.58), rgba(15,23,42,0.58))",
    color: "#ffffff",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },

  pageMobile: {
    padding: "22px 16px 100px",
  },

  headerMobile: {
    flexDirection: "column",
    gap: "20px",
  },

  heroTitleMobile: {
    fontSize: "36px",
  },

  headerButtonsMobile: {
    width: "100%",
  },

  statGridMobile: {
    gridTemplateColumns: "1fr",
  },

  contentGridMobile: {
    gridTemplateColumns: "1fr",
  },

  toolGridMobile: {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
};
