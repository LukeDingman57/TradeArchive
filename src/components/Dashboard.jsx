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

const getFirmLogo = (firmName) => {
  const firm = String(firmName || "Firm").trim();

  if (!firm) return "FIRM";

  if (firm.toLowerCase().includes("alpha")) return "ALPHA";
  if (firm.toLowerCase().includes("topstep")) return "TOP";
  if (firm.toLowerCase().includes("apex")) return "APEX";

  return firm
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
};

const createAccount = ({
  firm = "Topstep",
  name = "",
  type = "Funded",
  startingBalance = 50000,
  currentBalance = 50000,
  targetAmount = 0,
}) => {
  const balance = Number(currentBalance || startingBalance || 0);
  const target = Number(targetAmount || 0);

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name || `${firm} Account`,
    firm,
    type,
    logo: getFirmLogo(firm),
    status: "Not Started",
    balance,
    targetLabel: type === "Evaluation" ? "To Pass" : "To Payout",
    targetAmount: target,
    progress: 0,
  };
};

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
  const [activeModal, setActiveModal] = React.useState(null);
  const [accounts, setAccounts] = React.useState([]);

  const addAccount = (accountData) => {
    setAccounts((currentAccounts) => [...currentAccounts, createAccount(accountData)]);
    setActiveModal(null);
  };

  const deleteAccount = (accountId) => {
    setAccounts((currentAccounts) =>
      currentAccounts.filter((account) => account.id !== accountId)
    );
  };

  const openAddFirm = () => setActiveModal("addFirm");
  const openAccountsManager = () => setActiveModal("accountsManager");
  const openRecoveryCalculator = () => setActiveModal("recoveryCalculator");
  const closeModal = () => setActiveModal(null);

  const goToPage = (page) => {
    if (typeof setActivePage === "function") {
      setActivePage(page);
    }
  };

  const fundedCount = accounts.filter((account) => account.type === "Funded").length;
  const evalCount = accounts.filter((account) => account.type === "Evaluation").length;
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const totalNeeded = accounts.reduce((sum, account) => sum + Number(account.targetAmount || 0), 0);

  return (
    <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
      <div style={styles.pageGlow} />

      <div style={styles.inner}>
        <header style={{ ...styles.header, ...(isMobile ? styles.headerMobile : {}) }}>
          <div>
            <p style={styles.eyebrow}>PROP TRADER COMMAND CENTER</p>
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
              View Journal
            </button>

            <button
              type="button"
              style={styles.blueButton}
              onClick={() => goToPage("journal")}
            >
              + Log Trade
            </button>
          </div>
        </header>

        <section style={{ ...styles.statGrid, ...(isMobile ? styles.statGridMobile : {}) }}>
          <TopStat
            icon="✓"
            iconStyle={styles.greenOrb}
            label="Today's Status"
            value="Safe to Trade"
            detail="No account is past daily risk limits"
          />

          <TopStat
            icon="↗"
            iconStyle={styles.blueOrb}
            label="Monthly P/L"
            value={accounts.length ? money(totalBalance) : "$0"}
            detail={`${fundedCount} funded • ${evalCount} evaluation`}
          />

          <TopStat
            icon="$"
            iconStyle={styles.goldOrb}
            label="Total Needed"
            value={accounts.length ? money(totalNeeded) : "$0"}
            detail="Pass and payout targets"
          />

          <TopStat
            icon="□"
            iconStyle={styles.blueOrb}
            label="Next News"
            value="NFP Friday"
            detail="High impact event"
          />
        </section>

        <main style={{ ...styles.contentGrid, ...(isMobile ? styles.contentGridMobile : {}) }}>
          <section style={styles.leftColumn}>
            <Panel>
              <PanelHeader
                title="My Accounts"
                actionLabel="Manage →"
                onAction={openAccountsManager}
              />

              {accounts.length === 0 ? (
                <EmptyAccounts onAddFirm={openAddFirm} />
              ) : (
                <div style={styles.accountRows}>
                  {accounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onClick={openAccountsManager}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                style={styles.addFirmRow}
                onClick={openAddFirm}
              >
                <span style={styles.addCircle}>+</span>
                <span>
                  <span style={styles.addFirmTitle}>Add Firm</span>
                  <span style={styles.addFirmText}>Track a new funded or evaluation account</span>
                </span>
              </button>
            </Panel>

            <Panel style={styles.quickToolsPanel}>
              <h2 style={styles.sectionTitle}>Quick Tools</h2>

              <div style={{ ...styles.toolGrid, ...(isMobile ? styles.toolGridMobile : {}) }}>
                {tools.map((tool, index) => (
                  <button
                    key={tool.label}
                    type="button"
                    style={{
                      ...styles.toolItem,
                      ...(index === tools.length - 1 ? styles.toolItemLast : {}),
                    }}
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
                  <div style={styles.recoveryValue}>{accounts.length ? money(totalNeeded) : "$0"}</div>
                  <div style={styles.recoveryPercent}>{accounts.length ? "Open" : "Empty"}</div>
                </div>

                <div style={styles.recoveryTrack}>
                  <div style={styles.recoveryFill} />
                </div>

                <p style={styles.recoveryNote}>
                  Add your prop firm accounts and this will show what you need to pass or reach payout.
                </p>

                <button
                  type="button"
                  style={styles.recoveryButton}
                  onClick={openRecoveryCalculator}
                >
                  Open Recovery Calculator
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
                Go to Journal
              </button>
            </Panel>
          </aside>
        </main>
      </div>

      {activeModal === "addFirm" && (
        <Modal title="Add Firm" onClose={closeModal}>
          <AddFirmForm onClose={closeModal} onSave={addAccount} />
        </Modal>
      )}

      {activeModal === "accountsManager" && (
        <Modal title="Manage Accounts" onClose={closeModal}>
          <AccountsManager accounts={accounts} onAddFirm={openAddFirm} onDeleteAccount={deleteAccount} />
        </Modal>
      )}

      {activeModal === "recoveryCalculator" && (
        <Modal title="Recovery Calculator" onClose={closeModal}>
          <RecoveryCalculator />
        </Modal>
      )}
    </div>
  );
}



function EmptyAccounts({ onAddFirm }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>＋</div>
      <h3 style={styles.emptyTitle}>No firms added yet</h3>
      <p style={styles.emptyText}>
        Add your Topstep, Alpha, Apex, or other prop firm accounts. Your journal entries will eventually update these accounts automatically.
      </p>
      <button type="button" style={styles.emptyButton} onClick={onAddFirm}>
        Add Your First Firm
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{title}</h2>
          <button type="button" style={styles.modalCloseButton} onClick={onClose}>
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function AddFirmForm({ onClose, onSave }) {
  const [firm, setFirm] = React.useState("Topstep");
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("Funded");
  const [startingBalance, setStartingBalance] = React.useState("50000");
  const [currentBalance, setCurrentBalance] = React.useState("50000");
  const [targetAmount, setTargetAmount] = React.useState("");

  const handleSave = () => {
    onSave({
      firm,
      name,
      type,
      startingBalance,
      currentBalance,
      targetAmount,
    });
  };

  return (
    <div style={styles.formGrid}>
      <label style={styles.formLabel}>
        Prop Firm
        <select
          style={styles.formInput}
          value={firm}
          onChange={(event) => setFirm(event.target.value)}
        >
          <option>Topstep</option>
          <option>Alpha Futures</option>
          <option>Apex</option>
          <option>MyFundedFutures</option>
          <option>Other</option>
        </select>
      </label>

      <label style={styles.formLabel}>
        Account Name
        <input
          style={styles.formInput}
          placeholder="Topstep 50K #1"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label style={styles.formLabel}>
        Account Type
        <select
          style={styles.formInput}
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option>Funded</option>
          <option>Evaluation</option>
        </select>
      </label>

      <label style={styles.formLabel}>
        Starting Balance
        <input
          style={styles.formInput}
          placeholder="50000"
          type="number"
          value={startingBalance}
          onChange={(event) => setStartingBalance(event.target.value)}
        />
      </label>

      <label style={styles.formLabel}>
        Current Balance
        <input
          style={styles.formInput}
          placeholder="50000"
          type="number"
          value={currentBalance}
          onChange={(event) => setCurrentBalance(event.target.value)}
        />
      </label>

      <label style={styles.formLabel}>
        Needed to Pass / Payout
        <input
          style={styles.formInput}
          placeholder="3000"
          type="number"
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
        />
      </label>

      <div style={styles.modalActions}>
        <button type="button" style={styles.modalSecondaryButton} onClick={onClose}>
          Cancel
        </button>
        <button type="button" style={styles.modalPrimaryButton} onClick={handleSave}>
          Save Firm
        </button>
      </div>

      <p style={styles.modalHelpText}>
        This saves in the dashboard UI for now. Next step is connecting it to Supabase so each user's firms persist after refresh.
      </p>
    </div>
  );
}

function AccountsManager({ accounts, onAddFirm, onDeleteAccount }) {
  return (
    <div>
      {accounts.length === 0 ? (
        <EmptyAccounts onAddFirm={onAddFirm} />
      ) : (
        <div style={styles.managerList}>
          {accounts.map((account) => (
            <div key={account.id} style={styles.managerRow}>
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

              <div style={styles.managerRight}>
                <span style={styles.managerBalance}>{money(account.balance)}</span>
                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={() => onDeleteAccount(account.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" style={styles.modalPrimaryButtonFull} onClick={onAddFirm}>
        + Add New Firm
      </button>
    </div>
  );
}

function RecoveryCalculator() {
  const [currentBalance, setCurrentBalance] = React.useState(47550);
  const [targetBalance, setTargetBalance] = React.useState(50000);
  const [risk, setRisk] = React.useState(200);
  const [averageR, setAverageR] = React.useState(1.5);

  const needed = Math.max(0, Number(targetBalance || 0) - Number(currentBalance || 0));
  const avgWin = Math.max(1, Number(risk || 0) * Number(averageR || 0));
  const winsNeeded = Math.ceil(needed / avgWin);

  return (
    <div>
      <div style={styles.formGrid}>
        <label style={styles.formLabel}>
          Current Balance
          <input
            style={styles.formInput}
            type="number"
            value={currentBalance}
            onChange={(event) => setCurrentBalance(event.target.value)}
          />
        </label>

        <label style={styles.formLabel}>
          Target Balance
          <input
            style={styles.formInput}
            type="number"
            value={targetBalance}
            onChange={(event) => setTargetBalance(event.target.value)}
          />
        </label>

        <label style={styles.formLabel}>
          Risk Per Trade
          <input
            style={styles.formInput}
            type="number"
            value={risk}
            onChange={(event) => setRisk(event.target.value)}
          />
        </label>

        <label style={styles.formLabel}>
          Average R Winner
          <input
            style={styles.formInput}
            type="number"
            step="0.1"
            value={averageR}
            onChange={(event) => setAverageR(event.target.value)}
          />
        </label>
      </div>

      <div style={styles.calculatorResult}>
        <span style={styles.metricLabel}>You need</span>
        <strong style={styles.calculatorNumber}>{money(needed)}</strong>
        <p style={styles.recoveryNote}>
          At {money(risk)} risk and {averageR}R average, that is about {winsNeeded} clean winning trades.
        </p>
      </div>
    </div>
  );
}


function TopStat({ icon, iconStyle, label, value, detail }) {
  return (
    <article style={styles.topStat}>
      <div style={{ ...styles.topStatIcon, ...iconStyle }}>{icon}</div>

      <div>
        <p style={styles.topStatLabel}>{label}</p>
        <h3 style={styles.topStatValue}>{value}</h3>
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
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 30% 0%, rgba(37,99,235,0.14), transparent 28%), radial-gradient(circle at 95% 8%, rgba(14,165,233,0.08), transparent 24%), #020813",
    color: "#ffffff",
    padding: "38px 34px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  pageGlow: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.022), transparent 28%, rgba(37,99,235,0.035))",
  },

  inner: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "1460px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 10px",
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.16em",
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
    minHeight: "50px",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,8,19,0.30)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "0 22px",
    fontSize: "15px",
    fontWeight: 750,
    cursor: "pointer",
  },

  blueButton: {
    minHeight: "50px",
    border: "none",
    background: "linear-gradient(180deg, #3483ff, #0f63e8)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "0 24px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 18px 36px rgba(37,99,235,0.22)",
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  topStat: {
    minHeight: "138px",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.70), rgba(5,13,27,0.76))",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: "16px",
    padding: "22px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 18px 52px rgba(0,0,0,0.18)",
  },

  topStatIcon: {
    width: "68px",
    height: "68px",
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
    background:
      "radial-gradient(circle at 35% 25%, rgba(34,197,94,0.80), rgba(22,101,52,0.58))",
  },

  blueOrb: {
    background:
      "radial-gradient(circle at 35% 25%, rgba(59,130,246,0.76), rgba(29,78,216,0.48))",
  },

  goldOrb: {
    background:
      "radial-gradient(circle at 35% 25%, rgba(245,158,11,0.82), rgba(146,64,14,0.50))",
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
    color: "#ffffff",
    fontSize: "25px",
    lineHeight: 1.08,
    fontWeight: 850,
    letterSpacing: "-0.035em",
  },

  topStatDetail: {
    margin: 0,
    color: "#ffffff",
    opacity: 0.78,
    fontSize: "14px",
    lineHeight: 1.45,
  },

  contentGrid: {
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
      "linear-gradient(180deg, rgba(15,23,42,0.73), rgba(5,13,27,0.78))",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: "16px",
    padding: "24px",
    boxSizing: "border-box",
    boxShadow: "0 18px 52px rgba(0,0,0,0.18)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(148,163,184,0.13)",
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
    borderBottom: "1px solid rgba(148,163,184,0.13)",
    background: "transparent",
    color: "#ffffff",
    padding: "22px 0",
    display: "grid",
    gridTemplateColumns:
      "minmax(215px, 1.45fr) minmax(100px, 0.7fr) minmax(100px, 0.7fr) minmax(120px, 0.8fr) auto 18px",
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
    fontWeight: 650,
  },

  accountMetric: {
    paddingLeft: "18px",
    borderLeft: "1px solid rgba(148,163,184,0.13)",
  },

  metricLabel: {
    display: "block",
    color: "#ffffff",
    opacity: 0.72,
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
    borderLeft: "1px solid rgba(148,163,184,0.13)",
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
    opacity: 0.7,
    fontSize: "26px",
    fontWeight: 300,
  },

  addFirmRow: {
    width: "100%",
    marginTop: "14px",
    border: "1px dashed rgba(148,163,184,0.20)",
    background: "rgba(2,8,19,0.30)",
    color: "#ffffff",
    borderRadius: "12px",
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
    opacity: 0.76,
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
    borderRight: "1px solid rgba(148,163,184,0.13)",
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

  toolItemLast: {
    borderRight: "none",
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

  mutedLabel: {
    margin: "0 0 12px",
    color: "#ffffff",
    opacity: 0.78,
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
    opacity: 0.8,
    fontSize: "14px",
    lineHeight: 1.55,
  },

  recoveryButton: {
    width: "100%",
    minHeight: "50px",
    border: "1px solid rgba(148,163,184,0.14)",
    background:
      "linear-gradient(180deg, rgba(30,41,59,0.56), rgba(15,23,42,0.56))",
    color: "#ffffff",
    borderRadius: "9px",
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
    opacity: 0.76,
    fontSize: "14px",
    textAlign: "right",
  },

  tradeChevron: {
    color: "#ffffff",
    opacity: 0.72,
    fontSize: "24px",
    fontWeight: 300,
  },

  goJournalButton: {
    width: "100%",
    minHeight: "50px",
    marginTop: "16px",
    border: "1px solid rgba(148,163,184,0.14)",
    background:
      "linear-gradient(180deg, rgba(30,41,59,0.56), rgba(15,23,42,0.56))",
    color: "#ffffff",
    borderRadius: "9px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },



  emptyState: {
    border: "1px dashed rgba(148,163,184,0.22)",
    background: "rgba(2,8,19,0.30)",
    borderRadius: "14px",
    padding: "34px 22px",
    marginTop: "18px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    margin: "0 auto 14px",
    background: "rgba(37,99,235,0.14)",
    border: "1px solid rgba(96,165,250,0.24)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: 800,
  },

  emptyTitle: {
    margin: "0 0 8px",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 850,
    letterSpacing: "-0.035em",
  },

  emptyText: {
    maxWidth: "520px",
    margin: "0 auto 18px",
    color: "#ffffff",
    opacity: 0.74,
    fontSize: "14px",
    lineHeight: 1.55,
  },

  emptyButton: {
    border: "none",
    background: "linear-gradient(180deg, #3483ff, #0f63e8)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },


  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(2,8,19,0.72)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  modalCard: {
    width: "100%",
    maxWidth: "620px",
    maxHeight: "90vh",
    overflowY: "auto",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(5,13,27,0.98))",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 28px 80px rgba(0,0,0,0.45)",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "22px",
  },

  modalTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 850,
    letterSpacing: "-0.04em",
  },

  modalCloseButton: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,8,19,0.45)",
    color: "#ffffff",
    fontSize: "24px",
    lineHeight: 1,
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  formLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
  },

  formInput: {
    width: "100%",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,8,19,0.55)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "13px 12px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },

  modalActions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px",
  },

  modalPrimaryButton: {
    border: "none",
    background: "linear-gradient(180deg, #3483ff, #0f63e8)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },

  modalSecondaryButton: {
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,8,19,0.45)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  modalPrimaryButtonFull: {
    width: "100%",
    marginTop: "16px",
    border: "none",
    background: "linear-gradient(180deg, #3483ff, #0f63e8)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "14px 18px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },

  modalHelpText: {
    gridColumn: "1 / -1",
    margin: "0",
    color: "#ffffff",
    opacity: 0.68,
    fontSize: "13px",
    lineHeight: 1.5,
  },

  managerList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  managerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(2,8,19,0.35)",
    borderRadius: "14px",
    padding: "14px",
  },

  managerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },

  managerBalance: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  deleteButton: {
    border: "1px solid rgba(248,113,113,0.22)",
    background: "rgba(127,29,29,0.16)",
    color: "#fecaca",
    borderRadius: "9px",
    padding: "9px 11px",
    fontSize: "13px",
    fontWeight: 850,
    cursor: "pointer",
  },

  calculatorResult: {
    marginTop: "18px",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(2,8,19,0.35)",
    borderRadius: "14px",
    padding: "18px",
  },

  calculatorNumber: {
    display: "block",
    color: "#ffffff",
    fontSize: "38px",
    fontWeight: 900,
    letterSpacing: "-0.06em",
    marginTop: "8px",
  },


  pageMobile: {
    padding: "24px 16px 100px",
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
