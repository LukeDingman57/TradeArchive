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
  accountCount: "1",
  type: "Evaluation",
  status: "Active",
  accountSize: "50000",
  startingBalance: "50000",
  currentBalance: "50000",
  targetAmount: "3000",
  dailyLossLimit: "1000",
  maxDrawdown: "2000",
  payoutRule: "",
  payoutDays: "0",
  payoutDayGoal: "5",
  payoutHistory: [],
  notes: "",
};

function loadStoredAccounts() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
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
  return firm.split(" ").map((word) => word[0]).join("").slice(0, 5).toUpperCase();
}

function money(value, showPlus = false) {
  const number = Number(value || 0);
  const sign = number > 0 && showPlus ? "+" : number < 0 ? "-" : "";
  return `${sign}$${Math.abs(number).toLocaleString()}`;
}

function createAccount(form, existingId = null, existingCreatedAt = null, accountNumber = 1, groupId = "") {
  const firm = form.firm === "Other" ? form.customFirm || "Other" : form.firm;
  const accountSize = Number(form.accountSize || 0);
  const startingBalance = Number(form.startingBalance || accountSize || 0);
  const balance = Number(form.currentBalance || startingBalance || 0);
  const targetAmount = Number(form.targetAmount || 0);
  const profit = balance - startingBalance;
  const lowerFirm = firm.toLowerCase();
  const isTopstep = lowerFirm.includes("topstep");
  const isFunded = form.type === "Funded";
  const payoutDayGoal = isTopstep && isFunded ? Number(form.payoutDayGoal || 5) : 0;
  const payoutDays = payoutDayGoal
    ? Math.max(0, Math.min(payoutDayGoal, Number(form.payoutDays || 0)))
    : 0;

  const progress =
    payoutDayGoal > 0
      ? Math.max(0, Math.min(100, (payoutDays / payoutDayGoal) * 100))
      : targetAmount > 0
      ? Math.max(0, Math.min(100, (profit / targetAmount) * 100))
      : 0;

  const baseName =
    form.name ||
    `${firm} ${accountSize ? `${accountSize / 1000}K` : ""}`.trim();

  return {
    id: existingId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    groupId,
    accountNumber,
    firm,
    logo: getFirmLogo(firm),
    name: accountNumber > 1 && !existingId ? `${baseName} #${accountNumber}` : baseName,
    type: form.type,
    status:
      payoutDayGoal && payoutDays >= payoutDayGoal
        ? "Eligible"
        : form.status,
    accountSize,
    startingBalance,
    balance,
    targetAmount: payoutDayGoal ? 0 : targetAmount,
    dailyLossLimit: Number(form.dailyLossLimit || 0),
    maxDrawdown: Number(form.maxDrawdown || 0),
    payoutRule:
      form.payoutRule ||
      (isTopstep && isFunded ? "5 winning days over $150" : ""),
    payoutDays,
    payoutDayGoal,
    payoutHistory: form.payoutHistory || [],
    notes: form.notes || "",
    targetLabel: payoutDayGoal ? "Payout Days" : form.type === "Evaluation" ? "To Pass" : "To Payout",
    progress: Math.round(progress),
    createdAt: existingCreatedAt || new Date().toISOString(),
  };
}

function accountToForm(account) {
  return {
    firm: FIRM_OPTIONS.includes(account.firm) ? account.firm : "Other",
    customFirm: FIRM_OPTIONS.includes(account.firm) ? "" : account.firm,
    name: account.name || "",
    accountCount: "1",
    type: account.type || "Evaluation",
    status: account.status || "Active",
    accountSize: String(account.accountSize || ""),
    startingBalance: String(account.startingBalance || ""),
    currentBalance: String(account.balance || ""),
    targetAmount: String(account.targetAmount || ""),
    dailyLossLimit: String(account.dailyLossLimit || ""),
    maxDrawdown: String(account.maxDrawdown || ""),
    payoutRule: account.payoutRule || "",
    payoutDays: String(account.payoutDays || 0),
    payoutDayGoal: String(account.payoutDayGoal || 5),
    payoutHistory: account.payoutHistory || [],
    notes: account.notes || "",
  };
}

