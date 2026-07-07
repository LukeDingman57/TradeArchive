import React from "react";

const STORAGE_KEY = "tradearchive_dashboard_accounts";
const SELECTED_RECOVERY_KEY = "tradearchive_selected_recovery_account";

const FIRM_OPTIONS = [
  "Topstep",
  "Alpha Futures",
  "Apex",
  "MyFundedFutures",
  "Tradeify",
  "Take Profit Trader",
  "Other",
];

function getFirmLogo(firmName) {
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
}

function money(value) {
  const number = Number(value || 0);
  const sign = number < 0 ? "-" : "";

  return `${sign}$${Math.abs(number).toLocaleString()}`;
}

function loadStoredAccounts() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load accounts", error);
    return [];
  }
}

function saveStoredAccounts(accounts) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function createAccount(form) {
  const startingBalance = Number(form.startingBalance || 0);
  const currentBalance = Number(form.currentBalance || startingBalance || 0);
  const targetAmount = Number(form.targetAmount || 0);
  const dailyLossLimit = Number(form.dailyLossLimit || 0);
  const maxDrawdown = Number(form.maxDrawdown || 0);
  const profit = currentBalance - startingBalance;
  const progress =
    targetAmount > 0 ? Math.max(0, Math.min(100, (profit / targetAmount) * 100)) : 0;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    firm: form.firm,
    logo: getFirmLogo(form.firm),
    name: form.name || `${form.firm} Account`,
    type: form.type,
    status: form.status,
    startingBalance,
    balance: currentBalance,
    targetAmount,
    dailyLossLimit,
    maxDrawdown,
    payoutRule: form.payoutRule || "",
    notes: form.notes || "",
    targetLabel: form.type === "Evaluation" ? "To Pass" : "To Payout",
    progress: Math.round(progress),
    createdAt: new Date().toISOString(),
  };
}

const emptyForm = {
  firm: "Topstep",
  name: "",
  type: "Evaluation",
  status: "Active",
  startingBalance: "50000",
  currentBalance: "50000",
  targetAmount: "3000",
  dailyLossLimit: "1000",
  maxDrawdown: "2000",
  payoutRule: "",
  notes: "",
};

