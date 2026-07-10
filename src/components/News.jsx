import React from "react";
import { useSettings } from "./SettingsContext";


let activePreferences = {
  timezone: "Local time",
  timeFormat: "12 hour",
  dateFormat: "MM/DD/YYYY",
};

function getIntlTimeZone(timezone) {
  if (timezone === "New York time") return "America/New_York";
  if (timezone === "UTC") return "UTC";
  return undefined;
}

function getDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function formatDateByPreference(date) {
  const timeZone = getIntlTimeZone(activePreferences.timezone);
  const format = activePreferences.dateFormat || "MM/DD/YYYY";

  if (format === "DD/MM/YYYY") {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone,
    }).format(date);
  }

  if (format === "YYYY-MM-DD") {
    const parts = getDateParts(date, timeZone);
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone,
  }).format(date);
}


const NEWS_FILTER_KEY = "tradearchive_news_filters";

const defaultFilters = {
  impacts: ["High", "Medium"],
  currencies: ["USD"],
  range: "Today",
  search: "",
};

const impactOptions = ["High", "Medium", "Low"];
const currencyOptions = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"];
const rangeOptions = ["Today", "Tomorrow", "This Week"];

function impactTheme(impact = "Low") {
  const value = String(impact).toLowerCase();

  if (value.includes("high")) {
    return {
      label: "High",
      icon: "🔴",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.26)",
      text: "#fecaca",
      dot: "#ef4444",
    };
  }

  if (value.includes("medium")) {
    return {
      label: "Medium",
      icon: "🟠",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.26)",
      text: "#fde68a",
      dot: "#f59e0b",
    };
  }

  return {
    label: "Low",
    icon: "🟡",
    bg: "rgba(234,179,8,0.10)",
    border: "rgba(234,179,8,0.22)",
    text: "#fef3c7",
    dot: "#eab308",
  };
}

function loadFilters() {
  try {
    const stored = localStorage.getItem(NEWS_FILTER_KEY);
    return stored ? { ...defaultFilters, ...JSON.parse(stored) } : defaultFilters;
  } catch {
    return defaultFilters;
  }
}

function getEventDate(event) {
  return event.date || event.datetime || event.time || event.timestamp || null;
}

function formatDateLabel(dateString) {
  if (!dateString) return "—";

  const eventDate = new Date(dateString);
  if (Number.isNaN(eventDate.getTime())) return "—";

  const timeZone = getIntlTimeZone(activePreferences.timezone);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const eventParts = getDateParts(eventDate, timeZone);
  const todayParts = getDateParts(today, timeZone);
  const tomorrowParts = getDateParts(tomorrow, timeZone);

  const eventKey = `${eventParts.year}-${eventParts.month}-${eventParts.day}`;
  const todayKey = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const tomorrowKey = `${tomorrowParts.year}-${tomorrowParts.month}-${tomorrowParts.day}`;

  if (eventKey === todayKey) return "Today";
  if (eventKey === tomorrowKey) return "Tomorrow";

  return formatDateByPreference(eventDate);
}

function formatTime(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: activePreferences.timeFormat !== "24 hour",
    timeZone: getIntlTimeZone(activePreferences.timezone),
  }).format(date);
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function normalizeEvent(event, index) {
  const rawDate = getEventDate(event);
  const impact = event.impact || event.importance || event.priority || "Low";
  const theme = impactTheme(impact);

  return {
    id: `${rawDate || index}-${event.event || event.title || index}`,
    rawDate,
    day: formatDateLabel(rawDate),
    time: formatTime(rawDate),
    timestamp: rawDate ? new Date(rawDate).getTime() : 0,
    impact: theme.label,
    currency: event.currency || event.countryCode || "USD",
    country: event.country || event.region || "",
    event: event.event || event.title || event.name || "Economic Event",
    previous: valueOrDash(event.previous),
    forecast: valueOrDash(event.estimate ?? event.forecast ?? event.consensus),
    actual: valueOrDash(event.actual),
  };
}

