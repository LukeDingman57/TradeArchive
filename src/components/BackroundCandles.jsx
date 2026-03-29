import { useEffect, useMemo, useState } from "react";

function makeSeedCandles(count = 70, start = 100) {
  const candles = [];
  let lastClose = start;

  for (let i = 0; i < count; i++) {
    const drift = (Math.random() - 0.5) * 8;
    const open = lastClose;
    const close = open + drift;
    const high = Math.max(open, close) + Math.random() * 4;
    const low = Math.min(open, close) - Math.random() * 4;

    candles.push({ id: i, open, close, high, low });
    lastClose = close;
  }

  return candles;
}

function nextCandle(previous, id) {
  const open = previous.close;
  const drift = (Math.random() - 0.48) * 10;
  const close = open + drift;
  const high = Math.max(open, close) + Math.random() * 4.5;
  const low = Math.min(open, close) - Math.random() * 4.5;

  return { id, open, close, high, low };
}

export default function BackgroundCandles() {
  const initial = useMemo(() => makeSeedCandles(), []);
  const [candles, setCandles] = useState(initial);

  useEffect(() => {
    let nextId = initial.length;

    const interval = setInterval(() => {
      setCandles((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(1), nextCandle(last, nextId++)];
      });
    }, 450);

    return () => clearInterval(interval);
  }, [initial]);

  const allHigh = Math.max(...candles.map((c) => c.high));
  const allLow = Math.min(...candles.map((c) => c.low));
  const range = allHigh - allLow || 1;

  return (
    <div style={styles.wrap}>
      <div style={styles.grid} />
      <div style={styles.chart}>
        {candles.map((c) => {
          const isUp = c.close >= c.open;

          const bodyTop = ((allHigh - Math.max(c.open, c.close)) / range) * 100;
          const bodyBottom = ((Math.min(c.open, c.close) - allLow) / range) * 100;
          const wickTop = ((allHigh - c.high) / range) * 100;
          const wickBottom = ((c.low - allLow) / range) * 100;

          return (
            <div key={c.id} style={styles.candleSlot}>
              <div
                style={{
                  ...styles.wick,
                  top: `${wickTop}%`,
                  bottom: `${wickBottom}%`,
                }}
              />
              <div
                style={{
                  ...styles.body,
                  top: `${bodyTop}%`,
                  bottom: `${bodyBottom}%`,
                  background: isUp
                    ? "rgba(30,203,120,0.9)"
                    : "rgba(224,71,71,0.88)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background:
      "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 45%), #050505",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: "100% 20%, 80px 100%",
    opacity: 0.22,
  },
  chart: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "stretch",
    gap: "6px",
    padding: "40px 24px 24px 24px",
  },
  candleSlot: {
    position: "relative",
    flex: 1,
    minWidth: "6px",
    height: "100%",
  },
  wick: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    width: "2px",
    background: "rgba(255,255,255,0.85)",
    borderRadius: "999px",
  },
  body: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    width: "72%",
    minHeight: "6px",
    borderRadius: "4px",
  },
};