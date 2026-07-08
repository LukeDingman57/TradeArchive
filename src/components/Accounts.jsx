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

const DEFAULT_FORM = {
  firm: "Topstep",
  customFirm: "",
  name: "",
  type: "Evaluation",
  status: "Active",
  accountSize: "50000",
  startingBalance: "50000",
  currentBalance: "50000",
  targetAmount: "3000",
  dailyLossLimit: "1000",
  maxDrawdown: "2000",
  payoutRule: "",
  notes: "",
};

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

function money(value, showPlus = false) {
  const number = Number(value || 0);
  const sign = number > 0 && showPlus ? "+" : number < 0 ? "-" : "";
  return `${sign}$${Math.abs(number).toLocaleString()}`;
}

function createAccount(form, existingId = null, existingCreatedAt = null) {
  const firm = form.firm === "Other" ? form.customFirm || "Other" : form.firm;
  const accountSize = Number(form.accountSize || 0);
  const startingBalance = Number(form.startingBalance || accountSize || 0);
  const balance = Number(form.currentBalance || startingBalance || 0);
  const targetAmount = Number(form.targetAmount || 0);
  const profit = balance - startingBalance;
  const progress =
    targetAmount > 0 ? Math.max(0, Math.min(100, (profit / targetAmount) * 100)) : 0;

  return {
    id: existingId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    firm,
    logo: getFirmLogo(firm),
    name: form.name || `${firm} ${accountSize ? `${accountSize / 1000}K` : ""}`.trim(),
    type: form.type,
    status: form.status,
    accountSize,
    startingBalance,
    balance,
    targetAmount,
    dailyLossLimit: Number(form.dailyLossLimit || 0),
    maxDrawdown: Number(form.maxDrawdown || 0),
    payoutRule: form.payoutRule || "",
    notes: form.notes || "",
    targetLabel: form.type === "Evaluation" ? "To Pass" : "To Payout",
    progress: Math.round(progress),
    createdAt: existingCreatedAt || new Date().toISOString(),
  };
}

function accountToForm(account) {
  return {
    firm: FIRM_OPTIONS.includes(account.firm) ? account.firm : "Other",
    customFirm: FIRM_OPTIONS.includes(account.firm) ? "" : account.firm,
    name: account.name || "",
    type: account.type || "Evaluation",
    status: account.status || "Active",
    accountSize: String(account.accountSize || ""),
    startingBalance: String(account.startingBalance || ""),
    currentBalance: String(account.balance || ""),
    targetAmount: String(account.targetAmount || ""),
    dailyLossLimit: String(account.dailyLossLimit || ""),
    maxDrawdown: String(account.maxDrawdown || ""),
    payoutRule: account.payoutRule || "",
    notes: account.notes || "",
  };
}

