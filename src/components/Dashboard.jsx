import React from "react";

function useIsMobileDashboard() {
  const getIsMobile = () =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const [isMobile, setIsMobile] = React.useState(getIsMobile);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

const accounts = [
  {
    name: "Topstep 50K #1",
    firm: "Topstep",
    type: "Funded",
    status: "Healthy",
    balance: 51280,
    startBalance: 50000,
    drawdownLeft: 2280,
    dailyLossLeft: 870,
    needed: 720,
    targetLabel: "to next payout",
    progress: 64,
  },
  {
    name: "Alpha Zero",
    firm: "Alpha Futures",
    type: "Funded",
    status: "Warning",
    balance: 50640,
    startBalance: 50000,
    drawdownLeft: 640,
    dailyLossLeft: 420,
    needed: 360,
    targetLabel: "to payout zone",
    progress: 48,
  },
  {
    name: "Topstep Eval",
    firm: "Topstep",
    type: "Evaluation",
    status: "Recovery",
    balance: 48250,
    startBalance: 50000,
    drawdownLeft: 1250,
    dailyLossLeft: 1000,
    needed: 4750,
    targetLabel: "to pass",
    progress: 28,
  },
];

const recentTrades = [
  { result: "+$350", grade: "A+", side: "Long", market: "NQ", date: "Today" },
  { result: "BE", grade: "A", side: "Short", market: "ES", date: "Yesterday" },
  { result: "+$210", grade: "A", side: "Long", market: "NQ", date: "Jul 5" },
  { result: "-$200", grade: "B", side: "Short", market: "NQ", date: "Jul 3" },
];

const formatMoney = (value) => {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);

  return `${sign}$${abs.toLocaleString()}`;
};

