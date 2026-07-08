import React from "react";

const MARKET_FILTER_KEY = "tradearchive_market_filters";
const NEXT_NEWS_KEY = "tradearchive_next_news_event";

const sampleEvents = [
  { id: "1", date: "Today", time: "8:30 AM", impact: "High", currency: "USD", event: "Core CPI m/m", previous: "0.2%", forecast: "0.3%", actual: "", description: "Inflation data can move indexes, bonds, the dollar, gold, and futures quickly." },
  { id: "2", date: "Today", time: "8:30 AM", impact: "High", currency: "USD", event: "CPI y/y", previous: "3.3%", forecast: "3.4%", actual: "", description: "Major inflation release. High volatility is common around the release." },
  { id: "3", date: "Today", time: "10:00 AM", impact: "Medium", currency: "USD", event: "Consumer Sentiment", previous: "65.6", forecast: "66.0", actual: "", description: "Sentiment can affect risk assets, especially when the number strongly surprises." },
  { id: "4", date: "Tomorrow", time: "8:30 AM", impact: "High", currency: "USD", event: "PPI m/m", previous: "0.1%", forecast: "0.2%", actual: "", description: "Producer inflation can move markets, especially when CPI is already in focus." },
  { id: "5", date: "Tomorrow", time: "2:00 PM", impact: "High", currency: "USD", event: "FOMC Minutes", previous: "—", forecast: "—", actual: "", description: "Fed communication can move NQ, ES, DXY, yields, and gold." },
  { id: "6", date: "This Week", time: "8:30 AM", impact: "High", currency: "USD", event: "Non-Farm Payrolls", previous: "206K", forecast: "190K", actual: "", description: "NFP is one of the biggest recurring events for futures traders." },
  { id: "7", date: "This Week", time: "9:45 AM", impact: "Medium", currency: "USD", event: "Flash PMI", previous: "51.6", forecast: "51.8", actual: "", description: "Business activity report. Can matter more when growth concerns are elevated." },
  { id: "8", date: "Today", time: "4:30 AM", impact: "Medium", currency: "GBP", event: "GDP m/m", previous: "0.4%", forecast: "0.2%", actual: "", description: "UK growth data. Mostly relevant for GBP pairs and broader risk sentiment." },
  { id: "9", date: "Today", time: "5:00 AM", impact: "Medium", currency: "EUR", event: "German ZEW", previous: "47.5", forecast: "49.0", actual: "", description: "Eurozone sentiment data. Mostly relevant for EUR pairs and DAX traders." },
  { id: "10", date: "This Week", time: "7:30 PM", impact: "Low", currency: "JPY", event: "Trade Balance", previous: "—", forecast: "—", actual: "", description: "Usually lower impact unless the release strongly surprises expectations." },
];

const defaultFilters = { impacts: ["High", "Medium"], currencies: ["USD"], dateRange: "Today", search: "" };
const impactOptions = ["High", "Medium", "Low"];
const currencyOptions = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"];
const dateOptions = ["Today", "Tomorrow", "This Week"];

function loadFilters() {
  if (typeof window === "undefined") return defaultFilters;
  try {
    const stored = window.localStorage.getItem(MARKET_FILTER_KEY);
    return stored ? { ...defaultFilters, ...JSON.parse(stored) } : defaultFilters;
  } catch {
    return defaultFilters;
  }
}

function saveFilters(filters) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MARKET_FILTER_KEY, JSON.stringify(filters));
  }
}

function saveNextNews(event) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NEXT_NEWS_KEY, JSON.stringify(event || null));
  }
}

function getImpactStyle(impact) {
  if (impact === "High") return { dot: "#ef4444", bg: "rgba(239,68,68,0.13)", border: "rgba(239,68,68,0.26)", text: "#fecaca" };
  if (impact === "Medium") return { dot: "#f59e0b", bg: "rgba(245,158,11,0.13)", border: "rgba(245,158,11,0.26)", text: "#fde68a" };
  return { dot: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.24)", text: "#bbf7d0" };
}