export default function Accounts({ setActivePage }) {
  const [accounts, setAccounts] = React.useState(loadStoredAccounts);
  const [form, setForm] = React.useState(DEFAULT_FORM);
  const [editingId, setEditingId] = React.useState(null);
  const [showEditor, setShowEditor] = React.useState(false);

  React.useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  const fundedCount = accounts.filter((account) => account.type === "Funded").length;
  const evalCount = accounts.filter((account) => account.type === "Evaluation").length;
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const totalProfit = accounts.reduce(
    (sum, account) =>
      sum + (Number(account.balance || 0) - Number(account.startingBalance || 0)),
    0
  );
  const totalTargets = accounts.reduce((sum, account) => sum + Number(account.targetAmount || 0), 0);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openNewEditor = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowEditor(true);
  };

  const openEditEditor = (account) => {
    setForm(accountToForm(account));
    setEditingId(account.id);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const saveAccount = () => {
    const existing = accounts.find((account) => account.id === editingId);
    const nextAccount = createAccount(form, editingId, existing?.createdAt);

    setAccounts((current) => {
      if (editingId) {
        return current.map((account) => (account.id === editingId ? nextAccount : account));
      }

      if (current.length === 0 && typeof window !== "undefined") {
        window.localStorage.setItem(SELECTED_RECOVERY_KEY, nextAccount.id);
      }

      return [...current, nextAccount];
    });

    closeEditor();
  };

  const deleteAccount = (accountId) => {
    const confirmed = window.confirm("Delete this prop firm account?");
    if (!confirmed) return;

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
            <p style={styles.eyebrow}>PROP FIRM OPERATIONS</p>
            <h1 style={styles.title}>Accounts</h1>
            <p style={styles.subtitle}>
              This is where traders manage firms, evaluations, funded accounts, limits, and payout goals. The dashboard stays clean and reads from this page.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button type="button" style={styles.secondaryButton} onClick={goDashboard}>
              Back to Dashboard
            </button>
            <button type="button" style={styles.primaryButton} onClick={openNewEditor}>
              + Add Firm
            </button>
          </div>
        </header>

        <section style={styles.summaryGrid}>
          <SummaryCard label="Accounts" value={accounts.length} detail={`${fundedCount} funded • ${evalCount} evaluation`} />
          <SummaryCard label="Total Balance" value={money(totalBalance)} detail="Across all firms" />
          <SummaryCard label="Net P/L" value={money(totalProfit, true)} detail="Versus starting balances" />
          <SummaryCard label="Remaining Goals" value={money(totalTargets)} detail="Pass and payout targets" />
        </section>

        <section style={styles.workspaceGrid}>
          <div style={styles.mainPanel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Firm Accounts</h2>
                <p style={styles.sectionText}>Add, edit, delete, and organize the accounts that appear on your dashboard.</p>
              </div>
              <button type="button" style={styles.linkButton} onClick={openNewEditor}>
                + Add Account
              </button>
            </div>

            {accounts.length === 0 ? (
              <EmptyAccounts onAdd={openNewEditor} />
            ) : (
              <div style={styles.accountTable}>
                {accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    onEdit={() => openEditEditor(account)}
                    onDelete={() => deleteAccount(account.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside style={styles.sidePanel}>
            <h2 style={styles.sectionTitle}>Setup Checklist</h2>
            <div style={styles.checklist}>
              <ChecklistItem done={accounts.length > 0} title="Add your first firm" text="Track Topstep, Alpha, Apex, or any other prop account." />
              <ChecklistItem done={false} title="Connect journal entries" text="Next step: every logged trade updates the selected account." />
              <ChecklistItem done={false} title="Move to Supabase" text="Final step: accounts sync across devices and logins." />
            </div>

            <div style={styles.infoBox}>
              <div style={styles.infoTitle}>Why this page matters</div>
              <p style={styles.infoText}>
                The dashboard should answer what matters today. This page is the control room where accounts are created and maintained.
              </p>
            </div>
          </aside>
        </section>
      </div>

      {showEditor && (
        <div style={styles.modalOverlay} onClick={closeEditor}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrowSmall}>{editingId ? "EDIT ACCOUNT" : "NEW ACCOUNT"}</p>
                <h2 style={styles.modalTitle}>{editingId ? "Edit Firm Account" : "Add Firm Account"}</h2>
              </div>
              <button type="button" style={styles.closeButton} onClick={closeEditor}>
                ×
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

              {form.firm === "Other" && (
                <Field label="Custom Firm Name">
                  <input
                    style={styles.input}
                    value={form.customFirm}
                    placeholder="Example: Bulenox"
                    onChange={(event) => updateForm("customFirm", event.target.value)}
                  />
                </Field>
              )}

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

              <Field label="Account Size">
                <input
                  style={styles.input}
                  type="number"
                  value={form.accountSize}
                  onChange={(event) => updateForm("accountSize", event.target.value)}
                />
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

              <label style={{ ...styles.field, ...styles.fullWidth }}>
                Payout Rule
                <input
                  style={styles.input}
                  value={form.payoutRule}
                  placeholder="Example: 5 winning days over $200"
                  onChange={(event) => updateForm("payoutRule", event.target.value)}
                />
              </label>

              <label style={{ ...styles.field, ...styles.fullWidth }}>
                Notes
                <textarea
                  style={{ ...styles.input, ...styles.textarea }}
                  value={form.notes}
                  placeholder="Anything important about this account..."
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </label>
            </div>

            <div style={styles.modalActions}>
              <button type="button" style={styles.secondaryButton} onClick={closeEditor}>
                Cancel
              </button>
              <button type="button" style={styles.primaryButton} onClick={saveAccount}>
                {editingId ? "Save Changes" : "Save Account"}
              </button>
            </div>
          </div>
        </div>
      )}
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

function EmptyAccounts({ onAdd }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>+</div>
      <h3 style={styles.emptyTitle}>No firm accounts yet</h3>
      <p style={styles.emptyText}>
        Add your first evaluation or funded account. This is where account management lives instead of cluttering the dashboard.
      </p>
      <button type="button" style={styles.primaryButton} onClick={onAdd}>
        Add Your First Firm
      </button>
    </div>
  );
}

function ChecklistItem({ done, title, text }) {
  return (
    <div style={styles.checkItem}>
      <div style={{ ...styles.checkCircle, ...(done ? styles.checkCircleDone : {}) }}>
        {done ? "✓" : ""}
      </div>
      <div>
        <div style={styles.checkTitle}>{title}</div>
        <div style={styles.checkText}>{text}</div>
      </div>
    </div>
  );
}

function AccountRow({ account, onEdit, onDelete }) {
  const progress = Number(account.progress || 0);
  const profit = Number(account.balance || 0) - Number(account.startingBalance || 0);

  return (
    <article style={styles.accountRow}>
      <div style={styles.accountIdentity}>
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

      <Metric label="Balance" value={money(account.balance)} />
      <Metric label="Net P/L" value={money(profit, true)} />
      <Metric label={account.targetLabel || "Goal"} value={money(account.targetAmount)} />

      <div style={styles.progressBlock}>
        <div style={styles.progressTop}>
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      <div style={styles.rowActions}>
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

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      {label}
      {children}
    </label>
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
    fontWeight: 850,
    letterSpacing: "0.18em",
  },

  eyebrowSmall: {
    margin: "0 0 8px",
    color: "#93c5fd",
    fontSize: "11px",
    fontWeight: 850,
    letterSpacing: "0.16em",
  },

  title: {
    margin: "0 0 10px",
    color: "#ffffff",
    fontSize: "46px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.055em",
  },

  subtitle: {
    margin: 0,
    maxWidth: "820px",
    color: "rgba(241,245,249,0.78)",
    fontSize: "17px",
    lineHeight: 1.6,
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
    fontWeight: 780,
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

  workspaceGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.35fr) 360px",
    gap: "20px",
    alignItems: "start",
  },

  mainPanel: {
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.73), rgba(5,13,27,0.78))",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 18px 52px rgba(0,0,0,0.18)",
  },

  sidePanel: {
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
    alignItems: "flex-start",
    gap: "16px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(148,163,184,0.13)",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  sectionText: {
    margin: "7px 0 0",
    color: "#ffffff",
    opacity: 0.66,
    fontSize: "14px",
    lineHeight: 1.5,
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: "#4f9cff",
    fontSize: "15px",
    fontWeight: 850,
    cursor: "pointer",
    padding: 0,
  },

  emptyState: {
    border: "1px dashed rgba(148,163,184,0.22)",
    background: "rgba(2,8,19,0.30)",
    borderRadius: "14px",
    padding: "54px 22px",
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
    fontWeight: 900,
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

  accountTable: {
    display: "grid",
    gap: "12px",
  },

  accountRow: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 1.2fr) 120px 120px 120px minmax(140px, 0.8fr) auto",
    alignItems: "center",
    gap: "16px",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(2,8,19,0.30)",
    borderRadius: "14px",
    padding: "16px",
  },

  accountIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },

  firmLogo: {
    width: "52px",
    height: "52px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#000000",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 900,
  },

  accountName: {
    margin: "0 0 7px",
    color: "#ffffff",
    fontSize: "17px",
    lineHeight: 1.15,
    fontWeight: 900,
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

  metric: {
    borderLeft: "1px solid rgba(148,163,184,0.13)",
    paddingLeft: "12px",
  },

  metricLabel: {
    display: "block",
    color: "#ffffff",
    opacity: 0.70,
    textTransform: "uppercase",
    fontSize: "10.5px",
    letterSpacing: "0.05em",
    fontWeight: 850,
    marginBottom: "7px",
  },

  metricValue: {
    display: "block",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 900,
  },

  progressBlock: {
    minWidth: "130px",
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 850,
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

  rowActions: {
    display: "flex",
    gap: "8px",
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

  checklist: {
    display: "grid",
    gap: "16px",
    marginTop: "20px",
  },

  checkItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },

  checkCircle: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    border: "1px solid rgba(148,163,184,0.20)",
    background: "rgba(2,8,19,0.35)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: "13px",
    fontWeight: 900,
    flexShrink: 0,
  },

  checkCircleDone: {
    background: "rgba(34,197,94,0.16)",
    border: "1px solid rgba(34,197,94,0.28)",
    color: "#86efac",
  },

  checkTitle: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
    marginBottom: "4px",
  },

  checkText: {
    color: "#ffffff",
    opacity: 0.66,
    fontSize: "13px",
    lineHeight: 1.5,
  },

  infoBox: {
    marginTop: "22px",
    border: "1px solid rgba(96,165,250,0.18)",
    background: "rgba(37,99,235,0.08)",
    borderRadius: "14px",
    padding: "16px",
  },

  infoTitle: {
    color: "#bfdbfe",
    fontSize: "14px",
    fontWeight: 900,
    marginBottom: "7px",
  },

  infoText: {
    margin: 0,
    color: "#ffffff",
    opacity: 0.72,
    fontSize: "13px",
    lineHeight: 1.55,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(2,8,19,0.74)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "22px",
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: "760px",
    maxHeight: "90vh",
    overflowY: "auto",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(5,13,27,0.98))",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 28px 80px rgba(0,0,0,0.46)",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "22px",
  },

  modalTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    letterSpacing: "-0.045em",
  },

  closeButton: {
    width: "40px",
    height: "40px",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,8,19,0.46)",
    color: "#ffffff",
    borderRadius: "10px",
    fontSize: "24px",
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
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

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "22px",
  },
};
