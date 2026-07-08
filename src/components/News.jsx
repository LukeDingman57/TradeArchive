import React from "react";

const NEWS_FILTER_KEY = "tradearchive_news_filters";
const NEXT_NEWS_KEY = "tradearchive_next_news_event";

const events = [
  { id: "1", day: "Today", time: "8:30 AM", impact: "High", currency: "USD", event: "Core CPI m/m", previous: "0.2%", forecast: "0.3%", actual: "", category: "Inflation", note: "Usually one of the biggest volatility events for NQ, ES, DXY, gold, and yields." },
  { id: "2", day: "Today", time: "8:30 AM", impact: "High", currency: "USD", event: "CPI y/y", previous: "3.3%", forecast: "3.4%", actual: "", category: "Inflation", note: "Big surprises can quickly change rate-cut expectations." },
  { id: "3", day: "Today", time: "10:00 AM", impact: "Medium", currency: "USD", event: "Consumer Sentiment", previous: "65.6", forecast: "66.0", actual: "", category: "Consumer", note: "Can move risk assets when the number strongly surprises." },
  { id: "4", day: "Tomorrow", time: "8:30 AM", impact: "High", currency: "USD", event: "PPI m/m", previous: "0.1%", forecast: "0.2%", actual: "", category: "Inflation", note: "Producer inflation can matter more when CPI and Fed expectations are already in focus." },
  { id: "5", day: "Tomorrow", time: "2:00 PM", impact: "High", currency: "USD", event: "FOMC Minutes", previous: "—", forecast: "—", actual: "", category: "Fed", note: "Fed communication can move NQ, ES, DXY, yields, and gold." },
  { id: "6", day: "This Week", time: "8:30 AM", impact: "High", currency: "USD", event: "Non-Farm Payrolls", previous: "206K", forecast: "190K", actual: "", category: "Labor", note: "One of the biggest recurring events for futures traders." },
  { id: "7", day: "This Week", time: "9:45 AM", impact: "Medium", currency: "USD", event: "Flash PMI", previous: "51.6", forecast: "51.8", actual: "", category: "Growth", note: "Business activity report. Can matter more when growth concerns are elevated." },
  { id: "8", day: "Today", time: "4:30 AM", impact: "Medium", currency: "GBP", event: "GDP m/m", previous: "0.4%", forecast: "0.2%", actual: "", category: "Growth", note: "UK growth data. Mostly relevant for GBP pairs and broader risk sentiment." },
  { id: "9", day: "Today", time: "5:00 AM", impact: "Medium", currency: "EUR", event: "German ZEW", previous: "47.5", forecast: "49.0", actual: "", category: "Sentiment", note: "Eurozone sentiment data. Mostly relevant for EUR pairs and DAX traders." },
];

const defaultFilters = {
  impacts: ["High", "Medium"],
  currencies: ["USD"],
  range: "Today",
  search: "",
};

const impactOptions = ["High", "Medium", "Low"];
const currencyOptions = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"];
const rangeOptions = ["Today", "Tomorrow", "This Week"];

function loadFilters() {
  if (typeof window === "undefined") return defaultFilters;
  try {
    const stored = window.localStorage.getItem(NEWS_FILTER_KEY);
    return stored ? { ...defaultFilters, ...JSON.parse(stored) } : defaultFilters;
  } catch {
    return defaultFilters;
  }
}

function saveFilters(filters) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NEWS_FILTER_KEY, JSON.stringify(filters));
  }
}

function saveNextNews(event) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NEXT_NEWS_KEY, JSON.stringify(event || null));
  }
}

function impactTheme(impact) {
  if (impact === "High") return { icon: "🔴", dot: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.24)", text: "#fecaca", name: "Red Folder" };
  if (impact === "Medium") return { icon: "🟠", dot: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.24)", text: "#fde68a", name: "Orange Folder" };
  return { icon: "🟢", dot: "#22c55e", bg: "rgba(34,197,94,0.11)", border: "rgba(34,197,94,0.22)", text: "#bbf7d0", name: "Green Folder" };
}

