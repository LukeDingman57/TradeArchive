import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "tradearchive_settings_v1";

const defaultSettings = {
  preferences: {
    theme: "Dark",
    timezone: "Local time",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12 hour",
  },
  journal: {
    defaultRisk: "200",
    defaultInstrument: "MNQ",
    defaultAccount: "",
    defaultRR: "1.4",
    autoSaveDrafts: true,
    rememberLastValues: true,
  },
  news: {
    currencies: ["USD"],
    impacts: ["High", "Medium"],
    range: "Today",
    showCountdowns: true,
    autoRefresh: true,
  },
  notifications: {
    dailyJournalReminder: false,
    weeklyReview: false,
    payoutReminder: true,
    newsReminder: false,
  },
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...defaultSettings,
      ...saved,
      preferences: { ...defaultSettings.preferences, ...(saved.preferences || {}) },
      journal: { ...defaultSettings.journal, ...(saved.journal || {}) },
      news: { ...defaultSettings.news, ...(saved.news || {}) },
      notifications: { ...defaultSettings.notifications, ...(saved.notifications || {}) },
    };
  } catch {
    return defaultSettings;
  }
}

export default function Settings({
  session,
  billingError,
  portalLoading,
  onManageBilling,
  onLogout,
}) {
  const [activeSection, setActiveSection] = useState("account");
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const saveSettings = (nextSettings, successMessage = "Settings saved.") => {
    setSettings(nextSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    setMessage(successMessage);
  };

  const updateSection = (section, field, value) => {
    const nextSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    };

    saveSettings(nextSettings);
  };

  const toggleArrayValue = (section, field, value) => {
    const current = settings[section][field] || [];
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    updateSection(section, field, nextValues);
  };

  const sendPasswordReset = async () => {
    if (!session?.user?.email) {
      setMessage("Log in first to reset your password.");
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      setMessage("Password reset email sent.");
    } catch (err) {
      setMessage(err?.message || "Could not send password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const exportSettings = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      email: session?.user?.email || null,
      settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tradearchive-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Settings export downloaded.");
  };

  const resetLocalSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(defaultSettings);
    setMessage("Local settings reset.");
  };

  const cards = useMemo(
    () => [
      {
        id: "account",
        icon: "👤",
        title: "Account",
        text: session?.user?.email || "Manage your account details.",
        action: "Open",
      },
      {
        id: "preferences",
        icon: "⚙️",
        title: "Preferences",
        text: "Theme, timezone, currency, date format, and app defaults.",
        action: "Edit",
      },
      {
        id: "journal",
        icon: "📒",
        title: "Journal Defaults",
        text: "Default risk, instrument, checklist, screenshots, and trade settings.",
        action: "Edit",
      },
      {
        id: "news",
        icon: "📰",
        title: "News Defaults",
        text: "Default currencies, impact filters, date range, and event reminders.",
        action: "Edit",
      },
      {
        id: "billing",
        icon: "💳",
        title: "Billing",
        text: "Manage your subscription, invoices, and payment method.",
        action: portalLoading ? "Opening..." : "Open",
      },
      {
        id: "support",
        icon: "🛠️",
        title: "Support",
        text: "Contact support, report a bug, request a feature, or join Discord.",
        action: "Open",
      },
      {
        id: "privacy",
        icon: "🔒",
        title: "Privacy",
        text: "Export data, download trades, manage screenshots, or delete account.",
        action: "Open",
      },
    ],
    [portalLoading, session?.user?.email]
  );

  const handleCardClick = (id) => {
    if (id === "billing") {
      onManageBilling?.();
      return;
    }

    setActiveSection(id);
    setMessage("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.eyebrow}>SETTINGS</p>
        <h1 style={styles.title}>Manage your workspace</h1>
        <p style={styles.subtitle}>
          Control your account, billing, journal defaults, news preferences, and support options.
        </p>
      </div>

      {billingError ? <div style={styles.errorBox}>{billingError}</div> : null}
      {message ? <div style={styles.successBox}>{message}</div> : null}

      <div style={styles.layout}>
        <div style={styles.grid}>
          {cards.map((card) => {
            const isActive = activeSection === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                style={{
                  ...styles.card,
                  ...(isActive ? styles.activeCard : {}),
                }}
              >
                <div style={styles.cardIcon}>{card.icon}</div>
                <div style={styles.cardBody}>
                  <div style={styles.cardTitle}>{card.title}</div>
                  <div style={styles.cardText}>{card.text}</div>
                </div>
                <div style={styles.cardAction}>{card.action} ›</div>
              </button>
            );
          })}
        </div>

        <div style={styles.panel}>{renderPanel()}</div>
      </div>

      <div style={styles.versionCard}>
        <div>
          <div style={styles.versionTitle}>TradeArchive</div>
          <div style={styles.versionText}>Built for funded futures traders.</div>
        </div>
        <div style={styles.versionBadge}>v1.0</div>
      </div>
    </div>
  );

  function renderPanel() {
    if (activeSection === "account") {
      return (
        <Section title="Account" subtitle="Manage login and account access.">
          <InfoRow label="Email" value={session?.user?.email || "Not logged in"} />
          <div style={styles.buttonRow}>
            <button style={styles.primaryButton} onClick={sendPasswordReset} disabled={resetLoading}>
              {resetLoading ? "Sending..." : "Send password reset"}
            </button>
            <button style={styles.secondaryButton} onClick={onLogout}>Logout</button>
          </div>
        </Section>
      );
    }

    if (activeSection === "preferences") {
      return (
        <Section title="Preferences" subtitle="Save your default workspace options.">
          <SelectField label="Theme" value={settings.preferences.theme} options={["Dark", "Light", "System"]} onChange={(value) => updateSection("preferences", "theme", value)} />
          <SelectField label="Timezone" value={settings.preferences.timezone} options={["Local time", "New York time", "UTC"]} onChange={(value) => updateSection("preferences", "timezone", value)} />
          <SelectField label="Currency" value={settings.preferences.currency} options={["USD", "EUR", "GBP", "CAD", "AUD"]} onChange={(value) => updateSection("preferences", "currency", value)} />
          <SelectField label="Date format" value={settings.preferences.dateFormat} options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} onChange={(value) => updateSection("preferences", "dateFormat", value)} />
          <SelectField label="Time format" value={settings.preferences.timeFormat} options={["12 hour", "24 hour"]} onChange={(value) => updateSection("preferences", "timeFormat", value)} />
        </Section>
      );
    }

    if (activeSection === "journal") {
      return (
        <Section title="Journal Defaults" subtitle="Defaults used when logging new trades.">
          <TextField label="Default risk" value={settings.journal.defaultRisk} onChange={(value) => updateSection("journal", "defaultRisk", value)} prefix="$" />
          <TextField label="Default instrument" value={settings.journal.defaultInstrument} onChange={(value) => updateSection("journal", "defaultInstrument", value)} />
          <TextField label="Default account" value={settings.journal.defaultAccount} onChange={(value) => updateSection("journal", "defaultAccount", value)} placeholder="Topstep 50k, Alpha Zero..." />
          <TextField label="Minimum RR" value={settings.journal.defaultRR} onChange={(value) => updateSection("journal", "defaultRR", value)} />
          <Toggle label="Auto-save drafts" checked={settings.journal.autoSaveDrafts} onChange={(value) => updateSection("journal", "autoSaveDrafts", value)} />
          <Toggle label="Remember last trade values" checked={settings.journal.rememberLastValues} onChange={(value) => updateSection("journal", "rememberLastValues", value)} />
        </Section>
      );
    }

    if (activeSection === "news") {
      return (
        <Section title="News Defaults" subtitle="Control what the economic calendar shows first.">
          <OptionGroup label="Currencies" options={["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"]} selected={settings.news.currencies} onToggle={(value) => toggleArrayValue("news", "currencies", value)} />
          <OptionGroup label="Impact" options={["High", "Medium", "Low"]} selected={settings.news.impacts} onToggle={(value) => toggleArrayValue("news", "impacts", value)} />
          <SelectField label="Default range" value={settings.news.range} options={["Today", "Tomorrow", "This Week"]} onChange={(value) => updateSection("news", "range", value)} />
          <Toggle label="Show countdown timers" checked={settings.news.showCountdowns} onChange={(value) => updateSection("news", "showCountdowns", value)} />
          <Toggle label="Auto refresh calendar" checked={settings.news.autoRefresh} onChange={(value) => updateSection("news", "autoRefresh", value)} />
        </Section>
      );
    }

    if (activeSection === "support") {
      return (
        <Section title="Support" subtitle="Give users easy ways to contact you.">
          <button style={styles.primaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=TradeArchive Support")}>Contact Support</button>
          <button style={styles.secondaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Bug Report")}>Report a Bug</button>
          <button style={styles.secondaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Feature Request")}>Request a Feature</button>
          <div style={styles.note}>Add your Discord invite here once you make the server.</div>
        </Section>
      );
    }

    if (activeSection === "privacy") {
      return (
        <Section title="Privacy" subtitle="Data tools users expect in a real SaaS.">
          <button style={styles.primaryButton} onClick={exportSettings}>Export Settings</button>
          <button style={styles.secondaryButton} onClick={resetLocalSettings}>Reset Local Settings</button>
          <div style={styles.dangerBox}>
            <div style={styles.dangerTitle}>Delete account</div>
            <div style={styles.note}>For now, route deletion requests through support until you add a secure delete-account API endpoint.</div>
            <button style={styles.dangerButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Delete My TradeArchive Account")}>Request Account Deletion</button>
          </div>
        </Section>
      );
    }

    return null;
  }
}

function Section({ title, subtitle, children }) {
  return (
    <div>
      <h2 style={styles.panelTitle}>{title}</h2>
      <p style={styles.panelSubtitle}>{subtitle}</p>
      <div style={styles.panelContent}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, prefix }) {
  return (
    <label style={styles.fieldWrap}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.inputWrap}>
        {prefix ? <span style={styles.prefix}>{prefix}</span> : null}
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          style={{ ...styles.input, ...(prefix ? styles.inputWithPrefix : {}) }}
        />
      </div>
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label style={styles.fieldWrap}>
      <div style={styles.fieldLabel}>{label}</div>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={styles.input}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={styles.toggleRow}>
      <span>{label}</span>
      <span style={{ ...styles.toggle, ...(checked ? styles.toggleOn : {}) }}>
        <span style={{ ...styles.toggleDot, ...(checked ? styles.toggleDotOn : {}) }} />
      </span>
    </button>
  );
}

function OptionGroup({ label, options, selected, onToggle }) {
  return (
    <div style={styles.fieldWrap}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.optionGrid}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              style={{ ...styles.optionButton, ...(isSelected ? styles.optionButtonActive : {}) }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "46px 42px 70px",
    color: "white",
    background: "linear-gradient(180deg, #07101d 0%, #08111f 45%, #050b14 100%)",
  },
  header: { maxWidth: "900px", marginBottom: "28px" },
  eyebrow: { margin: "0 0 10px", color: "#93c5fd", fontSize: "13px", letterSpacing: "0.16em", fontWeight: 900 },
  title: { margin: "0 0 10px", fontSize: "46px", lineHeight: 1, fontWeight: 950, letterSpacing: "-0.05em" },
  subtitle: { margin: 0, maxWidth: "720px", color: "rgba(255,255,255,0.68)", fontSize: "16px", lineHeight: 1.65 },
  errorBox: { maxWidth: "1120px", marginBottom: "18px", borderRadius: "16px", padding: "13px 15px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fecaca", fontWeight: 800 },
  successBox: { maxWidth: "1120px", marginBottom: "18px", borderRadius: "16px", padding: "13px 15px", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)", color: "#bbf7d0", fontWeight: 800 },
  layout: { maxWidth: "1180px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "18px", alignItems: "start" },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: "14px" },
  card: { width: "100%", minHeight: "104px", border: "1px solid rgba(148,163,184,0.12)", background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))", borderRadius: "22px", padding: "18px", color: "white", display: "flex", alignItems: "center", gap: "15px", textAlign: "left", cursor: "pointer", boxShadow: "0 14px 34px rgba(0,0,0,0.20)" },
  activeCard: { border: "1px solid rgba(96,165,250,0.40)", background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(255,255,255,0.035))" },
  cardIcon: { width: "46px", height: "46px", borderRadius: "16px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(96,165,250,0.18)", display: "grid", placeItems: "center", fontSize: "20px", flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: "17px", fontWeight: 900, marginBottom: "6px" },
  cardText: { color: "rgba(255,255,255,0.62)", fontSize: "13px", lineHeight: 1.5 },
  cardAction: { color: "#93c5fd", fontSize: "13px", fontWeight: 900, whiteSpace: "nowrap" },
  panel: { minHeight: "420px", border: "1px solid rgba(148,163,184,0.12)", background: "linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.025))", borderRadius: "24px", padding: "24px", boxShadow: "0 18px 44px rgba(0,0,0,0.24)" },
  panelTitle: { margin: "0 0 8px", fontSize: "26px", fontWeight: 950, letterSpacing: "-0.03em" },
  panelSubtitle: { margin: "0 0 22px", color: "rgba(255,255,255,0.62)", lineHeight: 1.55 },
  panelContent: { display: "grid", gap: "14px" },
  fieldWrap: { display: "grid", gap: "7px" },
  fieldLabel: { color: "rgba(203,213,225,0.76)", fontSize: "12px", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase" },
  inputWrap: { position: "relative" },
  prefix: { position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.55)", fontWeight: 900 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid rgba(148,163,184,0.14)", background: "rgba(15,23,42,0.68)", color: "white", borderRadius: "14px", padding: "13px 14px", fontSize: "14px", outline: "none" },
  inputWithPrefix: { paddingLeft: "30px" },
  infoRow: { border: "1px solid rgba(148,163,184,0.12)", background: "rgba(15,23,42,0.44)", borderRadius: "16px", padding: "14px" },
  infoValue: { marginTop: "6px", fontSize: "15px", fontWeight: 800, color: "rgba(255,255,255,0.88)" },
  buttonRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  primaryButton: { border: "1px solid rgba(96,165,250,0.45)", background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)", color: "white", borderRadius: "14px", padding: "12px 15px", fontWeight: 900, cursor: "pointer" },
  secondaryButton: { border: "1px solid rgba(148,163,184,0.14)", background: "rgba(255,255,255,0.06)", color: "white", borderRadius: "14px", padding: "12px 15px", fontWeight: 900, cursor: "pointer", textAlign: "left" },
  toggleRow: { border: "1px solid rgba(148,163,184,0.12)", background: "rgba(15,23,42,0.44)", color: "white", borderRadius: "16px", padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontWeight: 800 },
  toggle: { width: "48px", height: "27px", borderRadius: "999px", background: "rgba(148,163,184,0.20)", position: "relative", transition: "0.2s" },
  toggleOn: { background: "rgba(59,130,246,0.75)" },
  toggleDot: { width: "21px", height: "21px", borderRadius: "999px", background: "white", position: "absolute", left: "3px", top: "3px", transition: "0.2s" },
  toggleDotOn: { left: "24px" },
  optionGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  optionButton: { border: "1px solid rgba(148,163,184,0.14)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.76)", borderRadius: "999px", padding: "9px 12px", fontWeight: 900, cursor: "pointer" },
  optionButtonActive: { border: "1px solid rgba(96,165,250,0.45)", background: "rgba(59,130,246,0.22)", color: "#bfdbfe" },
  note: { color: "rgba(255,255,255,0.62)", fontSize: "13px", lineHeight: 1.6 },
  dangerBox: { marginTop: "8px", border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.08)", borderRadius: "18px", padding: "16px", display: "grid", gap: "10px" },
  dangerTitle: { color: "#fecaca", fontWeight: 950, fontSize: "16px" },
  dangerButton: { border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.16)", color: "#fecaca", borderRadius: "14px", padding: "12px 15px", fontWeight: 900, cursor: "pointer" },
  versionCard: { maxWidth: "1180px", marginTop: "18px", border: "1px solid rgba(148,163,184,0.10)", background: "rgba(255,255,255,0.035)", borderRadius: "20px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  versionTitle: { fontSize: "16px", fontWeight: 900 },
  versionText: { marginTop: "5px", color: "rgba(255,255,255,0.58)", fontSize: "13px" },
  versionBadge: { padding: "8px 12px", borderRadius: "999px", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.22)", color: "#bfdbfe", fontSize: "12px", fontWeight: 900 },
};