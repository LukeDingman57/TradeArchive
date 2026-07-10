import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSettings } from "./SettingsContext";

export default function Settings({
  session,
  billingError,
  portalLoading,
  onManageBilling,
  onLogout,
}) {
  const [activeSection, setActiveSection] = useState("account");
  const [message, setMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const {
    settings,
    updateSection: contextUpdateSection,
    toggleArrayValue: contextToggleArrayValue,
    resetSettings,
  } = useSettings();

  const userEmail = session?.user?.email || "";
  const displayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    userEmail?.split("@")?.[0] ||
    "TradeArchive user";

  const showToast = (text) => {
    setMessage(text);
    window.clearTimeout(window.__taSettingsToast);
    window.__taSettingsToast = window.setTimeout(() => setMessage(""), 2200);
  };

  const updateSection = (section, field, value) => {
    contextUpdateSection(section, field, value);
    showToast("Saved");
  };

  const toggleArrayValue = (section, field, value) => {
    contextToggleArrayValue(section, field, value);
    showToast("Saved");
  };

  const sendPasswordReset = async () => {
    if (!session?.user?.email) {
      showToast("Log in first");
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      showToast("Password reset sent");
    } catch (err) {
      showToast(err?.message || "Could not send reset email");
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
    showToast("Export downloaded");
  };

  const resetLocalSettings = () => {
    resetSettings();
    showToast("Local settings reset");
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
    setActiveSection(id);
    setMessage("");
  };

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <div style={styles.shell}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>Settings</p>
            <h1 style={styles.title}>Workspace settings</h1>
            <p style={styles.subtitle}>
              Manage your account, defaults, billing, and TradeArchive preferences.
            </p>
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
            <div style={styles.panelGlow} />

            <div style={styles.panelTop}>
              <div>
                <div style={styles.panelKicker}>{activeItem?.label}</div>
                <h2 style={styles.panelTitle}>{panelMeta[activeSection]?.title}</h2>
                <p style={styles.panelSubtitle}>{panelMeta[activeSection]?.subtitle}</p>
              </div>

              {activeSection === "account" ? <SecurityArt /> : null}
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
            <SettingRows>
              <SettingRow icon="User" label="Full name">
                <ReadOnlyValue value={displayName} />
                <button style={styles.miniButton} onClick={() => showToast("Profile editing coming soon")}>
                  Edit
                </button>
              </SettingRow>
              <SettingRow icon="Mail" label="Email address">
                <ReadOnlyValue value={session?.user?.email || "Not logged in"} />
                <button style={styles.miniButton} onClick={() => showToast("Email changes coming soon")}>
                  Edit
                </button>
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <SettingGroup title="Security" text="Manage access to your account.">
            <SettingRows>
              <SettingRow icon="Lock" label="Password" description="Last changed 21 days ago">
                <button style={styles.primaryButton} onClick={sendPasswordReset} disabled={resetLoading}>
                  <span style={styles.buttonIcon}>▣</span>
                  {resetLoading ? "Sending..." : "Send reset"}
                </button>
              </SettingRow>
              <SettingRow icon="Shield" label="Two-factor authentication" description="Add an extra layer of security to your account.">
                <button style={styles.secondaryButton} onClick={() => showToast("2FA coming soon")}>
                  Enable 2FA
                </button>
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <SettingGroup title="Session" text="Manage your active sessions.">
            <SettingRows>
              <SettingRow icon="Desktop" label="Current session" description="Wichita, Kansas, United States · Chrome">
                <span style={styles.statusPill}>This device</span>
                <button style={styles.secondaryButton} onClick={onLogout}>
                  Logout
                </button>
              </SettingRow>
              <SettingRow icon="Activity" label="Other active sessions" description="View devices connected to your account.">
                <button style={styles.secondaryButton} onClick={() => showToast("Session viewer coming soon")}>
                  View sessions
                </button>
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <div style={styles.accountBottomBar}>
            <MiniStat icon="Calendar" label="Account created" value="March 14, 2025" />
            <MiniStat icon="Bank" label="Login provider" value="Google / Email" />
            <MiniStat icon="Shield" label="Member since" value="3 months" />
            <button style={styles.manageAccountButton} onClick={() => showToast("Account management coming soon")}>
              Manage account <span>›</span>
            </button>
          </div>
        </PanelStack>
      );
    }

    if (activeSection === "preferences") {
      return (
        <PanelStack>
          <SettingGroup title="Appearance" text="Control how TradeArchive looks and displays time.">
            <SettingRows>
              <SettingRow icon="Moon" label="Theme" description="Choose your preferred app appearance.">
                <SelectField value={settings.preferences.theme} options={["Dark", "Light", "System"]} onChange={(value) => updateSection("preferences", "theme", value)} />
              </SettingRow>
              <SettingRow icon="Clock" label="Timezone" description="Used for calendars and journal timestamps.">
                <SelectField value={settings.preferences.timezone} options={["Local time", "New York time", "UTC"]} onChange={(value) => updateSection("preferences", "timezone", value)} />
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <SettingGroup title="Formats" text="Set your preferred trading display defaults.">
            <SettingRows>
              <SettingRow icon="Dollar" label="Currency" description="Default currency for performance and risk.">
                <SelectField value={settings.preferences.currency} options={["USD", "EUR", "GBP", "CAD", "AUD"]} onChange={(value) => updateSection("preferences", "currency", value)} />
              </SettingRow>
              <SettingRow icon="Calendar" label="Date format" description="How dates are shown across the app.">
                <SelectField value={settings.preferences.dateFormat} options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} onChange={(value) => updateSection("preferences", "dateFormat", value)} />
              </SettingRow>
              <SettingRow icon="Clock" label="Time format" description="Choose 12-hour or 24-hour time.">
                <SelectField value={settings.preferences.timeFormat} options={["12 hour", "24 hour"]} onChange={(value) => updateSection("preferences", "timeFormat", value)} />
              </SettingRow>
            </SettingRows>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "journal") {
      return (
        <PanelStack>
          <SettingGroup title="Trade defaults" text="Pre-fill fields when logging a new trade.">
            <SettingRows>
              <SettingRow icon="Dollar" label="Default risk" description="Your typical risk per trade.">
                <TextField value={settings.journal.defaultRisk} onChange={(value) => updateSection("journal", "defaultRisk", value)} prefix="$" />
              </SettingRow>
              <SettingRow icon="Chart" label="Default instrument" description="Example: MNQ, NQ, MES, ES.">
                <TextField value={settings.journal.defaultInstrument} onChange={(value) => updateSection("journal", "defaultInstrument", value)} />
              </SettingRow>
              <SettingRow icon="Bank" label="Default account" description="Optional prop account name.">
                <TextField value={settings.journal.defaultAccount} onChange={(value) => updateSection("journal", "defaultAccount", value)} placeholder="Topstep 50k, Alpha Zero..." />
              </SettingRow>
              <SettingRow icon="Target" label="Minimum RR" description="Minimum reward-to-risk before taking a trade.">
                <TextField value={settings.journal.defaultRR} onChange={(value) => updateSection("journal", "defaultRR", value)} />
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <SettingGroup title="Behavior" text="Control how your journal remembers trade inputs.">
            <SettingRows>
              <SettingRow icon="Save" label="Auto-save drafts" description="Keep unfinished trade entries saved locally.">
                <Toggle checked={settings.journal.autoSaveDrafts} onChange={(value) => updateSection("journal", "autoSaveDrafts", value)} />
              </SettingRow>
              <SettingRow icon="History" label="Remember last trade values" description="Use previous trade values as the next default.">
                <Toggle checked={settings.journal.rememberLastValues} onChange={(value) => updateSection("journal", "rememberLastValues", value)} />
              </SettingRow>
            </SettingRows>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "news") {
      return (
        <PanelStack>
          <SettingGroup title="Economic calendar" text="Choose what news events show by default.">
            <SettingRows>
              <SettingRow icon="Globe" label="Currencies" description="Filter the calendar by currencies.">
                <OptionGroup options={["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"]} selected={settings.news.currencies} onToggle={(value) => toggleArrayValue("news", "currencies", value)} />
              </SettingRow>
              <SettingRow icon="Alert" label="Impact" description="Choose the event importance levels shown.">
                <OptionGroup options={["High", "Medium", "Low"]} selected={settings.news.impacts} onToggle={(value) => toggleArrayValue("news", "impacts", value)} />
              </SettingRow>
              <SettingRow icon="Calendar" label="Default range" description="The calendar range opened first.">
                <SelectField value={settings.news.range} options={["Today", "Tomorrow", "This Week"]} onChange={(value) => updateSection("news", "range", value)} />
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <SettingGroup title="Calendar behavior" text="Useful display settings for news prep.">
            <SettingRows>
              <SettingRow icon="Clock" label="Show countdown timers" description="Display time remaining until the next event.">
                <Toggle checked={settings.news.showCountdowns} onChange={(value) => updateSection("news", "showCountdowns", value)} />
              </SettingRow>
              <SettingRow icon="Refresh" label="Auto refresh calendar" description="Refresh events without manually reloading.">
                <Toggle checked={settings.news.autoRefresh} onChange={(value) => updateSection("news", "autoRefresh", value)} />
              </SettingRow>
            </SettingRows>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "billing") {
      return (
        <PanelStack>
          <SettingGroup title="Subscription" text="Manage your plan, payment method, and invoices.">
            <SettingRows>
              <SettingRow icon="Star" label="Current plan" description="Essential plan unlocks screenshots, analytics, and unlimited journal entries.">
                <span style={styles.activePill}>Active</span>
                <button style={styles.primaryButton} onClick={onManageBilling} disabled={portalLoading}>
                  {portalLoading ? "Opening..." : "Manage billing"}
                </button>
              </SettingRow>
              <SettingRow icon="Receipt" label="Invoices" description="View receipts and payment history in Stripe.">
                <button style={styles.secondaryButton} onClick={onManageBilling}>
                  View invoices
                </button>
              </SettingRow>
            </SettingRows>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "support") {
      return (
        <PanelStack>
          <SettingGroup title="Contact" text="Make it easy for traders to reach you.">
            <SettingRows>
              <SettingRow icon="Mail" label="Contact support" description="Send a general support message.">
                <button style={styles.primaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=TradeArchive Support")}>Email support</button>
              </SettingRow>
              <SettingRow icon="Bug" label="Report a bug" description="Let users report something broken.">
                <button style={styles.secondaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Bug Report")}>Report bug</button>
              </SettingRow>
              <SettingRow icon="Lightbulb" label="Request a feature" description="Collect feature ideas from users.">
                <button style={styles.secondaryButton} onClick={() => (window.location.href = "mailto:support@tradearchive.net?subject=Feature Request")}>Request feature</button>
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <SettingGroup title="Community" text="Add your Discord invite when the server is ready.">
            <SettingRows>
              <SettingRow icon="Discord" label="Discord" description="Create a server for feedback, updates, and user support.">
                <ReadOnlyValue value="Not connected yet" />
              </SettingRow>
            </SettingRows>
          </SettingGroup>
        </PanelStack>
      );
    }

    if (activeSection === "privacy") {
      return (
        <PanelStack>
          <SettingGroup title="Data" text="Give users control over their local settings and account data.">
            <SettingRows>
              <SettingRow icon="Download" label="Export settings" description="Download your local preferences as JSON.">
                <button style={styles.primaryButton} onClick={exportSettings}>Export</button>
              </SettingRow>
              <SettingRow icon="Refresh" label="Reset local settings" description="Clear local preferences and return to defaults.">
                <button style={styles.secondaryButton} onClick={resetLocalSettings}>Reset</button>
              </SettingRow>
            </SettingRows>
          </SettingGroup>

          <SettingGroup title="Danger zone" text="Sensitive account actions should require support or confirmation.">
            <div style={styles.dangerRow}>
              <IconBubble icon="Trash" />
              <div style={styles.dangerCopy}>
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

function SettingRows({ children }) {
  return <div style={styles.rowsShell}>{children}</div>;
}

function SettingRow({ icon, label, description, children }) {
  return (
    <div style={styles.settingRow}>
      <IconBubble icon={icon} />
      <div style={styles.rowCopy}>
        <div style={styles.rowLabel}>{label}</div>
        {description ? <div style={styles.rowDescription}>{description}</div> : null}
      </div>
      <div style={styles.rowControl}>{children}</div>
    </div>
  );
}

function IconBubble({ icon }) {
  return <span style={styles.rowIcon}>{iconMap[icon] || "•"}</span>;
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={styles.miniStat}>
      <IconBubble icon={icon} />
      <div>
        <div style={styles.miniStatLabel}>{label}</div>
        <div style={styles.miniStatValue}>{value}</div>
      </div>
    </div>
  );
}

function SecurityArt() {
  return (
    <div style={styles.securityArt}>
      <div style={styles.securityLineOne} />
      <div style={styles.securityLineTwo} />
      <div style={styles.safeBox}>
        <div style={styles.safeHandle} />
        <div style={styles.safeDial} />
        <div style={styles.safeDotOne} />
        <div style={styles.safeDotTwo} />
      </div>
      <div style={styles.shieldBadge}>✓</div>
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
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={styles.input}
    >
      {options.map((option) => (
        <option key={option} value={option} style={styles.selectOption}>
          {option}
        </option>
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
  account: { title: "Account", subtitle: "Login, email, and account access." },
  preferences: { title: "Preferences", subtitle: "Set your default workspace display options." },
  journal: { title: "Journal defaults", subtitle: "Pre-fill trade entries with your normal risk and instrument." },
  news: { title: "News defaults", subtitle: "Control what the economic calendar shows first." },
  billing: { title: "Billing", subtitle: "Manage subscription, invoices, and payment method." },
  support: { title: "Support", subtitle: "Contact, bugs, feature requests, and community." },
  privacy: { title: "Privacy", subtitle: "Export settings, reset data, and account controls." },
};

const iconMap = {
  User: "♙",
  Sliders: "⌘",
  Journal: "▤",
  Calendar: "□",
  Card: "▭",
  Help: "?",
  Shield: "◇",
  Mail: "✉",
  Lock: "⌂",
  Desktop: "▱",
  Activity: "⚙",
  Bank: "♜",
  Moon: "◐",
  Clock: "◷",
  Dollar: "$",
  Chart: "↗",
  Target: "◎",
  Save: "▣",
  History: "↺",
  Globe: "◌",
  Alert: "!",
  Refresh: "↻",
  Star: "★",
  Receipt: "≡",
  Bug: "◆",
  Lightbulb: "✦",
  Discord: "◍",
  Download: "⇩",
  Trash: "×",
};

const styles = {
  page: {
    minHeight: "100vh",
    color: "white",
    background:
      "radial-gradient(circle at 72% 18%, rgba(37,99,235,0.14), transparent 28%), linear-gradient(180deg, #07101d 0%, #08111f 48%, #050b14 100%)",
    padding: "34px 38px 58px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlowOne: {
    position: "absolute",
    top: "-160px",
    right: "8%",
    width: "460px",
    height: "460px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.13)",
    filter: "blur(110px)",
    pointerEvents: "none",
  },
  backgroundGlowTwo: {
    position: "absolute",
    left: "16%",
    bottom: "-240px",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "rgba(14,165,233,0.07)",
    filter: "blur(120px)",
    pointerEvents: "none",
  },
  shell: {
    width: "100%",
    maxWidth: "1370px",
    margin: "0",
    position: "relative",
    zIndex: 2,
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "26px",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#60a5fa",
    fontSize: "12px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 950,
  },
  title: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.06em",
  },
  subtitle: {
    margin: "12px 0 0",
    color: "rgba(226,232,240,0.68)",
    fontSize: "15px",
    lineHeight: 1.6,
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
    border: "1px solid rgba(96,165,250,0.30)",
    color: "#dbeafe",
    boxShadow: "0 18px 38px rgba(0,0,0,0.35)",
    fontSize: "13px",
    fontWeight: 900,
  },
  settingsFrame: {
    display: "grid",
    gridTemplateColumns: "245px minmax(0, 1fr)",
    gap: "18px",
    alignItems: "start",
  },
  settingsNav: {
    position: "sticky",
    top: "22px",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.50), rgba(2,6,23,0.38))",
    borderRadius: "22px",
    padding: "14px",
    boxShadow: "0 18px 42px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
  },
  navHeader: {
    padding: "8px 10px 10px",
    color: "rgba(148,163,184,0.76)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
  },
  navItem: {
    width: "100%",
    height: "44px",
    border: "1px solid transparent",
    borderRadius: "14px",
    background: "transparent",
    color: "rgba(226,232,240,0.72)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 10px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: 850,
    textAlign: "left",
  },
  navItemActive: {
    background: "linear-gradient(135deg, rgba(37,99,235,0.34), rgba(30,64,175,0.18))",
    border: "1px solid rgba(96,165,250,0.38)",
    color: "#ffffff",
    boxShadow: "0 12px 24px rgba(37,99,235,0.16)",
  },
  navIcon: {
    width: "25px",
    height: "25px",
    borderRadius: "9px",
    background: "rgba(148,163,184,0.10)",
    color: "rgba(203,213,225,0.72)",
    display: "grid",
    placeItems: "center",
    fontSize: "11px",
    fontWeight: 950,
    flexShrink: 0,
  },
  navIconActive: {
    background: "rgba(59,130,246,0.34)",
    color: "#bfdbfe",
    boxShadow: "inset 0 0 0 1px rgba(147,197,253,0.18)",
  },
  navLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  navFooter: {
    marginTop: "18px",
    padding: "15px 10px 3px",
    borderTop: "1px solid rgba(148,163,184,0.12)",
  },
  footerBrand: {
    fontSize: "13px",
    fontWeight: 950,
    color: "rgba(255,255,255,0.92)",
  },
  footerText: {
    marginTop: "5px",
    color: "rgba(148,163,184,0.66)",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  contentPanel: {
    minHeight: "720px",
    border: "1px solid rgba(148,163,184,0.13)",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.74), rgba(8,15,28,0.54))",
    borderRadius: "24px",
    padding: "30px 36px 34px",
    boxShadow: "0 24px 62px rgba(0,0,0,0.26)",
    position: "relative",
    overflow: "hidden",
  },
  panelGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "420px",
    height: "220px",
    background: "radial-gradient(circle at 70% 25%, rgba(37,99,235,0.16), transparent 58%)",
    pointerEvents: "none",
  },
  panelTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    position: "relative",
    zIndex: 2,
  },
  panelKicker: {
    color: "#60a5fa",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    marginBottom: "9px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.05,
    fontWeight: 950,
    letterSpacing: "-0.045em",
  },
  panelSubtitle: {
    margin: "9px 0 0",
    color: "rgba(226,232,240,0.65)",
    fontSize: "14.5px",
    lineHeight: 1.55,
  },
  securityArt: {
    width: "260px",
    height: "126px",
    position: "relative",
    flexShrink: 0,
    marginTop: "-4px",
  },
  securityLineOne: {
    position: "absolute",
    right: "24px",
    top: "32px",
    width: "220px",
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.34), transparent)",
  },
  securityLineTwo: {
    position: "absolute",
    right: "8px",
    top: "72px",
    width: "180px",
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.24), transparent)",
  },
  safeBox: {
    position: "absolute",
    right: "50px",
    top: "8px",
    width: "92px",
    height: "86px",
    borderRadius: "18px",
    background: "linear-gradient(145deg, #111827, #020617)",
    border: "1px solid rgba(96,165,250,0.22)",
    boxShadow: "0 24px 42px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
  },
  safeHandle: {
    position: "absolute",
    left: "11px",
    top: "20px",
    width: "8px",
    height: "42px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(15,23,42,0.8)",
  },
  safeDial: {
    position: "absolute",
    left: "34px",
    top: "27px",
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    background: "radial-gradient(circle, #60a5fa 0%, #2563eb 35%, #0f172a 70%)",
    border: "1px solid rgba(147,197,253,0.38)",
    boxShadow: "0 0 28px rgba(37,99,235,0.48)",
  },
  safeDotOne: {
    position: "absolute",
    right: "14px",
    top: "18px",
    width: "5px",
    height: "5px",
    borderRadius: "999px",
    background: "#1d4ed8",
  },
  safeDotTwo: {
    position: "absolute",
    right: "14px",
    bottom: "18px",
    width: "5px",
    height: "5px",
    borderRadius: "999px",
    background: "#1d4ed8",
  },
  shieldBadge: {
    position: "absolute",
    right: "18px",
    top: "58px",
    width: "52px",
    height: "58px",
    display: "grid",
    placeItems: "center",
    borderRadius: "18px 18px 22px 22px",
    background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
    border: "1px solid rgba(147,197,253,0.42)",
    color: "white",
    fontSize: "26px",
    fontWeight: 950,
    boxShadow: "0 18px 34px rgba(37,99,235,0.30)",
  },
  divider: {
    height: "1px",
    background: "rgba(148,163,184,0.13)",
    margin: "24px 0 22px",
    position: "relative",
    zIndex: 2,
  },
  panelStack: {
    display: "grid",
    gap: "24px",
    position: "relative",
    zIndex: 2,
  },
  group: {
    display: "grid",
    gridTemplateColumns: "230px minmax(0, 1fr)",
    gap: "30px",
    alignItems: "start",
  },
  groupHeader: {
    paddingTop: "8px",
  },
  groupTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 950,
    color: "rgba(255,255,255,0.94)",
  },
  groupText: {
    margin: "8px 0 0",
    color: "rgba(148,163,184,0.72)",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  groupRows: {
    minWidth: 0,
  },
  rowsShell: {
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "17px",
    overflow: "hidden",
    background: "linear-gradient(180deg, rgba(2,6,23,0.28), rgba(15,23,42,0.20))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.025)",
  },
  settingRow: {
    minHeight: "72px",
    display: "grid",
    gridTemplateColumns: "38px minmax(0, 1fr) auto",
    gap: "16px",
    alignItems: "center",
    padding: "15px 18px",
    borderBottom: "1px solid rgba(148,163,184,0.10)",
  },
  rowIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    background: "rgba(148,163,184,0.10)",
    color: "#dbeafe",
    display: "grid",
    placeItems: "center",
    fontSize: "14px",
    fontWeight: 950,
    flexShrink: 0,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  rowCopy: {
    minWidth: 0,
  },
  rowLabel: {
    fontSize: "14px",
    fontWeight: 950,
    color: "rgba(255,255,255,0.94)",
  },
  rowDescription: {
    marginTop: "5px",
    color: "rgba(148,163,184,0.72)",
    fontSize: "12.5px",
    lineHeight: 1.45,
  },
  rowControl: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },
  readOnlyValue: {
    minWidth: "200px",
    color: "rgba(255,255,255,0.86)",
    fontSize: "13.5px",
    fontWeight: 750,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  inputWrap: {
    position: "relative",
    width: "255px",
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
    width: "255px",
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(15,23,42,0.58)",
    color: "white",
    borderRadius: "12px",
    padding: "11px 12px",
    fontSize: "13.5px",
    outline: "none",
  },
  inputWithPrefix: {
    paddingLeft: "28px",
  },
  selectOption: {
    background: "#0f172a",
    color: "#ffffff",
  },
  primaryButton: {
    border: "1px solid rgba(96,165,250,0.52)",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    borderRadius: "12px",
    padding: "11px 14px",
    fontWeight: 950,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 14px 24px rgba(37,99,235,0.24)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  buttonIcon: {
    fontSize: "11px",
    color: "#dbeafe",
  },
  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(255,255,255,0.065)",
    color: "white",
    borderRadius: "12px",
    padding: "11px 14px",
    fontWeight: 900,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  miniButton: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    borderRadius: "11px",
    padding: "9px 12px",
    fontWeight: 900,
    fontSize: "12.5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  statusPill: {
    border: "1px solid rgba(96,165,250,0.24)",
    background: "rgba(37,99,235,0.22)",
    color: "#bfdbfe",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  activePill: {
    border: "1px solid rgba(16,185,129,0.24)",
    background: "rgba(16,185,129,0.14)",
    color: "#6ee7b7",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 950,
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
    maxWidth: "460px",
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
  accountBottomBar: {
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(15,23,42,0.32)",
    borderRadius: "18px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: "18px",
    alignItems: "center",
  },
  miniStat: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  miniStatLabel: {
    color: "rgba(148,163,184,0.78)",
    fontSize: "12.5px",
    lineHeight: 1.4,
  },
  miniStatValue: {
    marginTop: "4px",
    color: "rgba(255,255,255,0.90)",
    fontSize: "13.5px",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },
  manageAccountButton: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(255,255,255,0.065)",
    color: "white",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: 950,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: "14px",
  },
  dangerRow: {
    display: "grid",
    gridTemplateColumns: "38px minmax(0, 1fr) auto",
    gap: "16px",
    alignItems: "center",
    padding: "16px 18px",
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.18)",
    borderRadius: "17px",
  },
  dangerCopy: {
    minWidth: 0,
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
