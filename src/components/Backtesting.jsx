import React, { useEffect, useMemo, useState } from "react";

const CHART_WIDTH = 860;
const CHART_HEIGHT = 520;
const PRICE_SCALE_WIDTH = 78;
const TIME_AXIS_HEIGHT = 36;
const LEFT_PAD = 12;
const RIGHT_PAD = 8;
const TOP_PAD = 10;
const BOTTOM_PAD = 10;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateCandles(seed, startPrice, count) {
  const rand = mulberry32(seed);
  const candles = [];
  let price = startPrice;

  for (let i = 0; i < count; i += 1) {
    const drift = (rand() - 0.47) * 14;
    const open = price;
    const close = open + drift;
    const high = Math.max(open, close) + rand() * 7;
    const low = Math.min(open, close) - rand() * 7;

    candles.push({
      time: i,
      open,
      high,
      low,
      close,
    });

    price = close + (rand() - 0.5) * 3;
  }

  return candles;
}

function priceToY(price, minPrice, maxPrice) {
  const usableHeight = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;
  return TOP_PAD + ((maxPrice - price) / (maxPrice - minPrice || 1)) * usableHeight;
}

function indexToX(index, visibleCount) {
  const usableWidth = CHART_WIDTH - LEFT_PAD - RIGHT_PAD;
  const step = usableWidth / Math.max(visibleCount - 1, 1);
  return LEFT_PAD + index * step;
}

function xToIndex(x, visibleCount) {
  const usableWidth = CHART_WIDTH - LEFT_PAD - RIGHT_PAD;
  const step = usableWidth / Math.max(visibleCount - 1, 1);
  const raw = Math.round((x - LEFT_PAD) / step);
  return Math.max(0, Math.min(visibleCount - 1, raw));
}

function yToPrice(y, minPrice, maxPrice) {
  const usableHeight = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;
  const clamped = Math.max(TOP_PAD, Math.min(CHART_HEIGHT - BOTTOM_PAD, y));
  const ratio = (clamped - TOP_PAD) / usableHeight;
  return maxPrice - ratio * (maxPrice - minPrice);
}

function formatPrice(value) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ToolButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.toolBtn,
        ...(active ? styles.toolBtnActive : {}),
      }}
    >
      {children}
    </button>
  );
}