export default function Accounts({ setActivePage }) {
  const [accounts, setAccounts] = React.useState(loadStoredAccounts);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);

  React.useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  const fundedCount = accounts.filter((account) => account.type === "Funded").length;
  const evalCount = accounts.filter((account) => account.type === "Evaluation").length;
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const totalGoal = accounts.reduce((sum, account) => sum + Number(account.targetAmount || 0), 0);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    if (editingId) {
      setAccounts((current) =>
        current.map((account) => {
          if (account.id !== editingId) return account;

          return {
            ...createAccount(form),
            id: editingId,
            createdAt: account.createdAt,
            logo: getFirmLogo(form.firm),
          };
        })
      );
    } else {
      setAccounts((current) => [...current, createAccount(form)]);
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setForm({
      firm: account.firm || "Topstep",
      name: account.name || "",
      type: account.type || "Evaluation",
      status: account.status || "Active",
      startingBalance: String(account.startingBalance || ""),
      currentBalance: String(account.balance || ""),
      targetAmount: String(account.targetAmount || ""),
      dailyLossLimit: String(account.dailyLossLimit || ""),
      maxDrawdown: String(account.maxDrawdown || ""),
      payoutRule: account.payoutRule || "",
      notes: account.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = (accountId) => {
    setAccounts((current) => current.filter((account) => account.id !== accountId));

    if (typeof window !== "undefined") {
      const selected = window.localStorage.getItem(SELECTED_RECOVERY_KEY);
      if (selected === accountId) {
        window.localStorage.removeItem(SELECTED_RECOVERY_KEY);
      }
    }
  };

  const goDashboard = () => {
    if (typeof setActivePage === "function") {
      setActivePage("dashboard");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow} />

      <div style={styles.inner}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ACCOUNT MANAGER</p>
            <h1 style={styles.title}>Prop firm accounts</h1>
            <p style={styles.subtitle}>
              Add your evaluations and funded accounts here. The dashboard uses this data for recovery, payout, and account progress.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button type="button" style={styles.secondaryButton} onClick={goDashboard}>
              Back to Dashboard
            </button>
            <button type="button" style={styles.primaryButton} onClick={openNewForm}>
              + Add Firm
            </button>
          </div>
        </header>

        <section style={styles.summaryGrid}>
          <SummaryCard label="Total Accounts" value={accounts.length} detail={`${fundedCount} funded • ${evalCount} evaluation`} />
          <SummaryCard label="Total Balance" value={money(totalBalance)} detail="Across tracked accounts" />
          <SummaryCard label="Remaining Goal" value={money(totalGoal)} detail="Pass and payout targets" />
          <SummaryCard label="Data Source" value="Manual" detail="Journal sync comes next" />
        </section>

        {showForm && (
          <section style={styles.formPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>
                {editingId ? "Edit Account" : "Add New Firm"}
              </h2>
              <button
                type="button"
                style={styles.linkButton}
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Close
              </button>
            </div>

            <div style={styles.formGrid}>
              <Field label="Prop Firm">
                <select
                  style={styles.input}
                  value={form.firm}
                  onChange={(event) => updateForm("firm", event.target.value)}
                >
                  {FIRM_OPTIONS.map((firm) => (
                    <option key={firm}>{firm}</option>
                  ))}
                </select>
              </Field>

              <Field label="Account Name">
                <input
                  style={styles.input}
                  value={form.name}
                  placeholder="Topstep 50K #1"
                  onChange={(event) => updateForm("name", event.target.value)}
                />
              </Field>

              <Field label="Account Type">
                <select
                  style={styles.input}
                  value={form.type}
                  onChange={(event) => updateForm("type", event.target.value)}
                >
                  <option>Evaluation</option>
                  <option>Funded</option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  style={styles.input}
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                >
                  <option>Active</option>
                  <option>Passed</option>
                  <option>Funded</option>
                  <option>Paused</option>
                  <option>Blown</option>
                </select>
              </Field>

              <Field label="Starting Balance">
                <input
                  style={styles.input}
                  type="number"
                  value={form.startingBalance}
                  onChange={(event) => updateForm("startingBalance", event.target.value)}
                />
              </Field>

              <Field label="Current Balance">
                <input
                  style={styles.input}
                  type="number"
                  value={form.currentBalance}
                  onChange={(event) => updateForm("currentBalance", event.target.value)}
                />
              </Field>

              <Field label="Needed to Pass / Payout">
                <input
                  style={styles.input}
                  type="number"
                  value={form.targetAmount}
                  onChange={(event) => updateForm("targetAmount", event.target.value)}
                />
              </Field>

              <Field label="Daily Loss Limit">
                <input
                  style={styles.input}
                  type="number"
                  value={form.dailyLossLimit}
                  onChange={(event) => updateForm("dailyLossLimit", event.target.value)}
                />
              </Field>

              <Field label="Max Drawdown">
                <input
                  style={styles.input}
                  type="number"
                  value={form.maxDrawdown}
                  onChange={(event) => updateForm("maxDrawdown", event.target.value)}
                />
              </Field>

              <Field label="Payout Rule">
                <input
                  style={styles.input}
                  value={form.payoutRule}
                  placeholder="Example: 5 winning days over $200"
                  onChange={(event) => updateForm("payoutRule", event.target.value)}
                />
              </Field>

              <label style={{ ...styles.field, ...styles.fullWidth }}>
                Notes
                <textarea
                  style={{ ...styles.input, ...styles.textarea }}
                  value={form.notes}
                  placeholder="Anything important about this firm or account..."
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </label>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </button>

              <button type="button" style={styles.primaryButton} onClick={handleSave}>
                {editingId ? "Save Changes" : "Save Firm"}
              </button>
            </div>
          </section>
        )}

        <section style={styles.accountsPanel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.sectionTitle}>Your Accounts</h2>
            <button type="button" style={styles.linkButton} onClick={openNewForm}>
              + Add Another
            </button>
          </div>

          {accounts.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>+</div>
              <h3 style={styles.emptyTitle}>No firms added yet</h3>
              <p style={styles.emptyText}>
                Start by adding one evaluation or funded account. After that, your dashboard will show recovery progress and remaining goals.
              </p>
              <button type="button" style={styles.primaryButton} onClick={openNewForm}>
                Add Your First Firm
              </button>
            </div>
          ) : (
            <div style={styles.accountList}>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => handleEdit(account)}
                  onDelete={() => handleDelete(account.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail }) {
  return (
    <article style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <h3 style={styles.summaryValue}>{value}</h3>
      <p style={styles.summaryDetail}>{detail}</p>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      {label}
      {children}
    </label>
  );
}

function AccountCard({ account, onEdit, onDelete }) {
  const progress = Number(account.progress || 0);

  return (
    <article style={styles.accountCard}>
      <div style={styles.accountMain}>
        <div style={styles.firmLogo}>{account.logo}</div>

        <div>
          <h3 style={styles.accountName}>{account.name}</h3>
          <div style={styles.accountTags}>
            <span style={styles.accountTag}>{account.firm}</span>
            <span style={styles.accountTag}>{account.type}</span>
            <span style={styles.accountTag}>{account.status}</span>
          </div>
        </div>
      </div>

      <div style={styles.accountMetrics}>
        <Metric label="Balance" value={money(account.balance)} />
        <Metric label={account.targetLabel || "Target"} value={money(account.targetAmount)} />
        <Metric label="Daily Limit" value={money(account.dailyLossLimit)} />
        <Metric label="Max Drawdown" value={money(account.maxDrawdown)} />
      </div>

      <div style={styles.progressBlock}>
        <div style={styles.progressTop}>
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      <div style={styles.accountActions}>
        <button type="button" style={styles.editButton} onClick={onEdit}>
          Edit
        </button>
        <button type="button" style={styles.deleteButton} onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div style={styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
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

  glow: {
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

  title: {
    margin: "0 0 10px",
    color: "#ffffff",
    fontSize: "46px",
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: "-0.055em",
  },

  subtitle: {
    margin: 0,
    maxWidth: "760px",
    color: "rgba(241,245,249,0.78)",
    fontSize: "17px",
    lineHeight: 1.55,
  },

  headerActions: {
    display: "flex",
    gap: "14px",
    flexShrink: 0,
  },

  primaryButton: {
    minHeight: "48px",
    border: "none",
    background: "linear-gradient(180deg, #3483ff, #0f63e8)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "0 20px",
    fontSize: "15px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow: "0 18px 36px rgba(37,99,235,0.22)",
  },

  secondaryButton: {
    minHeight: "48px",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,8,19,0.30)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "0 20px",
    fontSize: "15px",
    fontWeight: 750,
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  summaryCard: {
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.70), rgba(5,13,27,0.76))",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 18px 52px rgba(0,0,0,0.18)",
  },

  summaryLabel: {
    margin: "0 0 10px",
    color: "#ffffff",
    opacity: 0.78,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: "12px",
    fontWeight: 850,
  },

  summaryValue: {
    margin: "0 0 8px",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    letterSpacing: "-0.05em",
  },

  summaryDetail: {
    margin: 0,
    color: "#ffffff",
    opacity: 0.74,
    fontSize: "14px",
  },

  formPanel: {
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.73), rgba(5,13,27,0.78))",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 18px 52px rgba(0,0,0,0.18)",
  },

  accountsPanel: {
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.73), rgba(5,13,27,0.78))",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 18px 52px rgba(0,0,0,0.18)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(148,163,184,0.13)",
    marginBottom: "20px",
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
    fontWeight: 850,
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 850,
  },

  fullWidth: {
    gridColumn: "1 / -1",
  },

  input: {
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

  textarea: {
    minHeight: "90px",
    resize: "vertical",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
  },

  emptyState: {
    border: "1px dashed rgba(148,163,184,0.22)",
    background: "rgba(2,8,19,0.30)",
    borderRadius: "14px",
    padding: "42px 22px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    margin: "0 auto 14px",
    background: "rgba(37,99,235,0.14)",
    border: "1px solid rgba(96,165,250,0.24)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: 900,
  },

  emptyTitle: {
    margin: "0 0 8px",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 850,
    letterSpacing: "-0.035em",
  },

  emptyText: {
    maxWidth: "560px",
    margin: "0 auto 20px",
    color: "#ffffff",
    opacity: 0.74,
    fontSize: "15px",
    lineHeight: 1.55,
  },

  accountList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  accountCard: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 1.1fr) minmax(360px, 1.2fr) minmax(160px, 0.7fr) auto",
    alignItems: "center",
    gap: "18px",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(2,8,19,0.30)",
    borderRadius: "14px",
    padding: "18px",
  },

  accountMain: {
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

  accountMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  },

  metric: {
    borderLeft: "1px solid rgba(148,163,184,0.13)",
    paddingLeft: "12px",
  },

  metricLabel: {
    display: "block",
    color: "#ffffff",
    opacity: 0.72,
    textTransform: "uppercase",
    fontSize: "11px",
    letterSpacing: "0.04em",
    fontWeight: 800,
    marginBottom: "7px",
  },

  metricValue: {
    display: "block",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 850,
  },

  progressBlock: {
    minWidth: "150px",
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "8px",
  },

  progressTrack: {
    width: "100%",
    height: "7px",
    background: "rgba(148,163,184,0.18)",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "#2f7cff",
    borderRadius: "999px",
  },

  accountActions: {
    display: "flex",
    gap: "10px",
  },

  editButton: {
    border: "1px solid rgba(96,165,250,0.24)",
    background: "rgba(37,99,235,0.14)",
    color: "#bfdbfe",
    borderRadius: "9px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 850,
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid rgba(248,113,113,0.22)",
    background: "rgba(127,29,29,0.16)",
    color: "#fecaca",
    borderRadius: "9px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 850,
    cursor: "pointer",
  },
};