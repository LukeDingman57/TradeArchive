import React, { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "./lib/supabase";
import Dashboard from "./components/Dashboard";
import Backtesting from "./components/Backtesting";
import Sidebar from "./components/Sidebar";
import Journal from "./Journal";
import "./App.css";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim()
);

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

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

function PricingPage({
  setActivePage,
  onCheckout,
  checkoutLoading,
  billingError,
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
        "50 backtesting trades / week",
        "50 journal entries",
        "1 year lookback",
        "Up to 3 indicators",
        "Basic trade review tools",
      ],
    },
    {
      name: "Essential",
      price: "$9.99/mo",
      sub: "Best for traders building consistency",
      highlight: true,
      buttonText: "Get Essential",
      action: "essential",
      features: [
        "500 backtesting trades / month",
        "500 journal entries",
        "5 years lookback",
        "Unlimited indicators",
        "Advanced review workflow",
        "Performance analytics",
      ],
    },
    {
      name: "Pro",
      price: "$19.99/mo",
      sub: "Built for serious traders",
      highlight: false,
      buttonText: "Go Pro",
      action: "pro",
      features: [
        "Unlimited backtesting trades",
        "Unlimited journal entries",
        "Unlimited lookback",
        "Unlimited indicators",
        "Deep analytics",
        "Priority feature access",
      ],
    },
  ];

  const handlePlanClick = async (action) => {
    if (action === "free") {
      setActivePage("journal");
      return;
    }

    await onCheckout(action);
  };

  return (
    <div style={pricingStyles.page}>
      <div style={pricingStyles.glowOne} />
      <div style={pricingStyles.glowTwo} />

      <div style={pricingStyles.inner}>
        <div style={pricingStyles.header}>
          <p style={pricingStyles.eyebrow}>PRICING</p>
          <h1 style={pricingStyles.title}>
            Choose the plan that fits your trading
          </h1>
          <p style={pricingStyles.subtitle}>
            Start free, then upgrade when you want deeper analytics,
            backtesting power, and a cleaner review process.
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

        <div style={pricingStyles.grid}>
          {plans.map((plan, index) => (
            <div
              key={index}
              style={{
                ...pricingStyles.card,
                ...(plan.highlight ? pricingStyles.cardHighlight : {}),
              }}
            >
              {plan.highlight && (
                <div style={pricingStyles.badge}>Most Popular</div>
              )}

              <div style={pricingStyles.cardTop}>
                <h2 style={pricingStyles.planName}>{plan.name}</h2>
                <div
                  style={{
                    ...pricingStyles.price,
                    ...(plan.highlight ? pricingStyles.priceHighlight : {}),
                  }}
                >
                  {plan.price}
                </div>
                <p style={pricingStyles.planSub}>{plan.sub}</p>
              </div>

              <div style={pricingStyles.divider} />

              <div style={pricingStyles.featureList}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={pricingStyles.featureRow}>
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

        <div style={pricingStyles.bottomStrip}>
          <div style={pricingStyles.stripItem}>
            <div style={pricingStyles.stripLabel}>Built for traders</div>
            <div style={pricingStyles.stripText}>
              Clean journaling, replay, and review in one place
            </div>
          </div>

          <div style={pricingStyles.stripItem}>
            <div style={pricingStyles.stripLabel}>Upgrade anytime</div>
            <div style={pricingStyles.stripText}>
              Start with Free and move up when you need more depth
            </div>
          </div>

          <div style={pricingStyles.stripItem}>
            <div style={pricingStyles.stripLabel}>Simple pricing</div>
            <div style={pricingStyles.stripText}>
              No clutter, no confusing tiers, just what matters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [loadingSession, setLoadingSession] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

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

    try {
      const publishableKey =
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
      const selectedPriceId = priceMap[planKey];

      if (!publishableKey) {
        throw new Error("Missing Stripe publishable key in .env");
      }

      if (!selectedPriceId) {
        throw new Error(
          `Missing Stripe price id for the ${planKey} plan in .env`
        );
      }

      setCheckoutLoading(true);

      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

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

      const sessionId = result?.id;

      if (!sessionId) {
        throw new Error("No checkout session id returned");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
      setBillingError(err?.message || "Unable to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderPage = () => {
    if (activePage === "dashboard") {
      return <Dashboard setActivePage={setActivePage} />;
    }

    if (activePage === "journal") {
      return <Journal setActivePage={setActivePage} />;
    }

    if (activePage === "backtesting") {
      return <Backtesting setActivePage={setActivePage} />;
    }

    if (activePage === "pricing") {
      return (
        <PricingPage
          setActivePage={setActivePage}
          onCheckout={startCheckout}
          checkoutLoading={checkoutLoading}
          billingError={billingError}
        />
      );
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

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#08111f" }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: "72px",
            borderBottom: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            color: "white",
            background: "rgba(8, 15, 28, 0.88)",
            position: "sticky",
            top: 0,
            zIndex: 20,
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{ fontSize: "20px", fontWeight: 800, cursor: "pointer" }}
            onClick={() => setActivePage("dashboard")}
          >
            Trade<span style={{ color: "#60a5fa" }}>Archive</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ color: "#cbd5e1", fontSize: "14px" }}>
              {session?.user?.email}
            </span>

            <button onClick={handleLogout} style={logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {renderPage()}
      </div>
    </div>
  );
}

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

const pricingStyles = {
  page: {
    minHeight: "calc(100vh - 72px)",
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
};