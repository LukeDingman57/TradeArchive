import React, { useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { supabase } from "./lib/supabase";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Journal from "./Journal";
import ComingSoon from "./ComingSoon";
import "./App.css";

function AuthScreen({ initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user && data?.session) {
          setMessage("Account created and logged in.");
        } else {
          setMessage(
            "Account created. Check your email if confirmation is required."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage("Logged in.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #13233f 0%, #0a1220 45%, #060c16 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(8, 15, 28, 0.92)",
          border: "1px solid rgba(148,163,184,0.14)",
          borderRadius: "20px",
          padding: "28px",
          color: "white",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              marginBottom: "18px",
              border: "1px solid rgba(148,163,184,0.14)",
              background: "rgba(148,163,184,0.06)",
              color: "#cbd5e1",
              borderRadius: "999px",
              padding: "9px 13px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ← Back to demo
          </button>
        )}

        <h1 style={{ fontSize: "38px", marginBottom: "8px", fontWeight: 800 }}>
          Trade<span style={{ color: "#60a5fa" }}>Archive</span>
        </h1>

        <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
          {mode === "signup" ? "Create your account" : "Login to your account"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                ...inputStyle,
                paddingRight: "60px",
              }}
            />

            <span
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "13px",
                color: "#94a3b8",
                fontWeight: 600,
                userSelect: "none",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <button type="submit" disabled={loading} style={primaryButton}>
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "14px", color: "#cbd5e1", lineHeight: 1.5 }}>
            {message}
          </p>
        )}

        <button
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setMessage("");
          }}
          style={secondaryButton}
        >
          {mode === "signup"
            ? "Already have an account? Login"
            : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}



