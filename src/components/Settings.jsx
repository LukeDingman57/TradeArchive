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

  const saveSettings = (nextSettings, successMessage = "Saved") => {
    setSettings(nextSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    setMessage(successMessage);
    window.clearTimeout(window.__taSettingsToast);
    window.__taSettingsToast = window.setTimeout(() => setMessage(""), 2200);
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
      setMessage("Log in first");
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      setMessage("Password reset sent");
    } catch (err) {
      setMessage(err?.message || "Could not send reset email");
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
    setMessage("Export downloaded");
  };

  const resetLocalSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(defaultSettings);
    setMessage("Local settings reset");
  };

  const navItems = useMemo(
    () => [
      { id: "account", label: "Account", icon: "User" },
      { id: "preferences", label: "Preferences", icon: "Sliders" },
      { id: "journal", label: "Journal", icon: "Journal" },
      { id: "news", label: "News", icon: "Calendar" },
      { id: "billing", label: "Billing", icon: "Card" },
      { id: "support", label: "Support", icon: "Help" },
      { id: "privacy", label: "Privacy", icon: "Shield" },
    ],
    []
  );

  const activeItem = navItems.find((item) => item.id === activeSection);

  const handleNavClick = (id) => {
    if (id === "billing") {
      setActiveSection("billing");
      return;
    }

    setActiveSection(id);
    setMessage("");
  };

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>Settings</p>
            <h1 style={styles.title}>Workspace settings</h1>
            <p style={styles.subtitle}>Manage your account, defaults, billing, and TradeArchive preferences.</p>
          </div>
        </div>

        {billingError ? <div style={styles.errorBox}>{billingError}</div> : null}
        {message ? <div style={styles.toast}>{message}</div> : null}

        <div style={styles.settingsFrame}>
          <aside style={styles.settingsNav}>
            <div style={styles.navHeader}>General</div>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
                >
                  <span style={{ ...styles.navIcon, ...(isActive ? styles.navIconActive : {}) }}>
                    {iconMap[item.icon]}
                  </span>
                  <span style={styles.navLabel}>{item.label}</span>
                </button>
              );
            })}

            <div style={styles.navFooter}>
              <div style={styles.footerBrand}>TradeArchive</div>
              <div style={styles.footerText}>v1.0 · Funded trader workspace</div>
            </div>
          </aside>

          <section style={styles.contentPanel}>
            <div style={styles.panelTop}>
              <div>
                <div style={styles.panelKicker}>{activeItem?.label}</div>
                <h2 style={styles.panelTitle}>{panelMeta[activeSection]?.title}</h2>
                <p style={styles.panelSubtitle}>{panelMeta[activeSection]?.subtitle}</p>
              </div>
            </div>

            <div style={styles.divider} />
            {renderPanel()}
          </section>
        </div>
      </div>
    </main>
  );

  function renderPanel() {
    if (activeSection === "account") {
      return (
        <PanelStack>
          <SettingGroup title="Profile" text="Basic account information tied to this login.">
            <SettingRow label="Email address" description="Used for login, billing, and password resets.">
              <ReadOnlyValue value={session?.user?.email || "Not logged in"} />
            </SettingRow>
          </SettingGroup>

          <SettingGroup title="Security" text="Manage access to your account.">
            <SettingRow label="Password" description="Send a reset link to your email.">
              <button style={styles.primaryButton} onClick={sendPasswordReset} disabled={resetLoading}>
                {resetLoading ? "Sending..." : "Send reset"}
              </button>
            </SettingRow>
            <SettingRow label="Session" description="Sign out of this device.">
              <button style={styles.secondaryButton} onClick={onLogout}>Logout</button>
            </SettingRow>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "preferences") {
      return (
        <PanelStack>
          <SettingGroup title="Appearance" text="Control how TradeArchive looks and displays time.">
            <SettingRow label="Theme" description="Choose your preferred app appearance.">
              <SelectField value={settings.preferences.theme} options={["Dark", "Light", "System"]} onChange={(value) => updateSection("preferences", "theme", value)} />
            </SettingRow>
            <SettingRow label="Timezone" description="Used for calendars and journal timestamps.">
              <SelectField value={settings.preferences.timezone} options={["Local time", "New York time", "UTC"]} onChange={(value) => updateSection("preferences", "timezone", value)} />
            </SettingRow>
          </SettingGroup>

          <SettingGroup title="Formats" text="Set your preferred trading display defaults.">
            <SettingRow label="Currency" description="Default currency for performance and risk.">
              <SelectField value={settings.preferences.currency} options={["USD", "EUR", "GBP", "CAD", "AUD"]} onChange={(value) => updateSection("preferences", "currency", value)} />
            </SettingRow>
            <SettingRow label="Date format" description="How dates are shown across the app.">
              <SelectField value={settings.preferences.dateFormat} options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} onChange={(value) => updateSection("preferences", "dateFormat", value)} />
            </SettingRow>
            <SettingRow label="Time format" description="Choose 12-hour or 24-hour time.">
              <SelectField value={settings.preferences.timeFormat} options={["12 hour", "24 hour"]} onChange={(value) => updateSection("preferences", "timeFormat", value)} />
            </SettingRow>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "journal") {
      return (
        <PanelStack>
          <SettingGroup title="Trade defaults" text="Pre-fill fields when logging a new trade.">
            <SettingRow label="Default risk" description="Your typical risk per trade.">
              <TextField value={settings.journal.defaultRisk} onChange={(value) => updateSection("journal", "defaultRisk", value)} prefix="$" />
            </SettingRow>
            <SettingRow label="Default instrument" description="Example: MNQ, NQ, MES, ES.">
              <TextField value={settings.journal.defaultInstrument} onChange={(value) => updateSection("journal", "defaultInstrument", value)} />
            </SettingRow>
            <SettingRow label="Default account" description="Optional prop account name.">
              <TextField value={settings.journal.defaultAccount} onChange={(value) => updateSection("journal", "defaultAccount", value)} placeholder="Topstep 50k, Alpha Zero..." />
            </SettingRow>
            <SettingRow label="Minimum RR" description="Minimum reward-to-risk before taking a trade.">
              <TextField value={settings.journal.defaultRR} onChange={(value) => updateSection("journal", "defaultRR", value)} />
            </SettingRow>
          </SettingGroup>

          <SettingGroup title="Behavior" text="Control how your journal remembers trade inputs.">
            <SettingRow label="Auto-save drafts" description="Keep unfinished trade entries saved locally.">
              <Toggle checked={settings.journal.autoSaveDrafts} onChange={(value) => updateSection("journal", "autoSaveDrafts", value)} />
            </SettingRow>
            <SettingRow label="Remember last trade values" description="Use previous trade values as the next default.">
              <Toggle checked={settings.journal.rememberLastValues} onChange={(value) => updateSection("journal", "rememberLastValues", value)} />
            </SettingRow>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "news") {
      return (
        <PanelStack>
          <SettingGroup title="Economic calendar" text="Choose what news events show by default.">
            <SettingRow label="Currencies" description="Filter the calendar by currencies.">
              <OptionGroup options={["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"]} selected={settings.news.currencies} onToggle={(value) => toggleArrayValue("news", "currencies", value)} />
            </SettingRow>
            <SettingRow label="Impact" description="Choose the event importance levels shown.">
              <OptionGroup options={["High", "Medium", "Low"]} selected={settings.news.impacts} onToggle={(value) => toggleArrayValue("news", "impacts", value)} />
            </SettingRow>
            <SettingRow label="Default range" description="The calendar range opened first.">
              <SelectField value={settings.news.range} options={["Today", "Tomorrow", "This Week"]} onChange={(value) => updateSection("news", "range", value)} />
            </SettingRow>
          </SettingGroup>

          <SettingGroup title="Calendar behavior" text="Useful display settings for news prep.">
            <SettingRow label="Show countdown timers" description="Display time remaining until the next event.">
              <Toggle checked={settings.news.showCountdowns} onChange={(value) => updateSection("news", "showCountdowns", value)} />
            </SettingRow>
            <SettingRow label="Auto refresh calendar" description="Refresh events without manually reloading.">
              <Toggle checked={settings.news.autoRefresh} onChange={(value) => updateSection("news", "autoRefresh", value)} />
            </SettingRow>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "billing") {
      return (
        <PanelStack>
          <SettingGroup title="Subscription" text="Manage your plan, payment method, and invoices.">
            <SettingRow label="Current plan" description="Open Stripe to view subscription details.">
              <button style={styles.primaryButton} onClick={onManageBilling} disabled={portalLoading}>
                {portalLoading ? "Opening..." : "Manage billing"}
              </button>
            </SettingRow>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "support") {
      return (
        <PanelStack>
          <SettingGroup title="Contact" text="Make it easy for traders to reach you.">
            <SettingRow label="Contact support" description="Send a general support message.">
              <button style={styles.primaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=TradeArchive Support")}>Email support</button>
            </SettingRow>
            <SettingRow label="Report a bug" description="Let users report something broken.">
              <button style={styles.secondaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Bug Report")}>Report bug</button>
            </SettingRow>
            <SettingRow label="Request a feature" description="Collect feature ideas from users.">
              <button style={styles.secondaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Feature Request")}>Request feature</button>
            </SettingRow>
          </SettingGroup>

          <SettingGroup title="Community" text="Add your Discord invite when the server is ready.">
            <SettingRow label="Discord" description="Create a server for feedback, updates, and user support.">
              <ReadOnlyValue value="Not connected yet" />
            </SettingRow>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "privacy") {
      return (
        <PanelStack>
          <SettingGroup title="Data" text="Give users control over their local settings and account data.">
            <SettingRow label="Export settings" description="Download your local preferences as JSON.">
              <button style={styles.primaryButton} onClick={exportSettings}>Export</button>
            </SettingRow>
            <SettingRow label="Reset local settings" description="Clear local preferences and return to defaults.">
              <button style={styles.secondaryButton} onClick={resetLocalSettings}>Reset</button>
            </SettingRow>
          </SettingGroup>

          <SettingGroup title="Danger zone" text="Sensitive account actions should require support or confirmation.">
            <div style={styles.dangerRow}>
              <div>
                <div style={styles.rowLabel}>Delete account</div>
                <div style={styles.rowDescription}>Until a secure delete endpoint exists, route this through support.</div>
              </div>
              <button style={styles.dangerButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Delete My TradeArchive Account")}>Request deletion</button>
            </div>
          </SettingGroup>
        </PanelStack>
      );
    }

    return null;
  }
}

function PanelStack({ children }) {
  return <div style={styles.panelStack}>{children}</div>;
}

function SettingGroup({ title, text, children }) {
  return (
    <div style={styles.group}>
      <div style={styles.groupHeader}>
        <h3 style={styles.groupTitle}>{title}</h3>
        <p style={styles.groupText}>{text}</p>
      </div>
      <div style={styles.groupRows}>{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div style={styles.settingRow}>
      <div style={styles.rowCopy}>
        <div style={styles.rowLabel}>{label}</div>
        <div style={styles.rowDescription}>{description}</div>
      </div>
      <div style={styles.rowControl}>{children}</div>
    </div>
  );
}

function ReadOnlyValue({ value }) {
  return <div style={styles.readOnlyValue}>{value}</div>;
}

function TextField({ value, onChange, placeholder, prefix }) {
  return (
    <div style={styles.inputWrap}>
      {prefix ? <span style={styles.prefix}>{prefix}</span> : null}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...styles.input, ...(prefix ? styles.inputWithPrefix : {}) }}
      />
    </div>
  );
}

function SelectField({ value, options, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={styles.input}>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ ...styles.toggle, ...(checked ? styles.toggleOn : {}) }}>
      <span style={{ ...styles.toggleDot, ...(checked ? styles.toggleDotOn : {}) }} />
    </button>
  );
}

function OptionGroup({ options, selected, onToggle }) {
  return (
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
  );
}

const panelMeta = {
  account: {
    title: "Account",
    subtitle: "Login, email, and account access.",
  },
  preferences: {
    title: "Preferences",
    subtitle: "Set your default workspace display options.",
  },
  journal: {
    title: "Journal defaults",
    subtitle: "Pre-fill trade entries with your normal risk and instrument.",
  },
  news: {
    title: "News defaults",
    subtitle: "Control what the economic calendar shows first.",
  },
  billing: {
    title: "Billing",
    subtitle: "Manage subscription, invoices, and payment method.",
  },
  support: {
    title: "Support",
    subtitle: "Contact, bugs, feature requests, and community.",
  },
  privacy: {
    title: "Privacy",
    subtitle: "Export settings, reset data, and account controls.",
  },
};

const iconMap = {
  User: "◉",
  Sliders: "⌘",
  Journal: "▤",
  Calendar: "□",
  Card: "▭",
  Help: "?",
  Shield: "◇",
};

const styles = {
  page: {
    minHeight: "100vh",
    color: "white",
    background: "linear-gradient(180deg, #07101d 0%, #08111f 48%, #050b14 100%)",
    padding: "32px 36px 52px",
    boxSizing: "border-box",
  },
  shell: {
    width: "100%",
    maxWidth: "1380px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "28px",
  },
  eyebrow: {
    margin: "0 0 12px",
    color: "#93c5fd",
    fontSize: "12px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 900,
  },
  title: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.055em",
  },
  subtitle: {
    margin: "13px 0 0",
    color: "rgba(226,232,240,0.68)",
    fontSize: "15px",
    lineHeight: 1.65,
  },
  errorBox: {
    marginBottom: "16px",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "rgba(239,68,68,0.11)",
    border: "1px solid rgba(239,68,68,0.24)",
    color: "#fecaca",
    fontWeight: 800,
    fontSize: "13px",
  },
  toast: {
    position: "fixed",
    right: "28px",
    bottom: "28px",
    zIndex: 1000,
    borderRadius: "14px",
    padding: "12px 14px",
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(96,165,250,0.24)",
    color: "#dbeafe",
    boxShadow: "0 18px 38px rgba(0,0,0,0.35)",
    fontSize: "13px",
    fontWeight: 900,
  },
  settingsFrame: {
    display: "grid",
    gridTemplateColumns: "220px minmax(0, 1fr)",
    gap: "22px",
    alignItems: "start",
  },
  settingsNav: {
    position: "sticky",
    top: "24px",
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(8,15,28,0.54)",
    borderRadius: "20px",
    padding: "14px",
    boxShadow: "0 18px 42px rgba(0,0,0,0.20)",
  },
  navHeader: {
    padding: "8px 10px 10px",
    color: "rgba(148,163,184,0.70)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  navItem: {
    width: "100%",
    height: "38px",
    border: "1px solid transparent",
    borderRadius: "13px",
    background: "transparent",
    color: "rgba(226,232,240,0.72)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 10px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: 800,
    textAlign: "left",
  },
  navItemActive: {
    background: "rgba(59,130,246,0.14)",
    border: "1px solid rgba(96,165,250,0.26)",
    color: "#ffffff",
  },
  navIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "9px",
    background: "rgba(148,163,184,0.10)",
    color: "rgba(203,213,225,0.72)",
    display: "grid",
    placeItems: "center",
    fontSize: "12px",
    fontWeight: 950,
    flexShrink: 0,
  },
  navIconActive: {
    background: "rgba(59,130,246,0.22)",
    color: "#bfdbfe",
  },
  navLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  navFooter: {
    marginTop: "18px",
    padding: "14px 10px 4px",
    borderTop: "1px solid rgba(148,163,184,0.10)",
  },
  footerBrand: {
    fontSize: "13px",
    fontWeight: 950,
    color: "rgba(255,255,255,0.90)",
  },
  footerText: {
    marginTop: "5px",
    color: "rgba(148,163,184,0.66)",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  contentPanel: {
    minHeight: "500px",
    border: "1px solid rgba(148,163,184,0.12)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.70), rgba(8,15,28,0.52))",
    borderRadius: "24px",
    padding: "26px 32px 30px",
    boxShadow: "0 22px 54px rgba(0,0,0,0.24)",
  },
  panelTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },
  panelKicker: {
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },
  panelSubtitle: {
    margin: "9px 0 0",
    color: "rgba(226,232,240,0.62)",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  divider: {
    height: "1px",
    background: "rgba(148,163,184,0.12)",
    margin: "20px 0 22px",
  },
  panelStack: {
    display: "grid",
    gap: "20px",
  },
  group: {
    display: "grid",
    gridTemplateColumns: "200px minmax(0, 1fr)",
    gap: "26px",
    alignItems: "start",
  },
  groupHeader: {
    paddingTop: "3px",
  },
  groupTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 950,
    color: "rgba(255,255,255,0.92)",
  },
  groupText: {
    margin: "8px 0 0",
    color: "rgba(148,163,184,0.70)",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  groupRows: {
    border: "1px solid rgba(148,163,184,0.11)",
    borderRadius: "18px",
    overflow: "hidden",
    background: "rgba(2,6,23,0.24)",
  },
  settingRow: {
    minHeight: "64px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 260px",
    gap: "18px",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid rgba(148,163,184,0.09)",
  },
  rowCopy: {
    minWidth: 0,
  },
  rowLabel: {
    fontSize: "14px",
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
  },
  rowDescription: {
    marginTop: "5px",
    color: "rgba(148,163,184,0.70)",
    fontSize: "12.5px",
    lineHeight: 1.5,
  },
  rowControl: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    minWidth: 0,
  },
  readOnlyValue: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(15,23,42,0.52)",
    color: "rgba(255,255,255,0.90)",
    borderRadius: "13px",
    padding: "12px 13px",
    fontSize: "13.5px",
    fontWeight: 800,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  inputWrap: {
    position: "relative",
    width: "100%",
  },
  prefix: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255,255,255,0.52)",
    fontWeight: 900,
    fontSize: "13px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(15,23,42,0.58)",
    color: "white",
    borderRadius: "13px",
    padding: "12px 13px",
    fontSize: "13.5px",
    outline: "none",
  },
  inputWithPrefix: {
    paddingLeft: "28px",
  },
  primaryButton: {
    border: "1px solid rgba(96,165,250,0.45)",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    borderRadius: "12px",
    padding: "11px 14px",
    fontWeight: 900,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 22px rgba(37,99,235,0.22)",
  },
  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.055)",
    color: "white",
    borderRadius: "12px",
    padding: "11px 14px",
    fontWeight: 900,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  toggle: {
    width: "46px",
    height: "26px",
    border: "none",
    borderRadius: "999px",
    background: "rgba(148,163,184,0.22)",
    position: "relative",
    transition: "0.2s",
    cursor: "pointer",
    padding: 0,
  },
  toggleOn: {
    background: "rgba(59,130,246,0.76)",
  },
  toggleDot: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    background: "white",
    position: "absolute",
    left: "3px",
    top: "3px",
    transition: "0.2s",
  },
  toggleDotOn: {
    left: "23px",
  },
  optionGrid: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "8px",
  },
  optionButton: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.045)",
    color: "rgba(255,255,255,0.74)",
    borderRadius: "999px",
    padding: "8px 11px",
    fontSize: "12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  optionButtonActive: {
    border: "1px solid rgba(96,165,250,0.45)",
    background: "rgba(59,130,246,0.20)",
    color: "#bfdbfe",
  },
  dangerRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "20px",
    alignItems: "center",
    padding: "18px",
    background: "rgba(239,68,68,0.06)",
  },
  dangerButton: {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.14)",
    color: "#fecaca",
    borderRadius: "12px",
    padding: "11px 14px",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
