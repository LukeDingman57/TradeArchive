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
      preferences: {
        ...defaultSettings.preferences,
        ...(saved.preferences || {}),
      },
      journal: {
        ...defaultSettings.journal,
        ...(saved.journal || {}),
      },
      news: {
        ...defaultSettings.news,
        ...(saved.news || {}),
      },
      notifications: {
        ...defaultSettings.notifications,
        ...(saved.notifications || {}),
      },
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
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const navItems = useMemo(
    () => [
      {
        id: "account",
        icon: "U",
        title: "Account",
        text: "Login, email, and account access",
        keywords: "account email password login logout profile",
      },
      {
        id: "preferences",
        icon: "P",
        title: "Preferences",
        text: "Theme, timezone, currency, and formats",
        keywords: "theme timezone currency date time format preferences",
      },
      {
        id: "journal",
        icon: "J",
        title: "Journal Defaults",
        text: "Risk, instrument, RR, and draft settings",
        keywords: "journal risk instrument account rr drafts trades",
      },
      {
        id: "news",
        icon: "N",
        title: "News Defaults",
        text: "Calendar filters and reminders",
        keywords: "news economic calendar currencies impact countdown refresh",
      },
      {
        id: "billing",
        icon: "B",
        title: "Billing",
        text: "Subscription, invoices, and payment method",
        keywords: "billing subscription stripe invoice payment plan upgrade",
      },
      {
        id: "support",
        icon: "S",
        title: "Support",
        text: "Contact, bugs, feedback, and feature requests",
        keywords: "support contact bug feature request discord help",
      },
      {
        id: "privacy",
        icon: "L",
        title: "Privacy",
        text: "Exports, local settings, and account deletion",
        keywords: "privacy export delete data settings local account",
      },
    ],
    []
  );

  const filteredNavItems = navItems.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return `${item.title} ${item.text} ${item.keywords}`
      .toLowerCase()
      .includes(query);
  });

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
      const { error } = await supabase.auth.resetPasswordForEmail(
        session.user.email,
        {
          redirectTo: window.location.origin,
        }
      );

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

  const handleNavClick = (id) => {
    if (id === "billing") {
      onManageBilling?.();
      return;
    }

    setActiveSection(id);
    setMessage("");
  };

  const currentSection = navItems.find((item) => item.id === activeSection);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>SETTINGS</p>
            <h1 style={styles.title}>Settings</h1>
            <p style={styles.subtitle}>
              Manage your TradeArchive account, defaults, and workspace preferences.
            </p>
          </div>

          <div style={styles.accountPill}>
            <div style={styles.accountDot}>TA</div>
            <div style={styles.accountTextWrap}>
              <div style={styles.accountPillLabel}>Signed in as</div>
              <div style={styles.accountEmail}>
                {session?.user?.email || "Guest user"}
              </div>
            </div>
          </div>
        </div>

        {billingError ? <div style={styles.errorBox}>{billingError}</div> : null}
        {message ? <div style={styles.successBox}>{message}</div> : null}

        <div style={styles.settingsShell}>
          <aside style={styles.navPanel}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search settings"
                style={styles.searchInput}
              />
            </div>

            <div style={styles.navGroupLabel}>Workspace</div>

            <nav style={styles.navList}>
              {filteredNavItems.map((item) => {
                const isActive = activeSection === item.id;
                const isBilling = item.id === "billing";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      ...styles.navButton,
                      ...(isActive ? styles.navButtonActive : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.navIcon,
                        ...(isActive ? styles.navIconActive : {}),
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={styles.navCopy}>
                      <span style={styles.navTitle}>{item.title}</span>
                      <span style={styles.navSub}>{item.text}</span>
                    </span>
                    <span style={styles.navArrow}>
                      {isBilling && portalLoading ? "..." : "›"}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div style={styles.sidebarFooter}>
              <div style={styles.footerBrand}>TradeArchive</div>
              <div style={styles.footerText}>Version 1.0 • Funded trader workspace</div>
            </div>
          </aside>

          <main style={styles.detailPanel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>{currentSection?.title}</h2>
                <p style={styles.panelSubtitle}>{currentSection?.text}</p>
              </div>

              {activeSection !== "account" && activeSection !== "support" && activeSection !== "privacy" ? (
                <span style={styles.savedBadge}>Auto-saves</span>
              ) : null}
            </div>

            <div style={styles.divider} />

            {renderPanel()}
          </main>
        </div>
      </div>
    </div>
  );

  function renderPanel() {
    if (activeSection === "account") {
      return (
        <PanelStack>
          <PanelSection
            title="Profile"
            description="This is the email connected to your TradeArchive account."
          >
            <InfoRow label="Email address" value={session?.user?.email || "Not logged in"} />
          </PanelSection>

          <PanelSection
            title="Security"
            description="Send a reset email if you need to change your password."
          >
            <div style={styles.buttonRow}>
              <button
                style={styles.primaryButton}
                onClick={sendPasswordReset}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send password reset"}
              </button>
              <button style={styles.secondaryButton} onClick={onLogout}>
                Logout
              </button>
            </div>
          </PanelSection>
        </PanelStack>
      );
    }

    if (activeSection === "preferences") {
      return (
        <PanelStack>
          <PanelSection title="Display" description="Choose how the app should look and format time.">
            <SettingsGrid>
              <SelectField
                label="Theme"
                value={settings.preferences.theme}
                options={["Dark", "Light", "System"]}
                onChange={(value) => updateSection("preferences", "theme", value)}
              />
              <SelectField
                label="Timezone"
                value={settings.preferences.timezone}
                options={["Local time", "New York time", "UTC"]}
                onChange={(value) => updateSection("preferences", "timezone", value)}
              />
              <SelectField
                label="Date format"
                value={settings.preferences.dateFormat}
                options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]}
                onChange={(value) => updateSection("preferences", "dateFormat", value)}
              />
              <SelectField
                label="Time format"
                value={settings.preferences.timeFormat}
                options={["12 hour", "24 hour"]}
                onChange={(value) => updateSection("preferences", "timeFormat", value)}
              />
            </SettingsGrid>
          </PanelSection>

          <PanelSection title="Money" description="Used for risk, performance, and account values.">
            <SelectField
              label="Currency"
              value={settings.preferences.currency}
              options={["USD", "EUR", "GBP", "CAD", "AUD"]}
              onChange={(value) => updateSection("preferences", "currency", value)}
            />
          </PanelSection>
        </PanelStack>
      );
    }

    if (activeSection === "journal") {
      return (
        <PanelStack>
          <PanelSection title="Trade entry defaults" description="These defaults pre-fill your journal when adding trades.">
            <SettingsGrid>
              <TextField
                label="Default risk"
                value={settings.journal.defaultRisk}
                onChange={(value) => updateSection("journal", "defaultRisk", value)}
                prefix="$"
              />
              <TextField
                label="Default instrument"
                value={settings.journal.defaultInstrument}
                onChange={(value) => updateSection("journal", "defaultInstrument", value)}
              />
              <TextField
                label="Default account"
                value={settings.journal.defaultAccount}
                onChange={(value) => updateSection("journal", "defaultAccount", value)}
                placeholder="Topstep 50k, Alpha Zero..."
              />
              <TextField
                label="Minimum RR"
                value={settings.journal.defaultRR}
                onChange={(value) => updateSection("journal", "defaultRR", value)}
              />
            </SettingsGrid>
          </PanelSection>

          <PanelSection title="Journal behavior" description="Control how trade drafts are handled.">
            <Toggle
              label="Auto-save drafts"
              text="Keep unsaved journal entries from being lost."
              checked={settings.journal.autoSaveDrafts}
              onChange={(value) => updateSection("journal", "autoSaveDrafts", value)}
            />
            <Toggle
              label="Remember last trade values"
              text="Use the previous trade as the starting point for the next one."
              checked={settings.journal.rememberLastValues}
              onChange={(value) => updateSection("journal", "rememberLastValues", value)}
            />
          </PanelSection>
        </PanelStack>
      );
    }

    if (activeSection === "news") {
      return (
        <PanelStack>
          <PanelSection title="Calendar filters" description="Pick the news events you want shown by default.">
            <OptionGroup
              label="Currencies"
              options={["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"]}
              selected={settings.news.currencies}
              onToggle={(value) => toggleArrayValue("news", "currencies", value)}
            />
            <OptionGroup
              label="Impact"
              options={["High", "Medium", "Low"]}
              selected={settings.news.impacts}
              onToggle={(value) => toggleArrayValue("news", "impacts", value)}
            />
            <SelectField
              label="Default range"
              value={settings.news.range}
              options={["Today", "Tomorrow", "This Week"]}
              onChange={(value) => updateSection("news", "range", value)}
            />
          </PanelSection>

          <PanelSection title="News behavior" description="Control countdowns and automatic refreshes.">
            <Toggle
              label="Show countdown timers"
              text="Display a timer before high-impact events."
              checked={settings.news.showCountdowns}
              onChange={(value) => updateSection("news", "showCountdowns", value)}
            />
            <Toggle
              label="Auto refresh calendar"
              text="Keep the economic calendar updated while you are using the app."
              checked={settings.news.autoRefresh}
              onChange={(value) => updateSection("news", "autoRefresh", value)}
            />
          </PanelSection>
        </PanelStack>
      );
    }

    if (activeSection === "support") {
      return (
        <PanelStack>
          <PanelSection title="Contact" description="Give users a simple way to reach you.">
            <ActionList>
              <ActionRow
                title="Contact support"
                text="Ask a question or get help with your account."
                button="Email"
                onClick={() =>
                  (window.location.href =
                    "mailto:support@tradearchive.net?subject=TradeArchive Support")
                }
              />
              <ActionRow
                title="Report a bug"
                text="Send details about something not working correctly."
                button="Report"
                onClick={() =>
                  (window.location.href =
                    "mailto:support@tradearchive.net?subject=Bug Report")
                }
              />
              <ActionRow
                title="Request a feature"
                text="Tell us what would make TradeArchive more useful."
                button="Request"
                onClick={() =>
                  (window.location.href =
                    "mailto:support@tradearchive.net?subject=Feature Request")
                }
              />
            </ActionList>
          </PanelSection>

          <PanelSection title="Community" description="Add your Discord invite once the server is ready.">
            <div style={styles.emptyState}>
              Discord community is not connected yet.
            </div>
          </PanelSection>
        </PanelStack>
      );
    }

    if (activeSection === "privacy") {
      return (
        <PanelStack>
          <PanelSection title="Your data" description="Export and reset local workspace settings.">
            <ActionList>
              <ActionRow
                title="Export settings"
                text="Download your local settings as a JSON file."
                button="Export"
                onClick={exportSettings}
              />
              <ActionRow
                title="Reset local settings"
                text="Restore preferences, journal defaults, and news defaults."
                button="Reset"
                onClick={resetLocalSettings}
              />
            </ActionList>
          </PanelSection>

          <PanelSection title="Danger zone" description="Account deletion should be handled carefully.">
            <div style={styles.dangerBox}>
              <div>
                <div style={styles.dangerTitle}>Delete account</div>
                <div style={styles.dangerText}>
                  Until you add a secure delete-account API endpoint, route these requests through support.
                </div>
              </div>
              <button
                style={styles.dangerButton}
                onClick={() =>
                  (window.location.href =
                    "mailto:support@tradearchive.net?subject=Delete My TradeArchive Account")
                }
              >
                Request deletion
              </button>
            </div>
          </PanelSection>
        </PanelStack>
      );
    }

    return null;
  }
}

function PanelStack({ children }) {
  return <div style={styles.panelStack}>{children}</div>;
}

function PanelSection({ title, description, children }) {
  return (
    <section style={styles.sectionBlock}>
      <div style={styles.sectionIntro}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        <p style={styles.sectionDescription}>{description}</p>
      </div>
      <div style={styles.sectionContent}>{children}</div>
    </section>
  );
}

function SettingsGrid({ children }) {
  return <div style={styles.settingsGrid}>{children}</div>;
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
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, text, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={styles.toggleRow}>
      <span>
        <span style={styles.toggleTitle}>{label}</span>
        <span style={styles.toggleText}>{text}</span>
      </span>
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
              style={{
                ...styles.optionButton,
                ...(isSelected ? styles.optionButtonActive : {}),
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionList({ children }) {
  return <div style={styles.actionList}>{children}</div>;
}

function ActionRow({ title, text, button, onClick }) {
  return (
    <div style={styles.actionRow}>
      <div>
        <div style={styles.actionTitle}>{title}</div>
        <div style={styles.actionText}>{text}</div>
      </div>
      <button style={styles.secondaryButton} onClick={onClick}>
        {button}
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "white",
    background:
      "radial-gradient(circle at top left, rgba(37,99,235,0.10), transparent 30%), linear-gradient(180deg, #07101d 0%, #08111f 44%, #050b14 100%)",
    padding: "34px 34px 64px",
    boxSizing: "border-box",
  },
  shell: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "24px",
  },
  eyebrow: {
    margin: "0 0 9px",
    color: "#93c5fd",
    fontSize: "12px",
    letterSpacing: "0.16em",
    fontWeight: 900,
  },
  title: {
    margin: "0 0 8px",
    fontSize: "48px",
    lineHeight: 0.95,
    fontWeight: 950,
    letterSpacing: "-0.055em",
  },
  subtitle: {
    margin: 0,
    maxWidth: "680px",
    color: "rgba(226,232,240,0.68)",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  accountPill: {
    minWidth: "280px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(15,23,42,0.48)",
    borderRadius: "18px",
    padding: "12px 14px",
    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
  },
  accountDot: {
    width: "36px",
    height: "36px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    background: "rgba(59,130,246,0.18)",
    border: "1px solid rgba(96,165,250,0.22)",
    color: "#bfdbfe",
    fontSize: "12px",
    fontWeight: 950,
    flexShrink: 0,
  },
  accountTextWrap: { minWidth: 0 },
  accountPillLabel: {
    color: "rgba(148,163,184,0.78)",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "3px",
  },
  accountEmail: {
    color: "rgba(248,250,252,0.88)",
    fontSize: "13px",
    fontWeight: 800,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  errorBox: {
    marginBottom: "14px",
    borderRadius: "16px",
    padding: "13px 15px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#fecaca",
    fontWeight: 800,
  },
  successBox: {
    marginBottom: "14px",
    borderRadius: "16px",
    padding: "13px 15px",
    background: "rgba(34,197,94,0.10)",
    border: "1px solid rgba(34,197,94,0.22)",
    color: "#bbf7d0",
    fontWeight: 800,
  },
  settingsShell: {
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: "18px",
    alignItems: "stretch",
  },
  navPanel: {
    border: "1px solid rgba(148,163,184,0.12)",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.62), rgba(15,23,42,0.28))",
    borderRadius: "24px",
    padding: "14px",
    minHeight: "650px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 18px 44px rgba(0,0,0,0.22)",
  },
  searchWrap: {
    position: "relative",
    marginBottom: "16px",
  },
  searchIcon: {
    position: "absolute",
    left: "13px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(148,163,184,0.85)",
    fontSize: "17px",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(2,6,23,0.34)",
    color: "white",
    borderRadius: "16px",
    padding: "13px 14px 13px 38px",
    fontSize: "14px",
    outline: "none",
  },
  navGroupLabel: {
    color: "rgba(148,163,184,0.64)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    margin: "0 8px 8px",
  },
  navList: {
    display: "grid",
    gap: "5px",
  },
  navButton: {
    width: "100%",
    border: "1px solid transparent",
    background: "transparent",
    color: "white",
    borderRadius: "16px",
    padding: "11px 10px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    cursor: "pointer",
    textAlign: "left",
  },
  navButtonActive: {
    border: "1px solid rgba(96,165,250,0.26)",
    background: "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.58))",
    boxShadow: "0 12px 24px rgba(37,99,235,0.10)",
  },
  navIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    background: "rgba(148,163,184,0.08)",
    color: "rgba(203,213,225,0.80)",
    fontSize: "12px",
    fontWeight: 950,
    flexShrink: 0,
  },
  navIconActive: {
    background: "rgba(59,130,246,0.22)",
    color: "#bfdbfe",
  },
  navCopy: {
    flex: 1,
    minWidth: 0,
    display: "grid",
    gap: "3px",
  },
  navTitle: {
    color: "rgba(248,250,252,0.92)",
    fontSize: "14px",
    fontWeight: 900,
  },
  navSub: {
    color: "rgba(148,163,184,0.72)",
    fontSize: "12px",
    lineHeight: 1.35,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  navArrow: {
    color: "#93c5fd",
    fontSize: "18px",
    fontWeight: 900,
  },
  sidebarFooter: {
    marginTop: "auto",
    padding: "14px 8px 4px",
    borderTop: "1px solid rgba(148,163,184,0.10)",
  },
  footerBrand: {
    color: "rgba(248,250,252,0.92)",
    fontSize: "13px",
    fontWeight: 950,
    marginBottom: "5px",
  },
  footerText: {
    color: "rgba(148,163,184,0.66)",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  detailPanel: {
    border: "1px solid rgba(148,163,184,0.12)",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.72), rgba(15,23,42,0.38))",
    borderRadius: "24px",
    padding: "26px",
    minHeight: "650px",
    boxShadow: "0 18px 44px rgba(0,0,0,0.24)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
  },
  panelTitle: {
    margin: "0 0 7px",
    fontSize: "30px",
    fontWeight: 950,
    letterSpacing: "-0.045em",
  },
  panelSubtitle: {
    margin: 0,
    color: "rgba(226,232,240,0.62)",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  savedBadge: {
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid rgba(34,197,94,0.24)",
    background: "rgba(34,197,94,0.10)",
    color: "#bbf7d0",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 900,
  },
  divider: {
    height: "1px",
    background: "rgba(148,163,184,0.12)",
    margin: "22px 0",
  },
  panelStack: {
    display: "grid",
    gap: "26px",
  },
  sectionBlock: {
    display: "grid",
    gridTemplateColumns: "220px minmax(0, 1fr)",
    gap: "28px",
    alignItems: "start",
  },
  sectionIntro: {
    paddingTop: "4px",
  },
  sectionTitle: {
    margin: "0 0 7px",
    fontSize: "15px",
    fontWeight: 950,
    color: "rgba(248,250,252,0.92)",
  },
  sectionDescription: {
    margin: 0,
    color: "rgba(148,163,184,0.72)",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  sectionContent: {
    display: "grid",
    gap: "12px",
  },
  settingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  fieldWrap: {
    display: "grid",
    gap: "7px",
  },
  fieldLabel: {
    color: "rgba(203,213,225,0.76)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  inputWrap: {
    position: "relative",
  },
  prefix: {
    position: "absolute",
    left: "13px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255,255,255,0.55)",
    fontWeight: 900,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(2,6,23,0.26)",
    color: "white",
    borderRadius: "14px",
    padding: "12px 13px",
    fontSize: "14px",
    outline: "none",
  },
  inputWithPrefix: {
    paddingLeft: "30px",
  },
  infoRow: {
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(2,6,23,0.20)",
    borderRadius: "16px",
    padding: "14px",
  },
  infoValue: {
    marginTop: "6px",
    fontSize: "15px",
    fontWeight: 850,
    color: "rgba(255,255,255,0.90)",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "1px solid rgba(96,165,250,0.45)",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    borderRadius: "13px",
    padding: "11px 14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(37,99,235,0.22)",
  },
  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(255,255,255,0.055)",
    color: "white",
    borderRadius: "13px",
    padding: "10px 13px",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  toggleRow: {
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(2,6,23,0.18)",
    color: "white",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    cursor: "pointer",
    textAlign: "left",
  },
  toggleTitle: {
    display: "block",
    fontSize: "14px",
    fontWeight: 900,
    color: "rgba(248,250,252,0.92)",
    marginBottom: "4px",
  },
  toggleText: {
    display: "block",
    fontSize: "12px",
    lineHeight: 1.45,
    color: "rgba(148,163,184,0.72)",
  },
  toggle: {
    width: "46px",
    height: "26px",
    borderRadius: "999px",
    background: "rgba(148,163,184,0.20)",
    position: "relative",
    transition: "0.2s",
    flexShrink: 0,
  },
  toggleOn: {
    background: "rgba(59,130,246,0.78)",
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
    flexWrap: "wrap",
    gap: "8px",
  },
  optionButton: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.045)",
    color: "rgba(255,255,255,0.74)",
    borderRadius: "999px",
    padding: "9px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  optionButtonActive: {
    border: "1px solid rgba(96,165,250,0.45)",
    background: "rgba(59,130,246,0.22)",
    color: "#bfdbfe",
  },
  actionList: {
    display: "grid",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: "18px",
    overflow: "hidden",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "15px",
    background: "rgba(2,6,23,0.16)",
    borderBottom: "1px solid rgba(148,163,184,0.10)",
  },
  actionTitle: {
    color: "rgba(248,250,252,0.92)",
    fontSize: "14px",
    fontWeight: 950,
    marginBottom: "4px",
  },
  actionText: {
    color: "rgba(148,163,184,0.72)",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  emptyState: {
    border: "1px dashed rgba(148,163,184,0.18)",
    color: "rgba(148,163,184,0.78)",
    background: "rgba(2,6,23,0.14)",
    borderRadius: "16px",
    padding: "18px",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  dangerBox: {
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(239,68,68,0.08)",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
  },
  dangerTitle: {
    color: "#fecaca",
    fontWeight: 950,
    fontSize: "15px",
    marginBottom: "5px",
  },
  dangerText: {
    color: "rgba(254,202,202,0.72)",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  dangerButton: {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.16)",
    color: "#fecaca",
    borderRadius: "13px",
    padding: "10px 13px",
    fontWeight: 900,
    cursor: "pointer",
    flexShrink: 0,
  },
};