export default function Accounts({ setActivePage }) {
  const [accounts, setAccounts] = React.useState(loadStoredAccounts);
  const [form, setForm] = React.useState(DEFAULT_FORM);
  const [editingId, setEditingId] = React.useState(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState("");

  React.useEffect(() => saveStoredAccounts(accounts), [accounts]);
  React.useEffect(() => {
    if (!selectedAccountId && accounts.length) setSelectedAccountId(accounts[0].id);
  }, [accounts, selectedAccountId]);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0] || null;
  const fundedCount = accounts.filter((account) => account.type === "Funded").length;
  const evalCount = accounts.filter((account) => account.type === "Evaluation").length;
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const totalProfit = accounts.reduce((sum, account) => sum + (Number(account.balance || 0) - Number(account.startingBalance || 0)), 0);
  const evalAccounts = accounts.filter((account) => account.type === "Evaluation");
  const fundedPayoutAccounts = accounts.filter((account) => account.payoutDayGoal);
  const totalTargets = evalAccounts.reduce((sum, account) => sum + Number(account.targetAmount || 0), 0);
  const eligiblePayoutCount = fundedPayoutAccounts.filter(
    (account) => Number(account.payoutDays || 0) >= Number(account.payoutDayGoal || 0)
  ).length;

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

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

    if (editingId) {
      const nextAccount = createAccount(form, editingId, existing?.createdAt, existing?.accountNumber || 1, existing?.groupId || "");
      setAccounts((current) =>
        current.map((account) => (account.id === editingId ? nextAccount : account))
      );
      closeEditor();
      return;
    }

    const accountCount = Math.max(1, Math.min(20, Number(form.accountCount || 1)));
    const groupId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const newAccounts = Array.from({ length: accountCount }, (_, index) =>
      createAccount(form, null, null, index + 1, groupId)
    );

    setAccounts((current) => {
      if (current.length === 0 && newAccounts[0] && typeof window !== "undefined") {
        window.localStorage.setItem(SELECTED_RECOVERY_KEY, newAccounts[0].id);
        setSelectedAccountId(newAccounts[0].id);
      }

      return [...current, ...newAccounts];
    });

    closeEditor();
  };

  const deleteAccount = (accountId) => {
    if (!window.confirm("Delete this prop firm account?")) return;
    setAccounts((current) => current.filter((account) => account.id !== accountId));
    if (selectedAccountId === accountId) {
      const next = accounts.find((account) => account.id !== accountId);
      setSelectedAccountId(next?.id || "");
    }
    if (typeof window !== "undefined" && window.localStorage.getItem(SELECTED_RECOVERY_KEY) === accountId) {
      window.localStorage.removeItem(SELECTED_RECOVERY_KEY);
    }
  };

  const recordPayout = (accountId) => {
    const payoutAmount = window.prompt("Payout amount? Example: 1500");
    if (payoutAmount === null) return;

    setAccounts((current) =>
      current.map((account) => {
        if (account.id !== accountId) return account;

        const payout = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          amount: Number(payoutAmount || 0),
          date: new Date().toISOString(),
        };

        return {
          ...account,
          payoutDays: 0,
          progress: account.payoutDayGoal ? 0 : account.progress,
          status: "Active",
          payoutHistory: [payout, ...(account.payoutHistory || [])],
        };
      })
    );
  };

  const addPayoutDay = (accountId) => {
    setAccounts((current) =>
      current.map((account) => {
        if (account.id !== accountId || !account.payoutDayGoal) return account;

        const nextDays = Math.min(account.payoutDayGoal, Number(account.payoutDays || 0) + 1);
        const nextProgress = Math.round((nextDays / account.payoutDayGoal) * 100);

        return {
          ...account,
          payoutDays: nextDays,
          progress: nextProgress,
          status: nextDays >= account.payoutDayGoal ? "Eligible" : "Active",
        };
      })
    );
  };

  const resetPayoutDays = (accountId) => {
    if (!window.confirm("Reset payout days to 0 / 5?")) return;

    setAccounts((current) =>
      current.map((account) =>
        account.id === accountId
          ? {
              ...account,
              payoutDays: 0,
              progress: account.payoutDayGoal ? 0 : account.progress,
              status: "Active",
            }
          : account
      )
    );
  };

  const goDashboard = () => {
    if (typeof setActivePage === "function") setActivePage("dashboard");
  };

  return (
    <div style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />
      <div style={styles.inner}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>PROP FIRM CONTROL ROOM</p>
            <h1 style={styles.title}>Accounts</h1>
            <p style={styles.subtitle}>Manage every evaluation and funded account from one place. Add firms here, then let the dashboard stay focused on today’s trading decisions.</p>
          </div>
          <div style={styles.headerActions}>
            <button type="button" style={styles.secondaryButton} onClick={goDashboard}>Dashboard</button>
            <button type="button" style={styles.primaryButton} onClick={openNewEditor}>+ Add Account</button>
          </div>
        </header>

        <section style={styles.heroPanel}>
          <div style={styles.heroLeft}>
            <div style={styles.heroLabel}>Workspace Status</div>
            <h2 style={styles.heroHeading}>{accounts.length ? `${accounts.length} account${accounts.length > 1 ? "s" : ""} tracked` : "Set up your prop firm workspace"}</h2>
            <p style={styles.heroCopy}>{accounts.length ? "Your accounts are now feeding the dashboard. Next step is assigning journal entries to each account." : "Start by adding the account you are currently trying to pass, recover, or take a payout from."}</p>
            <div style={styles.heroActions}>
              <button type="button" style={styles.primaryButton} onClick={openNewEditor}>{accounts.length ? "+ Add Another Account" : "Add First Account"}</button>
              <button type="button" style={styles.secondaryButton} onClick={goDashboard}>View Dashboard</button>
            </div>
          </div>
          <div style={styles.heroStats}>
            <HeroStat label="Funded" value={fundedCount} />
            <HeroStat label="Evaluations" value={evalCount} />
            <HeroStat label="Net P/L" value={money(totalProfit, true)} />
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <SummaryCard label="Total Balance" value={money(totalBalance)} detail="Across all firms" />
          <SummaryCard
            label={evalAccounts.length ? "Evaluation Goals" : "Payout Progress"}
            value={evalAccounts.length ? money(totalTargets) : `${eligiblePayoutCount} Eligible`}
            detail={
              evalAccounts.length
                ? "Only evaluation pass targets"
                : `${fundedPayoutAccounts.length} funded account${fundedPayoutAccounts.length === 1 ? "" : "s"} tracked`
            }
          />
          <SummaryCard label="Data Source" value="Manual" detail="Supabase sync comes next" />
        </section>

        <main style={styles.workspaceGrid}>
          <section style={styles.card}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Account List</h2>
                <p style={styles.sectionText}>Click an account to preview it on the right.</p>
              </div>
              <button type="button" style={styles.linkButton} onClick={openNewEditor}>+ New</button>
            </div>

            {accounts.length === 0 ? (
              <EmptyAccounts onAdd={openNewEditor} />
            ) : (
              <div style={styles.accountList}>
                {accounts.map((account) => (
                  <button key={account.id} type="button" onClick={() => setSelectedAccountId(account.id)} style={{ ...styles.accountListItem, ...(selectedAccount?.id === account.id ? styles.accountListItemActive : {}) }}>
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
                    <div style={styles.listProgress}>
                      <div style={styles.progressTop}>
                        <span>{account.targetLabel}</span>
                        <strong>
                          {account.payoutDayGoal
                            ? `${account.payoutDays || 0} / ${account.payoutDayGoal}`
                            : `${account.progress}%`}
                        </strong>
                      </div>
                      <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${account.progress}%` }} /></div>
                    </div>
                    <div style={styles.listAmount}>{money(account.balance)}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside style={styles.detailColumn}>
            <section style={styles.card}>
              {selectedAccount ? <AccountDetail
                account={selectedAccount}
                onEdit={() => openEditEditor(selectedAccount)}
                onDelete={() => deleteAccount(selectedAccount.id)}
                onRecordPayout={() => recordPayout(selectedAccount.id)}
                onAddPayoutDay={() => addPayoutDay(selectedAccount.id)}
                onResetPayoutDays={() => resetPayoutDays(selectedAccount.id)}
              /> : <div style={styles.emptyDetail}><div style={styles.emptyIconSmall}>+</div><h3 style={styles.emptyTitle}>No account selected</h3><p style={styles.emptyText}>Add a firm account and its details will show here.</p></div>}
            </section>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Account Setup Flow</h2>
              <div style={styles.timeline}>
                <TimelineItem active={accounts.length > 0} number="1" title="Create account" text="Add firm, account type, balance, target, and drawdown limits." />
                <TimelineItem active={false} number="2" title="Link journal" text="Assign every trade to one prop firm account." />
                <TimelineItem active={false} number="3" title="Automate dashboard" text="Balance, recovery, and payout progress update automatically." />
              </div>
            </section>
          </aside>
        </main>
      </div>

      {showEditor && (
        <div style={styles.modalOverlay} onClick={closeEditor}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div><p style={styles.eyebrowSmall}>{editingId ? "EDIT ACCOUNT" : "NEW PROP ACCOUNT"}</p><h2 style={styles.modalTitle}>{editingId ? "Edit Account" : "Add Account"}</h2></div>
              <button type="button" style={styles.closeButton} onClick={closeEditor}>×</button>
            </div>
            <div style={styles.formGrid}>
              <Field label="Prop Firm"><select style={styles.input} value={form.firm} onChange={(e) => updateForm("firm", e.target.value)}>{FIRM_OPTIONS.map((firm) => <option key={firm}>{firm}</option>)}</select></Field>
              {form.firm === "Other" && <Field label="Custom Firm Name"><input style={styles.input} value={form.customFirm} placeholder="Example: Bulenox" onChange={(e) => updateForm("customFirm", e.target.value)} /></Field>}
              <Field label="Account Name"><input style={styles.input} value={form.name} placeholder="Topstep 50K" onChange={(e) => updateForm("name", e.target.value)} /></Field>
              {!editingId && <Field label="Number of Accounts"><input style={styles.input} type="number" min="1" max="20" value={form.accountCount} onChange={(e) => updateForm("accountCount", e.target.value)} /></Field>}
              <Field label="Account Type"><select style={styles.input} value={form.type} onChange={(e) => updateForm("type", e.target.value)}><option>Evaluation</option><option>Funded</option></select></Field>
              <Field label="Status"><select style={styles.input} value={form.status} onChange={(e) => updateForm("status", e.target.value)}><option>Active</option><option>Passed</option><option>Funded</option><option>Paused</option><option>Blown</option></select></Field>
              <Field label="Account Size"><input style={styles.input} type="number" value={form.accountSize} onChange={(e) => updateForm("accountSize", e.target.value)} /></Field>
              <Field label="Starting Balance"><input style={styles.input} type="number" value={form.startingBalance} onChange={(e) => updateForm("startingBalance", e.target.value)} /></Field>
              <Field label="Current Balance"><input style={styles.input} type="number" value={form.currentBalance} onChange={(e) => updateForm("currentBalance", e.target.value)} /></Field>
              {form.firm === "Topstep" && form.type === "Funded" ? (
                <>
                  <Field label="Current Payout Days">
                    <input style={styles.input} type="number" min="0" max="5" value={form.payoutDays} onChange={(e) => updateForm("payoutDays", e.target.value)} />
                  </Field>
                  <Field label="Payout Day Goal">
                    <input style={styles.input} type="number" min="1" value={form.payoutDayGoal} onChange={(e) => updateForm("payoutDayGoal", e.target.value)} />
                  </Field>
                </>
              ) : (
                <Field label="Needed to Pass / Payout"><input style={styles.input} type="number" value={form.targetAmount} onChange={(e) => updateForm("targetAmount", e.target.value)} /></Field>
              )}
              <Field label="Daily Loss Limit"><input style={styles.input} type="number" value={form.dailyLossLimit} onChange={(e) => updateForm("dailyLossLimit", e.target.value)} /></Field>
              <Field label="Max Drawdown"><input style={styles.input} type="number" value={form.maxDrawdown} onChange={(e) => updateForm("maxDrawdown", e.target.value)} /></Field>
              <label style={{ ...styles.field, ...styles.fullWidth }}>Payout Rule<input style={styles.input} value={form.payoutRule} placeholder="Example: 5 winning days over $200" onChange={(e) => updateForm("payoutRule", e.target.value)} /></label>
              <label style={{ ...styles.field, ...styles.fullWidth }}>Notes<textarea style={{ ...styles.input, ...styles.textarea }} value={form.notes} placeholder="Anything important about this account..." onChange={(e) => updateForm("notes", e.target.value)} /></label>
            </div>
            <div style={styles.modalActions}><button type="button" style={styles.secondaryButton} onClick={closeEditor}>Cancel</button><button type="button" style={styles.primaryButton} onClick={saveAccount}>{editingId ? "Save Changes" : "Save Account"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroStat({ label, value }) { return <div style={styles.heroStat}><div style={styles.heroStatValue}>{value}</div><div style={styles.heroStatLabel}>{label}</div></div>; }
function SummaryCard({ label, value, detail }) { return <article style={styles.summaryCard}><p style={styles.summaryLabel}>{label}</p><h3 style={styles.summaryValue}>{value}</h3><p style={styles.summaryDetail}>{detail}</p></article>; }
function EmptyAccounts({ onAdd }) { return <div style={styles.emptyState}><div style={styles.emptyIcon}>+</div><h3 style={styles.emptyTitle}>No prop accounts yet</h3><p style={styles.emptyText}>Add your first funded or evaluation account. After that, this page becomes the control room for all firm rules and limits.</p><button type="button" style={styles.primaryButton} onClick={onAdd}>Add Your First Account</button></div>; }
function TimelineItem({ active, number, title, text }) { return <div style={styles.timelineItem}><div style={{ ...styles.timelineNumber, ...(active ? styles.timelineNumberActive : {}) }}>{active ? "✓" : number}</div><div><h3 style={styles.timelineTitle}>{title}</h3><p style={styles.timelineText}>{text}</p></div></div>; }
function DetailMetric({ label, value }) { return <div style={styles.detailMetric}><span>{label}</span><strong>{value}</strong></div>; }
function Field({ label, children }) { return <label style={styles.field}>{label}{children}</label>; }

function AccountDetail({ account, onEdit, onDelete, onRecordPayout, onAddPayoutDay, onResetPayoutDays }) {
  const profit = Number(account.balance || 0) - Number(account.startingBalance || 0);
  const progress = Number(account.progress || 0);
  const winsNeeded = account.payoutDayGoal
    ? Math.max(0, Number(account.payoutDayGoal || 0) - Number(account.payoutDays || 0))
    : Math.ceil(Number(account.targetAmount || 0) / 300);
  return (
    <div>
      <div style={styles.detailTop}><div style={styles.firmLogoLarge}>{account.logo}</div><div><h2 style={styles.detailTitle}>{account.name}</h2><div style={styles.accountTags}><span style={styles.accountTag}>{account.firm}</span><span style={styles.accountTag}>{account.type}</span><span style={styles.accountTag}>{account.status}</span></div></div></div>
      <div style={styles.detailMoney}><div><span style={styles.detailLabel}>Balance</span><strong style={styles.detailBalance}>{money(account.balance)}</strong></div><div><span style={styles.detailLabel}>Net P/L</span><strong style={styles.detailBalance}>{money(profit, true)}</strong></div></div>
      <div style={styles.detailProgressHeader}>
        <span>{account.targetLabel}</span>
        <strong>
          {account.payoutDayGoal
            ? `${account.payoutDays || 0} / ${account.payoutDayGoal}`
            : `${progress}%`}
        </strong>
      </div>
      <div style={styles.progressTrackBig}><div style={{ ...styles.progressFill, width: `${progress}%` }} /></div>
      <div style={styles.detailGrid}>
        <DetailMetric
          label={account.payoutDayGoal ? "Payout Days Left" : "Remaining Goal"}
          value={account.payoutDayGoal ? winsNeeded : money(account.targetAmount)}
        />
        <DetailMetric label="Daily Loss Limit" value={money(account.dailyLossLimit)} />
        <DetailMetric label="Max Drawdown" value={money(account.maxDrawdown)} />
        <DetailMetric
          label={account.payoutDayGoal ? "Rule" : "Est. Wins Needed"}
          value={account.payoutDayGoal ? ">$150 days" : winsNeeded || 0}
        />
      </div>
      {account.payoutDayGoal ? (
        <div style={styles.payoutActions}>
          <button type="button" style={styles.editButton} onClick={onAddPayoutDay}>
            + Add Payout Day
          </button>
          <button type="button" style={styles.editButton} onClick={onRecordPayout}>
            Record Payout
          </button>
          <button type="button" style={styles.secondarySmallButton} onClick={onResetPayoutDays}>
            Reset Days
          </button>
        </div>
      ) : null}
      {account.payoutHistory?.length ? (
        <div style={styles.noteBox}>
          <span>Payout History</span>
          {account.payoutHistory.map((payout) => (
            <p key={payout.id}>
              {new Date(payout.date).toLocaleDateString("en-US")} — {money(payout.amount)}
            </p>
          ))}
        </div>
      ) : null}
      {account.payoutRule ? <div style={styles.noteBox}><span>Payout Rule</span><p>{account.payoutRule}</p></div> : null}
      {account.notes ? <div style={styles.noteBox}><span>Notes</span><p>{account.notes}</p></div> : null}
      <div style={styles.detailActions}><button type="button" style={styles.editButton} onClick={onEdit}>Edit Account</button><button type="button" style={styles.deleteButton} onClick={onDelete}>Delete</button></div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", position: "relative", overflow: "hidden", background: "radial-gradient(circle at 25% -10%, rgba(37,99,235,0.18), transparent 30%), radial-gradient(circle at 92% 8%, rgba(14,165,233,0.10), transparent 26%), #020813", color: "#ffffff", padding: "38px 34px 54px", boxSizing: "border-box", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  glowOne: { position: "absolute", top: "-160px", left: "-140px", width: "360px", height: "360px", borderRadius: "50%", background: "rgba(37,99,235,0.14)", filter: "blur(90px)", pointerEvents: "none" },
  glowTwo: { position: "absolute", right: "-120px", bottom: "-160px", width: "360px", height: "360px", borderRadius: "50%", background: "rgba(96,165,250,0.10)", filter: "blur(90px)", pointerEvents: "none" },
  inner: { position: "relative", zIndex: 2, width: "100%", maxWidth: "1460px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px", marginBottom: "22px" },
  eyebrow: { margin: "0 0 10px", color: "#93c5fd", fontSize: "12px", fontWeight: 850, letterSpacing: "0.18em" },
  eyebrowSmall: { margin: "0 0 8px", color: "#93c5fd", fontSize: "11px", fontWeight: 850, letterSpacing: "0.16em" },
  title: { margin: "0 0 10px", color: "#ffffff", fontSize: "48px", lineHeight: 1, fontWeight: 900, letterSpacing: "-0.06em" },
  subtitle: { margin: 0, maxWidth: "820px", color: "rgba(241,245,249,0.76)", fontSize: "17px", lineHeight: 1.6 },
  headerActions: { display: "flex", gap: "14px", flexShrink: 0 },
  primaryButton: { minHeight: "48px", border: "none", background: "linear-gradient(180deg, #3483ff, #0f63e8)", color: "#ffffff", borderRadius: "12px", padding: "0 20px", fontSize: "15px", fontWeight: 850, cursor: "pointer", boxShadow: "0 18px 36px rgba(37,99,235,0.22)" },
  secondaryButton: { minHeight: "48px", border: "1px solid rgba(148,163,184,0.22)", background: "rgba(2,8,19,0.30)", color: "#ffffff", borderRadius: "12px", padding: "0 20px", fontSize: "15px", fontWeight: 780, cursor: "pointer" },
  heroPanel: { display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px", alignItems: "stretch", background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(15,23,42,0.76) 48%, rgba(2,8,19,0.80))", border: "1px solid rgba(96,165,250,0.18)", borderRadius: "24px", padding: "24px", marginBottom: "18px", boxShadow: "0 22px 62px rgba(0,0,0,0.22)" },
  heroLeft: { display: "flex", flexDirection: "column", justifyContent: "center" },
  heroLabel: { color: "#bfdbfe", fontSize: "12px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" },
  heroHeading: { margin: "0 0 10px", color: "#ffffff", fontSize: "30px", fontWeight: 900, letterSpacing: "-0.045em" },
  heroCopy: { margin: "0 0 18px", maxWidth: "720px", color: "rgba(255,255,255,0.74)", fontSize: "15px", lineHeight: 1.6 },
  heroActions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  heroStats: { display: "grid", gridTemplateColumns: "1fr", gap: "10px" },
  heroStat: { background: "rgba(2,8,19,0.35)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "16px", padding: "15px" },
  heroStatValue: { color: "#ffffff", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "4px" },
  heroStatLabel: { color: "rgba(255,255,255,0.66)", fontSize: "13px", fontWeight: 800 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px", marginBottom: "18px" },
  summaryCard: { background: "linear-gradient(180deg, rgba(15,23,42,0.70), rgba(5,13,27,0.76))", border: "1px solid rgba(148,163,184,0.13)", borderRadius: "18px", padding: "22px", boxShadow: "0 18px 52px rgba(0,0,0,0.18)" },
  summaryLabel: { margin: "0 0 10px", color: "#ffffff", opacity: 0.74, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "12px", fontWeight: 850 },
  summaryValue: { margin: "0 0 8px", color: "#ffffff", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em" },
  summaryDetail: { margin: 0, color: "#ffffff", opacity: 0.70, fontSize: "14px" },
  workspaceGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 430px", gap: "20px", alignItems: "start" },
  card: { background: "linear-gradient(180deg, rgba(15,23,42,0.73), rgba(5,13,27,0.78))", border: "1px solid rgba(148,163,184,0.13)", borderRadius: "20px", padding: "22px", boxShadow: "0 18px 52px rgba(0,0,0,0.18)" },
  detailColumn: { display: "flex", flexDirection: "column", gap: "18px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", paddingBottom: "18px", borderBottom: "1px solid rgba(148,163,184,0.13)", marginBottom: "18px" },
  sectionTitle: { margin: 0, color: "#ffffff", fontSize: "22px", fontWeight: 900, letterSpacing: "-0.04em" },
  sectionText: { margin: "7px 0 0", color: "#ffffff", opacity: 0.64, fontSize: "14px", lineHeight: 1.5 },
  linkButton: { border: "none", background: "transparent", color: "#4f9cff", fontSize: "15px", fontWeight: 850, cursor: "pointer", padding: 0 },
  accountList: { display: "grid", gap: "12px" },
  accountListItem: { width: "100%", border: "1px solid rgba(148,163,184,0.12)", background: "rgba(2,8,19,0.26)", color: "#ffffff", borderRadius: "16px", padding: "16px", display: "grid", gridTemplateColumns: "minmax(250px, 1fr) 180px 120px", alignItems: "center", gap: "18px", textAlign: "left", cursor: "pointer" },
  accountListItemActive: { border: "1px solid rgba(96,165,250,0.34)", background: "rgba(37,99,235,0.10)", boxShadow: "0 14px 30px rgba(37,99,235,0.10)" },
  accountIdentity: { display: "flex", alignItems: "center", gap: "14px", minWidth: 0 },
  firmLogo: { width: "52px", height: "52px", flexShrink: 0, borderRadius: "50%", background: "#000000", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "11px", fontWeight: 900 },
  firmLogoLarge: { width: "66px", height: "66px", flexShrink: 0, borderRadius: "50%", background: "#000000", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "13px", fontWeight: 900 },
  accountName: { margin: "0 0 7px", color: "#ffffff", fontSize: "17px", lineHeight: 1.15, fontWeight: 900, letterSpacing: "-0.035em" },
  accountTags: { display: "flex", gap: "7px", flexWrap: "wrap" },
  accountTag: { color: "#ffffff", background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.13)", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", fontWeight: 650 },
  listProgress: { minWidth: "160px" },
  listAmount: { color: "#ffffff", fontSize: "17px", fontWeight: 900, textAlign: "right" },
  progressTop: { display: "flex", justifyContent: "space-between", gap: "12px", color: "#ffffff", fontSize: "13px", fontWeight: 850, marginBottom: "8px" },
  progressTrack: { width: "100%", height: "7px", background: "rgba(148,163,184,0.18)", borderRadius: "999px", overflow: "hidden" },
  progressTrackBig: { width: "100%", height: "9px", background: "rgba(148,163,184,0.18)", borderRadius: "999px", overflow: "hidden", marginBottom: "18px" },
  progressFill: { height: "100%", background: "#2f7cff", borderRadius: "999px" },
  emptyState: { border: "1px dashed rgba(148,163,184,0.22)", background: "rgba(2,8,19,0.30)", borderRadius: "16px", padding: "52px 22px", textAlign: "center" },
  emptyIcon: { width: "58px", height: "58px", borderRadius: "50%", margin: "0 auto 14px", background: "rgba(37,99,235,0.14)", border: "1px solid rgba(96,165,250,0.24)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: 900 },
  emptyIconSmall: { width: "46px", height: "46px", borderRadius: "50%", marginBottom: "14px", background: "rgba(37,99,235,0.14)", border: "1px solid rgba(96,165,250,0.24)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 900 },
  emptyTitle: { margin: "0 0 8px", color: "#ffffff", fontSize: "22px", fontWeight: 900, letterSpacing: "-0.035em" },
  emptyText: { maxWidth: "560px", margin: "0 auto 20px", color: "#ffffff", opacity: 0.72, fontSize: "15px", lineHeight: 1.55 },
  emptyDetail: { minHeight: "280px", display: "flex", flexDirection: "column", justifyContent: "center" },
  detailTop: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "22px" },
  detailTitle: { margin: "0 0 8px", color: "#ffffff", fontSize: "25px", fontWeight: 900, letterSpacing: "-0.045em" },
  detailMoney: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" },
  detailLabel: { display: "block", color: "#ffffff", opacity: 0.66, fontSize: "12px", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "7px" },
  detailBalance: { color: "#ffffff", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em" },
  detailProgressHeader: { display: "flex", justifyContent: "space-between", color: "#ffffff", fontSize: "14px", fontWeight: 850, marginBottom: "9px" },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" },
  detailMetric: { background: "rgba(2,8,19,0.35)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "12px", padding: "13px" },
  noteBox: { background: "rgba(2,8,19,0.35)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "12px", padding: "13px", marginBottom: "10px" },
  detailActions: { display: "flex", gap: "10px", marginTop: "16px" },
  payoutActions: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" },
  secondarySmallButton: { border: "1px solid rgba(148,163,184,0.18)", background: "rgba(2,8,19,0.35)", color: "#ffffff", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 850, cursor: "pointer" },
  editButton: { flex: 1, border: "1px solid rgba(96,165,250,0.24)", background: "rgba(37,99,235,0.14)", color: "#bfdbfe", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 850, cursor: "pointer" },
  deleteButton: { border: "1px solid rgba(248,113,113,0.22)", background: "rgba(127,29,29,0.16)", color: "#fecaca", borderRadius: "10px", padding: "12px", fontSize: "13px", fontWeight: 850, cursor: "pointer" },
  timeline: { display: "grid", gap: "16px", marginTop: "20px" },
  timelineItem: { display: "flex", gap: "12px", alignItems: "flex-start" },
  timelineNumber: { width: "28px", height: "28px", borderRadius: "50%", background: "rgba(2,8,19,0.35)", border: "1px solid rgba(148,163,184,0.18)", color: "rgba(255,255,255,0.72)", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 900, flexShrink: 0 },
  timelineNumberActive: { color: "#86efac", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.26)" },
  timelineTitle: { margin: "0 0 5px", color: "#ffffff", fontSize: "14px", fontWeight: 900 },
  timelineText: { margin: 0, color: "#ffffff", opacity: 0.66, fontSize: "13px", lineHeight: 1.5 },
  modalOverlay: { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,8,19,0.74)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "22px", boxSizing: "border-box" },
  modal: { width: "100%", maxWidth: "760px", maxHeight: "90vh", overflowY: "auto", background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(5,13,27,0.98))", border: "1px solid rgba(148,163,184,0.18)", borderRadius: "18px", padding: "24px", boxShadow: "0 28px 80px rgba(0,0,0,0.46)", boxSizing: "border-box" },
  modalHeader: { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", marginBottom: "22px" },
  modalTitle: { margin: 0, color: "#ffffff", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.045em" },
  closeButton: { width: "40px", height: "40px", border: "1px solid rgba(148,163,184,0.18)", background: "rgba(2,8,19,0.46)", color: "#ffffff", borderRadius: "10px", fontSize: "24px", cursor: "pointer" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "8px", color: "#ffffff", fontSize: "13px", fontWeight: 850 },
  fullWidth: { gridColumn: "1 / -1" },
  input: { width: "100%", border: "1px solid rgba(148,163,184,0.18)", background: "rgba(2,8,19,0.55)", color: "#ffffff", borderRadius: "10px", padding: "13px 12px", fontSize: "14px", boxSizing: "border-box", outline: "none" },
  textarea: { minHeight: "90px", resize: "vertical" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" },
};