export default function Dashboard({ setActivePage }) {
  const isMobile = useIsMobileDashboard();

  const totalProfit = accounts.reduce(
    (sum, account) => sum + (account.balance - account.startBalance),
    0
  );

  const fundedAccounts = accounts.filter((account) => account.type === "Funded").length;
  const evalAccounts = accounts.filter((account) => account.type === "Evaluation").length;
  const totalDailyLossLeft = accounts.reduce(
    (sum, account) => sum + account.dailyLossLeft,
    0
  );

  return (
    <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
      <div style={styles.backgroundGlow} />

      <header style={{ ...styles.header, ...(isMobile ? styles.headerMobile : {}) }}>
        <div>
          <p style={styles.eyebrow}>PROP TRADER COMMAND CENTER</p>
          <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>
            Good afternoon, Luke
          </h1>
          <p style={styles.subtitle}>
            Track your accounts, drawdown, recovery targets, payouts, and journal from one clean workspace.
          </p>
        </div>

        <div style={{ ...styles.headerActions, ...(isMobile ? styles.headerActionsMobile : {}) }}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => setActivePage("journal")}
          >
            View Journal
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => setActivePage("journal")}
          >
            Log Trade
          </button>
        </div>
      </header>

      <section style={{ ...styles.statusGrid, ...(isMobile ? styles.statusGridMobile : {}) }}>
        <StatusCard
          label="Today's Status"
          value="Safe to Trade"
          detail="No account is past daily risk limits"
          tone="green"
        />

        <StatusCard
          label="Monthly P/L"
          value={formatMoney(totalProfit)}
          detail={`${fundedAccounts} funded • ${evalAccounts} evaluation`}
          tone={totalProfit >= 0 ? "green" : "red"}
        />

        <StatusCard
          label="Daily Loss Left"
          value={`$${totalDailyLossLeft.toLocaleString()}`}
          detail="Across tracked accounts"
          tone="blue"
        />

        <StatusCard
          label="Next News"
          value="NFP Friday"
          detail="High impact event this week"
          tone="neutral"
        />
      </section>

      <main style={{ ...styles.mainGrid, ...(isMobile ? styles.mainGridMobile : {}) }}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelLabel}>ACCOUNTS</p>
              <h2 style={styles.panelTitle}>Account overview</h2>
            </div>

            <div style={styles.panelActions}>
              <button
                type="button"
                style={styles.addFirmButton}
                onClick={() => setActivePage("accounts")}
              >
                + Add Firm
              </button>

              <button
                type="button"
                style={styles.textButton}
                onClick={() => setActivePage("accounts")}
              >
                Manage
              </button>
            </div>
          </div>

          <div style={styles.accountList}>
            {accounts.map((account) => (
              <AccountCard key={account.name} account={account} />
            ))}
          </div>
        </section>

        <aside style={styles.sideStack}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelLabel}>RECOVERY</p>
                <h2 style={styles.panelTitle}>Need to pass</h2>
              </div>
            </div>

            <div style={styles.recoveryBox}>
              <div style={styles.recoveryTop}>
                <div>
                  <p style={styles.mutedSmall}>Topstep Eval</p>
                  <h3 style={styles.bigNumber}>$4,750</h3>
                </div>

                <div style={styles.recoveryBadge}>28%</div>
              </div>

              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: "28%" }} />
              </div>

              <p style={styles.recoveryText}>
                At $200 risk and a 1.5R average win, that is about 16 clean winning trades.
              </p>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelLabel}>RECENT TRADES</p>
                <h2 style={styles.panelTitle}>Last journal entries</h2>
              </div>

              <button
                type="button"
                style={styles.textButton}
                onClick={() => setActivePage("journal")}
              >
                Open
              </button>
            </div>

            <div style={styles.tradeList}>
              {recentTrades.map((trade, index) => (
                <div key={index} style={styles.tradeRow}>
                  <div>
                    <div style={styles.tradeMeta}>
                      {trade.grade} • {trade.side} • {trade.market}
                    </div>
                    <div style={styles.tradeDate}>{trade.date}</div>
                  </div>

                  <div
                    style={{
                      ...styles.tradeResult,
                      color:
                        trade.result.includes("+")
                          ? "#86efac"
                          : trade.result.includes("-")
                          ? "#fca5a5"
                          : "#e5e7eb",
                    }}
                  >
                    {trade.result}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelLabel}>QUICK TOOLS</p>
                <h2 style={styles.panelTitle}>Trading tools</h2>
              </div>
            </div>

            <div style={styles.toolGrid}>
              <ToolButton label="Risk Calculator" onClick={() => setActivePage("tools")} />
              <ToolButton label="Payout Tracker" onClick={() => setActivePage("payouts")} />
              <ToolButton label="Evaluation Progress" onClick={() => setActivePage("evaluations")} />
              <ToolButton label="Analytics" onClick={() => setActivePage("analytics")} />
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function StatusCard({ label, value, detail, tone }) {
  const toneStyle =
    tone === "green"
      ? styles.toneGreen
      : tone === "red"
      ? styles.toneRed
      : tone === "blue"
      ? styles.toneBlue
      : styles.toneNeutral;

  return (
    <div style={styles.statusCard}>
      <p style={styles.statusLabel}>{label}</p>
      <div style={styles.statusValueRow}>
        <span style={{ ...styles.statusDot, ...toneStyle }} />
        <h3 style={styles.statusValue}>{value}</h3>
      </div>
      <p style={styles.statusDetail}>{detail}</p>
    </div>
  );
}

function AccountCard({ account }) {
  const statusStyle =
    account.status === "Healthy"
      ? styles.statusHealthy
      : account.status === "Warning"
      ? styles.statusWarning
      : styles.statusRecovery;

  return (
    <div style={styles.accountCard}>
      <div style={styles.accountTop}>
        <div>
          <h3 style={styles.accountName}>{account.name}</h3>
          <p style={styles.accountMeta}>
            {account.firm} • {account.type}
          </p>
        </div>

        <span style={{ ...styles.accountStatus, ...statusStyle }}>
          {account.status}
        </span>
      </div>

      <div style={styles.accountStats}>
        <MiniStat label="Balance" value={`$${account.balance.toLocaleString()}`} />
        <MiniStat label="Drawdown Left" value={`$${account.drawdownLeft.toLocaleString()}`} />
        <MiniStat label="Daily Left" value={`$${account.dailyLossLeft.toLocaleString()}`} />
        <MiniStat label="Needed" value={`$${account.needed.toLocaleString()}`} />
      </div>

      <div>
        <div style={styles.accountProgressHeader}>
          <span>{account.targetLabel}</span>
          <span>{account.progress}%</span>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${account.progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={styles.miniStat}>
      <span style={styles.miniLabel}>{label}</span>
      <span style={styles.miniValue}>{value}</span>
    </div>
  );
}

function ToolButton({ label, onClick }) {
  return (
    <button type="button" style={styles.toolButton} onClick={onClick}>
      {label}
    </button>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    background: "#060914",
    color: "#f8fafc",
    padding: "34px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  backgroundGlow: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 20% 0%, rgba(59,130,246,0.18), transparent 34%), radial-gradient(circle at 85% 10%, rgba(14,165,233,0.10), transparent 28%)",
  },

  header: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "28px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 10px",
    fontSize: "12px",
    letterSpacing: "0.14em",
    color: "#93c5fd",
    fontWeight: 700,
  },

  title: {
    margin: "0 0 12px",
    fontSize: "42px",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    fontWeight: 750,
  },

  subtitle: {
    margin: 0,
    maxWidth: "720px",
    color: "rgba(226,232,240,0.72)",
    fontSize: "15px",
    lineHeight: 1.65,
  },

  headerActions: {
    display: "flex",
    gap: "12px",
    flexShrink: 0,
  },

  primaryButton: {
    border: "none",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "13px 18px",
    fontSize: "14px",
    fontWeight: 750,
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: "14px",
    background: "rgba(15,23,42,0.62)",
    color: "#f8fafc",
    padding: "13px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  statusGrid: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  statusCard: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 18px 55px rgba(0,0,0,0.22)",
  },

  statusLabel: {
    margin: "0 0 12px",
    color: "rgba(203,213,225,0.68)",
    fontSize: "13px",
    fontWeight: 650,
  },

  statusValueRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "999px",
    display: "inline-block",
  },

  toneGreen: {
    background: "#22c55e",
    boxShadow: "0 0 18px rgba(34,197,94,0.6)",
  },

  toneRed: {
    background: "#ef4444",
    boxShadow: "0 0 18px rgba(239,68,68,0.45)",
  },

  toneBlue: {
    background: "#60a5fa",
    boxShadow: "0 0 18px rgba(96,165,250,0.45)",
  },

  toneNeutral: {
    background: "#94a3b8",
  },

  statusValue: {
    margin: 0,
    fontSize: "22px",
    letterSpacing: "-0.03em",
  },

  statusDetail: {
    margin: 0,
    color: "rgba(203,213,225,0.62)",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  mainGrid: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.55fr) minmax(360px, 0.9fr)",
    gap: "18px",
  },

  panel: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 18px 55px rgba(0,0,0,0.22)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },

  panelActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },

  addFirmButton: {
    border: "1px solid rgba(96,165,250,0.28)",
    background: "rgba(37,99,235,0.12)",
    color: "#bfdbfe",
    borderRadius: "12px",
    padding: "9px 12px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },

  panelLabel: {
    margin: "0 0 8px",
    color: "rgba(147,197,253,0.9)",
    fontSize: "12px",
    letterSpacing: "0.14em",
    fontWeight: 800,
  },

  panelTitle: {
    margin: 0,
    fontSize: "22px",
    letterSpacing: "-0.035em",
  },

  textButton: {
    border: "none",
    background: "transparent",
    color: "#93c5fd",
    fontSize: "14px",
    fontWeight: 750,
    cursor: "pointer",
    padding: "4px 0",
  },

  accountList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  accountCard: {
    background: "rgba(2,6,23,0.42)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "20px",
    padding: "18px",
  },

  accountTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },

  accountName: {
    margin: "0 0 6px",
    fontSize: "18px",
    letterSpacing: "-0.025em",
  },

  accountMeta: {
    margin: 0,
    color: "rgba(203,213,225,0.58)",
    fontSize: "13px",
  },

  accountStatus: {
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  statusHealthy: {
    background: "rgba(34,197,94,0.12)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.22)",
  },

  statusWarning: {
    background: "rgba(245,158,11,0.12)",
    color: "#fcd34d",
    border: "1px solid rgba(245,158,11,0.24)",
  },

  statusRecovery: {
    background: "rgba(96,165,250,0.12)",
    color: "#bfdbfe",
    border: "1px solid rgba(96,165,250,0.22)",
  },

  accountStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },

  miniStat: {
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: "14px",
    padding: "12px",
  },

  miniLabel: {
    display: "block",
    color: "rgba(203,213,225,0.56)",
    fontSize: "12px",
    marginBottom: "6px",
  },

  miniValue: {
    display: "block",
    fontSize: "14px",
    fontWeight: 800,
    color: "#f8fafc",
  },

  accountProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "rgba(203,213,225,0.66)",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
  },

  progressTrack: {
    height: "8px",
    background: "rgba(148,163,184,0.13)",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #2563eb, #60a5fa)",
  },

  sideStack: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  recoveryBox: {
    background: "rgba(2,6,23,0.42)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "20px",
    padding: "18px",
  },

  recoveryTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },

  mutedSmall: {
    margin: "0 0 6px",
    color: "rgba(203,213,225,0.58)",
    fontSize: "13px",
  },

  bigNumber: {
    margin: 0,
    fontSize: "34px",
    letterSpacing: "-0.05em",
  },

  recoveryBadge: {
    borderRadius: "999px",
    padding: "8px 11px",
    background: "rgba(96,165,250,0.12)",
    border: "1px solid rgba(96,165,250,0.22)",
    color: "#bfdbfe",
    fontSize: "13px",
    fontWeight: 800,
  },

  recoveryText: {
    margin: "14px 0 0",
    color: "rgba(203,213,225,0.68)",
    fontSize: "14px",
    lineHeight: 1.55,
  },

  tradeList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  tradeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    background: "rgba(2,6,23,0.42)",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: "16px",
    padding: "13px 14px",
  },

  tradeMeta: {
    color: "#f8fafc",
    fontSize: "14px",
    fontWeight: 750,
    marginBottom: "4px",
  },

  tradeDate: {
    color: "rgba(203,213,225,0.52)",
    fontSize: "12px",
  },

  tradeResult: {
    fontWeight: 850,
    fontSize: "15px",
    whiteSpace: "nowrap",
  },

  toolGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  toolButton: {
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(2,6,23,0.42)",
    color: "#f8fafc",
    borderRadius: "15px",
    padding: "14px 12px",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
    textAlign: "left",
  },

  pageMobile: {
    padding: "22px 16px 110px",
    overflowX: "hidden",
  },

  headerMobile: {
    flexDirection: "column",
    gap: "18px",
  },

  titleMobile: {
    fontSize: "34px",
  },

  headerActionsMobile: {
    width: "100%",
  },

  statusGridMobile: {
    gridTemplateColumns: "1fr",
  },

  mainGridMobile: {
    gridTemplateColumns: "1fr",
  },
};
