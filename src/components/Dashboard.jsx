import React from "react";

function useIsMobileDashboard() {
  const getIsMobile = () =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const [isMobile, setIsMobile] = React.useState(getIsMobile);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

export default function Dashboard({ setActivePage }) {
  const isMobile = useIsMobileDashboard();

  const features = [
    {
      icon: "✍️",
      title: "Trade Journaling",
      text: "Log trades, screenshots, mistakes, and notes.",
      page: "journal",
    },
    {
      icon: "📊",
      title: "Performance Analytics",
      text: "See what is helping or hurting your results.",
      page: "pricing",
    },
    {
      icon: "🗂️",
      title: "Strategy Archive",
      text: "Keep your best setups easy to find.",
      page: "journal",
    },
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "Free",
      description: "Great for getting started and building consistency.",
      buttonText: "Start Free",
      highlighted: false,
      page: "journal",
      features: [
        "Manual trade journaling",
        "Basic trade notes",
        "Simple performance stats",
        "50 journal entries total",
        "1 journal workspace",
      ],
    },
    {
      name: "Essential",
      price: "$3.99/mo",
      description: "For traders who want structure and cleaner review.",
      buttonText: "Get Essential",
      highlighted: true,
      page: "pricing",
      features: [
        "Everything in Free",
        "Unlimited journal entries",
        "Screenshot uploads",
        "Mistake tracking",
        "Performance analytics",
        "Setup tagging",
      ],
    },
    {
      name: "Essential Yearly",
      price: "$39.99/yr",
      description: "Same Essential tools with yearly billing.",
      buttonText: "Get Yearly",
      highlighted: false,
      page: "pricing",
      features: [
        "Everything in Essential",
        "Unlimited journal entries",
        "Screenshot uploads",
        "Mistake tracking",
        "Performance analytics",
        "Lower effective monthly price",
      ],
    },
  ];

  const chartCandles = [
    { x: 520, wickTop: 455, wickBottom: 595, bodyTop: 495, bodyHeight: 58, color: "rgba(34,197,94,0.40)" },
    { x: 542, wickTop: 430, wickBottom: 570, bodyTop: 468, bodyHeight: 64, color: "rgba(34,197,94,0.40)" },
    { x: 564, wickTop: 410, wickBottom: 548, bodyTop: 448, bodyHeight: 60, color: "rgba(34,197,94,0.40)" },
    { x: 586, wickTop: 388, wickBottom: 528, bodyTop: 425, bodyHeight: 66, color: "rgba(34,197,94,0.40)" },
    { x: 608, wickTop: 370, wickBottom: 512, bodyTop: 408, bodyHeight: 62, color: "rgba(34,197,94,0.40)" },
    { x: 630, wickTop: 352, wickBottom: 495, bodyTop: 388, bodyHeight: 68, color: "rgba(34,197,94,0.40)" },
    { x: 652, wickTop: 338, wickBottom: 480, bodyTop: 374, bodyHeight: 65, color: "rgba(34,197,94,0.40)" },
    { x: 674, wickTop: 326, wickBottom: 468, bodyTop: 360, bodyHeight: 70, color: "rgba(34,197,94,0.40)" },
    { x: 696, wickTop: 316, wickBottom: 458, bodyTop: 352, bodyHeight: 68, color: "rgba(34,197,94,0.40)" },
    { x: 718, wickTop: 330, wickBottom: 470, bodyTop: 366, bodyHeight: 62, color: "rgba(239,68,68,0.36)" },
    { x: 740, wickTop: 346, wickBottom: 486, bodyTop: 382, bodyHeight: 58, color: "rgba(239,68,68,0.36)" },
    { x: 762, wickTop: 336, wickBottom: 475, bodyTop: 370, bodyHeight: 66, color: "rgba(34,197,94,0.40)" },
    { x: 784, wickTop: 315, wickBottom: 455, bodyTop: 350, bodyHeight: 72, color: "rgba(34,197,94,0.40)" },
    { x: 806, wickTop: 288, wickBottom: 430, bodyTop: 323, bodyHeight: 76, color: "rgba(34,197,94,0.40)" },
    { x: 828, wickTop: 268, wickBottom: 410, bodyTop: 304, bodyHeight: 74, color: "rgba(34,197,94,0.40)" },
    { x: 850, wickTop: 252, wickBottom: 395, bodyTop: 288, bodyHeight: 72, color: "rgba(34,197,94,0.40)" },
    { x: 872, wickTop: 238, wickBottom: 384, bodyTop: 274, bodyHeight: 78, color: "rgba(34,197,94,0.40)" },
    { x: 894, wickTop: 225, wickBottom: 370, bodyTop: 262, bodyHeight: 74, color: "rgba(34,197,94,0.40)" },
    { x: 916, wickTop: 214, wickBottom: 360, bodyTop: 250, bodyHeight: 79, color: "rgba(34,197,94,0.40)" },
    { x: 938, wickTop: 202, wickBottom: 346, bodyTop: 238, bodyHeight: 76, color: "rgba(34,197,94,0.40)" },
    { x: 960, wickTop: 190, wickBottom: 336, bodyTop: 226, bodyHeight: 82, color: "rgba(34,197,94,0.40)" },
    { x: 982, wickTop: 176, wickBottom: 320, bodyTop: 212, bodyHeight: 78, color: "rgba(34,197,94,0.40)" },
    { x: 1004, wickTop: 165, wickBottom: 308, bodyTop: 200, bodyHeight: 80, color: "rgba(34,197,94,0.40)" },
    { x: 1026, wickTop: 156, wickBottom: 300, bodyTop: 192, bodyHeight: 76, color: "rgba(34,197,94,0.40)" },
    { x: 1048, wickTop: 176, wickBottom: 322, bodyTop: 214, bodyHeight: 72, color: "rgba(239,68,68,0.36)" },
    { x: 1070, wickTop: 192, wickBottom: 338, bodyTop: 230, bodyHeight: 68, color: "rgba(239,68,68,0.36)" },
    { x: 1092, wickTop: 205, wickBottom: 352, bodyTop: 242, bodyHeight: 65, color: "rgba(34,197,94,0.40)" },
    { x: 1114, wickTop: 182, wickBottom: 332, bodyTop: 220, bodyHeight: 72, color: "rgba(34,197,94,0.40)" },
    { x: 1136, wickTop: 160, wickBottom: 312, bodyTop: 198, bodyHeight: 76, color: "rgba(34,197,94,0.40)" },
    { x: 1158, wickTop: 140, wickBottom: 292, bodyTop: 178, bodyHeight: 80, color: "rgba(34,197,94,0.40)" },
    { x: 1180, wickTop: 122, wickBottom: 276, bodyTop: 160, bodyHeight: 82, color: "rgba(34,197,94,0.40)" },
    { x: 1202, wickTop: 110, wickBottom: 264, bodyTop: 148, bodyHeight: 86, color: "rgba(34,197,94,0.40)" },
    { x: 1224, wickTop: 98, wickBottom: 252, bodyTop: 136, bodyHeight: 88, color: "rgba(34,197,94,0.40)" },
    { x: 1246, wickTop: 90, wickBottom: 244, bodyTop: 128, bodyHeight: 86, color: "rgba(34,197,94,0.40)" },
    { x: 1268, wickTop: 100, wickBottom: 255, bodyTop: 138, bodyHeight: 80, color: "rgba(239,68,68,0.36)" },
    { x: 1290, wickTop: 112, wickBottom: 268, bodyTop: 150, bodyHeight: 76, color: "rgba(239,68,68,0.36)" },
    { x: 1312, wickTop: 118, wickBottom: 272, bodyTop: 156, bodyHeight: 72, color: "rgba(34,197,94,0.40)" },
    { x: 1334, wickTop: 118, wickBottom: 272, bodyTop: 156, bodyHeight: 72, color: "rgba(34,197,94,0.40)" },
    { x: 1356, wickTop: 118, wickBottom: 272, bodyTop: 156, bodyHeight: 72, color: "rgba(34,197,94,0.40)" },
    { x: 1378, wickTop: 120, wickBottom: 274, bodyTop: 158, bodyHeight: 74, color: "rgba(34,197,94,0.40)" },
    { x: 1400, wickTop: 114, wickBottom: 268, bodyTop: 152, bodyHeight: 78, color: "rgba(34,197,94,0.40)" },
    { x: 1422, wickTop: 106, wickBottom: 262, bodyTop: 144, bodyHeight: 82, color: "rgba(34,197,94,0.40)" },
    { x: 1444, wickTop: 96, wickBottom: 252, bodyTop: 134, bodyHeight: 86, color: "rgba(34,197,94,0.40)" },
    { x: 1466, wickTop: 88, wickBottom: 244, bodyTop: 126, bodyHeight: 88, color: "rgba(34,197,94,0.40)" },
  ];

  return (
    <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
      <div style={styles.chartBackground}>
        <div style={styles.gridOverlay}></div>
        <div style={styles.verticalFade}></div>

        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
          style={styles.chartSvg}
        >
          <g opacity="0.95">
            {chartCandles.map((candle, index) => (
              <g key={index}>
                <line
                  x1={candle.x}
                  y1={candle.wickTop}
                  x2={candle.x}
                  y2={candle.wickBottom}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.3"
                />
                <rect
                  x={candle.x - 4}
                  y={candle.bodyTop}
                  width="8"
                  height={candle.bodyHeight}
                  fill={candle.color}
                  rx="1.4"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div style={{ ...styles.brandMark, ...(isMobile ? styles.brandMarkMobile : {}) }}>
        <span style={styles.brandTrade}>Trade</span>
        <span style={styles.brandArchive}>Archive</span>
      </div>

      <section style={{ ...styles.hero, ...(isMobile ? styles.heroMobile : {}) }}>
        <div style={{ ...styles.heroLeft, ...(isMobile ? styles.heroLeftMobile : {}) }}>
          <p style={{ ...styles.smallText, ...(isMobile ? styles.smallTextMobile : {}) }}>JOURNAL. REVIEW. IMPROVE.</p>

          <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>A cleaner way to review your trades</h1>

          <p style={{ ...styles.subtitle, ...(isMobile ? styles.subtitleMobile : {}) }}>
            Log trades, track mistakes, review screenshots, and see what is actually helping your trading.
          </p>

          <div style={{ ...styles.buttonRow, ...(isMobile ? styles.buttonRowMobile : {}) }}>
            <button
              style={{ ...styles.primaryButton, ...(isMobile ? styles.mobileFullButton : {}) }}
              onClick={() => setActivePage("journal")}
            >
              Start Free
            </button>

            <button
              style={{ ...styles.secondaryButton, ...(isMobile ? styles.mobileFullButton : {}) }}
              onClick={() => setActivePage("pricing")}
            >
              View Features
            </button>
          </div>
        </div>

        <div style={{ ...styles.heroRight, ...(isMobile ? styles.heroRightMobile : {}) }}>
          <div style={{ ...styles.snapshotCard, ...(isMobile ? styles.snapshotCardMobile : {}) }}>
            <h3 style={styles.snapshotTitle}>Performance Snapshot</h3>

            <div style={styles.statRow}>
              <span style={styles.statLabel}>Win Rate</span>
              <span style={styles.statValue}>58.4%</span>
            </div>

            <div style={styles.statRow}>
              <span style={styles.statLabel}>Profit Factor</span>
              <span style={styles.statValue}>1.86</span>
            </div>

            <div style={styles.statRow}>
              <span style={styles.statLabel}>Avg. R</span>
              <span style={styles.statValue}>1.42R</span>
            </div>

            <div style={styles.statRow}>
              <span style={styles.statLabel}>Best Setup</span>
              <span style={styles.statValue}>Opening Range</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...styles.featuresSection, ...(isMobile ? styles.sectionMobile : {}) }}>
        <p style={styles.featuresLabel}>CORE FEATURES</p>
        <h2 style={{ ...styles.featuresTitle, ...(isMobile ? styles.sectionTitleMobile : {}) }}>
          Built for better trade review
        </h2>
        <p style={{ ...styles.featuresSubtitle, ...(isMobile ? styles.sectionSubtitleMobile : {}) }}>
          Keep the important parts of your trading process organized without a messy spreadsheet.
        </p>

        <div style={{ ...styles.featuresGrid, ...(isMobile ? styles.featuresGridMobile : {}) }}>
          {features.map((feature, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActivePage(feature.page)}
              style={styles.featureCardButton}
            >
              <div style={{ ...styles.featureCard, ...(isMobile ? styles.featureCardMobile : {}) }}>
                <div style={styles.iconBox}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureText}>{feature.text}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section style={{ ...styles.pricingSection, ...(isMobile ? styles.sectionMobile : {}) }}>
        <p style={styles.pricingLabel}>PRICING</p>
        <h2 style={{ ...styles.pricingTitle, ...(isMobile ? styles.sectionTitleMobile : {}) }}>Simple pricing</h2>
        <p style={{ ...styles.pricingSubtitle, ...(isMobile ? styles.sectionSubtitleMobile : {}) }}>
          Start free, then upgrade when you want unlimited journaling, screenshots, and better review tools.
        </p>

        <div style={{ ...styles.pricingGrid, ...(isMobile ? styles.pricingGridMobile : {}) }}>
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              style={{
                ...styles.pricingCard,
                ...(isMobile ? styles.pricingCardMobile : {}),
                ...(plan.highlighted ? styles.pricingCardHighlight : {}),
                ...(isMobile && plan.highlighted ? styles.pricingCardHighlightMobile : {}),
              }}
            >
              {plan.highlighted && (
                <div style={styles.popularBadge}>Most Popular</div>
              )}

              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.planPrice}>{plan.price}</div>
              <p style={styles.planDescription}>{plan.description}</p>

              <button
                style={{
                  ...styles.planButton,
                  ...(plan.highlighted ? styles.planButtonHighlight : {}),
                }}
                onClick={() => setActivePage(plan.page)}
              >
                {plan.buttonText}
              </button>

              <div style={styles.planFeatureList}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={styles.planFeatureItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...styles.supportSection, ...(isMobile ? styles.supportSectionMobile : {}) }}>
        <div style={{ ...styles.supportCard, ...(isMobile ? styles.supportCardMobile : {}) }}>
          <div>
            <div style={styles.supportLabel}>SUPPORT & FEEDBACK</div>
            <h2 style={{ ...styles.supportTitle, ...(isMobile ? styles.supportTitleMobile : {}) }}>
              Need help or have an idea?
            </h2>
            <p style={{ ...styles.supportText, ...(isMobile ? styles.supportTextMobile : {}) }}>
              Found a bug, need account help, or have an idea for TradeArchive? Send it over anytime.
            </p>
          </div>

          <div style={{ ...styles.supportActions, ...(isMobile ? styles.supportActionsMobile : {}) }}>
            <a
              href="mailto:support@tradearchive.net"
              style={{ ...styles.supportButton, ...(isMobile ? styles.supportButtonMobile : {}) }}
            >
              Contact Support
            </a>

            <a
              href="mailto:support@tradearchive.net?subject=TradeArchive%20Suggestion"
              style={{ ...styles.supportSecondaryButton, ...(isMobile ? styles.supportButtonMobile : {}) }}
            >
              Send Suggestion
            </a>
          </div>

          <div style={styles.supportEmail}>
            support@tradearchive.net
          </div>
        </div>
      </section>

    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top center, rgba(14,165,233,0.12), transparent 30%), linear-gradient(180deg, #03111f 0%, #020b16 45%, #01060d 100%)",
    color: "#ffffff",
    padding: "30px 34px 54px",
    boxSizing: "border-box",
  },

  chartBackground: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.46,
    overflow: "hidden",
  },

  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
    backgroundSize: "72px 72px",
  },

  verticalFade: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.12) 0%, rgba(2,6,23,0.05) 35%, rgba(2,6,23,0.65) 78%, rgba(2,6,23,0.88) 100%)",
  },

  chartSvg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "62%",
  },

  brandMark: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    fontSize: "38px",
    fontWeight: "650",
    letterSpacing: "-0.025em",
    lineHeight: 1,
    marginBottom: "18px",
  },

  brandTrade: {
    color: "#ffffff",
  },

  brandArchive: {
    color: "#60a5fa",
  },

  hero: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "34px",
    alignItems: "center",
    marginBottom: "38px",
  },

  heroLeft: {
    maxWidth: "760px",
  },

  smallText: {
    color: "#7dd3fc",
    fontSize: "14px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "14px",
  },

  title: {
    fontSize: "52px",
    lineHeight: "0.98",
    fontWeight: "650",
    margin: "0 0 22px 0",
    letterSpacing: "-0.035em",
  },

  subtitle: {
    fontSize: "15px",
    lineHeight: "1.55",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "700px",
    marginBottom: "30px",
  },

  buttonRow: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },

  primaryButton: {
    background: "#ffffff",
    color: "#0f172a",
    border: "none",
    borderRadius: "14px",
    padding: "16px 24px",
    fontSize: "15px",
    fontWeight: "650",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(255,255,255,0.08)",
  },

  secondaryButton: {
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "14px",
    padding: "16px 24px",
    fontSize: "15px",
    fontWeight: "650",
    cursor: "pointer",
  },

  heroRight: {
    display: "flex",
    justifyContent: "center",
  },

  snapshotCard: {
    width: "100%",
    maxWidth: "340px",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(6px)",
  },

  snapshotTitle: {
    fontSize: "20px",
    margin: "0 0 22px 0",
    color: "rgba(255,255,255,0.95)",
  },

  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  statLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
  },

  statValue: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "650",
  },

  featuresSection: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    background: "rgba(0,0,0,0.34)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "34px 24px 26px",
    boxSizing: "border-box",
    backdropFilter: "blur(4px)",
  },

  featuresLabel: {
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
    fontSize: "14px",
    letterSpacing: "0.12em",
    marginBottom: "12px",
  },

  featuresTitle: {
    textAlign: "center",
    fontSize: "38px",
    lineHeight: "1.06",
    fontWeight: "650",
    margin: "0 0 18px 0",
    letterSpacing: "-0.025em",
  },

  featuresSubtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
    lineHeight: "1.6",
    maxWidth: "950px",
    margin: "0 auto 36px auto",
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    width: "100%",
  },

  featureCardButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
    width: "100%",
    color: "#f8fafc",
    fontFamily: "inherit",
  },

  featureCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(0,0,0,0.28))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "22px 18px",
    minHeight: "178px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    justifyContent: "flex-start",
    backdropFilter: "blur(3px)",
    transition: "transform 0.2s ease, border 0.2s ease",
  },

  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "18px",
  },

  featureTitle: {
    fontSize: "20px",
    lineHeight: "1.2",
    fontWeight: "650",
    margin: "0 0 14px 0",
    color: "#f8fafc",
    textShadow: "0 1px 12px rgba(0,0,0,0.45)",
  },

  featureText: {
    color: "rgba(248,250,252,0.78)",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: 0,
  },

  pricingSection: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    marginTop: "32px",
    background: "rgba(0,0,0,0.34)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "34px 24px 26px",
    boxSizing: "border-box",
    backdropFilter: "blur(4px)",
  },

  pricingLabel: {
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
    fontSize: "14px",
    letterSpacing: "0.12em",
    marginBottom: "12px",
  },

  pricingTitle: {
    textAlign: "center",
    fontSize: "32px",
    lineHeight: "1.08",
    fontWeight: "650",
    margin: "0 0 18px 0",
    letterSpacing: "-0.025em",
  },

  pricingSubtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    fontSize: "20px",
    lineHeight: "1.6",
    maxWidth: "900px",
    margin: "0 auto 36px auto",
  },

  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    width: "100%",
  },

  pricingCard: {
    position: "relative",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.3))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "22px 18px",
    minHeight: "430px",
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(3px)",
  },

  pricingCardHighlight: {
    border: "1px solid rgba(59,130,246,0.45)",
    boxShadow:
      "0 0 0 1px rgba(59,130,246,0.2), 0 18px 50px rgba(37,99,235,0.18)",
    transform: "translateY(-6px)",
  },

  popularBadge: {
    position: "absolute",
    top: "-12px",
    right: "20px",
    background: "#3b82f6",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "650",
    padding: "8px 12px",
    borderRadius: "999px",
    boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
  },

  planName: {
    fontSize: "24px",
    fontWeight: "650",
    margin: "0 0 10px 0",
  },

  planPrice: {
    fontSize: "24px",
    fontWeight: "650",
    marginBottom: "12px",
    letterSpacing: "-0.03em",
  },

  planDescription: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "rgba(255,255,255,0.72)",
    margin: "0 0 20px 0",
  },

  planButton: {
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "14px",
    padding: "14px 18px",
    fontSize: "15px",
    fontWeight: "650",
    cursor: "pointer",
    marginBottom: "24px",
  },

  planButtonHighlight: {
    background: "#ffffff",
    color: "#0f172a",
    border: "none",
  },

  planFeatureList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "auto",
  },

  planFeatureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "rgba(255,255,255,0.82)",
    fontSize: "15px",
    lineHeight: "1.5",
  },


  supportSection: {
    position: "relative",
    zIndex: 2,
    marginTop: "32px",
    marginBottom: "10px",
  },

  supportCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.30))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "34px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    backdropFilter: "blur(4px)",
  },

  supportLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: "13px",
    letterSpacing: "0.12em",
    marginBottom: "10px",
  },

  supportTitle: {
    margin: "0 0 12px 0",
    fontSize: "32px",
    lineHeight: "1.1",
    fontWeight: "650",
    letterSpacing: "-0.025em",
  },

  supportText: {
    margin: 0,
    maxWidth: "760px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
    lineHeight: "1.7",
  },

  supportActions: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },

  supportButton: {
    background: "#ffffff",
    color: "#0f172a",
    border: "none",
    borderRadius: "14px",
    padding: "15px 22px",
    fontSize: "15px",
    fontWeight: "650",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  supportSecondaryButton: {
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "14px",
    padding: "15px 22px",
    fontSize: "15px",
    fontWeight: "650",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  supportEmail: {
    color: "rgba(255,255,255,0.55)",
    fontSize: "15px",
    fontWeight: "600",
  },


  pageMobile: {
    overflowX: "hidden",
    padding: "20px 16px 110px",
  },

  brandMarkMobile: {
    display: "none",
  },

  heroMobile: {
    gridTemplateColumns: "1fr",
    gap: "24px",
    marginBottom: "28px",
    textAlign: "center",
  },

  heroLeftMobile: {
    maxWidth: "100%",
  },

  smallTextMobile: {
    fontSize: "12px",
    marginBottom: "10px",
  },

  titleMobile: {
    fontSize: "36px",
    lineHeight: "1.02",
    letterSpacing: "-0.025em",
  },

  subtitleMobile: {
    fontSize: "15px",
    lineHeight: "1.55",
    maxWidth: "100%",
    marginBottom: "22px",
  },

  buttonRowMobile: {
    flexDirection: "column",
    width: "100%",
  },

  mobileFullButton: {
    width: "100%",
    fontSize: "15px",
    padding: "15px 18px",
  },

  heroRightMobile: {
    width: "100%",
  },

  snapshotCardMobile: {
    maxWidth: "100%",
    padding: "22px",
  },

  sectionMobile: {
    padding: "28px 18px 24px",
    borderRadius: "20px",
    marginTop: "22px",
  },

  sectionTitleMobile: {
    fontSize: "24px",
    lineHeight: "1.1",
  },

  sectionSubtitleMobile: {
    fontSize: "15px",
    lineHeight: "1.55",
    marginBottom: "24px",
  },

  featuresGridMobile: {
    gridTemplateColumns: "1fr",
    gap: "14px",
  },

  featureCardMobile: {
    minHeight: "auto",
    padding: "24px 18px",
  },

  pricingGridMobile: {
    gridTemplateColumns: "1fr",
    gap: "18px",
  },

  pricingCardMobile: {
    minHeight: "auto",
    transform: "none",
    padding: "26px 22px",
  },

  pricingCardHighlightMobile: {
    transform: "none",
  },

  supportSectionMobile: {
    marginTop: "22px",
  },

  supportCardMobile: {
    padding: "26px 20px",
    borderRadius: "20px",
  },

  supportTitleMobile: {
    fontSize: "24px",
  },

  supportTextMobile: {
    fontSize: "15px",
  },

  supportActionsMobile: {
    flexDirection: "column",
  },

  supportButtonMobile: {
    width: "100%",
    boxSizing: "border-box",
  },


  checkIcon: {
    color: "#60a5fa",
    fontWeight: "650",
    fontSize: "15px",
    flexShrink: 0,
  },
};