export default function News({ setActivePage }) {
  const [filters, setFilters] = React.useState(loadFilters);
  const [selectedId, setSelectedId] = React.useState("");

  React.useEffect(() => saveFilters(filters), [filters]);

  const filteredEvents = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesRange =
        filters.range === "This Week" || event.day === filters.range || event.day === "Today";

      const matchesSearch =
        !search ||
        event.event.toLowerCase().includes(search) ||
        event.currency.toLowerCase().includes(search) ||
        event.category.toLowerCase().includes(search);

      return (
        filters.impacts.includes(event.impact) &&
        filters.currencies.includes(event.currency) &&
        matchesRange &&
        matchesSearch
      );
    });
  }, [filters]);

  const nextEvent = filteredEvents[0] || null;
  const selectedEvent = filteredEvents.find((event) => event.id === selectedId) || nextEvent;

  React.useEffect(() => {
    saveNextNews(nextEvent);
  }, [nextEvent]);

  const toggleFilter = (key, value) => {
    setFilters((current) => {
      const currentList = current[key];
      const nextList = currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];

      return {
        ...current,
        [key]: nextList.length ? nextList : currentList,
      };
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGrid} />
      <div style={styles.inner}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>NEWS CENTER</p>
            <h1 style={styles.title}>News</h1>
            <p style={styles.subtitle}>
              Filter red-folder news, track the next event, and feed the dashboard with only the news you care about.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button type="button" style={styles.secondaryButton} onClick={() => setActivePage?.("dashboard")}>
              Dashboard
            </button>
            <button type="button" style={styles.primaryButton} onClick={() => setFilters(defaultFilters)}>
              Reset Filters
            </button>
          </div>
        </header>

        <section style={styles.commandBar}>
          <div style={styles.commandLeft}>
            <span style={styles.commandLabel}>Selected Feed</span>
            <strong>
              {filters.currencies.join(", ")} • {filters.impacts.join(" / ")} • {filters.range}
            </strong>
          </div>

          <input
            style={styles.search}
            placeholder="Search CPI, NFP, FOMC, USD..."
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </section>

        <main style={styles.layout}>
          <aside style={styles.leftRail}>
            <FilterBlock title="Impact">
              {impactOptions.map((impact) => (
                <FilterPill
                  key={impact}
                  active={filters.impacts.includes(impact)}
                  label={`${impactTheme(impact).icon} ${impactTheme(impact).name}`}
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

            <div style={styles.ruleCard}>
              <div style={styles.ruleTitle}>Trading Rule</div>
              <p>
                For red-folder USD news, consider no entries 5–15 minutes before and after unless the setup is part of your tested plan.
              </p>
            </div>
          </aside>

          <section style={styles.mainFeed}>
            <NextNewsPanel event={nextEvent} />

            <div style={styles.feedHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Economic News Feed</h2>
                <p style={styles.sectionText}>
                  Forex Factory-style filters with a TradeArchive workflow. Live data comes next.
                </p>
              </div>
              <span style={styles.countBadge}>{filteredEvents.length} events</span>
            </div>

            <div style={styles.eventStack}>
              {filteredEvents.length === 0 ? (
                <div style={styles.emptyState}>No events match your filters.</div>
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
      style={{
        ...styles.filterPill,
        ...(active ? styles.filterPillActive : {}),
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function NextNewsPanel({ event }) {
  const theme = impactTheme(event?.impact);

  return (
    <section style={styles.nextPanel}>
      <div>
        <p style={styles.panelLabel}>Next News For Your Filters</p>
        {event ? (
          <>
            <h2 style={styles.nextTitle}>{event.event}</h2>
            <div style={styles.nextMeta}>
              {event.currency} • {event.day} • {event.time}
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.nextTitle}>No matching news</h2>
            <div style={styles.nextMeta}>Adjust your filters to show events.</div>
          </>
        )}
      </div>

      {event && (
        <div style={{ ...styles.impactTile, background: theme.bg, borderColor: theme.border, color: theme.text }}>
          <span style={styles.impactIcon}>{theme.icon}</span>
          <strong>{event.impact}</strong>
          <small>{theme.name}</small>
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
      style={{
        ...styles.eventCard,
        ...(active ? styles.eventCardActive : {}),
      }}
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
          <span style={styles.categoryBadge}>{event.category}</span>
        </div>
        <h3>{event.event}</h3>
        <p>{event.note}</p>
      </div>

      <div style={styles.numbersGrid}>
        <NumberBox label="Previous" value={event.previous} />
        <NumberBox label="Forecast" value={event.forecast} />
        <NumberBox label="Actual" value={event.actual || "Pending"} />
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
          {theme.icon} {theme.name}
        </span>
      </div>

      <div style={styles.detailTime}>
        {event.day} at {event.time}
      </div>

      <div style={styles.detailGrid}>
        <NumberBox label="Previous" value={event.previous} />
        <NumberBox label="Forecast" value={event.forecast} />
        <NumberBox label="Actual" value={event.actual || "Pending"} />
      </div>

      <div style={styles.explainBox}>
        <strong>Why traders care</strong>
        <p>{event.note}</p>
      </div>

      <div style={styles.explainBoxYellow}>
        <strong>Journal integration</strong>
        <p>
          Later, any trade taken near this event can be automatically tagged as a news trade.
        </p>
      </div>
    </div>
  );
}

function EmptyDetails() {
  return (
    <div>
      <p style={styles.panelLabel}>Event Details</p>
      <h2 style={styles.detailTitle}>Select an event</h2>
      <p style={styles.sectionText}>Click a news event to see previous, forecast, actual, and trading notes.</p>
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
    position: "relative",
    overflow: "hidden",
    background: "#030712",
    color: "#ffffff",
    padding: "34px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  bgGrid: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(rgba(59,130,246,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.045) 1px, transparent 1px), radial-gradient(circle at 22% 0%, rgba(37,99,235,0.20), transparent 32%), radial-gradient(circle at 95% 12%, rgba(239,68,68,0.08), transparent 24%)",
    backgroundSize: "42px 42px, 42px 42px, auto, auto",
    pointerEvents: "none",
  },

  inner: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1500px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "flex-start",
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
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.07em",
  },

  subtitle: {
    margin: 0,
    maxWidth: "760px",
    color: "rgba(255,255,255,0.68)",
    fontSize: "16px",
    lineHeight: 1.6,
  },

  headerActions: {
    display: "flex",
    gap: "12px",
  },

  primaryButton: {
    minHeight: "46px",
    border: "none",
    background: "linear-gradient(180deg, #3483ff, #0f63e8)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "0 18px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondaryButton: {
    minHeight: "46px",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.60)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "0 18px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },

  commandBar: {
    minHeight: "62px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "18px",
    padding: "12px 16px",
    marginBottom: "18px",
    backdropFilter: "blur(12px)",
  },

  commandLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  commandLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  search: {
    width: "340px",
    maxWidth: "100%",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 13px",
    outline: "none",
    fontSize: "14px",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr) 350px",
    gap: "18px",
    alignItems: "start",
  },

  leftRail: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "20px",
    padding: "18px",
    backdropFilter: "blur(12px)",
  },

  mainFeed: {
    minWidth: 0,
  },

  rightPanel: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "20px",
    padding: "20px",
    backdropFilter: "blur(12px)",
  },

  filterBlock: {
    marginBottom: "20px",
  },

  filterTitle: {
    marginBottom: "10px",
    color: "rgba(255,255,255,0.58)",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.10em",
  },

  filterList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  currencyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  filterPill: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(2,8,19,0.38)",
    color: "rgba(255,255,255,0.72)",
    borderRadius: "12px",
    padding: "11px 12px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 850,
  },

  filterPillActive: {
    background: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.34)",
    color: "#ffffff",
  },

  ruleCard: {
    marginTop: "20px",
    border: "1px solid rgba(245,158,11,0.22)",
    background: "rgba(245,158,11,0.08)",
    borderRadius: "14px",
    padding: "14px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  ruleTitle: {
    color: "#fde68a",
    fontWeight: 950,
    marginBottom: "6px",
  },

  nextPanel: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    background: "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.76) 52%, rgba(127,29,29,0.18))",
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
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },

  nextTitle: {
    margin: "0 0 8px",
    fontSize: "32px",
    fontWeight: 950,
    letterSpacing: "-0.06em",
  },

  nextMeta: {
    color: "rgba(255,255,255,0.68)",
    fontSize: "15px",
    fontWeight: 800,
  },

  impactTile: {
    minWidth: "120px",
    border: "1px solid",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    textAlign: "center",
  },

  impactIcon: {
    fontSize: "26px",
  },

  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },

  sectionText: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,0.60)",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  countBadge: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(15,23,42,0.72)",
    color: "rgba(255,255,255,0.72)",
    borderRadius: "999px",
    padding: "8px 11px",
    fontSize: "12px",
    fontWeight: 900,
  },

  eventStack: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  eventCard: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "94px 5px minmax(0, 1fr) 250px",
    gap: "16px",
    alignItems: "center",
    border: "1px solid rgba(148,163,184,0.13)",
    background: "rgba(15,23,42,0.64)",
    color: "#ffffff",
    borderRadius: "18px",
    padding: "16px",
    cursor: "pointer",
    textAlign: "left",
  },

  eventCardActive: {
    border: "1px solid rgba(96,165,250,0.36)",
    background: "rgba(37,99,235,0.14)",
    boxShadow: "0 16px 40px rgba(37,99,235,0.10)",
  },

  eventTime: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  impactMarker: {
    width: "5px",
    height: "64px",
    borderRadius: "999px",
  },

  eventMain: {
    minWidth: 0,
  },

  eventTop: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },

  currencyBadge: {
    display: "inline-flex",
    minWidth: "44px",
    justifyContent: "center",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.12)",
    border: "1px solid rgba(96,165,250,0.20)",
    color: "#bfdbfe",
    padding: "5px 8px",
    fontSize: "12px",
    fontWeight: 900,
  },

  impactBadge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "12px",
    fontWeight: 900,
  },

  categoryBadge: {
    borderRadius: "999px",
    background: "rgba(148,163,184,0.10)",
    border: "1px solid rgba(148,163,184,0.12)",
    color: "rgba(255,255,255,0.72)",
    padding: "5px 8px",
    fontSize: "12px",
    fontWeight: 850,
  },

  numbersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  numberBox: {
    background: "rgba(2,8,19,0.36)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  detailTitle: {
    margin: "0 0 12px",
    fontSize: "28px",
    fontWeight: 950,
    letterSpacing: "-0.05em",
  },

  detailBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  detailTime: {
    color: "rgba(255,255,255,0.66)",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "16px",
  },

  detailGrid: {
    display: "grid",
    gap: "10px",
    marginBottom: "16px",
  },

  explainBox: {
    background: "rgba(37,99,235,0.10)",
    border: "1px solid rgba(96,165,250,0.18)",
    borderRadius: "14px",
    padding: "14px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px",
    lineHeight: 1.55,
    marginBottom: "12px",
  },

  explainBoxYellow: {
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.20)",
    borderRadius: "14px",
    padding: "14px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  emptyState: {
    border: "1px dashed rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.54)",
    borderRadius: "18px",
    padding: "38px",
    textAlign: "center",
    color: "rgba(255,255,255,0.58)",
  },
};