export default function News({ setActivePage }) {
  const { settings, resolvedTheme } = useSettings();

  activePreferences = {
    ...activePreferences,
    ...(settings?.preferences || {}),
  };

  const settingsDefaults = React.useMemo(
    () => ({
      impacts: settings?.news?.impacts?.length
        ? settings.news.impacts
        : defaultFilters.impacts,
      currencies: settings?.news?.currencies?.length
        ? settings.news.currencies
        : defaultFilters.currencies,
      range: settings?.news?.range || defaultFilters.range,
      search: "",
    }),
    [settings?.news?.impacts, settings?.news?.currencies, settings?.news?.range]
  );

  const isLightTheme = resolvedTheme === "light";
  const [events, setEvents] = React.useState([]);
  const [filters, setFilters] = React.useState(() => {
    const stored = loadFilters();

    return {
      ...settingsDefaults,
      ...stored,
      impacts: stored?.impacts?.length ? stored.impacts : settingsDefaults.impacts,
      currencies: stored?.currencies?.length
        ? stored.currencies
        : settingsDefaults.currencies,
      range: stored?.range || settingsDefaults.range,
    };
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedId, setSelectedId] = React.useState("");


  React.useEffect(() => {
    setFilters((current) => ({
      ...current,
      impacts: settingsDefaults.impacts,
      currencies: settingsDefaults.currencies,
      range: settingsDefaults.range,
    }));
  }, [settingsDefaults]);

  React.useEffect(() => {
    localStorage.setItem(NEWS_FILTER_KEY, JSON.stringify(filters));
  }, [filters]);

  React.useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/economic-calendar");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load economic calendar");
        }

        const rawEvents = Array.isArray(data)
          ? data
          : Array.isArray(data?.events)
          ? data.events
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const normalized = rawEvents
          .map(normalizeEvent)
          .filter((event) => event.rawDate)
          .sort((a, b) => a.timestamp - b.timestamp);

        setEvents(normalized);
      } catch (err) {
        setError(err.message || "Calendar failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);


  React.useEffect(() => {
    setEvents((currentEvents) =>
      currentEvents.map((event, index) => ({
        ...event,
        id: event.id || `${event.rawDate || index}-${event.event || index}`,
        day: formatDateLabel(event.rawDate),
        time: formatTime(event.rawDate),
      }))
    );
  }, [
    settings?.preferences?.timezone,
    settings?.preferences?.timeFormat,
    settings?.preferences?.dateFormat,
  ]);

  const filteredEvents = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesRange =
        filters.range === "This Week" || event.day === filters.range;

      const matchesSearch =
        !search ||
        event.event.toLowerCase().includes(search) ||
        event.currency.toLowerCase().includes(search) ||
        event.country.toLowerCase().includes(search);

      return (
        matchesRange &&
        filters.impacts.includes(event.impact) &&
        filters.currencies.includes(event.currency) &&
        matchesSearch
      );
    });
  }, [events, filters]);

  const nextEvent = filteredEvents[0] || null;
  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedId) || nextEvent;

  const toggleFilter = (key, value) => {
    setFilters((current) => {
      const list = current[key];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];

      return { ...current, [key]: next.length ? next : list };
    });
  };

  return (
    <div
      style={{
        ...styles.page,
        ...(isLightTheme
          ? {
              background: "#eef4fb",
              color: "#0f172a",
            }
          : {}),
      }}
    >
      <div style={styles.inner}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ECONOMIC CALENDAR</p>
            <h1 style={styles.title}>News</h1>
            <p style={styles.subtitle}>
              Real economic events, impact levels, and release times for futures traders.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button style={styles.secondaryButton} onClick={() => setActivePage?.("dashboard")}>
              Dashboard
            </button>
            <button style={styles.primaryButton} onClick={() => setFilters(settingsDefaults)}>
              Reset Filters
            </button>
          </div>
        </header>

        <section style={styles.commandBar}>
          <div>
            <span style={styles.commandLabel}>Selected Feed</span>
            <strong>
              {filters.currencies.join(", ")} • {filters.impacts.join(" / ")} • {filters.range}
            </strong>
          </div>

          <input
            style={styles.search}
            placeholder="Search CPI, NFP, FOMC..."
            value={filters.search}
            onChange={(e) =>
              setFilters((current) => ({ ...current, search: e.target.value }))
            }
          />
        </section>

        <main style={styles.layout}>
          <aside style={styles.leftRail}>
            <FilterBlock title="Impact">
              {impactOptions.map((impact) => (
                <FilterPill
                  key={impact}
                  active={filters.impacts.includes(impact)}
                  label={`${impactTheme(impact).icon} ${impact}`}
                  onClick={() => toggleFilter("impacts", impact)}
                />
              ))}
            </FilterBlock>

            <FilterBlock title="Currency">
              <div style={styles.currencyGrid}>
                {currencyOptions.map((currency) => (
                  <FilterPill
                    key={currency}
                    active={filters.currencies.includes(currency)}
                    label={currency}
                    onClick={() => toggleFilter("currencies", currency)}
                  />
                ))}
              </div>
            </FilterBlock>

            <FilterBlock title="Range">
              {rangeOptions.map((range) => (
                <FilterPill
                  key={range}
                  active={filters.range === range}
                  label={range}
                  onClick={() => setFilters((current) => ({ ...current, range }))}
                />
              ))}
            </FilterBlock>
          </aside>

          <section style={styles.mainFeed}>
            <NextNewsPanel event={nextEvent} loading={loading} />

            <div style={styles.feedHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Economic News Feed</h2>
                <p style={styles.sectionText}>
                  Pulled from your economic calendar API.
                </p>
              </div>
              <span style={styles.countBadge}>
                {loading ? "Loading..." : `${filteredEvents.length} events`}
              </span>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.eventStack}>
              {loading ? (
                <div style={styles.emptyState}>Loading economic calendar...</div>
              ) : filteredEvents.length === 0 ? (
                <div style={styles.emptyState}>
                  No events found. Try enabling more currencies, impact levels, or This Week.
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <NewsEventCard
                    key={event.id}
                    event={event}
                    active={selectedEvent?.id === event.id}
                    onClick={() => setSelectedId(event.id)}
                  />
                ))
              )}
            </div>
          </section>

          <aside style={styles.rightPanel}>
            {selectedEvent ? <EventDetails event={selectedEvent} /> : <EmptyDetails />}
          </aside>
        </main>
      </div>
    </div>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div style={styles.filterBlock}>
      <div style={styles.filterTitle}>{title}</div>
      <div style={styles.filterList}>{children}</div>
    </div>
  );
}

function FilterPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      style={{ ...styles.filterPill, ...(active ? styles.filterPillActive : {}) }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function NextNewsPanel({ event, loading }) {
  const theme = impactTheme(event?.impact);

  return (
    <section style={styles.nextPanel}>
      <div>
        <p style={styles.panelLabel}>Next Event</p>
        <h2 style={styles.nextTitle}>
          {loading ? "Loading..." : event ? event.event : "No matching event"}
        </h2>
        <div style={styles.nextMeta}>
          {event ? `${event.currency} • ${event.day} • ${event.time}` : "Adjust filters to show events"}
        </div>
      </div>

      {event && (
        <div style={{ ...styles.impactTile, background: theme.bg, borderColor: theme.border, color: theme.text }}>
          <span>{theme.icon}</span>
          <strong>{event.impact}</strong>
        </div>
      )}
    </section>
  );
}

function NewsEventCard({ event, active, onClick }) {
  const theme = impactTheme(event.impact);

  return (
    <button
      type="button"
      style={{ ...styles.eventCard, ...(active ? styles.eventCardActive : {}) }}
      onClick={onClick}
    >
      <div style={styles.eventTime}>
        <strong>{event.time}</strong>
        <span>{event.day}</span>
      </div>

      <div style={{ ...styles.impactMarker, background: theme.dot }} />

      <div style={styles.eventMain}>
        <div style={styles.eventTop}>
          <span style={styles.currencyBadge}>{event.currency}</span>
          <span style={{ ...styles.impactBadge, background: theme.bg, borderColor: theme.border, color: theme.text }}>
            {theme.icon} {event.impact}
          </span>
        </div>
        <h3 style={styles.eventTitle}>{event.event}</h3>
        <p style={styles.eventCountry}>{event.country}</p>
      </div>

      <div style={styles.numbersGrid}>
        <NumberBox label="Previous" value={event.previous} />
        <NumberBox label="Forecast" value={event.forecast} />
        <NumberBox label="Actual" value={event.actual} />
      </div>
    </button>
  );
}

function EventDetails({ event }) {
  const theme = impactTheme(event.impact);

  return (
    <div>
      <p style={styles.panelLabel}>Event Details</p>
      <h2 style={styles.detailTitle}>{event.event}</h2>

      <div style={styles.detailBadges}>
        <span style={styles.currencyBadge}>{event.currency}</span>
        <span style={{ ...styles.impactBadge, background: theme.bg, borderColor: theme.border, color: theme.text }}>
          {theme.icon} {event.impact}
        </span>
      </div>

      <div style={styles.detailTime}>
        {event.day} at {event.time}
      </div>

      <div style={styles.detailGrid}>
        <NumberBox label="Previous" value={event.previous} />
        <NumberBox label="Forecast" value={event.forecast} />
        <NumberBox label="Actual" value={event.actual} />
      </div>
    </div>
  );
}

function EmptyDetails() {
  return (
    <div>
      <p style={styles.panelLabel}>Event Details</p>
      <h2 style={styles.detailTitle}>Select an event</h2>
      <p style={styles.sectionText}>Click a news event to see details.</p>
    </div>
  );
}

function NumberBox({ label, value }) {
  return (
    <div style={styles.numberBox}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#030712",
    color: "#ffffff",
    padding: "34px",
    boxSizing: "border-box",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  inner: { maxWidth: "1500px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "20px",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.18em",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "54px",
    fontWeight: 950,
    letterSpacing: "-0.07em",
  },
  subtitle: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: "16px",
  },
  headerActions: { display: "flex", gap: "12px" },
  primaryButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "12px",
    padding: "0 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.60)",
    color: "#fff",
    borderRadius: "12px",
    padding: "0 18px",
    fontWeight: 850,
    cursor: "pointer",
  },
  commandBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "18px",
    padding: "14px 16px",
    marginBottom: "18px",
  },
  commandLabel: {
    display: "block",
    color: "rgba(255,255,255,0.48)",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  search: {
    width: "340px",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "#0f172a",
    color: "#fff",
    borderRadius: "12px",
    padding: "12px 13px",
    outline: "none",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr) 350px",
    gap: "18px",
  },
  leftRail: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "20px",
    padding: "18px",
  },
  mainFeed: { minWidth: 0 },
  rightPanel: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "20px",
    padding: "20px",
  },
  filterBlock: { marginBottom: "20px" },
  filterTitle: {
    marginBottom: "10px",
    color: "rgba(255,255,255,0.58)",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  filterList: { display: "flex", flexDirection: "column", gap: "8px" },
  currencyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  filterPill: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(2,8,19,0.38)",
    color: "rgba(255,255,255,0.72)",
    borderRadius: "12px",
    padding: "11px 12px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 850,
  },
  filterPillActive: {
    background: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.34)",
    color: "#fff",
  },
  nextPanel: {
    display: "flex",
    justifyContent: "space-between",
    background: "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.76))",
    border: "1px solid rgba(96,165,250,0.20)",
    borderRadius: "22px",
    padding: "22px",
    marginBottom: "18px",
  },
  panelLabel: {
    margin: "0 0 8px",
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  nextTitle: { margin: "0 0 8px", fontSize: "30px", fontWeight: 950 },
  nextMeta: { color: "rgba(255,255,255,0.68)", fontWeight: 800 },
  impactTile: {
    border: "1px solid",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
  },
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  sectionTitle: { margin: 0, fontSize: "22px", fontWeight: 950 },
  sectionText: { margin: "6px 0 0", color: "rgba(255,255,255,0.60)" },
  countBadge: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "999px",
    padding: "8px 11px",
    fontSize: "12px",
    fontWeight: 900,
  },
  eventStack: { display: "flex", flexDirection: "column", gap: "12px" },
  eventCard: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "94px 5px minmax(0, 1fr) 250px",
    gap: "16px",
    alignItems: "center",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(15,23,42,0.64)",
    color: "#fff",
    borderRadius: "18px",
    padding: "16px",
    cursor: "pointer",
    textAlign: "left",
  },
  eventCardActive: {
    border: "1px solid rgba(96,165,250,0.36)",
    background: "rgba(37,99,235,0.14)",
  },
  eventTime: { display: "flex", flexDirection: "column", gap: "5px" },
  impactMarker: { width: "5px", height: "64px", borderRadius: "999px" },
  eventMain: { minWidth: 0 },
  eventTop: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" },
  eventTitle: { margin: 0, fontSize: "17px", fontWeight: 950 },
  eventCountry: { margin: "6px 0 0", color: "rgba(255,255,255,0.55)" },
  currencyBadge: {
    borderRadius: "999px",
    background: "rgba(96,165,250,0.12)",
    border: "1px solid rgba(96,165,250,0.20)",
    color: "#bfdbfe",
    padding: "5px 8px",
    fontSize: "12px",
    fontWeight: 900,
  },
  impactBadge: {
    border: "1px solid",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "12px",
    fontWeight: 900,
  },
  numbersGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" },
  numberBox: {
    background: "rgba(2,8,19,0.36)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  detailTitle: { margin: "0 0 12px", fontSize: "28px", fontWeight: 950 },
  detailBadges: { display: "flex", gap: "8px", marginBottom: "14px" },
  detailTime: { color: "rgba(255,255,255,0.66)", marginBottom: "16px" },
  detailGrid: { display: "grid", gap: "10px" },
  emptyState: {
    border: "1px dashed rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.54)",
    borderRadius: "18px",
    padding: "38px",
    textAlign: "center",
    color: "rgba(255,255,255,0.58)",
  },
  errorBox: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#fecaca",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "12px",
  },
};