export default function Market({ setActivePage }) {
  const [filters, setFilters] = React.useState(loadFilters);
  const [selectedEventId, setSelectedEventId] = React.useState(sampleEvents[0].id);

  React.useEffect(() => saveFilters(filters), [filters]);

  const filteredEvents = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return sampleEvents.filter((event) => {
      const matchesDate = filters.dateRange === "This Week" || event.date === filters.dateRange || event.date === "Today";
      const matchesSearch =
        !search ||
        event.event.toLowerCase().includes(search) ||
        event.currency.toLowerCase().includes(search) ||
        event.impact.toLowerCase().includes(search);

      return (
        filters.impacts.includes(event.impact) &&
        filters.currencies.includes(event.currency) &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [filters]);

  const nextEvent = filteredEvents[0] || null;
  const selectedEvent = filteredEvents.find((event) => event.id === selectedEventId) || filteredEvents[0] || null;

  React.useEffect(() => saveNextNews(nextEvent), [nextEvent]);

  const toggleList = (key, value) => {
    setFilters((current) => {
      const list = current[key];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, [key]: next.length ? next : list };
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MARKET PREP</p>
            <h1 style={styles.title}>Market</h1>
            <p style={styles.subtitle}>
              Check economic news, filter red-folder events, and feed the dashboard's Next News card.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button style={styles.secondaryButton} onClick={() => setActivePage?.("dashboard")}>Dashboard</button>
            <button style={styles.primaryButton} onClick={() => setFilters(defaultFilters)}>Reset Filters</button>
          </div>
        </header>

        <section style={styles.topGrid}>
          <NextEventCard event={nextEvent} />
          <InfoCard label="Session" title="New York" text="Later this can show London, NY, Tokyo, and session countdowns." />
          <InfoCard label="Journal Link" title="News Tagging" text="Later, trades near major events can be tagged automatically." />
        </section>

        <main style={styles.grid}>
          <aside style={styles.panel}>
            <h2 style={styles.sectionTitle}>Filters</h2>
            <p style={styles.sectionText}>These filters control this page and the dashboard Next News card.</p>

            <FilterGroup title="Impact">
              {impactOptions.map((impact) => (
                <FilterButton key={impact} label={impact} active={filters.impacts.includes(impact)} dot={getImpactStyle(impact).dot} onClick={() => toggleList("impacts", impact)} />
              ))}
            </FilterGroup>

            <FilterGroup title="Currency">
              <div style={styles.currencyGrid}>
                {currencyOptions.map((currency) => (
                  <FilterButton key={currency} label={currency} active={filters.currencies.includes(currency)} onClick={() => toggleList("currencies", currency)} />
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Date">
              {dateOptions.map((range) => (
                <FilterButton key={range} label={range} active={filters.dateRange === range} onClick={() => setFilters((current) => ({ ...current, dateRange: range }))} />
              ))}
            </FilterGroup>

            <div style={styles.warningBox}>
              <strong>Trading reminder</strong>
              <p>High-impact news can create violent wicks. Build rules around when you will not trade.</p>
            </div>
          </aside>

          <section style={styles.calendarPanel}>
            <div style={styles.calendarHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Economic Calendar</h2>
                <p style={styles.sectionText}>Sample layout for now. Next step is connecting live data.</p>
              </div>

              <input
                style={styles.searchInput}
                placeholder="Search event, currency, impact..."
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Impact</th>
                    <th style={styles.th}>Currency</th>
                    <th style={styles.th}>Event</th>
                    <th style={styles.th}>Previous</th>
                    <th style={styles.th}>Forecast</th>
                    <th style={styles.th}>Actual</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr><td style={styles.emptyCell} colSpan="7">No events match your filters.</td></tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        active={selectedEvent?.id === event.id}
                        onClick={() => setSelectedEventId(event.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside style={styles.panel}>
            {selectedEvent ? <EventDetail event={selectedEvent} /> : <p style={styles.sectionText}>Select an event.</p>}
          </aside>
        </main>
      </div>
    </div>
  );
}

function NextEventCard({ event }) {
  const impact = getImpactStyle(event?.impact);

  return (
    <article style={styles.nextCard}>
      <div style={styles.cardTop}>
        <p style={styles.cardLabel}>Next News</p>
        {event && <ImpactBadge event={event} />}
      </div>

      {event ? (
        <>
          <h2 style={styles.nextTitle}>{event.event}</h2>
          <div style={styles.meta}>{event.currency} • {event.date} • {event.time}</div>
          <div style={{ color: impact.text, fontWeight: 900 }}>Feeds dashboard card</div>
        </>
      ) : (
        <>
          <h2 style={styles.nextTitle}>No news found</h2>
          <div style={styles.meta}>Adjust filters to show events.</div>
        </>
      )}
    </article>
  );
}

function InfoCard({ label, title, text }) {
  return (
    <article style={styles.infoCard}>
      <p style={styles.cardLabel}>{label}</p>
      <h2 style={styles.infoTitle}>{title}</h2>
      <p style={styles.infoText}>{text}</p>
    </article>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div style={styles.filterGroup}>
      <div style={styles.filterTitle}>{title}</div>
      <div style={styles.filterStack}>{children}</div>
    </div>
  );
}

function FilterButton({ active, label, dot, onClick }) {
  return (
    <button type="button" style={{ ...styles.filterButton, ...(active ? styles.filterButtonActive : {}) }} onClick={onClick}>
      {dot && <span style={{ ...styles.dot, background: dot }} />}
      {label}
    </button>
  );
}

function ImpactBadge({ event }) {
  const impact = getImpactStyle(event.impact);

  return (
    <span style={{ ...styles.impactBadge, background: impact.bg, borderColor: impact.border, color: impact.text }}>
      <span style={{ ...styles.dot, background: impact.dot }} />
      {event.impact}
    </span>
  );
}

function EventRow({ event, active, onClick }) {
  return (
    <tr onClick={onClick} style={{ ...styles.row, ...(active ? styles.rowActive : {}) }}>
      <td style={styles.td}><strong>{event.time}</strong><div style={styles.dateText}>{event.date}</div></td>
      <td style={styles.td}><ImpactBadge event={event} /></td>
      <td style={styles.td}><span style={styles.currencyBadge}>{event.currency}</span></td>
      <td style={{ ...styles.td, color: "#fff", fontWeight: 900 }}>{event.event}</td>
      <td style={styles.td}>{event.previous}</td>
      <td style={styles.td}>{event.forecast}</td>
      <td style={styles.td}>{event.actual || "—"}</td>
    </tr>
  );
}

function EventDetail({ event }) {
  return (
    <div>
      <div style={styles.detailHeader}>
        <ImpactBadge event={event} />
        <span style={styles.currencyBadge}>{event.currency}</span>
      </div>

      <h2 style={styles.detailTitle}>{event.event}</h2>
      <p style={styles.meta}>{event.date} • {event.time}</p>

      <div style={styles.detailGrid}>
        <DetailMetric label="Previous" value={event.previous} />
        <DetailMetric label="Forecast" value={event.forecast} />
        <DetailMetric label="Actual" value={event.actual || "Pending"} />
      </div>

      <div style={styles.explainBox}>
        <strong>Why traders care</strong>
        <p>{event.description}</p>
      </div>

      <div style={styles.rulesBox}>
        <strong>Possible rule</strong>
        <p>Avoid entries 5–15 minutes before and after high-impact events unless news trading is part of your tested plan.</p>
      </div>
    </div>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div style={styles.detailMetric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const panelBase = {
  background: "linear-gradient(180deg, rgba(15,23,42,0.73), rgba(5,13,27,0.78))",
  border: "1px solid rgba(148,163,184,0.13)",
  borderRadius: "20px",
  padding: "20px",
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 20% -10%, rgba(37,99,235,0.16), transparent 30%), radial-gradient(circle at 95% 8%, rgba(14,165,233,0.10), transparent 25%), #020813",
    color: "#ffffff",
    padding: "38px 34px 54px",
    boxSizing: "border-box",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  inner: { maxWidth: "1480px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px", marginBottom: "22px" },
  eyebrow: { margin: "0 0 10px", color: "#93c5fd", fontSize: "12px", fontWeight: 850, letterSpacing: "0.18em" },
  title: { margin: "0 0 10px", fontSize: "48px", lineHeight: 1, fontWeight: 900, letterSpacing: "-0.06em" },
  subtitle: { margin: 0, maxWidth: "820px", color: "rgba(241,245,249,0.76)", fontSize: "17px", lineHeight: 1.6 },
  headerActions: { display: "flex", gap: "14px", flexShrink: 0 },
  primaryButton: { minHeight: "48px", border: "none", background: "linear-gradient(180deg, #3483ff, #0f63e8)", color: "#fff", borderRadius: "12px", padding: "0 20px", fontSize: "15px", fontWeight: 850, cursor: "pointer" },
  secondaryButton: { minHeight: "48px", border: "1px solid rgba(148,163,184,0.22)", background: "rgba(2,8,19,0.30)", color: "#fff", borderRadius: "12px", padding: "0 20px", fontSize: "15px", fontWeight: 780, cursor: "pointer" },
  topGrid: { display: "grid", gridTemplateColumns: "1.25fr 0.85fr 0.85fr", gap: "16px", marginBottom: "18px" },
  nextCard: { ...panelBase, background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(15,23,42,0.76) 48%, rgba(2,8,19,0.80))" },
  infoCard: panelBase,
  cardTop: { display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", marginBottom: "12px" },
  cardLabel: { margin: 0, color: "#93c5fd", textTransform: "uppercase", fontSize: "12px", fontWeight: 850, letterSpacing: "0.10em" },
  nextTitle: { margin: "0 0 8px", fontSize: "30px", fontWeight: 900, letterSpacing: "-0.05em" },
  meta: { color: "rgba(255,255,255,0.70)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" },
  infoTitle: { margin: "10px 0 8px", fontSize: "22px", fontWeight: 900, letterSpacing: "-0.04em" },
  infoText: { margin: 0, color: "rgba(255,255,255,0.68)", fontSize: "14px", lineHeight: 1.55 },
  grid: { display: "grid", gridTemplateColumns: "280px minmax(0, 1fr) 360px", gap: "18px", alignItems: "start" },
  panel: panelBase,
  calendarPanel: { ...panelBase, minWidth: 0 },
  calendarHeader: { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", paddingBottom: "16px", borderBottom: "1px solid rgba(148,163,184,0.13)", marginBottom: "16px" },
  sectionTitle: { margin: 0, fontSize: "22px", fontWeight: 900, letterSpacing: "-0.04em" },
  sectionText: { margin: "7px 0 0", color: "rgba(255,255,255,0.64)", fontSize: "14px", lineHeight: 1.5 },
  searchInput: { width: "300px", maxWidth: "100%", border: "1px solid rgba(148,163,184,0.18)", background: "#0f172a", color: "#fff", borderRadius: "12px", padding: "12px 13px", fontSize: "14px", outline: "none" },
  filterGroup: { marginTop: "18px" },
  filterTitle: { color: "rgba(255,255,255,0.76)", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "12px", fontWeight: 850, marginBottom: "10px" },
  filterStack: { display: "flex", flexDirection: "column", gap: "8px" },
  currencyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  filterButton: { width: "100%", border: "1px solid rgba(148,163,184,0.13)", background: "rgba(2,8,19,0.28)", color: "rgba(255,255,255,0.76)", borderRadius: "12px", padding: "11px 12px", cursor: "pointer", fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" },
  filterButtonActive: { background: "rgba(37,99,235,0.16)", border: "1px solid rgba(96,165,250,0.30)", color: "#fff" },
  warningBox: { marginTop: "18px", border: "1px solid rgba(245,158,11,0.22)", background: "rgba(245,158,11,0.08)", borderRadius: "14px", padding: "14px", color: "rgba(255,255,255,0.72)", fontSize: "13px", lineHeight: 1.5 },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "760px" },
  th: { padding: "12px 10px", textAlign: "left", color: "rgba(255,255,255,0.58)", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(148,163,184,0.13)" },
  row: { cursor: "pointer", borderBottom: "1px solid rgba(148,163,184,0.10)" },
  rowActive: { background: "rgba(37,99,235,0.10)" },
  td: { padding: "14px 10px", color: "rgba(255,255,255,0.78)", fontSize: "14px", verticalAlign: "middle" },
  dateText: { color: "rgba(255,255,255,0.48)", fontSize: "12px", fontWeight: 700, marginTop: "3px" },
  impactBadge: { display: "inline-flex", alignItems: "center", gap: "7px", border: "1px solid", borderRadius: "999px", padding: "6px 9px", fontSize: "12px", fontWeight: 850, whiteSpace: "nowrap" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  currencyBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "44px", borderRadius: "999px", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.20)", color: "#bfdbfe", padding: "6px 9px", fontSize: "12px", fontWeight: 900 },
  emptyCell: { padding: "32px", color: "rgba(255,255,255,0.58)", textAlign: "center" },
  detailHeader: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" },
  detailTitle: { margin: "0 0 8px", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em" },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "16px" },
  detailMetric: { background: "rgba(2,8,19,0.34)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "12px", padding: "13px", display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.78)" },
  explainBox: { background: "rgba(37,99,235,0.10)", border: "1px solid rgba(96,165,250,0.18)", borderRadius: "14px", padding: "15px", marginBottom: "12px", color: "rgba(255,255,255,0.72)", fontSize: "13px", lineHeight: 1.55 },
  rulesBox: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.20)", borderRadius: "14px", padding: "15px", color: "rgba(255,255,255,0.72)", fontSize: "13px", lineHeight: 1.55 },
};