function SideRow({ name, value, change }) {
  return (
    <div style={styles.sideRow}>
      <div>
        <div style={styles.sideName}>{name}</div>
        <div style={styles.sideSub}>5m</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={styles.sideValue}>{value}</div>
        <div style={styles.sideChange}>{change}</div>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  visibleCandles,
  visibleCount,
  minPrice,
  maxPrice,
  priceLevels,
  timeLabels,
  annotations,
  draft,
  activeTool,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) {
  const last = visibleCandles[visibleCandles.length - 1];

  return (
    <div style={styles.chartPanel}>
      <div style={styles.chartHeader}>
        <div>
          <div style={styles.chartTitleLine}>
            <span style={styles.chartSymbol}>{title}</span>
            <span style={styles.chartTf}>5m</span>
          </div>
          <div style={styles.chartSubtitle}>{subtitle}</div>
        </div>

        <div style={styles.chartOhlc}>
          O {formatPrice(last.open)} H {formatPrice(last.high)} L {formatPrice(last.low)} C{" "}
          {formatPrice(last.close)}
        </div>
      </div>

      <div style={styles.chartBodyWrap}>
        <div style={styles.chartBody}>
          {[...Array(7)].map((_, i) => (
            <div
              key={`h-${i}`}
              style={{
                ...styles.hLine,
                top: `${14 + i * 12}%`,
              }}
            />
          ))}

          {[...Array(8)].map((_, i) => (
            <div
              key={`v-${i}`}
              style={{
                ...styles.vLine,
                left: `${12 + i * 11}%`,
              }}
            />
          ))}

          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            style={styles.chartSvg}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          >
            {visibleCandles.map((candle, i) => {
              const x = indexToX(i, visibleCount);
              const bodyWidth = Math.max(5, Math.min(10, (CHART_WIDTH - 24) / visibleCount * 0.58));
              const openY = priceToY(candle.open, minPrice, maxPrice);
              const closeY = priceToY(candle.close, minPrice, maxPrice);
              const highY = priceToY(candle.high, minPrice, maxPrice);
              const lowY = priceToY(candle.low, minPrice, maxPrice);
              const up = candle.close >= candle.open;
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(2, Math.abs(closeY - openY));

              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={up ? "#2563eb" : "#111827"}
                    strokeWidth="1.2"
                  />
                  <rect
                    x={x - bodyWidth / 2}
                    y={bodyTop}
                    width={bodyWidth}
                    height={bodyHeight}
                    fill={up ? "#2563eb" : "#111827"}
                    rx="0.5"
                  />
                </g>
              );
            })}

            {annotations.lines.map((line, i) => (
              <line
                key={`line-${i}`}
                x1={indexToX(line.startIndex, visibleCount)}
                y1={priceToY(line.startPrice, minPrice, maxPrice)}
                x2={indexToX(line.endIndex, visibleCount)}
                y2={priceToY(line.endPrice, minPrice, maxPrice)}
                stroke="#2563eb"
                strokeWidth="2"
              />
            ))}

            {annotations.equilibriums.map((eq, i) => {
              const x1 = indexToX(Math.min(eq.startIndex, eq.endIndex), visibleCount);
              const x2 = indexToX(Math.max(eq.startIndex, eq.endIndex), visibleCount);
              const y1 = priceToY(Math.max(eq.startPrice, eq.endPrice), minPrice, maxPrice);
              const y2 = priceToY(Math.min(eq.startPrice, eq.endPrice), minPrice, maxPrice);
              const midPrice = (eq.startPrice + eq.endPrice) / 2;
              const midY = priceToY(midPrice, minPrice, maxPrice);

              return (
                <g key={`eq-${i}`}>
                  <rect
                    x={x1}
                    y={y1}
                    width={Math.max(10, x2 - x1)}
                    height={Math.max(10, y2 - y1)}
                    fill="rgba(90, 90, 90, 0.18)"
                    stroke="rgba(90, 90, 90, 0.35)"
                  />
                  <line
                    x1={x1}
                    y1={midY}
                    x2={x2}
                    y2={midY}
                    stroke="#6b7280"
                    strokeDasharray="6 4"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x2 - 26}
                    y={midY - 6}
                    fill="#6b7280"
                    fontSize="12"
                    fontWeight="700"
                  >
                    EQ
                  </text>
                </g>
              );
            })}

            {annotations.longs.map((position, i) => {
              const x = indexToX(position.index, visibleCount);
              const width = 110;
              const entryY = priceToY(position.entry, minPrice, maxPrice);
              const stopY = priceToY(position.stop, minPrice, maxPrice);
              const targetY = priceToY(position.target, minPrice, maxPrice);

              return (
                <g key={`long-${i}`}>
                  <rect
                    x={x}
                    y={targetY}
                    width={width}
                    height={entryY - targetY}
                    fill="rgba(34, 197, 94, 0.16)"
                  />
                  <rect
                    x={x}
                    y={entryY}
                    width={width}
                    height={stopY - entryY}
                    fill="rgba(239, 68, 68, 0.14)"
                  />

                  <line x1={x} y1={targetY} x2={x + width} y2={targetY} stroke="#16a34a" strokeWidth="2" />
                  <line x1={x} y1={entryY} x2={x + width} y2={entryY} stroke="#2563eb" strokeWidth="2" />
                  <line x1={x} y1={stopY} x2={x + width} y2={stopY} stroke="#dc2626" strokeWidth="2" />

                  <text x={x + width - 62} y={targetY - 6} fill="#16a34a" fontSize="11" fontWeight="700">
                    TP
                  </text>
                  <text x={x + width - 74} y={entryY - 6} fill="#2563eb" fontSize="11" fontWeight="700">
                    Entry
                  </text>
                  <text x={x + width - 62} y={stopY - 6} fill="#dc2626" fontSize="11" fontWeight="700">
                    SL
                  </text>
                </g>
              );
            })}

            {draft && activeTool === "line" && (
              <line
                x1={indexToX(draft.startIndex, visibleCount)}
                y1={priceToY(draft.startPrice, minPrice, maxPrice)}
                x2={indexToX(draft.currentIndex, visibleCount)}
                y2={priceToY(draft.currentPrice, minPrice, maxPrice)}
                stroke="#60a5fa"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            )}

            {draft && activeTool === "equilibrium" && (() => {
              const x1 = indexToX(Math.min(draft.startIndex, draft.currentIndex), visibleCount);
              const x2 = indexToX(Math.max(draft.startIndex, draft.currentIndex), visibleCount);
              const y1 = priceToY(Math.max(draft.startPrice, draft.currentPrice), minPrice, maxPrice);
              const y2 = priceToY(Math.min(draft.startPrice, draft.currentPrice), minPrice, maxPrice);
              const midPrice = (draft.startPrice + draft.currentPrice) / 2;
              const midY = priceToY(midPrice, minPrice, maxPrice);

              return (
                <g>
                  <rect
                    x={x1}
                    y={y1}
                    width={Math.max(10, x2 - x1)}
                    height={Math.max(10, y2 - y1)}
                    fill="rgba(90, 90, 90, 0.14)"
                    stroke="rgba(90, 90, 90, 0.45)"
                    strokeDasharray="5 4"
                  />
                  <line
                    x1={x1}
                    y1={midY}
                    x2={x2}
                    y2={midY}
                    stroke="#6b7280"
                    strokeDasharray="6 4"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })()}

            {draft && activeTool === "long" && (() => {
              const x = indexToX(draft.startIndex, visibleCount);
              const width = 110;
              const entry = draft.startPrice;
              const stop = Math.min(entry - 0.5, draft.currentPrice);
              const risk = entry - stop;
              const target = entry + risk * 2;

              const entryY = priceToY(entry, minPrice, maxPrice);
              const stopY = priceToY(stop, minPrice, maxPrice);
              const targetY = priceToY(target, minPrice, maxPrice);

              return (
                <g>
                  <rect x={x} y={targetY} width={width} height={entryY - targetY} fill="rgba(34, 197, 94, 0.12)" />
                  <rect x={x} y={entryY} width={width} height={stopY - entryY} fill="rgba(239, 68, 68, 0.12)" />
                  <line x1={x} y1={targetY} x2={x + width} y2={targetY} stroke="#16a34a" strokeWidth="2" strokeDasharray="6 4" />
                  <line x1={x} y1={entryY} x2={x + width} y2={entryY} stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" />
                  <line x1={x} y1={stopY} x2={x + width} y2={stopY} stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" />
                </g>
              );
            })()}
          </svg>

          <div style={styles.priceScale}>
            {priceLevels.map((level, i) => (
              <div key={i} style={styles.priceLabel}>
                {formatPrice(level)}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.timeAxis}>
          {timeLabels.map((label, i) => (
            <div key={i} style={styles.timeLabel}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Backtesting() {
  const esAll = useMemo(() => generateCandles(12, 5120, 140), []);
  const nqAll = useMemo(() => generateCandles(28, 22300, 140), []);

  const [visibleCount, setVisibleCount] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeTool, setActiveTool] = useState("cursor");
  const [activeChart, setActiveChart] = useState("es");

  const [annotations, setAnnotations] = useState({
    es: { lines: [], longs: [], equilibriums: [] },
    nq: { lines: [], longs: [], equilibriums: [] },
  });

  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + 1;
        if (next >= Math.min(esAll.length, nqAll.length)) {
          setIsPlaying(false);
          return Math.min(esAll.length, nqAll.length);
        }
        return next;
      });
    }, speed === 1 ? 550 : speed === 2 ? 300 : 140);

    return () => clearInterval(timer);
  }, [isPlaying, speed, esAll.length, nqAll.length]);

  const esVisible = esAll.slice(0, visibleCount);
  const nqVisible = nqAll.slice(0, visibleCount);

  const buildScale = (candles) => {
    const low = Math.min(...candles.map((c) => c.low));
    const high = Math.max(...candles.map((c) => c.high));
    const pad = (high - low) * 0.12 || 1;
    const minPrice = low - pad;
    const maxPrice = high + pad;
    const step = (maxPrice - minPrice) / 5;
    const priceLevels = Array.from({ length: 6 }, (_, i) => maxPrice - i * step);
    const timeStep = Math.max(1, Math.floor(candles.length / 5));
    const timeLabels = Array.from({ length: 6 }, (_, i) => {
      const idx = Math.min(candles.length - 1, i * timeStep);
      const mins = 30 + idx * 5;
      const hour = 9 + Math.floor(mins / 60);
      const minute = mins % 60;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    });

    return { minPrice, maxPrice, priceLevels, timeLabels };
  };

  const esScale = buildScale(esVisible);
  const nqScale = buildScale(nqVisible);

  const handleChartPointer = (chart, scale, event) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * CHART_HEIGHT;

    return {
      chart,
      index: xToIndex(x, visibleCount),
      price: yToPrice(y, scale.minPrice, scale.maxPrice),
    };
  };

  const handleMouseDown = (chart, scale) => (event) => {
    if (activeTool === "cursor") return;

    const point = handleChartPointer(chart, scale, event);
    setActiveChart(chart);

    if (activeTool === "line" || activeTool === "equilibrium" || activeTool === "long") {
      setDraft({
        chart,
        startIndex: point.index,
        startPrice: point.price,
        currentIndex: point.index,
        currentPrice: point.price,
      });
    }
  };

  const handleMouseMove = (chart, scale) => (event) => {
    if (!draft || draft.chart !== chart) return;
    const point = handleChartPointer(chart, scale, event);

    setDraft((prev) =>
      prev
        ? {
            ...prev,
            currentIndex: point.index,
            currentPrice: point.price,
          }
        : prev
    );
  };

  const handleMouseUp = (chart) => () => {
    if (!draft || draft.chart !== chart) return;

    setAnnotations((prev) => {
      const next = { ...prev };
      const bucket = { ...next[chart] };

      if (activeTool === "line") {
        bucket.lines = [
          ...bucket.lines,
          {
            startIndex: draft.startIndex,
            startPrice: draft.startPrice,
            endIndex: draft.currentIndex,
            endPrice: draft.currentPrice,
          },
        ];
      }

      if (activeTool === "equilibrium") {
        bucket.equilibriums = [
          ...bucket.equilibriums,
          {
            startIndex: draft.startIndex,
            startPrice: draft.startPrice,
            endIndex: draft.currentIndex,
            endPrice: draft.currentPrice,
          },
        ];
      }

      if (activeTool === "long") {
        const entry = draft.startPrice;
        const stop = Math.min(entry - 0.5, draft.currentPrice);
        const risk = Math.max(0.25, entry - stop);
        const target = entry + risk * 2;

        bucket.longs = [
          ...bucket.longs,
          {
            index: draft.startIndex,
            entry,
            stop,
            target,
          },
        ];
      }

      next[chart] = bucket;
      return next;
    });

    setDraft(null);
  };

  const clearActiveChart = () => {
    setAnnotations((prev) => ({
      ...prev,
      [activeChart]: { lines: [], longs: [], equilibriums: [] },
    }));
    setDraft(null);
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <div style={styles.symbolChip}>ES1!</div>
          <div style={styles.symbolChip}>5m</div>
          <button style={styles.topBtn}>Indicators</button>
          <button style={styles.topBtn}>Compare</button>
          <button style={{ ...styles.topBtn, ...styles.topBtnPrimary }}>Dual Sync</button>
        </div>

        <div style={styles.topRight}>
          <button style={styles.topIconBtn} onClick={() => setVisibleCount((v) => Math.max(20, v - 1))}>
            ◀
          </button>
          <button style={styles.topIconBtn} onClick={() => setIsPlaying((v) => !v)}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            style={styles.topIconBtn}
            onClick={() => setVisibleCount((v) => Math.min(Math.min(esAll.length, nqAll.length), v + 1))}
          >
            Step
          </button>
          <button
            style={styles.topIconBtn}
            onClick={() => {
              setVisibleCount(80);
              setIsPlaying(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={styles.workspace}>
        <div style={styles.leftToolbar}>
          <ToolButton active={activeTool === "cursor"} onClick={() => { setActiveTool("cursor"); setDraft(null); }}>
            ⌖
          </ToolButton>
          <ToolButton active={activeTool === "line"} onClick={() => { setActiveTool("line"); setDraft(null); }}>
            ╱
          </ToolButton>
          <ToolButton active={activeTool === "long"} onClick={() => { setActiveTool("long"); setDraft(null); }}>
            Long
          </ToolButton>
          <ToolButton active={activeTool === "equilibrium"} onClick={() => { setActiveTool("equilibrium"); setDraft(null); }}>
            EQ
          </ToolButton>
          <ToolButton active={false} onClick={clearActiveChart}>
            Clear
          </ToolButton>
        </div>

        <div style={styles.center}>
          <div style={styles.innerToolbar}>
            <div style={styles.innerToolbarGroup}>
              {["╱", "╲", "▭", "⊙", "T", "＋"].map((item, i) => (
                <button key={i} style={styles.miniBtn}>
                  {item}
                </button>
              ))}
            </div>

            <div style={styles.innerToolbarGroup}>
              <button style={styles.miniBtn}>1x</button>
              <button style={styles.miniBtn} onClick={() => setSpeed(1)}>1</button>
              <button style={styles.miniBtn} onClick={() => setSpeed(2)}>2</button>
              <button style={styles.miniBtn} onClick={() => setSpeed(4)}>4</button>
            </div>
          </div>

          <div style={styles.chartsRow}>
            <ChartPanel
              title="ES1!"
              subtitle="E-mini S&P 500 Futures · 5 · CME"
              visibleCandles={esVisible}
              visibleCount={visibleCount}
              minPrice={esScale.minPrice}
              maxPrice={esScale.maxPrice}
              priceLevels={esScale.priceLevels}
              timeLabels={esScale.timeLabels}
              annotations={annotations.es}
              draft={draft?.chart === "es" ? draft : null}
              activeTool={activeTool}
              onMouseDown={handleMouseDown("es", esScale)}
              onMouseMove={handleMouseMove("es", esScale)}
              onMouseUp={handleMouseUp("es")}
            />

            <ChartPanel
              title="NQ1!"
              subtitle="NASDAQ 100 E-mini Futures · 5 · CME"
              visibleCandles={nqVisible}
              visibleCount={visibleCount}
              minPrice={nqScale.minPrice}
              maxPrice={nqScale.maxPrice}
              priceLevels={nqScale.priceLevels}
              timeLabels={nqScale.timeLabels}
              annotations={annotations.nq}
              draft={draft?.chart === "nq" ? draft : null}
              activeTool={activeTool}
              onMouseDown={handleMouseDown("nq", nqScale)}
              onMouseMove={handleMouseMove("nq", nqScale)}
              onMouseUp={handleMouseUp("nq")}
            />
          </div>

          <div style={styles.bottomBar}>
            <div style={styles.bottomLeft}>
              <span style={styles.bottomText}>Visible Candles: {visibleCount}</span>
              <span style={styles.bottomText}>Speed: {speed}x</span>
            </div>

            <div style={styles.bottomCenter}>
              <span style={styles.modePill}>Mode: Dual Sync</span>
            </div>

            <div style={styles.bottomRight}>
              <button style={styles.miniBtn} onClick={() => setAnnotations({
                es: { lines: [], longs: [], equilibriums: [] },
                nq: { lines: [], longs: [], equilibriums: [] },
              })}>
                Clear All
              </button>
            </div>
          </div>

          <div style={styles.timeline}>
            <div style={styles.timelineTrack} />
            <div
              style={{
                ...styles.timelineMarker,
                left: `${(visibleCount / Math.min(esAll.length, nqAll.length)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Watchlist</h3>
            <SideRow name="SSP 500" value="5,124.75" change="+16.25" />
            <SideRow name="NASDAQ 100" value="22,351.00" change="+38.75" />
            <SideRow name="Dow Jones" value="39,687" change="+60" />
            <SideRow name="Russell 2000" value="2,029.5" change="+17.2" />
          </div>

          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Trade Info</h3>
            <p style={styles.sideText}>Tool: {activeTool}</p>
            <p style={styles.sideText}>Active Chart: {activeChart.toUpperCase()}</p>
            <p style={styles.sideText}>Lines: {annotations[activeChart].lines.length}</p>
            <p style={styles.sideText}>Longs: {annotations[activeChart].longs.length}</p>
            <p style={styles.sideText}>Equilibriums: {annotations[activeChart].equilibriums.length}</p>
          </div>

          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Replay Stats</h3>
            <p style={styles.sideText}>Visible Candles: {visibleCount}</p>
            <p style={styles.sideText}>Speed: {speed}x</p>
            <p style={styles.sideText}>Mode: Dual Sync</p>
            <p style={styles.sideText}>Status: {isPlaying ? "Playing" : "Paused"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#b0b0b7",
    color: "#111827",
    boxSizing: "border-box",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  topBar: {
    height: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "0 12px",
    background: "#f7f7f8",
    borderBottom: "1px solid #d5d5db",
  },

  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  topRight: {
    display: "flex",
    gap: 8,
  },

  symbolChip: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    fontSize: 14,
    fontWeight: 600,
  },

  topBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "transparent",
    border: "1px solid #d1d5db",
    fontSize: 14,
    cursor: "pointer",
  },

  topBtnPrimary: {
    background: "#e8eefc",
    border: "1px solid #93c5fd",
  },

  topIconBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontSize: 14,
  },

  workspace: {
    display: "grid",
    gridTemplateColumns: "60px 1fr 300px",
    gap: 10,
    padding: 10,
  },

  leftToolbar: {
    background: "#f8fafc",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: 10,
  },

  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },

  toolBtnActive: {
    background: "#dbeafe",
    border: "1px solid #60a5fa",
    color: "#1d4ed8",
  },

  center: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  innerToolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: 8,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #d1d5db",
  },

  innerToolbarGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  miniBtn: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: 13,
  },

  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 0,
    border: "1px solid #9ca3af",
    borderRadius: 14,
    overflow: "hidden",
  },

  chartPanel: {
    background: "#b0b0b7",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #9ca3af",
  },

  chartHeader: {
    padding: "12px 14px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  chartTitleLine: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  chartSymbol: {
    fontSize: 18,
    fontWeight: 700,
  },

  chartTf: {
    fontSize: 15,
    color: "#374151",
  },

  chartSubtitle: {
    marginTop: 8,
    fontSize: 15,
  },

  chartOhlc: {
    fontSize: 14,
    color: "#047857",
    fontWeight: 600,
    marginTop: 2,
    whiteSpace: "nowrap",
  },

  chartBodyWrap: {
    display: "flex",
    flexDirection: "column",
  },

  chartBody: {
    position: "relative",
    height: CHART_HEIGHT,
    background: "#b0b0b7",
    borderTop: "1px solid rgba(0,0,0,0.04)",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },

  hLine: {
    position: "absolute",
    left: 0,
    right: PRICE_SCALE_WIDTH,
    height: 1,
    background: "rgba(0,0,0,0.05)",
  },

  vLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    background: "rgba(0,0,0,0.05)",
  },

  chartSvg: {
    position: "absolute",
    left: 0,
    top: 0,
    width: `calc(100% - ${PRICE_SCALE_WIDTH}px)`,
    height: CHART_HEIGHT,
    cursor: "crosshair",
  },

  priceScale: {
    position: "absolute",
    top: 0,
    right: 0,
    width: PRICE_SCALE_WIDTH,
    height: "100%",
    borderLeft: "1px solid rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
    fontSize: 12,
    color: "#111827",
  },

  priceLabel: {
    whiteSpace: "nowrap",
  },

  timeAxis: {
    height: TIME_AXIS_HEIGHT,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    fontSize: 12,
    color: "#111827",
  },

  timeLabel: {
    minWidth: 48,
    textAlign: "center",
  },

  bottomBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #d1d5db",
  },

  bottomLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  bottomCenter: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  bottomRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  bottomText: {
    fontSize: 14,
  },

  modePill: {
    padding: "7px 12px",
    borderRadius: 999,
    background: "#e8eefc",
    border: "1px solid #93c5fd",
    fontSize: 14,
  },

  timeline: {
    height: 52,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #d1d5db",
    position: "relative",
    overflow: "hidden",
  },

  timelineTrack: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 18,
    height: 16,
    background:
      "repeating-linear-gradient(90deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 14px)",
  },

  timelineMarker: {
    position: "absolute",
    top: 10,
    width: 3,
    height: 32,
    background: "#2563eb",
    borderRadius: 999,
    transform: "translateX(-50%)",
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  sideCard: {
    background: "#f8fafc",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 16,
  },

  sideTitle: {
    margin: "0 0 14px 0",
    fontSize: 17,
  },

  sideText: {
    margin: "0 0 10px 0",
    fontSize: 14,
    color: "#111827",
  },

  sideRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid rgba(0,0,0,0.08)",
  },

  sideName: {
    fontSize: 15,
  },

  sideSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 3,
  },

  sideValue: {
    fontSize: 15,
    color: "#047857",
  },

  sideChange: {
    fontSize: 12,
    color: "#047857",
    marginTop: 3,
  },
};