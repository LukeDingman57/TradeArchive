import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

const generateMockData = () => {
  const data = [];
  let lastClose = 24120;

  for (let i = 0; i < 120; i++) {
    const open = lastClose;

    const drift =
      i < 20 ? 6 :
      i < 35 ? -3 :
      i < 60 ? 8 :
      i < 80 ? -6 :
      i < 100 ? 4 : -2;

    const noise = (Math.random() - 0.5) * 18;
    const close = open + drift + noise;
    const high = Math.max(open, close) + Math.random() * 8 + 2;
    const low = Math.min(open, close) - Math.random() * 8 - 2;

    data.push({
      time: i + 1,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    lastClose = close;
  }

  return data;
};

const fullData = generateMockData();

export default function Backtesting() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const maSeriesRef = useRef(null);
  const playIntervalRef = useRef(null);

  const entryLineRef = useRef(null);
  const stopLineRef = useRef(null);
  const targetLineRef = useRef(null);

  const [index, setIndex] = useState(35);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const [tradeDirection, setTradeDirection] = useState("long");
  const [tradeStep, setTradeStep] = useState("idle");
  const [entryPrice, setEntryPrice] = useState(null);
  const [stopPrice, setStopPrice] = useState(null);
  const [targetPrice, setTargetPrice] = useState(null);
  const [tradeStatus, setTradeStatus] = useState("No trade");
  const [tradeResult, setTradeResult] = useState(null);

  const visibleData = useMemo(() => fullData.slice(0, index), [index]);
  const lastCandle = visibleData[visibleData.length - 1];

  const removePriceLine = (lineRef) => {
    if (lineRef.current && candleSeriesRef.current) {
      candleSeriesRef.current.removePriceLine(lineRef.current);
      lineRef.current = null;
    }
  };

  const syncTradeLines = () => {
    if (!candleSeriesRef.current) return;

    removePriceLine(entryLineRef);
    removePriceLine(stopLineRef);
    removePriceLine(targetLineRef);

    if (entryPrice != null) {
      entryLineRef.current = candleSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: tradeDirection === "long" ? "#22c55e" : "#3b82f6",
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: "ENTRY",
      });
    }

    if (stopPrice != null) {
      stopLineRef.current = candleSeriesRef.current.createPriceLine({
        price: stopPrice,
        color: "#ef4444",
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "STOP",
      });
    }

    if (targetPrice != null) {
      targetLineRef.current = candleSeriesRef.current.createPriceLine({
        price: targetPrice,
        color: "#a855f7",
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "TARGET",
      });
    }
  };

  const clearTrade = () => {
    setEntryPrice(null);
    setStopPrice(null);
    setTargetPrice(null);
    setTradeStep("idle");
    setTradeStatus("No trade");
    setTradeResult(null);
    removePriceLine(entryLineRef);
    removePriceLine(stopLineRef);
    removePriceLine(targetLineRef);
  };

  const startTradeSetup = () => {
    clearTrade();
    setTradeStep("entry");
    setTradeStatus("Click chart to place ENTRY");
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 620,
      layout: {
        background: { type: ColorType.Solid, color: "#0a1220" },
        textColor: "#9fb0c8",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.15)",
        scaleMargins: {
          top: 0.08,
          bottom: 0.08,
        },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.15)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const maSeries = chart.addSeries(LineSeries, {
      color: "#60a5fa",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chart.subscribeClick((param) => {
      if (!param?.point || !candleSeriesRef.current) return;
      if (tradeStep === "idle" || tradeStep === "done") return;

      const price = candleSeriesRef.current.coordinateToPrice(param.point.y);
      if (price == null) return;

      const rounded = Number(price.toFixed(2));

      if (tradeStep === "entry") {
        setEntryPrice(rounded);
        setTradeStep("stop");
        setTradeStatus("Click chart to place STOP");
      } else if (tradeStep === "stop") {
        setStopPrice(rounded);
        setTradeStep("target");
        setTradeStatus("Click chart to place TARGET");
      } else if (tradeStep === "target") {
        setTargetPrice(rounded);
        setTradeStep("done");
        setTradeStatus("Trade armed");
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    maSeriesRef.current = maSeries;

    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(playIntervalRef.current);
      chart.remove();
    };
  }, [tradeStep]);

  useEffect(() => {
    if (!candleSeriesRef.current || !maSeriesRef.current) return;

    candleSeriesRef.current.setData(visibleData);

    const maData = visibleData.map((bar, i) => {
      const slice = visibleData.slice(Math.max(0, i - 9), i + 1);
      const avg =
        slice.reduce((sum, item) => sum + item.close, 0) / slice.length;

      return {
        time: bar.time,
        value: Number(avg.toFixed(2)),
      };
    });

    maSeriesRef.current.setData(maData);
    chartRef.current?.timeScale().fitContent();
  }, [visibleData]);

  useEffect(() => {
    syncTradeLines();
  }, [entryPrice, stopPrice, targetPrice, tradeDirection]);

  useEffect(() => {
    if (!isPlaying) {
      clearInterval(playIntervalRef.current);
      return;
    }

    playIntervalRef.current = setInterval(() => {
      setIndex((prev) => {
        if (prev >= fullData.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(playIntervalRef.current);
  }, [isPlaying, speed]);

  useEffect(() => {
    if (
      tradeStep !== "done" ||
      entryPrice == null ||
      stopPrice == null ||
      targetPrice == null ||
      !lastCandle ||
      tradeResult
    ) {
      return;
    }

    if (tradeDirection === "long") {
      if (lastCandle.low <= stopPrice) {
        setTradeResult("Stopped Out");
        setTradeStatus("Stopped Out");
        setIsPlaying(false);
        return;
      }
      if (lastCandle.high >= targetPrice) {
        setTradeResult("Target Hit");
        setTradeStatus("Target Hit");
        setIsPlaying(false);
      }
    } else {
      if (lastCandle.high >= stopPrice) {
        setTradeResult("Stopped Out");
        setTradeStatus("Stopped Out");
        setIsPlaying(false);
        return;
      }
      if (lastCandle.low <= targetPrice) {
        setTradeResult("Target Hit");
        setTradeStatus("Target Hit");
        setIsPlaying(false);
      }
    }
  }, [
    lastCandle,
    tradeDirection,
    tradeStep,
    entryPrice,
    stopPrice,
    targetPrice,
    tradeResult,
  ]);

  const resetReplay = () => {
    setIsPlaying(false);
    setIndex(35);
    clearTrade();
  };

  const unrealizedPnL = (() => {
    if (entryPrice == null || !lastCandle) return null;

    const pnl =
      tradeDirection === "long"
        ? lastCandle.close - entryPrice
        : entryPrice - lastCandle.close;

    return Number(pnl.toFixed(2));
  })();

  const risk = (() => {
    if (entryPrice == null || stopPrice == null) return null;
    return Number(Math.abs(entryPrice - stopPrice).toFixed(2));
  })();

  const reward = (() => {
    if (entryPrice == null || targetPrice == null) return null;
    return Number(Math.abs(targetPrice - entryPrice).toFixed(2));
  })();

  const rr = (() => {
    if (risk == null || reward == null || risk === 0) return null;
    return Number((reward / risk).toFixed(2));
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #13233f 0%, #0a1220 45%, #060c16 100%)",
        color: "white",
        padding: "18px",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(148,163,184,0.14)",
          borderRadius: "18px",
          overflow: "hidden",
          background: "rgba(8, 15, 28, 0.88)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            borderBottom: "1px solid rgba(148,163,184,0.12)",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Backtesting / Replay
            </div>

            <div style={pillBlue}>NQ1!</div>
            <div style={pillGray}>1m</div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["1m", "5m", "15m", "1H"].map((tf) => (
              <button key={tf} style={toolbarButton(tf === "1m")}>
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            borderBottom: "1px solid rgba(148,163,184,0.12)",
            padding: "10px 18px",
            display: "flex",
            gap: "18px",
            flexWrap: "wrap",
            fontSize: "13px",
            color: "#cbd5e1",
          }}
        >
          <span><strong style={{ color: "#94a3b8" }}>O</strong> {lastCandle?.open?.toFixed(2)}</span>
          <span><strong style={{ color: "#94a3b8" }}>H</strong> {lastCandle?.high?.toFixed(2)}</span>
          <span><strong style={{ color: "#94a3b8" }}>L</strong> {lastCandle?.low?.toFixed(2)}</span>
          <span><strong style={{ color: "#94a3b8" }}>C</strong> {lastCandle?.close?.toFixed(2)}</span>
          <span><strong style={{ color: "#94a3b8" }}>Bars Visible</strong> {index}</span>
          <span><strong style={{ color: "#94a3b8" }}>Replay</strong> {isPlaying ? "Playing" : "Paused"}</span>
        </div>

        <div
          style={{
            padding: "14px 18px",
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "14px",
              }}
            >
              <button onClick={() => setIndex((prev) => Math.max(1, prev - 1))} style={controlButton()}>
                Previous
              </button>

              <button onClick={() => setIndex((prev) => Math.min(fullData.length, prev + 1))} style={controlButton()}>
                Next
              </button>

              <button onClick={() => setIsPlaying(true)} style={controlButton("#0f3b26", "#22c55e")}>
                Play
              </button>

              <button onClick={() => setIsPlaying(false)} style={controlButton("#3a1f23", "#ef4444")}>
                Pause
              </button>

              <button onClick={resetReplay} style={controlButton()}>
                Reset
              </button>

              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={selectStyle}
              >
                <option value={1200}>Slow</option>
                <option value={600}>Normal</option>
                <option value={250}>Fast</option>
              </select>
            </div>

            <div
              ref={chartContainerRef}
              style={{
                width: "100%",
                minHeight: "620px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,0.14)",
                background: "#0a1220",
              }}
            />
          </div>

          <div
            style={{
              border: "1px solid rgba(148,163,184,0.14)",
              borderRadius: "16px",
              background: "rgba(12, 18, 30, 0.92)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <div style={sectionTitle}>Trade Direction</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setTradeDirection("long")} style={toggleButton(tradeDirection === "long")}>
                  Long
                </button>
                <button onClick={() => setTradeDirection("short")} style={toggleButton(tradeDirection === "short")}>
                  Short
                </button>
              </div>
            </div>

            <div>
              <div style={sectionTitle}>Trade Setup</div>
              <button onClick={startTradeSetup} style={actionButton}>
                Set Entry / Stop / Target
              </button>
              <button onClick={clearTrade} style={secondaryActionButton}>
                Clear Trade
              </button>
              <div style={{ marginTop: "10px", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.5 }}>
                {tradeStatus}
              </div>
            </div>

            <div>
              <div style={sectionTitle}>Trade Levels</div>
              <div style={statRow}>
                <span>Entry</span>
                <strong>{entryPrice ?? "--"}</strong>
              </div>
              <div style={statRow}>
                <span>Stop</span>
                <strong>{stopPrice ?? "--"}</strong>
              </div>
              <div style={statRow}>
                <span>Target</span>
                <strong>{targetPrice ?? "--"}</strong>
              </div>
            </div>

            <div>
              <div style={sectionTitle}>Trade Stats</div>
              <div style={statRow}>
                <span>Status</span>
                <strong>{tradeResult || "Open / Waiting"}</strong>
              </div>
              <div style={statRow}>
                <span>Unrealized PnL</span>
                <strong
                  style={{
                    color:
                      unrealizedPnL == null
                        ? "#fff"
                        : unrealizedPnL >= 0
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                >
                  {unrealizedPnL == null ? "--" : unrealizedPnL}
                </strong>
              </div>
              <div style={statRow}>
                <span>Risk</span>
                <strong>{risk ?? "--"}</strong>
              </div>
              <div style={statRow}>
                <span>Reward</span>
                <strong>{reward ?? "--"}</strong>
              </div>
              <div style={statRow}>
                <span>R:R</span>
                <strong>{rr ?? "--"}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const pillBlue = {
  padding: "8px 12px",
  borderRadius: "10px",
  background: "rgba(59,130,246,0.12)",
  border: "1px solid rgba(59,130,246,0.28)",
  color: "#dbeafe",
  fontSize: "13px",
  fontWeight: 700,
};

const pillGray = {
  padding: "8px 12px",
  borderRadius: "10px",
  background: "rgba(148,163,184,0.08)",
  border: "1px solid rgba(148,163,184,0.14)",
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 600,
};

const toolbarButton = (active = false) => ({
  padding: "8px 12px",
  borderRadius: "10px",
  border: active
    ? "1px solid rgba(59,130,246,0.55)"
    : "1px solid rgba(148,163,184,0.14)",
  background: active ? "rgba(59,130,246,0.18)" : "rgba(148,163,184,0.06)",
  color: active ? "#dbeafe" : "#cbd5e1",
  fontWeight: 700,
  cursor: "pointer",
});

const controlButton = (bg = "rgba(148,163,184,0.08)", border = "#334155") => ({
  padding: "10px 14px",
  border: `1px solid ${border}`,
  borderRadius: "10px",
  background: bg,
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
});

const toggleButton = (active = false) => ({
  flex: 1,
  padding: "10px 12px",
  borderRadius: "10px",
  border: active
    ? "1px solid rgba(59,130,246,0.55)"
    : "1px solid rgba(148,163,184,0.14)",
  background: active ? "rgba(59,130,246,0.18)" : "rgba(148,163,184,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
});

const actionButton = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(59,130,246,0.55)",
  background: "rgba(59,130,246,0.18)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  marginBottom: "10px",
};

const secondaryActionButton = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(148,163,184,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const sectionTitle = {
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#94a3b8",
  marginBottom: "10px",
  fontWeight: 800,
};

const statRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid rgba(148,163,184,0.10)",
  fontSize: "14px",
};

const selectStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(148,163,184,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};