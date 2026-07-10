import React, { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { supabase } from "./lib/supabase";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Accounts from "./components/Accounts";
import News from "./components/News";
import Settings from "./components/Settings";
import { SettingsProvider } from "./components/SettingsContext";
import Journal from "./Journal";
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("Google auth error:", err);
      setMessage(err?.message || "Unable to continue with Google.");
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

        <div style={authDividerStyle}>
          <span style={authDividerLineStyle} />
          <span style={authDividerTextStyle}>or</span>
          <span style={authDividerLineStyle} />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            ...googleButton,
            ...(loading ? { opacity: 0.7, cursor: "not-allowed" } : {}),
          }}
        >
          <span style={googleIconStyle}>G</span>
          Continue with Google
        </button>

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



function GuestJournalWrapper({ children, onLogin, onSignup }) {
  const [showPrompt, setShowPrompt] = useState(false);

  const requireAccount = (event) => {
    const target = event.target;
    const actionElement = target?.closest?.(
      "button, input, textarea, select, [role='button'], label"
    );

    if (!actionElement) return;

    const text = (actionElement.innerText || actionElement.value || "").toLowerCase();
    const isNavigationOnly =
      text.includes("view") ||
      text.includes("filter") ||
      text.includes("search") ||
      text.includes("close") ||
      text.includes("cancel");

    if (isNavigationOnly) return;

    event.preventDefault();
    event.stopPropagation();
    setShowPrompt(true);
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onClickCapture={requireAccount}
        onSubmitCapture={requireAccount}
        onChangeCapture={requireAccount}
      >
        {children}
      </div>

      {showPrompt && (
        <div style={demoLockStyles.overlay}>
          <div style={demoLockStyles.card}>
            <div style={demoLockStyles.badge}>Free demo mode</div>
            <h2 style={demoLockStyles.title}>Create a free account to save trades</h2>
            <p style={demoLockStyles.text}>
              You can look around the journal in demo mode, but adding, editing,
              deleting, or saving trades requires an account so your data stays
              connected to you.
            </p>

            <div style={demoLockStyles.actions}>
              <button style={demoLockStyles.primary} onClick={onSignup}>
                Create Free Account
              </button>
              <button style={demoLockStyles.secondary} onClick={onLogin}>
                Login
              </button>
              <button
                style={demoLockStyles.ghost}
                onClick={() => setShowPrompt(false)}
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}
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
      sub: "Try TradeArchive before upgrading",
      highlight: false,
      buttonText: "Start Free",
      action: "free",
      features: [
        "50 journal entries",
        "Basic performance stats",
        "Simple trade review tools",
        "Track setups, notes, and results",
      ],
    },
    {
      name: "Essential",
      price: "$3.99/mo",
      sub: "For traders building consistency",
      highlight: true,
      buttonText: "Get Essential Monthly",
      action: "essential",
      features: [
        "Unlimited journal entries",
        "Screenshot uploads",
        "Mistake tracking",
        "Setup tagging for A+, A, B, and C trades",
        "Performance analytics",
        "Clean structured journaling system",
        "Pre-trade checklist ready for the next update",
      ],
    },
    {
      name: "Essential Yearly",
      price: "$39.99/yr",
      sub: "Save with yearly billing",
      highlight: false,
      buttonText: "Get Essential Yearly",
      action: "essential_yearly",
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
            Start free, then upgrade when you need unlimited journaling,
            screenshots, mistake tracking, and better review tools.
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
              Free to start, then one simple paid plan when you need more
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function TrialBanner({ isMobile = false, session, activePage, setActivePage, openAuth }) {
  const shouldShow = activePage === "dashboard";

  if (!shouldShow) return null;

  const handleStartTrial = () => {
    if (!session) {
      openAuth("signup");
      return;
    }

    setActivePage("pricing");
  };

  return (
    <div
      style={{
        ...trialBannerStyles.wrap,
        ...(isMobile ? trialBannerStyles.wrapMobile : {}),
      }}
    >
      <div
        style={{
          ...trialBannerStyles.card,
          ...(isMobile ? trialBannerStyles.cardMobile : {}),
        }}
      >
        <div
          style={{
            ...trialBannerStyles.copy,
            ...(isMobile ? trialBannerStyles.copyMobile : {}),
          }}
        >
          <div style={trialBannerStyles.badge}>Early user offer</div>
          <div
            style={{
              ...trialBannerStyles.title,
              ...(isMobile ? trialBannerStyles.titleMobile : {}),
            }}
          >
            Essential free trial
          </div>
          <div
            style={{
              ...trialBannerStyles.text,
              ...(isMobile ? trialBannerStyles.textMobile : {}),
            }}
          >
            Unlock unlimited journal entries, screenshots, mistake tracking, and performance insights. Use code{" "}
            <span style={trialBannerStyles.code}>FIRSTMONTH</span> at checkout.
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartTrial}
          style={{
            ...trialBannerStyles.button,
            ...(isMobile ? trialBannerStyles.buttonMobile : {}),
          }}
        >
          Try Free
        </button>
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
    { label: "Accounts", page: "accounts", icon: "▱" },
    { label: "Journal", page: "journal", icon: "↗" },
    { label: "News", page: "news", icon: "📰" },
    { label: "Pricing", page: "pricing", icon: "◈" },
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
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const isMobile = useIsMobile();
  const lastSeenUpdateRef = useRef(0);

  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setBillingError("");
    setActivePage("auth");
  };

  const priceMap = useMemo(
    () => ({
      essential: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL?.trim(),
      essential_yearly: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_YEARLY?.trim(),
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

  useEffect(() => {
    if (!session?.user?.id) return;

    const MIN_UPDATE_GAP_MS = 60 * 1000;

    const updateLastSeen = async (force = false) => {
      const now = Date.now();

      if (!force && now - lastSeenUpdateRef.current < MIN_UPDATE_GAP_MS) {
        return;
      }

      lastSeenUpdateRef.current = now;

      const { error } = await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", session.user.id);

      if (error) {
        console.error("Error updating last_seen_at:", error);
      }
    };

    const handleActivity = () => updateLastSeen(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateLastSeen(true);
      }
    };

    updateLastSeen(true);

    const intervalId = window.setInterval(() => updateLastSeen(false), 5 * 60 * 1000);

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("focus", handleActivity);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("focus", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user?.id]);

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


  const handleManageBilling = async () => {
    setBillingError("");

    if (!session) {
      setBillingError("Log in before managing billing.");
      openAuth("login");
      return;
    }

    try {
      setPortalLoading(true);

      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: session?.user?.email ?? "",
          userId: session?.user?.id ?? "",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Unable to open billing portal (${response.status})`
        );
      }

      if (!result?.url) {
        throw new Error("No billing portal URL returned from server.");
      }

      window.location.href = result.url;
    } catch (err) {
      console.error("Stripe portal error:", err);
      setBillingError(err?.message || "Unable to open billing portal.");
      alert(err?.message || "Unable to open billing portal.");
    } finally {
      setPortalLoading(false);
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
      return <Dashboard setActivePage={setActivePage} session={session} />;
    }

    if (activePage === "accounts") {
      return <Accounts setActivePage={setActivePage} />;
    }

    if (activePage === "news" || activePage === "market") {
      return <News setActivePage={setActivePage} />;
    }

    if (activePage === "journal") {
      if (!session) {
        return (
          <GuestJournalWrapper
            onLogin={() => openAuth("login")}
            onSignup={() => openAuth("signup")}
          >
            <Journal
              setActivePage={setActivePage}
              isDemoMode={true}
              onRequireAuth={() => openAuth("signup")}
            />
          </GuestJournalWrapper>
        );
      }

      return <Journal setActivePage={setActivePage} isDemoMode={false} />;
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

    if (activePage === "settings") {
      return (
        <Settings
          session={session}
          billingError={billingError}
          portalLoading={portalLoading}
          onManageBilling={handleManageBilling}
          onLogout={handleLogout}
        />
      );
    }

    return <Dashboard setActivePage={setActivePage} session={session} />;
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
    <SettingsProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#08111f",
          overflowX: "hidden",
        }}
      >
      {!isMobile && (
        <Sidebar activePage={activePage} setActivePage={setActivePage} session={session} />
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

      {!isMobile && activePage === "dashboard" && (
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
          overflow: "auto",
        }}
      >
        <TrialBanner
          isMobile={isMobile}
          session={session}
          activePage={activePage}
          setActivePage={setActivePage}
          openAuth={openAuth}
        />
        {renderPage()}
      </div>

        <Analytics />
      </div>
    </SettingsProvider>
  );
}




const trialBannerStyles = {
  wrap: {
    width: "100%",
    padding: "10px 360px 0 28px",
    boxSizing: "border-box",
    position: "relative",
    zIndex: 40,
  },

  wrapMobile: {
    padding: "12px 12px 0",
  },

  card: {
    width: "100%",
    maxWidth: "none",
    margin: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "10px 12px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(8,15,28,0.94) 55%, rgba(96,165,250,0.10))",
    border: "1px solid rgba(96,165,250,0.24)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
    backdropFilter: "blur(12px)",
  },

  cardMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: "12px",
    padding: "15px",
    borderRadius: "18px",
  },

  copy: {
    minWidth: 0,
  },

  copyMobile: {
    textAlign: "left",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "7px",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.14)",
    border: "1px solid rgba(147,197,253,0.24)",
    color: "#bfdbfe",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    color: "#ffffff",
    fontSize: "22px",
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: "-0.035em",
    marginBottom: "5px",
  },

  titleMobile: {
    fontSize: "21px",
  },

  text: {
    color: "rgba(255,255,255,0.70)",
    fontSize: "14px",
    lineHeight: 1.45,
  },

  textMobile: {
    fontSize: "13px",
  },

  code: {
    color: "#ffffff",
    fontWeight: 950,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    padding: "3px 7px",
    whiteSpace: "nowrap",
  },

  button: {
    flexShrink: 0,
    borderRadius: "13px",
    border: "1px solid rgba(147,197,253,0.48)",
    background: "linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)",
    color: "white",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(37,99,235,0.26)",
  },

  buttonMobile: {
    width: "100%",
    padding: "12px 14px",
  },
};


const demoLockStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 500,
    display: "grid",
    placeItems: "center",
    padding: "22px",
    background: "rgba(3, 7, 18, 0.72)",
    backdropFilter: "blur(10px)",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    textAlign: "center",
    color: "white",
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,15,28,0.98))",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "24px",
    padding: "28px 24px",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.18)",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "#bfdbfe",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 10px",
    fontSize: "30px",
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  text: {
    margin: "0 auto 22px",
    maxWidth: "430px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
    lineHeight: 1.65,
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },

  primary: {
    borderRadius: "14px",
    border: "1px solid rgba(96,165,250,0.45)",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondary: {
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  ghost: {
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.62)",
    padding: "8px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
};


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
    gridTemplateColumns: "repeat(5, 1fr)",
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

const authDividerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "16px 0",
};

const authDividerLineStyle = {
  flex: 1,
  height: "1px",
  background: "rgba(148,163,184,0.16)",
};

const authDividerTextStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const googleButton = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

const googleIconStyle = {
  width: "22px",
  height: "22px",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: 950,
  fontFamily: "Arial, sans-serif",
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