function AuthRequiredPage({ title = "Create a free account to continue", text, onLogin, onSignup }) {
  return (
    <div style={authRequiredStyles.page}>
      <div style={authRequiredStyles.glowOne} />
      <div style={authRequiredStyles.glowTwo} />

      <div style={authRequiredStyles.card}>
        <div style={authRequiredStyles.badge}>Free demo mode</div>
        <h1 style={authRequiredStyles.title}>{title}</h1>
        <p style={authRequiredStyles.text}>
          {text ||
            "You can explore TradeArchive first. Create a free account when you’re ready to save trades, use the journal, or upgrade your plan."}
        </p>

        <div style={authRequiredStyles.actions}>
          <button style={authRequiredStyles.primary} onClick={onSignup}>
            Create Free Account
          </button>
          <button style={authRequiredStyles.secondary} onClick={onLogin}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

function TradingViewWidget() {
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "NASDAQ:AAPL",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      save_image: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div style={chartStyles.widgetShell}>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}

function ChartsPage({ isMobile = false }) {
  return (
    <div style={{ ...chartStyles.page, ...(isMobile ? chartStyles.pageMobile : {}) }}>
      <TradingViewWidget />
    </div>
  );
}


function BacktestingComingSoon({ setActivePage }) {
  return (
    <div style={comingSoonStyles.page}>
      <div style={comingSoonStyles.glowOne} />
      <div style={comingSoonStyles.glowTwo} />

      <div style={comingSoonStyles.card}>
        <div style={comingSoonStyles.badge}>Coming Soon</div>

        <h1 style={comingSoonStyles.title}>Backtesting & Replay</h1>

        <p style={comingSoonStyles.subtitle}>
          Advanced chart replay and backtesting tools are currently in
          development.
        </p>

        <p style={comingSoonStyles.text}>
          For now, use TradeArchive to journal your trades, track your setups,
          upload screenshots, and review your performance so you can build more
          consistency before replay launches.
        </p>

        <div style={comingSoonStyles.featureGrid}>
          <div style={comingSoonStyles.featureBox}>
            <div style={comingSoonStyles.featureTitle}>Journal Now</div>
            <div style={comingSoonStyles.featureText}>
              Track entries, exits, setups, screenshots, and notes.
            </div>
          </div>

          <div style={comingSoonStyles.featureBox}>
            <div style={comingSoonStyles.featureTitle}>Replay Later</div>
            <div style={comingSoonStyles.featureText}>
              Backtesting and advanced chart replay are planned for a future
              update.
            </div>
          </div>
        </div>

        <button
          style={comingSoonStyles.button}
          onClick={() => setActivePage("journal")}
        >
          Go to Journal
        </button>
      </div>
    </div>
  );
}

function PricingPage({
  setActivePage,
  onCheckout,
  checkoutLoading,
  billingError,
  isMobile = false,
  isAuthed = false,
  onRequireAuth,
}) {
  const plans = [
    {
      name: "Free",
      price: "$0",
      sub: "Perfect for getting started",
      highlight: false,
      buttonText: "Start Free",
      action: "free",
      features: [
        "Track your trades",
        "50 journal entries / week",
        "Basic performance stats",
        "1 year lookback",
        "Simple trade review tools",
      ],
    },
    {
      name: "Essential",
      price: "$6.99/mo",
      sub: "Founders Price for traders building consistency",
      highlight: true,
      buttonText: "Get Essential",
      action: "essential",
      features: [
        "500 journal entries / month",
        "Setup tagging for A+, A, B, and C trades",
        "Performance analytics",
        "Screenshot uploads",
        "Clean structured journaling system",
        "5 years lookback",
        "Founders get future backtesting & replay included",
      ],
    },
    {
      name: "Pro",
      price: "$12.99/mo",
      sub: "For traders who want more room to grow",
      highlight: false,
      buttonText: "Go Pro",
      action: "pro",
      features: [
        "Unlimited journal entries",
        "Advanced performance breakdowns",
        "Deeper trade review workflow",
        "Priority feature access",
        "Founders get upcoming advanced chart tools included",
      ],
    },
  ];

  const handlePlanClick = async (action) => {
    if (action === "free") {
      if (!isAuthed) {
        onRequireAuth?.("signup");
        return;
      }

      setActivePage("journal");
      return;
    }

    await onCheckout(action);
  };

  return (
    <div style={{ ...pricingStyles.page, ...(isMobile ? pricingStyles.pageMobile : {}) }}>
      <div style={pricingStyles.glowOne} />
      <div style={pricingStyles.glowTwo} />

      <div style={{ ...pricingStyles.inner, ...(isMobile ? pricingStyles.innerMobile : {}) }}>
        <div style={{ ...pricingStyles.header, ...(isMobile ? pricingStyles.headerMobile : {}) }}>
          <p style={{ ...pricingStyles.eyebrow, ...(isMobile ? pricingStyles.eyebrowMobile : {}) }}>PRICING</p>
          <h1 style={{ ...pricingStyles.title, ...(isMobile ? pricingStyles.titleMobile : {}) }}>
            Choose the plan that fits your trading
          </h1>
          <p style={{ ...pricingStyles.subtitle, ...(isMobile ? pricingStyles.subtitleMobile : {}) }}>
            Start free, then upgrade to track your trades, improve consistency,
            and build a disciplined trading system. Founders get future
            backtesting and replay tools included when released.
          </p>
        </div>

        {billingError ? (
          <div
            style={{
              margin: "0 auto 24px",
              maxWidth: "760px",
              borderRadius: "16px",
              padding: "14px 16px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fecaca",
            }}
          >
            {billingError}
          </div>
        ) : null}

        <div style={{ ...pricingStyles.grid, ...(isMobile ? pricingStyles.gridMobile : {}) }}>
          {plans.map((plan, index) => (
            <div
              key={index}
              style={{
                ...pricingStyles.card,
                ...(isMobile ? pricingStyles.cardMobile : {}),
                ...(plan.highlight ? pricingStyles.cardHighlight : {}),
                ...(isMobile && plan.highlight ? pricingStyles.cardHighlightMobile : {}),
              }}
            >
              {plan.highlight && (
                <div style={{ ...pricingStyles.badge, ...(isMobile ? pricingStyles.badgeMobile : {}) }}>Most Popular</div>
              )}

              <div style={{ ...pricingStyles.cardTop, ...(isMobile ? pricingStyles.cardTopMobile : {}) }}>
                <h2 style={{ ...pricingStyles.planName, ...(isMobile ? pricingStyles.planNameMobile : {}) }}>{plan.name}</h2>
                <div
                  style={{
                    ...pricingStyles.price,
                    ...(isMobile ? pricingStyles.priceMobile : {}),
                    ...(plan.highlight ? pricingStyles.priceHighlight : {}),
                  }}
                >
                  {plan.price}
                </div>
                <p style={{ ...pricingStyles.planSub, ...(isMobile ? pricingStyles.planSubMobile : {}) }}>{plan.sub}</p>
              </div>

              <div style={pricingStyles.divider} />

              <div style={{ ...pricingStyles.featureList, ...(isMobile ? pricingStyles.featureListMobile : {}) }}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={{ ...pricingStyles.featureRow, ...(isMobile ? pricingStyles.featureRowMobile : {}) }}>
                    <div
                      style={{
                        ...pricingStyles.check,
                        ...(plan.highlight ? pricingStyles.checkHighlight : {}),
                      }}
                    >
                      ✓
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                style={{
                  ...pricingStyles.cta,
                  ...(isMobile ? pricingStyles.ctaMobile : {}),
                  ...(plan.highlight ? pricingStyles.ctaHighlight : {}),
                  ...(checkoutLoading
                    ? { opacity: 0.7, cursor: "not-allowed" }
                    : {}),
                }}
                onClick={() => handlePlanClick(plan.action)}
                disabled={checkoutLoading}
              >
                {checkoutLoading && plan.action !== "free"
                  ? "Opening Checkout..."
                  : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div style={{ ...pricingStyles.bottomStrip, ...(isMobile ? pricingStyles.bottomStripMobile : {}) }}>
          <div style={{ ...pricingStyles.stripItem, ...(isMobile ? pricingStyles.stripItemMobile : {}) }}>
            <div style={pricingStyles.stripLabel}>Built for traders</div>
            <div style={pricingStyles.stripText}>
              Clean journaling, screenshots, stats, and trade review in one place
            </div>
          </div>

          <div style={{ ...pricingStyles.stripItem, ...(isMobile ? pricingStyles.stripItemMobile : {}) }}>
            <div style={pricingStyles.stripLabel}>Upgrade anytime</div>
            <div style={pricingStyles.stripText}>
              Start free, then upgrade when you need more journal space
            </div>
          </div>

          <div style={{ ...pricingStyles.stripItem, ...(isMobile ? pricingStyles.stripItemMobile : {}) }}>
            <div style={pricingStyles.stripLabel}>Simple pricing</div>
            <div style={pricingStyles.stripText}>
              Early users lock in lower pricing before new features launch
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function useIsMobile() {
  const getIsMobile = () =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

function MobileNav({
  activePage,
  setActivePage,
  handleLogout,
  session,
  openAuth,
}) {
  const navItems = [
    { label: "Home", page: "dashboard", icon: "▦" },
    { label: "Charts", page: "charts", icon: "▧" },
    { label: "Replay", page: "backtesting", icon: "↻" },
    { label: "Journal", page: "journal", icon: "↗" },
    { label: "Pricing", page: "pricing", icon: "◈" },
    { label: "Soon", page: "comingsoon", icon: "✦" },
  ];

  return (
    <>
      <div style={mobileNavStyles.topBar}>
        <button
          onClick={session ? handleLogout : () => openAuth("login")}
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#ffffff",
            borderRadius: "10px",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {session ? "Logout" : "Login"}
        </button>

        <button
          type="button"
          onClick={() => setActivePage("dashboard")}
          style={mobileNavStyles.brandButton}
        >
          <span style={{ color: "#ffffff" }}>Trade</span>
          <span style={{ color: "#60a5fa" }}>Archive</span>
        </button>
      </div>

      <div style={mobileNavStyles.bottomBar}>
        {navItems.map((item) => {
          const isActive = activePage === item.page;

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => setActivePage(item.page)}
              style={{
                ...mobileNavStyles.navButton,
                ...(isActive ? mobileNavStyles.activeNavButton : {}),
              }}
            >
              <span style={mobileNavStyles.navIcon}>{item.icon}</span>
              <span style={mobileNavStyles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [loadingSession, setLoadingSession] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const isMobile = useIsMobile();

  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setBillingError("");
    setActivePage("auth");
  };

  const priceMap = useMemo(
    () => ({
      essential: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL?.trim(),
      pro: import.meta.env.VITE_STRIPE_PRICE_PRO?.trim(),
    }),
    []
  );

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session load error:", error);
      }

      if (!mounted) return;

      setSession(data?.session ?? null);
      setLoadingSession(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setLoadingSession(false);

      if (newSession) {
        setActivePage((currentPage) =>
          currentPage === "auth" ? "dashboard" : currentPage
        );
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setActivePage("dashboard");
  };

  const startCheckout = async (planKey) => {
    setBillingError("");

    if (!session) {
      setBillingError("Create a free account or log in before upgrading.");
      openAuth("signup");
      return;
    }

    try {
      const selectedPriceId = priceMap[planKey];

      if (!selectedPriceId) {
        throw new Error(
          `Missing Stripe price id for the ${planKey} plan in .env`
        );
      }

      setCheckoutLoading(true);

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: selectedPriceId,
          plan: planKey,
          customerEmail: session?.user?.email ?? "",
          userId: session?.user?.id ?? "",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Unable to create checkout session (${response.status})`
        );
      }

      if (!result?.url) {
        throw new Error("No checkout URL returned from server.");
      }

      window.location.href = result.url;
    } catch (err) {
      console.error("Stripe checkout error:", err);
      setBillingError(err?.message || "Unable to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderPage = () => {
    if (activePage === "auth") {
      return (
        <AuthScreen
          initialMode={authMode}
          onBack={() => setActivePage("dashboard")}
        />
      );
    }

    if (activePage === "dashboard") {
      return <Dashboard setActivePage={setActivePage} />;
    }

    if (activePage === "charts") {
      return <ChartsPage isMobile={isMobile} />;
    }

    if (activePage === "journal") {
      if (!session) {
        return (
          <AuthRequiredPage
            title="Create a free account to use the journal"
            text="Visitors can explore the demo dashboard first, but saving trades and journal entries requires an account so your data stays connected to you."
            onLogin={() => openAuth("login")}
            onSignup={() => openAuth("signup")}
          />
        );
      }

      return <Journal setActivePage={setActivePage} />;
    }

    if (activePage === "backtesting") {
      return <BacktestingComingSoon setActivePage={setActivePage} />;
    }

    if (activePage === "pricing") {
      return (
        <PricingPage
          setActivePage={setActivePage}
          onCheckout={startCheckout}
          checkoutLoading={checkoutLoading}
          billingError={billingError}
          isMobile={isMobile}
          isAuthed={!!session}
          onRequireAuth={openAuth}
        />
      );
    }

    if (activePage === "comingsoon") {
      return <ComingSoon setActivePage={setActivePage} />;
    }

    return <Dashboard setActivePage={setActivePage} />;
  };

  if (loadingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#08111f",
          color: "white",
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
        Loading TradeArchive...
      </div>
    );
  }


  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#08111f",
        overflowX: "hidden",
      }}
    >
      {!isMobile && (
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
      )}

      {isMobile && (
        <MobileNav
          activePage={activePage}
          setActivePage={setActivePage}
          handleLogout={handleLogout}
          session={session}
          openAuth={openAuth}
        />
      )}

      {!isMobile && activePage !== "charts" && (
        <div
          style={{
            position: "fixed",
            top: "18px",
            right: "22px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(8,15,28,0.88)",
            border: "1px solid rgba(148,163,184,0.14)",
            padding: "10px 14px",
            borderRadius: "14px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
          }}
        >
          {session ? (
            <>
              <div
                style={{
                  color: "rgba(255,255,255,0.72)",
                  fontSize: "14px",
                  fontWeight: "600",
                  maxWidth: "260px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session?.user?.email}
              </div>

              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuth("login")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                Login
              </button>

              <button
                onClick={() => openAuth("signup")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(96,165,250,0.45)",
                  background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "800",
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          paddingTop: isMobile ? "64px" : 0,
          paddingBottom: isMobile ? "86px" : 0,
          overflow: activePage === "charts" ? "hidden" : "auto",
        }}
      >
        {renderPage()}
      </div>

      <Analytics />
    </div>
  );
}



const authRequiredStyles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, #07101d 0%, #08111f 45%, #050b14 100%)",
    color: "white",
    display: "grid",
    placeItems: "center",
    padding: "42px 24px",
  },

  glowOne: {
    position: "absolute",
    top: "-120px",
    left: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.14)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  glowTwo: {
    position: "absolute",
    bottom: "-130px",
    right: "-90px",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.12)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "620px",
    textAlign: "center",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "28px",
    padding: "40px 28px",
    boxShadow: "0 22px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.18)",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "#bfdbfe",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 14px 0",
    fontSize: "38px",
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  text: {
    margin: "0 auto 26px",
    maxWidth: "500px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  primary: {
    borderRadius: "14px",
    border: "1px solid rgba(96,165,250,0.45)",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(37,99,235,0.28)",
  },

  secondary: {
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

const chartStyles = {
  page: {
    height: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    background: "#050b14",
    padding: "8px",
    boxSizing: "border-box",
  },

  widgetShell: {
    width: "100%",
    height: "100%",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#050b14",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.36)",
  },

  pageMobile: {
    height: "calc(100vh - 150px)",
    padding: "8px",
  },
};

const mobileNavStyles = {
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "64px",
    background: "rgba(8, 15, 28, 0.96)",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(12px)",
  },

  brandButton: {
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    cursor: "pointer",
  },

  bottomBar: {
    position: "fixed",
    left: "12px",
    right: "12px",
    bottom: "12px",
    height: "66px",
    background: "rgba(8, 15, 28, 0.96)",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "6px",
    padding: "8px",
    zIndex: 100,
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
    backdropFilter: "blur(14px)",
  },

  navButton: {
    border: "none",
    borderRadius: "16px",
    background: "transparent",
    color: "rgba(255,255,255,0.62)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    fontFamily: "inherit",
    cursor: "pointer",
  },

  activeNavButton: {
    background: "rgba(59,130,246,0.18)",
    color: "#ffffff",
  },

  navIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },

  navLabel: {
    fontSize: "11px",
    fontWeight: 800,
  },
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(148,163,184,0.06)",
  color: "white",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButton = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(59,130,246,0.55)",
  background: "rgba(59,130,246,0.18)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "15px",
};

const secondaryButton = {
  width: "100%",
  marginTop: "14px",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(148,163,184,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const logoutButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(148,163,184,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};


const comingSoonStyles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, #07101d 0%, #08111f 45%, #050b14 100%)",
    padding: "42px 32px",
    color: "white",
    display: "grid",
    placeItems: "center",
  },

  glowOne: {
    position: "absolute",
    top: "-120px",
    left: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.14)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  glowTwo: {
    position: "absolute",
    bottom: "-130px",
    right: "-90px",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.12)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "820px",
    textAlign: "center",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "30px",
    padding: "46px 34px",
    boxShadow: "0 22px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.18)",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "#bfdbfe",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 14px 0",
    fontSize: "48px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "0 auto 18px",
    maxWidth: "650px",
    color: "rgba(255,255,255,0.78)",
    fontSize: "20px",
    lineHeight: 1.6,
  },

  text: {
    margin: "0 auto 30px",
    maxWidth: "680px",
    color: "rgba(255,255,255,0.62)",
    fontSize: "16px",
    lineHeight: 1.75,
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    margin: "0 auto 28px",
    maxWidth: "680px",
  },

  featureBox: {
    textAlign: "left",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "18px",
  },

  featureTitle: {
    color: "#bfdbfe",
    fontSize: "15px",
    fontWeight: 800,
    marginBottom: "8px",
  },

  featureText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  button: {
    borderRadius: "16px",
    border: "1px solid rgba(96,165,250,0.45)",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    padding: "15px 22px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(37,99,235,0.28)",
  },
};

const pricingStyles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, #07101d 0%, #08111f 40%, #050b14 100%)",
    padding: "42px 32px 56px",
    color: "white",
  },

  glowOne: {
    position: "absolute",
    top: "-120px",
    left: "-120px",
    width: "380px",
    height: "380px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.14)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  glowTwo: {
    position: "absolute",
    bottom: "-140px",
    right: "-100px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.12)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  inner: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1280px",
    margin: "0 auto",
  },

  header: {
    textAlign: "center",
    marginBottom: "34px",
  },

  eyebrow: {
    margin: "0 0 12px 0",
    color: "#93c5fd",
    fontSize: "13px",
    letterSpacing: "0.16em",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 14px 0",
    fontSize: "50px",
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "0 auto",
    maxWidth: "760px",
    color: "rgba(255,255,255,0.70)",
    fontSize: "19px",
    lineHeight: 1.65,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "22px",
    marginTop: "34px",
  },

  card: {
    position: "relative",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.30)",
    backdropFilter: "blur(8px)",
    minHeight: "560px",
    display: "flex",
    flexDirection: "column",
  },

  cardHighlight: {
    border: "1px solid rgba(96,165,250,0.45)",
    boxShadow:
      "0 0 0 1px rgba(96,165,250,0.16), 0 24px 60px rgba(37,99,235,0.26)",
    transform: "translateY(-8px)",
    background:
      "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(255,255,255,0.04))",
  },

  badge: {
    position: "absolute",
    top: "18px",
    right: "18px",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.18)",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "#bfdbfe",
    fontSize: "12px",
    fontWeight: 800,
  },

  cardTop: {
    marginBottom: "18px",
  },

  planName: {
    margin: "0 0 10px 0",
    fontSize: "28px",
    fontWeight: 800,
  },

  price: {
    fontSize: "42px",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    marginBottom: "10px",
    color: "#ffffff",
  },

  priceHighlight: {
    color: "#93c5fd",
  },

  planSub: {
    margin: 0,
    color: "rgba(255,255,255,0.66)",
    fontSize: "16px",
    lineHeight: 1.6,
  },

  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    marginBottom: "22px",
  },

  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "28px",
  },

  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "rgba(255,255,255,0.84)",
    fontSize: "16px",
    lineHeight: 1.5,
  },

  check: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    color: "#cbd5e1",
    flexShrink: 0,
  },

  checkHighlight: {
    background: "rgba(59,130,246,0.18)",
    border: "1px solid rgba(96,165,250,0.25)",
    color: "#93c5fd",
  },

  cta: {
    marginTop: "auto",
    width: "100%",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "15px 18px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  ctaHighlight: {
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    border: "1px solid rgba(96,165,250,0.45)",
    boxShadow: "0 14px 28px rgba(37,99,235,0.28)",
  },

  bottomStrip: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  stripItem: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "20px 18px",
  },

  stripLabel: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#bfdbfe",
    marginBottom: "8px",
    letterSpacing: "0.04em",
  },

  stripText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  pageMobile: {
    overflowX: "hidden",
    padding: "28px 16px 118px",
  },

  innerMobile: {
    maxWidth: "100%",
  },

  headerMobile: {
    marginBottom: "24px",
  },

  eyebrowMobile: {
    fontSize: "12px",
    marginBottom: "10px",
  },

  titleMobile: {
    fontSize: "38px",
    lineHeight: 1.04,
    letterSpacing: "-0.04em",
  },

  subtitleMobile: {
    fontSize: "16px",
    lineHeight: 1.55,
    maxWidth: "100%",
  },

  gridMobile: {
    gridTemplateColumns: "1fr",
    gap: "18px",
    marginTop: "24px",
  },

  cardMobile: {
    padding: "24px",
    borderRadius: "24px",
    transform: "none",
  },

  cardHighlightMobile: {
    transform: "none",
  },

  badgeMobile: {
    position: "static",
    alignSelf: "flex-start",
    marginBottom: "14px",
    display: "inline-flex",
  },

  cardTopMobile: {
    marginBottom: "14px",
  },

  planNameMobile: {
    fontSize: "26px",
  },

  priceMobile: {
    fontSize: "38px",
    whiteSpace: "normal",
  },

  planSubMobile: {
    fontSize: "15px",
  },

  featureListMobile: {
    gap: "12px",
    marginBottom: "22px",
  },

  featureRowMobile: {
    fontSize: "15px",
    alignItems: "flex-start",
  },

  ctaMobile: {
    padding: "14px 16px",
  },

  bottomStripMobile: {
    gridTemplateColumns: "1fr",
    gap: "14px",
    marginTop: "22px",
  },

  stripItemMobile: {
    padding: "18px 16px",
    borderRadius: "18px",
  },
};