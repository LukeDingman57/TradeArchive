import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const defaultTrades = [
  {
    id: 1,
    date: "2026-03-28",
    symbol: "NQ",
    setup: "IFVG",
    side: "Long",
    session: "NY Open",
    grade: "A",
    mistakes: "",
    result: "Win",
    pnl: 530,
    entry: 19842.25,
    stop: 19822.25,
    target: 19882.25,
    rMultiple: 2.0,
    notes: "Waited for confirmation and held to target.",
    screenshot: "",
  },
  {
    id: 2,
    date: "2026-03-27",
    symbol: "ES",
    setup: "Opening Range Break",
    side: "Short",
    session: "NY Open",
    grade: "A",
    mistakes: "",
    result: "Win",
    pnl: 262,
    entry: 5271.5,
    stop: 5276.5,
    target: 5261.5,
    rMultiple: 2.0,
    notes: "Clean entry and partials.",
    screenshot: "",
  },
  {
    id: 3,
    date: "2026-03-26",
    symbol: "NQ",
    setup: "Liquidity Sweep",
    side: "Long",
    session: "Midday",
    grade: "B",
    mistakes: "Early entry",
    result: "Loss",
    pnl: -135,
    entry: 19795.5,
    stop: 19785.5,
    target: 19815.5,
    rMultiple: -1.0,
    notes: "Entered a little early.",
    screenshot: "",
  },
  {
    id: 4,
    date: "2026-03-25",
    symbol: "ES",
    setup: "IFVG",
    side: "Short",
    session: "NY Open",
    grade: "A+",
    mistakes: "",
    result: "Win",
    pnl: 410,
    entry: 5268.5,
    stop: 5273.5,
    target: 5258.5,
    rMultiple: 2.0,
    notes: "Held with trend and managed well.",
    screenshot: "",
  },
];

const emptyForm = {
  id: null,
  accountId: "",
  accountName: "",
  accountFirm: "",
  date: new Date().toISOString().slice(0, 10),
  symbol: "NQ",
  setup: "",
  side: "Long",
  session: "NY Open",
  grade: "A",
  mistakes: "",
  pnl: "",
  entry: "",
  stop: "",
  target: "",
  tradeReason: "",
  tradeInvalidation: "",
  bosConfirmed: false,
  ifvgConfirmed: false,
  smtConfirmed: false,
  sessionConfirmed: false,
  liquidityConfirmed: false,
  notes: "",
  screenshot: "",
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ACCOUNT_STORAGE_KEY = "tradearchive_dashboard_accounts";

const loadStoredAccounts = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load prop firm accounts:", error);
    return [];
  }
};

const getAccountLabel = (account) => {
  if (!account) return "No account selected";

  const firm = account.firm ? `${account.firm} • ` : "";
  return `${firm}${account.name || "Unnamed Account"}`;
};

const getAccountById = (accounts, accountId) =>
  accounts.find((account) => String(account.id) === String(accountId)) || null;


export default function Journal({ setActivePage }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [userPlan, setUserPlan] = useState("free");
  const [customRules, setCustomRules] = useState([]);
  const [customRuleChecks, setCustomRuleChecks] = useState({});
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [savingRule, setSavingRule] = useState(false);
  const [rulesMessage, setRulesMessage] = useState("");
  const [propAccounts, setPropAccounts] = useState(loadStoredAccounts);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const loadAccounts = () => {
      setPropAccounts(loadStoredAccounts());
    };

    loadAccounts();

    const handleStorageChange = (event) => {
      if (!event.key || event.key === ACCOUNT_STORAGE_KEY) {
        loadAccounts();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", loadAccounts);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", loadAccounts);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTrades = async () => {
      setLoadingTrades(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setTrades([]);
          setUserPlan("free");
          setLoadingTrades(false);
        }
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("plan, subscription_status")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError);
      }

      const normalizedPlan = String(profileData?.plan || "free").toLowerCase();
      const normalizedStatus = String(profileData?.subscription_status || "").toLowerCase();

      const activePlan =
        normalizedPlan === "essential" || normalizedPlan === "pro"
          ? normalizedPlan
          : normalizedStatus === "active"
          ? normalizedPlan || "free"
          : "free";

      if (isMounted) {
        setUserPlan(activePlan);
      }

      const { data: rulesData, error: rulesError } = await supabase
        .from("trading_rules")
        .select("id, rule_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (rulesError) {
        console.error("Error loading custom rules:", rulesError);
      }

      if (isMounted) {
        setCustomRules(rulesData || []);
      }

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error loading trades:", error);
        if (isMounted) {
          setTrades([]);
          setLoadingTrades(false);
        }
        return;
      }

      const mappedTrades = (data || []).map((trade) => ({
        id: trade.id,
        accountId: trade.account_id || "",
        accountName: trade.account_name || "",
        accountFirm: trade.account_firm || "",
        date: trade.date,
        symbol: trade.symbol || "NQ",
        setup: trade.setup || "",
        side: trade.side || "Long",
        session: trade.session || "NY Open",
        grade: trade.grade || "A",
        mistakes: trade.mistakes || "",
        result: trade.result || "Break-Even",
        pnl: Number(trade.pnl || 0),
        entry: trade.entry ?? "",
        stop: trade.stop ?? "",
        target: trade.target ?? "",
        rMultiple: trade.r_multiple ?? null,
        tradeReason: trade.trade_reason || "",
        tradeInvalidation: trade.trade_invalidation || "",
        bosConfirmed: Boolean(trade.bos_confirmed),
        ifvgConfirmed: Boolean(trade.ifvg_confirmed),
        smtConfirmed: Boolean(trade.smt_confirmed),
        sessionConfirmed: Boolean(trade.session_confirmed),
        liquidityConfirmed: Boolean(trade.liquidity_confirmed),
        notes: trade.notes || "",
        screenshot: trade.screenshot || "",
      }));

      const tradeIds = mappedTrades.map((trade) => trade.id);
      let checksByTrade = {};

      if (tradeIds.length) {
        const { data: checksData, error: checksError } = await supabase
          .from("trade_rule_checks")
          .select("trade_id, rule_id, followed")
          .in("trade_id", tradeIds);

        if (checksError) {
          console.error("Error loading rule checks:", checksError);
        } else {
          (checksData || []).forEach((check) => {
            const tradeKey = String(check.trade_id);
            if (!checksByTrade[tradeKey]) checksByTrade[tradeKey] = {};
            checksByTrade[tradeKey][String(check.rule_id)] = Boolean(check.followed);
          });
        }
      }

      const mappedTradesWithRules = mappedTrades.map((trade) => ({
        ...trade,
        customRuleChecks: checksByTrade[String(trade.id)] || {},
      }));

      if (isMounted) {
        setTrades(mappedTradesWithRules);
        setLoadingTrades(false);
      }
    };

    loadTrades();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter((trade) => Number(trade.pnl) > 0).length;
    const losses = trades.filter((trade) => Number(trade.pnl) < 0).length;
    const breakeven = trades.filter((trade) => Number(trade.pnl) === 0).length;
    const totalPnl = trades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";

    const validRTrades = trades.filter(
      (trade) => typeof trade.rMultiple === "number" && !Number.isNaN(trade.rMultiple)
    );

    const avgR = validRTrades.length
      ? (
          validRTrades.reduce((sum, trade) => sum + Number(trade.rMultiple), 0) /
          validRTrades.length
        ).toFixed(2)
      : "0.00";

    return {
      totalTrades,
      wins,
      losses,
      breakeven,
      totalPnl,
      winRate,
      avgR,
    };
  }, [trades]);

  const ruleCompliance = useMemo(() => {
    if (!customRules.length || !trades.length) {
      return {
        complianceRate: "0.0",
        totalChecks: 0,
        followedChecks: 0,
        mostBrokenRule: "No custom rule data yet",
      };
    }

    let totalChecks = 0;
    let followedChecks = 0;
    const brokenCounts = {};

    trades.forEach((trade) => {
      customRules.forEach((rule) => {
        totalChecks += 1;
        const followed = Boolean(trade.customRuleChecks?.[String(rule.id)]);
        if (followed) {
          followedChecks += 1;
        } else {
          brokenCounts[rule.rule_name] = (brokenCounts[rule.rule_name] || 0) + 1;
        }
      });
    });

    const mostBrokenRuleEntry = Object.entries(brokenCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      complianceRate: totalChecks ? ((followedChecks / totalChecks) * 100).toFixed(1) : "0.0",
      totalChecks,
      followedChecks,
      mostBrokenRule: mostBrokenRuleEntry ? mostBrokenRuleEntry[0] : "No broken rules logged",
    };
  }, [customRules, trades]);

  const setupAnalytics = useMemo(() => {
    const grouped = {};

    trades.forEach((trade) => {
      const key = trade.setup?.trim() || "Uncategorized";

      if (!grouped[key]) {
        grouped[key] = {
          setup: key,
          trades: 0,
          wins: 0,
          totalPnl: 0,
          totalR: 0,
          rCount: 0,
        };
      }

      grouped[key].trades += 1;
      if (Number(trade.pnl) > 0) grouped[key].wins += 1;
      grouped[key].totalPnl += Number(trade.pnl || 0);

      if (
        typeof trade.rMultiple === "number" &&
        !Number.isNaN(trade.rMultiple)
      ) {
        grouped[key].totalR += Number(trade.rMultiple);
        grouped[key].rCount += 1;
      }
    });

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        winRate: item.trades ? ((item.wins / item.trades) * 100).toFixed(1) : "0.0",
        avgR: item.rCount ? (item.totalR / item.rCount).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [trades]);


  const behaviorInsights = useMemo(() => {
    const totalTrades = trades.length;

    const emptyInsights = {
      totalTrades: 0,
      mostCommonMistake: "No data yet",
      mostCommonMistakeCount: 0,
      lowestPnlSetup: "No data yet",
      lowestPnlSetupValue: 0,
      bestLoggedSession: "No data yet",
      bestLoggedSessionWinRate: "0.0",
      avgWinningTrade: 0,
      avgLosingTrade: 0,
      largestWin: 0,
      largestLoss: 0,
    };

    if (!totalTrades) return emptyInsights;

    const mistakeCounts = {};
    const setupPnl = {};
    const sessionStats = {};
    const winningTrades = [];
    const losingTrades = [];

    trades.forEach((trade) => {
      const mistakeText = String(trade.mistakes || "").trim();
      const setupKey = String(trade.setup || "Uncategorized").trim() || "Uncategorized";
      const sessionKey = String(trade.session || "Uncategorized").trim() || "Uncategorized";
      const pnl = Number(trade.pnl || 0);

      if (mistakeText) {
        mistakeText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((mistake) => {
            mistakeCounts[mistake] = (mistakeCounts[mistake] || 0) + 1;
          });
      }

      if (!setupPnl[setupKey]) {
        setupPnl[setupKey] = 0;
      }
      setupPnl[setupKey] += pnl;

      if (!sessionStats[sessionKey]) {
        sessionStats[sessionKey] = {
          session: sessionKey,
          trades: 0,
          wins: 0,
        };
      }

      sessionStats[sessionKey].trades += 1;
      if (pnl > 0) sessionStats[sessionKey].wins += 1;

      if (pnl > 0) winningTrades.push(pnl);
      if (pnl < 0) losingTrades.push(pnl);
    });

    const mostCommonMistakeEntry = Object.entries(mistakeCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const lowestPnlSetupEntry = Object.entries(setupPnl).sort(
      (a, b) => a[1] - b[1]
    )[0];

    const bestSessionEntry = Object.values(sessionStats)
      .map((item) => ({
        ...item,
        winRate: item.trades ? (item.wins / item.trades) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.trades - a.trades)[0];

    const avgWinningTrade = winningTrades.length
      ? winningTrades.reduce((sum, value) => sum + value, 0) / winningTrades.length
      : 0;

    const avgLosingTrade = losingTrades.length
      ? losingTrades.reduce((sum, value) => sum + value, 0) / losingTrades.length
      : 0;

    return {
      totalTrades,
      mostCommonMistake: mostCommonMistakeEntry ? mostCommonMistakeEntry[0] : "No mistakes logged",
      mostCommonMistakeCount: mostCommonMistakeEntry ? mostCommonMistakeEntry[1] : 0,
      lowestPnlSetup: lowestPnlSetupEntry ? lowestPnlSetupEntry[0] : "No setup data",
      lowestPnlSetupValue: lowestPnlSetupEntry ? lowestPnlSetupEntry[1] : 0,
      bestLoggedSession: bestSessionEntry ? bestSessionEntry.session : "No session data",
      bestLoggedSessionWinRate: bestSessionEntry ? bestSessionEntry.winRate.toFixed(1) : "0.0",
      avgWinningTrade,
      avgLosingTrade,
      largestWin: winningTrades.length ? Math.max(...winningTrades) : 0,
      largestLoss: losingTrades.length ? Math.min(...losingTrades) : 0,
    };
  }, [trades]);

  const performanceInsights = useMemo(() => {
    const emptyInsights = {
      bestGrade: "No data yet",
      bestGradeWinRate: "0.0",
      bestGradeTrades: 0,
      bestSetup: "No data yet",
      bestSetupPnl: 0,
      bestAvgRSetup: "No data yet",
      bestAvgR: "0.00",
      costliestMistake: "No mistakes logged",
      costliestMistakeLoss: 0,
      bestSession: "No data yet",
      bestSessionWinRate: "0.0",
      bestSessionTrades: 0,
    };

    if (!trades.length) return emptyInsights;

    const gradeStats = {};
    const sessionStats = {};
    const mistakeLosses = {};

    trades.forEach((trade) => {
      const grade = String(trade.grade || "Ungraded").trim() || "Ungraded";
      const session = String(trade.session || "Uncategorized").trim() || "Uncategorized";
      const pnl = Number(trade.pnl || 0);
      const mistakeText = String(trade.mistakes || "").trim();

      if (!gradeStats[grade]) {
        gradeStats[grade] = { grade, trades: 0, wins: 0 };
      }

      gradeStats[grade].trades += 1;
      if (pnl > 0) gradeStats[grade].wins += 1;

      if (!sessionStats[session]) {
        sessionStats[session] = { session, trades: 0, wins: 0 };
      }

      sessionStats[session].trades += 1;
      if (pnl > 0) sessionStats[session].wins += 1;

      if (mistakeText && pnl < 0) {
        mistakeText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((mistake) => {
            mistakeLosses[mistake] = (mistakeLosses[mistake] || 0) + Math.abs(pnl);
          });
      }
    });

    const bestGrade = Object.values(gradeStats)
      .map((item) => ({
        ...item,
        winRate: item.trades ? (item.wins / item.trades) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.trades - a.trades)[0];

    const bestSetup = [...setupAnalytics].sort(
      (a, b) => b.totalPnl - a.totalPnl || b.trades - a.trades
    )[0];

    const bestAvgRSetup = [...setupAnalytics].sort(
      (a, b) => Number(b.avgR) - Number(a.avgR) || b.trades - a.trades
    )[0];

    const costliestMistake = Object.entries(mistakeLosses).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const bestSession = Object.values(sessionStats)
      .map((item) => ({
        ...item,
        winRate: item.trades ? (item.wins / item.trades) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.trades - a.trades)[0];

    return {
      bestGrade: bestGrade?.grade || emptyInsights.bestGrade,
      bestGradeWinRate: bestGrade ? bestGrade.winRate.toFixed(1) : "0.0",
      bestGradeTrades: bestGrade?.trades || 0,
      bestSetup: bestSetup?.setup || emptyInsights.bestSetup,
      bestSetupPnl: bestSetup?.totalPnl || 0,
      bestAvgRSetup: bestAvgRSetup?.setup || emptyInsights.bestAvgRSetup,
      bestAvgR: bestAvgRSetup?.avgR || "0.00",
      costliestMistake: costliestMistake?.[0] || emptyInsights.costliestMistake,
      costliestMistakeLoss: costliestMistake?.[1] || 0,
      bestSession: bestSession?.session || emptyInsights.bestSession,
      bestSessionWinRate: bestSession ? bestSession.winRate.toFixed(1) : "0.0",
      bestSessionTrades: bestSession?.trades || 0,
    };
  }, [trades, setupAnalytics]);

  const dailyTradeMap = useMemo(() => {
    const grouped = {};

    trades.forEach((trade) => {
      const dateKey = trade.date;
      if (!dateKey) return;

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
        };
      }

      const pnl = Number(trade.pnl || 0);
      grouped[dateKey].pnl += pnl;
      grouped[dateKey].trades += 1;

      if (pnl > 0) grouped[dateKey].wins += 1;
      else if (pnl < 0) grouped[dateKey].losses += 1;
      else grouped[dateKey].breakeven += 1;
    });

    return grouped;
  }, [trades]);

  const filteredTrades = useMemo(() => {
    let filtered = trades;

    if (filter === "wins") {
      filtered = filtered.filter((trade) => Number(trade.pnl) > 0);
    } else if (filter === "losses") {
      filtered = filtered.filter((trade) => Number(trade.pnl) < 0);
    } else if (filter === "breakeven") {
      filtered = filtered.filter((trade) => Number(trade.pnl) === 0);
    }

    if (selectedCalendarDate) {
      filtered = filtered.filter((trade) => trade.date === selectedCalendarDate);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((trade) => {
        return (
          String(trade.symbol || "").toLowerCase().includes(term) ||
          String(trade.setup || "").toLowerCase().includes(term) ||
          String(trade.notes || "").toLowerCase().includes(term) ||
          String(trade.session || "").toLowerCase().includes(term) ||
          String(trade.grade || "").toLowerCase().includes(term) ||
          String(trade.mistakes || "").toLowerCase().includes(term) ||
          String(trade.tradeReason || "").toLowerCase().includes(term) ||
          String(trade.tradeInvalidation || "").toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [trades, filter, searchTerm, selectedCalendarDate]);

  const calculateRMultiple = (side, entry, stop, target) => {
    const entryNum = Number(entry);
    const stopNum = Number(stop);
    const targetNum = Number(target);

    if (!entryNum || !stopNum || !targetNum) return null;

    const risk = Math.abs(entryNum - stopNum);
    if (risk === 0) return null;

    let reward = 0;

    if (side === "Long") {
      reward = targetNum - entryNum;
    } else {
      reward = entryNum - targetNum;
    }

    return Number((reward / risk).toFixed(2));
  };

  const liveRPreview = useMemo(() => {
    return calculateRMultiple(form.side, form.entry, form.stop, form.target);
  }, [form.side, form.entry, form.stop, form.target]);

  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();
    const calendarStart = new Date(year, month, 1 - startDay);

    const days = [];

    for (let i = 0; i < 42; i += 1) {
      const current = new Date(calendarStart);
      current.setDate(calendarStart.getDate() + i);

      const dateKey = formatDateKey(current);
      const tradeData = dailyTradeMap[dateKey] || null;

      days.push({
        date: current,
        dateKey,
        dayNumber: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: dateKey === formatDateKey(new Date()),
        isSelected: selectedCalendarDate === dateKey,
        tradeData,
      });
    }

    const monthTrades = trades.filter((trade) => {
      const tradeDate = parseLocalDate(trade.date);
      return (
        tradeDate &&
        tradeDate.getFullYear() === year &&
        tradeDate.getMonth() === month
      );
    });

    const monthlyPnl = monthTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const monthlyWins = monthTrades.filter((trade) => Number(trade.pnl) > 0).length;
    const monthlyLosses = monthTrades.filter((trade) => Number(trade.pnl) < 0).length;
    const monthlyBreakeven = monthTrades.filter((trade) => Number(trade.pnl) === 0).length;
    const monthlyWinRate = monthTrades.length
      ? ((monthlyWins / monthTrades.length) * 100).toFixed(1)
      : "0.0";

    const greenDays = Object.values(dailyTradeMap).filter((item) => {
      const itemDate = parseLocalDate(item.date);
      return (
        itemDate &&
        itemDate.getFullYear() === year &&
        itemDate.getMonth() === month &&
        item.pnl > 0
      );
    }).length;

    const redDays = Object.values(dailyTradeMap).filter((item) => {
      const itemDate = parseLocalDate(item.date);
      return (
        itemDate &&
        itemDate.getFullYear() === year &&
        itemDate.getMonth() === month &&
        item.pnl < 0
      );
    }).length;

    return {
      days,
      monthlyPnl,
      monthlyTrades: monthTrades.length,
      monthlyWins,
      monthlyLosses,
      monthlyBreakeven,
      monthlyWinRate,
      greenDays,
      redDays,
      monthLabel: `${monthNames[month]} ${year}`,
    };
  }, [calendarMonth, dailyTradeMap, selectedCalendarDate, trades]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomRuleChange = (ruleId, followed) => {
    setCustomRuleChecks((prev) => ({
      ...prev,
      [String(ruleId)]: followed,
    }));
  };

  const resetCustomRuleChecks = (rules = customRules) => {
    const nextChecks = {};
    rules.forEach((rule) => {
      nextChecks[String(rule.id)] = false;
    });
    setCustomRuleChecks(nextChecks);
  };

  const addTradingRule = async () => {
    const trimmedRule = newRule.trim();
    if (!trimmedRule) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRulesMessage("Log in before adding rules.");
      return;
    }

    setSavingRule(true);
    setRulesMessage("");

    const { data, error } = await supabase
      .from("trading_rules")
      .insert([{ user_id: user.id, rule_name: trimmedRule }])
      .select("id, rule_name")
      .single();

    if (error) {
      console.error("Error adding trading rule:", error);
      setRulesMessage(`Could not add rule: ${error.message}`);
    } else {
      const nextRules = [...customRules, data];
      setCustomRules(nextRules);
      resetCustomRuleChecks(nextRules);
      setNewRule("");
      setRulesMessage("Rule added. It will now appear in Add Trade.");
    }

    setSavingRule(false);
  };

  const deleteTradingRule = async (ruleId) => {
    const confirmed = window.confirm("Delete this trading rule?");
    if (!confirmed) return;

    setRulesMessage("");

    const { error } = await supabase
      .from("trading_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      console.error("Error deleting trading rule:", error);
      setRulesMessage(`Could not delete rule: ${error.message}`);
      return;
    }

    const nextRules = customRules.filter((rule) => String(rule.id) !== String(ruleId));
    setCustomRules(nextRules);
    resetCustomRuleChecks(nextRules);
    setRulesMessage("Rule deleted.");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        screenshot: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setForm((prev) => ({
      ...prev,
      screenshot: "",
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const openAddModal = () => {
    resetForm();
    resetCustomRuleChecks();
    setShowAddModal(true);
  };

  const openViewModal = (trade) => {
    setSelectedTrade(trade);
    setShowViewModal(true);
  };

  const openEditModal = (trade) => {
    setForm({
      id: trade.id,
      accountId: trade.accountId || "",
      accountName: trade.accountName || "",
      accountFirm: trade.accountFirm || "",
      date: trade.date || new Date().toISOString().slice(0, 10),
      symbol: trade.symbol || "NQ",
      setup: trade.setup || "",
      side: trade.side || "Long",
      session: trade.session || "NY Open",
      grade: trade.grade || "A",
      mistakes: trade.mistakes || "",
      pnl: trade.pnl ?? "",
      entry: trade.entry ?? "",
      stop: trade.stop ?? "",
      target: trade.target ?? "",
      tradeReason: trade.tradeReason || "",
      tradeInvalidation: trade.tradeInvalidation || "",
      bosConfirmed: Boolean(trade.bosConfirmed),
      ifvgConfirmed: Boolean(trade.ifvgConfirmed),
      smtConfirmed: Boolean(trade.smtConfirmed),
      sessionConfirmed: Boolean(trade.sessionConfirmed),
      liquidityConfirmed: Boolean(trade.liquidityConfirmed),
      notes: trade.notes || "",
      screenshot: trade.screenshot || "",
    });
    setCustomRuleChecks(trade.customRuleChecks || {});
    setShowEditModal(true);
  };

  const handleAddTrade = async () => {
    if (!form.setup.trim() || form.pnl === "" || !form.notes.trim()) {
      alert("Please fill out setup, P/L, and notes.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (userPlan !== "essential" && userPlan !== "pro" && trades.length >= 50) {
      alert("Free plan limit reached. Upgrade to Essential for unlimited journal entries.");
      return;
    }

    const pnlNumber = Number(form.pnl);
    const entryNum = form.entry === "" ? null : Number(form.entry);
    const stopNum = form.stop === "" ? null : Number(form.stop);
    const targetNum = form.target === "" ? null : Number(form.target);
    const rMultiple = calculateRMultiple(form.side, entryNum, stopNum, targetNum);
    const selectedAccount = getAccountById(propAccounts, form.accountId);

    const tradeToInsert = {
      user_id: user.id,
      account_id: form.accountId || null,
      account_name: selectedAccount?.name || form.accountName || "",
      account_firm: selectedAccount?.firm || form.accountFirm || "",
      account_id: form.accountId || null,
      account_name: selectedAccount?.name || form.accountName || "",
      account_firm: selectedAccount?.firm || form.accountFirm || "",
      date: form.date,
      symbol: form.symbol,
      setup: form.setup,
      side: form.side,
      session: form.session,
      grade: form.grade,
      mistakes: form.mistakes,
      result: pnlNumber > 0 ? "Win" : pnlNumber < 0 ? "Loss" : "Break-Even",
      pnl: pnlNumber,
      entry: entryNum,
      stop: stopNum,
      target: targetNum,
      r_multiple: rMultiple,
      trade_reason: form.tradeReason,
      trade_invalidation: form.tradeInvalidation,
      bos_confirmed: Boolean(form.bosConfirmed),
      ifvg_confirmed: Boolean(form.ifvgConfirmed),
      smt_confirmed: Boolean(form.smtConfirmed),
      session_confirmed: Boolean(form.sessionConfirmed),
      liquidity_confirmed: Boolean(form.liquidityConfirmed),
      notes: form.notes,
      screenshot: form.screenshot || "",
    };

    const { data, error } = await supabase
      .from("trades")
      .insert([tradeToInsert])
      .select()
      .single();

    if (error) {
      console.error("Error saving trade:", error);
      alert(`Could not save trade: ${error.message}`);
      return;
    }

    if (customRules.length) {
      const ruleRows = customRules.map((rule) => ({
        trade_id: data.id,
        rule_id: rule.id,
        followed: Boolean(customRuleChecks[String(rule.id)]),
      }));

      const { error: ruleCheckError } = await supabase
        .from("trade_rule_checks")
        .insert(ruleRows);

      if (ruleCheckError) {
        console.error("Error saving rule checks:", ruleCheckError);
      }
    }

    const newTrade = {
      ...mapSupabaseTrade(data),
      customRuleChecks: { ...customRuleChecks },
    };

    setTrades((prev) => [newTrade, ...prev]);
    setShowAddModal(false);
    resetForm();
  };

  const handleSaveEdit = async () => {
    if (!form.setup.trim() || form.pnl === "" || !form.notes.trim()) {
      alert("Please fill out setup, P/L, and notes.");
      return;
    }

    const pnlNumber = Number(form.pnl);
    const entryNum = form.entry === "" ? null : Number(form.entry);
    const stopNum = form.stop === "" ? null : Number(form.stop);
    const targetNum = form.target === "" ? null : Number(form.target);

    const rMultiple = calculateRMultiple(form.side, entryNum, stopNum, targetNum);
    const selectedAccount = getAccountById(propAccounts, form.accountId);

    const updatedTradePayload = {
      date: form.date,
      symbol: form.symbol,
      setup: form.setup,
      side: form.side,
      session: form.session,
      grade: form.grade,
      mistakes: form.mistakes,
      result: pnlNumber > 0 ? "Win" : pnlNumber < 0 ? "Loss" : "Break-Even",
      pnl: pnlNumber,
      entry: entryNum,
      stop: stopNum,
      target: targetNum,
      r_multiple: rMultiple,
      trade_reason: form.tradeReason,
      trade_invalidation: form.tradeInvalidation,
      bos_confirmed: Boolean(form.bosConfirmed),
      ifvg_confirmed: Boolean(form.ifvgConfirmed),
      smt_confirmed: Boolean(form.smtConfirmed),
      session_confirmed: Boolean(form.sessionConfirmed),
      liquidity_confirmed: Boolean(form.liquidityConfirmed),
      notes: form.notes,
      screenshot: form.screenshot || "",
    };

    const { data, error } = await supabase
      .from("trades")
      .update(updatedTradePayload)
      .eq("id", form.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating trade:", error);
      alert(`Could not update trade: ${error.message}`);
      return;
    }

    if (customRules.length) {
      const { error: deleteChecksError } = await supabase
        .from("trade_rule_checks")
        .delete()
        .eq("trade_id", form.id);

      if (deleteChecksError) {
        console.error("Error clearing old rule checks:", deleteChecksError);
      }

      const ruleRows = customRules.map((rule) => ({
        trade_id: form.id,
        rule_id: rule.id,
        followed: Boolean(customRuleChecks[String(rule.id)]),
      }));

      const { error: insertChecksError } = await supabase
        .from("trade_rule_checks")
        .insert(ruleRows);

      if (insertChecksError) {
        console.error("Error saving updated rule checks:", insertChecksError);
      }
    }

    const updatedTrade = {
      id: data.id,
      accountId: data.account_id || "",
      accountName: data.account_name || "",
      accountFirm: data.account_firm || "",
      date: data.date,
      symbol: data.symbol,
      setup: data.setup,
      side: data.side,
      session: data.session,
      grade: data.grade,
      mistakes: data.mistakes,
      result: data.result,
      pnl: Number(data.pnl || 0),
      entry: data.entry ?? "",
      stop: data.stop ?? "",
      target: data.target ?? "",
      rMultiple: data.r_multiple ?? null,
      tradeReason: data.trade_reason || "",
      tradeInvalidation: data.trade_invalidation || "",
      bosConfirmed: Boolean(data.bos_confirmed),
      ifvgConfirmed: Boolean(data.ifvg_confirmed),
      smtConfirmed: Boolean(data.smt_confirmed),
      sessionConfirmed: Boolean(data.session_confirmed),
      liquidityConfirmed: Boolean(data.liquidity_confirmed),
      notes: data.notes,
      screenshot: data.screenshot || "",
      customRuleChecks: { ...customRuleChecks },
    };

    setTrades((prev) =>
      prev.map((trade) => (trade.id === form.id ? updatedTrade : trade))
    );

    if (selectedTrade && selectedTrade.id === form.id) {
      setSelectedTrade(updatedTrade);
    }

    setShowEditModal(false);
    resetForm();
  };

  const mapSupabaseTrade = (trade) => ({
    id: trade.id,
    accountId: trade.account_id || "",
    accountName: trade.account_name || "",
    accountFirm: trade.account_firm || "",
    date: trade.date,
    symbol: trade.symbol || "NQ",
    setup: trade.setup || "",
    side: trade.side || "Long",
    session: trade.session || "NY Open",
    grade: trade.grade || "A",
    mistakes: trade.mistakes || "",
    result: trade.result || "Break-Even",
    pnl: Number(trade.pnl || 0),
    entry: trade.entry ?? "",
    stop: trade.stop ?? "",
    target: trade.target ?? "",
    rMultiple: trade.r_multiple ?? null,
    tradeReason: trade.trade_reason || "",
    tradeInvalidation: trade.trade_invalidation || "",
    bosConfirmed: Boolean(trade.bos_confirmed),
    ifvgConfirmed: Boolean(trade.ifvg_confirmed),
    smtConfirmed: Boolean(trade.smt_confirmed),
    sessionConfirmed: Boolean(trade.session_confirmed),
    liquidityConfirmed: Boolean(trade.liquidity_confirmed),
    notes: trade.notes || "",
    screenshot: trade.screenshot || "",
  });

  const handleDeleteTrade = async (id) => {
    const confirmed = window.confirm("Delete this trade?");
    if (!confirmed) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user before delete:", userError);
      alert(`Could not check your login: ${userError.message}`);
      return;
    }

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const tradeId = String(id);

    const { data: existingTrade, error: findError } = await supabase
      .from("trades")
      .select("id, user_id")
      .eq("id", tradeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findError) {
      console.error("Error finding trade before delete:", findError);
      alert(`Could not find trade before delete: ${findError.message}`);
      return;
    }

    if (!existingTrade) {
      console.warn("Trade not found for this user:", { tradeId, userId: user.id });
      setTrades((prev) => prev.filter((trade) => String(trade.id) !== tradeId));

      if (selectedTrade && String(selectedTrade.id) === tradeId) {
        setShowViewModal(false);
        setSelectedTrade(null);
      }

      alert("That trade was not found for your account. I removed it from the screen.");
      return;
    }

    await supabase
      .from("trade_rule_checks")
      .delete()
      .eq("trade_id", tradeId);

    const { error: deleteError } = await supabase
      .from("trades")
      .delete()
      .eq("id", tradeId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting trade:", deleteError);
      alert(`Could not delete trade: ${deleteError.message}`);
      return;
    }

    const { data: checkTrade, error: checkError } = await supabase
      .from("trades")
      .select("id")
      .eq("id", tradeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking trade after delete:", checkError);
      alert(`Trade delete check failed: ${checkError.message}`);
      return;
    }

    if (checkTrade) {
      console.warn("Delete ran, but row still exists. Check Supabase delete RLS policy.", {
        tradeId,
        userId: user.id,
      });
      alert(
        "Trade still exists in Supabase. Add a DELETE policy on the trades table: auth.uid() = user_id"
      );
      return;
    }

    setTrades((prev) => prev.filter((trade) => String(trade.id) !== tradeId));

    if (selectedTrade && String(selectedTrade.id) === tradeId) {
      setShowViewModal(false);
      setSelectedTrade(null);
    }
  };

  const formatPnl = (value) => {
    const num = Number(value);
    if (num > 0) return `+$${num}`;
    if (num < 0) return `-$${Math.abs(num)}`;
    return "$0";
  };

  const formatR = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return `${value > 0 ? "+" : ""}${Number(value).toFixed(2)}R`;
  };

  const getResultLabel = (pnl) => {
    const num = Number(pnl);
    if (num > 0) return "Win";
    if (num < 0) return "Loss";
    return "Break-Even";
  };

  const getResultColor = (pnl) => {
    const num = Number(pnl);
    if (num > 0) return "#4ade80";
    if (num < 0) return "#f87171";
    return "#facc15";
  };

  const closeAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowPlaybookModal(false);
  };

  const goToPreviousMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
    );
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const clearDateFilter = () => {
    setSelectedCalendarDate("");
  };

  if (loadingTrades) {
    return (
      <div style={{ padding: "40px", color: "white" }}>Loading trades...</div>
    );
  }

  return (
    <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
      <div style={{ ...styles.topbar, ...(isMobile ? styles.topbarMobile : {}) }}>
        <div
          style={{ ...styles.topLogo, ...(isMobile ? styles.topLogoMobile : {}) }}
          onClick={() => setActivePage?.("dashboard")}
        >
          <span style={{ color: "#f8fafc" }}>Trade</span>
          <span style={{ color: "#60a5fa" }}>Archive</span>
        </div>

        <div style={{ ...styles.topNav, ...(isMobile ? styles.topNavMobile : {}) }}>
          <button
            type="button"
            style={styles.topNavButton}
            onClick={() => setActivePage?.("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            style={{ ...styles.topNavButton, ...styles.activeTopNav }}
          >
            Journal
          </button>
          <button
            type="button"
            style={styles.topNavButton}
            onClick={() => setActivePage?.("pricing")}
          >
            Pricing
          </button>
        </div>

        <div style={{ ...styles.topRight, ...(isMobile ? styles.topRightMobile : {}) }}>
          <div style={styles.userPill}>User ▾</div>
        </div>
      </div>

      <div style={{ ...styles.content, ...(isMobile ? styles.contentMobile : {}) }}>
        <div style={{ ...styles.headingRow, ...(isMobile ? styles.headingRowMobile : {}) }}>
          <h1 style={{ ...styles.heading, ...(isMobile ? styles.headingMobile : {}) }}>Journal</h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: isMobile ? "stretch" : "flex-end" }}>
            <button
              type="button"
              style={{ ...styles.playbookButton, ...(isMobile ? styles.quickAddButtonMobile : {}) }}
              onClick={() => setShowPlaybookModal(true)}
            >
              My Playbook
            </button>
            <button style={{ ...styles.quickAddButton, ...(isMobile ? styles.quickAddButtonMobile : {}) }} onClick={openAddModal}>
              + Add Trade
            </button>
          </div>
        </div>

        <div style={{ ...styles.statsGrid, ...(isMobile ? styles.statsGridMobile : {}) }}>
          <div style={{ ...styles.statCard, ...(isMobile ? styles.statCardMobile : {}) }}>
            <div style={styles.statLabel}>Total Trades</div>
            <div style={styles.statValue}>{stats.totalTrades}</div>
          </div>

          <div style={{ ...styles.statCard, ...(isMobile ? styles.statCardMobile : {}) }}>
            <div style={styles.statLabel}>Win Rate</div>
            <div style={{ ...styles.statValue, color: "#4ade80" }}>{stats.winRate}%</div>
          </div>

          <div style={{ ...styles.statCard, ...(isMobile ? styles.statCardMobile : {}) }}>
            <div style={styles.statLabel}>Wins / Losses</div>
            <div style={styles.statValue}>
              <span style={{ color: "#4ade80" }}>{stats.wins}</span>
              <span style={{ color: "rgba(255,255,255,0.45)" }}> / </span>
              <span style={{ color: "#f87171" }}>{stats.losses}</span>
            </div>
          </div>

          <div style={{ ...styles.statCard, ...(isMobile ? styles.statCardMobile : {}) }}>
            <div style={styles.statLabel}>Break-Evens</div>
            <div style={{ ...styles.statValue, color: "#facc15" }}>{stats.breakeven}</div>
          </div>

          <div style={{ ...styles.statCard, ...(isMobile ? styles.statCardMobile : {}) }}>
            <div style={styles.statLabel}>Net P/L</div>
            <div
              style={{
                ...styles.statValue,
                color: stats.totalPnl >= 0 ? "#4ade80" : "#f87171",
              }}
            >
              {stats.totalPnl >= 0
                ? `+$${stats.totalPnl}`
                : `-$${Math.abs(stats.totalPnl)}`}
            </div>
          </div>

          <div style={{ ...styles.statCard, ...(isMobile ? styles.statCardMobile : {}) }}>
            <div style={styles.statLabel}>Avg R</div>
            <div
              style={{
                ...styles.statValue,
                color: Number(stats.avgR) >= 0 ? "#4ade80" : "#f87171",
              }}
            >
              {stats.avgR}R
            </div>
          </div>

          <div style={{ ...styles.statCard, ...(isMobile ? styles.statCardMobile : {}) }}>
            <div style={styles.statLabel}>Rule Compliance</div>
            <div style={{ ...styles.statValue, color: "#93c5fd" }}>
              {ruleCompliance.complianceRate}%
            </div>
            <div style={{ marginTop: "6px", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 700 }}>
              Most broken: {ruleCompliance.mostBrokenRule}
            </div>
          </div>
        </div>

        <div style={{ ...styles.analyticsCard, ...(isMobile ? styles.cardMobile : {}) }}>
          <div style={{ ...styles.analyticsHeader, ...(isMobile ? styles.sectionHeaderMobile : {}) }}>
            <div>
              <div style={{ ...styles.analyticsTitle, ...(isMobile ? styles.sectionTitleMobile : {}) }}>Setup Analytics</div>
              <div style={{ ...styles.analyticsSubtext, ...(isMobile ? styles.sectionSubtextMobile : {}) }}>
                See which setups actually make money and which ones need to be cut
              </div>
            </div>
          </div>

          <div style={styles.tableScroll}>
            <table style={styles.analyticsTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Setup</th>
                  <th style={styles.th}>Trades</th>
                  <th style={styles.th}>Win Rate</th>
                  <th style={styles.th}>Avg R</th>
                  <th style={styles.th}>Total P/L</th>
                </tr>
              </thead>
              <tbody>
                {setupAnalytics.length === 0 ? (
                  <tr>
                    <td style={styles.emptyState} colSpan="5">
                      No setup analytics yet.
                    </td>
                  </tr>
                ) : (
                  setupAnalytics.map((item) => (
                    <tr key={item.setup}>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{item.setup}</td>
                      <td style={styles.td}>{item.trades}</td>
                      <td
                        style={{
                          ...styles.td,
                          color: Number(item.winRate) >= 50 ? "#4ade80" : "#f87171",
                          fontWeight: 700,
                        }}
                      >
                        {item.winRate}%
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color: Number(item.avgR) >= 0 ? "#4ade80" : "#f87171",
                          fontWeight: 700,
                        }}
                      >
                        {item.avgR}R
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color: item.totalPnl >= 0 ? "#4ade80" : "#f87171",
                          fontWeight: 700,
                        }}
                      >
                        {item.totalPnl >= 0
                          ? `+$${item.totalPnl}`
                          : `-$${Math.abs(item.totalPnl)}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...styles.insightsCard, ...(isMobile ? styles.cardMobile : {}) }}>
          <div style={{ ...styles.insightsHeader, ...(isMobile ? styles.sectionHeaderMobile : {}) }}>
            <div>
              <div style={{ ...styles.insightsTitle, ...(isMobile ? styles.sectionTitleMobile : {}) }}>Behavior Insights</div>
              <div style={{ ...styles.insightsSubtext, ...(isMobile ? styles.sectionSubtextMobile : {}) }}>
                Descriptive summaries based only on your logged journal data.
              </div>
            </div>
          </div>

          <div style={{ ...styles.insightsGrid, ...(isMobile ? styles.insightsGridMobile : {}) }}>
            <div style={{ ...styles.insightBox, ...(isMobile ? styles.insightBoxMobile : {}) }}>
              <div style={styles.insightLabel}>Most Logged Mistake</div>
              <div style={styles.insightValue}>{behaviorInsights.mostCommonMistake}</div>
              <div style={styles.insightMeta}>
                {behaviorInsights.mostCommonMistakeCount > 0
                  ? `${behaviorInsights.mostCommonMistakeCount} logged time${
                      behaviorInsights.mostCommonMistakeCount === 1 ? "" : "s"
                    }`
                  : "No mistake tags yet"}
              </div>
            </div>

            <div style={{ ...styles.insightBox, ...(isMobile ? styles.insightBoxMobile : {}) }}>
              <div style={styles.insightLabel}>Lowest P/L Setup</div>
              <div style={styles.insightValue}>{behaviorInsights.lowestPnlSetup}</div>
              <div
                style={{
                  ...styles.insightMeta,
                  color:
                    behaviorInsights.lowestPnlSetupValue >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                {formatPnl(behaviorInsights.lowestPnlSetupValue)}
              </div>
            </div>

            <div style={{ ...styles.insightBox, ...(isMobile ? styles.insightBoxMobile : {}) }}>
              <div style={styles.insightLabel}>Best Logged Session</div>
              <div style={styles.insightValue}>{behaviorInsights.bestLoggedSession}</div>
              <div style={styles.insightMeta}>
                {behaviorInsights.bestLoggedSessionWinRate}% win rate
              </div>
            </div>

            <div style={{ ...styles.insightBox, ...(isMobile ? styles.insightBoxMobile : {}) }}>
              <div style={styles.insightLabel}>Average Win / Loss</div>
              <div style={styles.insightValue}>
                <span style={{ color: "#4ade80" }}>
                  {formatPnl(Math.round(behaviorInsights.avgWinningTrade))}
                </span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}> / </span>
                <span style={{ color: "#f87171" }}>
                  {formatPnl(Math.round(behaviorInsights.avgLosingTrade))}
                </span>
              </div>
              <div style={styles.insightMeta}>Based on closed logged trades</div>
            </div>

            <div style={{ ...styles.insightBox, ...(isMobile ? styles.insightBoxMobile : {}) }}>
              <div style={styles.insightLabel}>Largest Win</div>
              <div style={{ ...styles.insightValue, color: "#4ade80" }}>
                {formatPnl(behaviorInsights.largestWin)}
              </div>
              <div style={styles.insightMeta}>Highest positive P/L entry</div>
            </div>

            <div style={{ ...styles.insightBox, ...(isMobile ? styles.insightBoxMobile : {}) }}>
              <div style={styles.insightLabel}>Largest Loss</div>
              <div style={{ ...styles.insightValue, color: "#f87171" }}>
                {formatPnl(behaviorInsights.largestLoss)}
              </div>
              <div style={styles.insightMeta}>Lowest negative P/L entry</div>
            </div>
          </div>
        </div>



        <div style={{ ...styles.actionInsightsCard, ...(isMobile ? styles.cardMobile : {}) }}>
          <div style={styles.actionInsightsTop}>
            <div>
              <div style={styles.actionInsightsEyebrow}>REVIEW SUMMARY</div>
              <div style={{ ...styles.actionInsightsTitle, ...(isMobile ? styles.sectionTitleMobile : {}) }}>
                Key Trading Takeaways
              </div>
              <div style={styles.actionInsightsSubtext}>
                What is working, what is hurting performance, and where to focus next.
              </div>
            </div>
          </div>

          <div style={styles.actionInsightsList}>
            <div style={styles.actionInsightRow}>
              <div style={styles.actionIcon}>01</div>
              <div>
                <div style={styles.actionTitle}>Best Setup</div>
                <div style={styles.actionText}>
                  {performanceInsights.bestSetup !== "No data yet"
                    ? `${performanceInsights.bestSetup}: ${formatPnl(
                        performanceInsights.bestSetupPnl
                      )} total P/L.`
                    : "Not enough setup data yet."}
                </div>
              </div>
            </div>

            <div style={styles.actionInsightRow}>
              <div style={styles.actionIcon}>02</div>
              <div>
                <div style={styles.actionTitle}>Main Mistake</div>
                <div style={styles.actionText}>
                  {performanceInsights.costliestMistakeLoss > 0
                    ? `${performanceInsights.costliestMistake}: ${formatPnl(
                        -Math.round(performanceInsights.costliestMistakeLoss)
                      )} from losing trades.`
                    : "No losing mistake tags yet."}
                </div>
              </div>
            </div>

            <div style={styles.actionInsightRow}>
              <div style={styles.actionIcon}>03</div>
              <div>
                <div style={styles.actionTitle}>Best Session</div>
                <div style={styles.actionText}>
                  {performanceInsights.bestSessionTrades > 0
                    ? `${performanceInsights.bestSession}: ${performanceInsights.bestSessionWinRate}% win rate across ${performanceInsights.bestSessionTrades} trade${
                        performanceInsights.bestSessionTrades === 1 ? "" : "s"
                      }.`
                    : "Not enough session data yet."}
                </div>
              </div>
            </div>

            <div style={{ ...styles.actionInsightRow, borderBottom: "none" }}>
              <div style={styles.actionIcon}>04</div>
              <div>
                <div style={styles.actionTitle}>Best Grade</div>
                <div style={styles.actionText}>
                  {performanceInsights.bestGradeTrades > 0
                    ? `${performanceInsights.bestGrade} trades: ${performanceInsights.bestGradeWinRate}% win rate across ${performanceInsights.bestGradeTrades} trade${
                        performanceInsights.bestGradeTrades === 1 ? "" : "s"
                      }.`
                    : "Not enough graded trades yet."}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...styles.card, ...(isMobile ? styles.cardMobile : {}) }}>
          <div style={{ ...styles.tableHeader, ...(isMobile ? styles.tableHeaderMobile : {}) }}>
            <div>
              <div style={{ ...styles.tableTitle, ...(isMobile ? styles.sectionTitleMobile : {}) }}>Trade Journal</div>
              <div style={{ ...styles.tableSubtext, ...(isMobile ? styles.sectionSubtextMobile : {}) }}>
                Track setups, execution, and what is actually working
              </div>
            </div>

            <div style={{ ...styles.headerRight, ...(isMobile ? styles.headerRightMobile : {}) }}>
              <input
                type="text"
                placeholder="Search symbol, setup, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...styles.searchInput, ...(isMobile ? styles.searchInputMobile : {}) }}
              />

              <div style={{ ...styles.filterWrap, ...(isMobile ? styles.filterWrapMobile : {}) }}>
                <button
                  style={filterButton(filter === "all")}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  style={filterButton(filter === "wins")}
                  onClick={() => setFilter("wins")}
                >
                  Wins
                </button>
                <button
                  style={filterButton(filter === "losses")}
                  onClick={() => setFilter("losses")}
                >
                  Losses
                </button>
                <button
                  style={filterButton(filter === "breakeven")}
                  onClick={() => setFilter("breakeven")}
                >
                  Break-Even
                </button>
              </div>

              <button style={{ ...styles.addButton, ...(isMobile ? styles.addButtonMobile : {}) }} onClick={openAddModal}>
                + Add Trade
              </button>
            </div>
          </div>

          {selectedCalendarDate && (
            <div style={styles.activeDateFilterBar}>
              <div style={styles.activeDateFilterText}>
                Showing trades for <span style={{ color: "#93c5fd" }}>{selectedCalendarDate}</span>
              </div>
              <button style={styles.clearDateButton} onClick={clearDateFilter}>
                Clear Date Filter              </button>
            </div>
          )}

          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Account</th>
                  <th style={styles.th}>Symbol</th>
                  <th style={styles.th}>Setup</th>
                  <th style={styles.th}>Side</th>
                  <th style={styles.th}>Session</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>R</th>
                  <th style={styles.th}>Result</th>
                  <th style={styles.th}>P/L</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTrades.length === 0 ? (
                  <tr>
                    <td style={styles.emptyState} colSpan="11">
                      No trades found for this filter or search.
                    </td>
                  </tr>
                ) : (
                  filteredTrades.map((row) => (
                    <tr
                      key={row.id}
                      style={styles.rowClickable}
                      onClick={() => openViewModal(row)}
                    >
                      <td style={styles.td}>{row.date}</td>
                      <td style={styles.td}>
                        <span style={styles.accountPill}>
                          {row.accountName || "Unassigned"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{row.symbol}</td>
                      <td style={styles.td}>{row.setup}</td>
                      <td style={styles.td}>{row.side}</td>
                      <td style={styles.td}>{row.session || "—"}</td>
                      <td style={styles.td}>{row.grade || "—"}</td>
                      <td
                        style={{
                          ...styles.td,
                          color:
                            row.rMultiple === null || row.rMultiple === undefined
                              ? "rgba(255,255,255,0.7)"
                              : row.rMultiple >= 0
                              ? "#4ade80"
                              : "#f87171",
                          fontWeight: 700,
                        }}
                      >
                        {formatR(row.rMultiple)}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color: getResultColor(row.pnl),
                          fontWeight: 700,
                        }}
                      >
                        {getResultLabel(row.pnl)}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color:
                            Number(row.pnl) > 0
                              ? "#4ade80"
                              : Number(row.pnl) < 0
                              ? "#f87171"
                              : "#facc15",
                          fontWeight: 700,
                        }}
                      >
                        {formatPnl(row.pnl)}
                      </td>
                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.actionWrap}>
                          <button style={styles.viewButton} onClick={() => openViewModal(row)}>
                            View
                          </button>
                          <button style={styles.editButton} onClick={() => openEditModal(row)}>
                            Edit
                          </button>
                          <button
                            style={styles.deleteButton}
                            onClick={() => handleDeleteTrade(row.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...styles.calendarCard, ...(isMobile ? styles.cardMobile : {}) }}>
          <div style={{ ...styles.calendarHeader, ...(isMobile ? styles.calendarHeaderMobile : {}) }}>
            <div>
              <div style={{ ...styles.calendarTitle, ...(isMobile ? styles.sectionTitleMobile : {}) }}>Performance Calendar</div>
              <div style={{ ...styles.calendarSubtext, ...(isMobile ? styles.sectionSubtextMobile : {}) }}>
                See your green and red days across the month
              </div>
            </div>

            <div style={{ ...styles.calendarHeaderActions, ...(isMobile ? styles.calendarHeaderActionsMobile : {}) }}>
              <button style={styles.monthNavButton} onClick={goToPreviousMonth}>
                ‹
              </button>
              <div style={styles.calendarMonthLabel}>{calendarData.monthLabel}</div>
              <button style={styles.monthNavButton} onClick={goToNextMonth}>
                ›
              </button>
              <button style={styles.todayButton} onClick={goToCurrentMonth}>
                Today
              </button>
            </div>
          </div>

          <div style={{ ...styles.calendarStatsRow, ...(isMobile ? styles.calendarStatsRowMobile : {}) }}>
            <div style={{ ...styles.calendarStatCard, ...(isMobile ? styles.calendarStatCardMobile : {}) }}>
              <div style={styles.calendarStatLabel}>Monthly P/L</div>
              <div
                style={{
                  ...styles.calendarStatValue,
                  color: calendarData.monthlyPnl >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                {formatPnl(calendarData.monthlyPnl)}
              </div>
            </div>

            <div style={{ ...styles.calendarStatCard, ...(isMobile ? styles.calendarStatCardMobile : {}) }}>
              <div style={styles.calendarStatLabel}>Trades</div>
              <div style={styles.calendarStatValue}>{calendarData.monthlyTrades}</div>
            </div>

            <div style={{ ...styles.calendarStatCard, ...(isMobile ? styles.calendarStatCardMobile : {}) }}>
              <div style={styles.calendarStatLabel}>Win Rate</div>
              <div style={styles.calendarStatValue}>{calendarData.monthlyWinRate}%</div>
            </div>

            <div style={{ ...styles.calendarStatCard, ...(isMobile ? styles.calendarStatCardMobile : {}) }}>
              <div style={styles.calendarStatLabel}>Green Days</div>
              <div style={{ ...styles.calendarStatValue, color: "#4ade80" }}>
                {calendarData.greenDays}
              </div>
            </div>

            <div style={{ ...styles.calendarStatCard, ...(isMobile ? styles.calendarStatCardMobile : {}) }}>
              <div style={styles.calendarStatLabel}>Red Days</div>
              <div style={{ ...styles.calendarStatValue, color: "#f87171" }}>
                {calendarData.redDays}
              </div>
            </div>
          </div>

          <div style={{ ...styles.calendarGridWrap, ...(isMobile ? styles.calendarGridWrapMobile : {}) }}>
            <div style={styles.calendarWeekHeader}>
              {dayNames.map((day) => (
                <div key={day} style={styles.calendarWeekDay}>
                  {day}
                </div>
              ))}
            </div>

            <div style={{ ...styles.calendarGrid, ...(isMobile ? styles.calendarGridMobile : {}) }}>
              {calendarData.days.map((day) => {
                const pnl = day.tradeData?.pnl ?? 0;
                const hasTrades = Boolean(day.tradeData?.trades);
                const isGreen = hasTrades && pnl > 0;
                const isRed = hasTrades && pnl < 0;
                const isFlat = hasTrades && pnl === 0;

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() =>
                      setSelectedCalendarDate((prev) =>
                        prev === day.dateKey ? "" : day.dateKey
                      )
                    }
                    style={{
                      ...styles.calendarDay,  ...(isMobile ? styles.calendarDayMobile : {}),
                      ...(day.isCurrentMonth
                        ? {}
                        : styles.calendarDayOutsideMonth),
                      ...(isGreen ? styles.calendarDayGreen : {}),
                      ...(isRed ? styles.calendarDayRed : {}),
                      ...(isFlat ? styles.calendarDayFlat : {}),
                      ...(day.isSelected ? styles.calendarDaySelected : {}),
                    }}
                  >
                    <div style={styles.calendarDayTop}>
                      <div
                        style={{
                          ...styles.calendarDayNumber,
                          color: day.isCurrentMonth
                            ? "#e2e8f0"
                            : "rgba(255,255,255,0.28)",
                        }}
                      >
                        {day.dayNumber}
                      </div>

                      {day.isToday && <div style={styles.todayDot} />}
                    </div>

                    <div style={styles.calendarDayBody}>
                      {hasTrades ? (
                        <>
                          <div
                            style={{
                              ...styles.calendarDayPnl,
                              color: isGreen
                                ? "#86efac"
                                : isRed
                                ? "#fca5a5"
                                : "#fde047",
                            }}
                          >
                            {formatPnl(pnl)}
                          </div>
                          <div style={styles.calendarDayTrades}>
                            {day.tradeData.trades} trade{day.tradeData.trades !== 1 ? "s" : ""}
                          </div>
                        </>
                      ) : (
                        <div style={styles.calendarNoTrades}>No trades</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showPlaybookModal && (
        <PlaybookModal
          rules={customRules}
          newRule={newRule}
          setNewRule={setNewRule}
          savingRule={savingRule}
          rulesMessage={rulesMessage}
          onAddRule={addTradingRule}
          onDeleteRule={deleteTradingRule}
          onClose={() => setShowPlaybookModal(false)}
        />
      )}

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={closeAllModals}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Trade</h2>
              <button style={styles.closeButton} onClick={closeAllModals}>
                ✕
              </button>
            </div>

            <TradeForm
              form={form}
              userPlan={userPlan}
              propAccounts={propAccounts}
              setActivePage={setActivePage}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              removeScreenshot={removeScreenshot}
              liveRPreview={liveRPreview}
              customRules={customRules}
              customRuleChecks={customRuleChecks}
              handleCustomRuleChange={handleCustomRuleChange}
              onCancel={() => setShowAddModal(false)}
              onSave={handleAddTrade}
            />
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={styles.modalOverlay} onClick={closeAllModals}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Trade</h2>
              <button style={styles.closeButton} onClick={closeAllModals}>
                ✕
              </button>
            </div>

            <TradeForm
              form={form}
              userPlan={userPlan}
              propAccounts={propAccounts}
              setActivePage={setActivePage}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              removeScreenshot={removeScreenshot}
              liveRPreview={liveRPreview}
              customRules={customRules}
              customRuleChecks={customRuleChecks}
              handleCustomRuleChange={handleCustomRuleChange}
              onCancel={() => setShowEditModal(false)}
              onSave={handleSaveEdit}
              saveLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {showViewModal && selectedTrade && (
        <div style={styles.modalOverlay} onClick={closeAllModals}>
          <div style={styles.viewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {selectedTrade.symbol} • {selectedTrade.setup}
              </h2>
              <button style={styles.closeButton} onClick={closeAllModals}>
                ✕
              </button>
            </div>

            <div style={styles.viewGrid}>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Date</div>
                <div style={styles.viewValue}>{selectedTrade.date}</div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Account</div>
                <div style={styles.viewValue}>
                  {selectedTrade.accountName || "Unassigned"}
                </div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Side</div>
                <div style={styles.viewValue}>{selectedTrade.side}</div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Session</div>
                <div style={styles.viewValue}>{selectedTrade.session || "—"}</div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Grade</div>
                <div style={styles.viewValue}>{selectedTrade.grade || "—"}</div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Entry</div>
                <div style={styles.viewValue}>{selectedTrade.entry || "—"}</div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Stop</div>
                <div style={styles.viewValue}>{selectedTrade.stop || "—"}</div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Target</div>
                <div style={styles.viewValue}>{selectedTrade.target || "—"}</div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>R Multiple</div>
                <div
                  style={{
                    ...styles.viewValue,
                    color:
                      selectedTrade.rMultiple === null || selectedTrade.rMultiple === undefined
                        ? "#fff"
                        : selectedTrade.rMultiple >= 0
                        ? "#4ade80"
                        : "#f87171",
                  }}
                >
                  {formatR(selectedTrade.rMultiple)}
                </div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>Result</div>
                <div
                  style={{
                    ...styles.viewValue,
                    color: getResultColor(selectedTrade.pnl),
                  }}
                >
                  {getResultLabel(selectedTrade.pnl)}
                </div>
              </div>
              <div style={styles.viewCard}>
                <div style={styles.viewLabel}>P/L</div>
                <div
                  style={{
                    ...styles.viewValue,
                    color:
                      Number(selectedTrade.pnl) > 0
                        ? "#4ade80"
                        : Number(selectedTrade.pnl) < 0
                        ? "#f87171"
                        : "#facc15",
                  }}
                >
                  {formatPnl(selectedTrade.pnl)}
                </div>
              </div>
            </div>

            <div style={styles.notesBox}>
              <div style={styles.viewLabel}>Mistakes</div>
              <div style={styles.notesText}>{selectedTrade.mistakes || "No mistakes logged."}</div>
            </div>

            <div style={styles.notesBox}>
              <div style={styles.viewLabel}>Pre-Trade Plan</div>
              <div style={styles.notesText}>
                <strong>Reason:</strong> {selectedTrade.tradeReason || "No pre-trade reason logged."}
              </div>
              <div style={{ ...styles.notesText, marginTop: "10px" }}>
                <strong>Invalidation:</strong> {selectedTrade.tradeInvalidation || "No invalidation logged."}
              </div>

              <div style={styles.viewChecklistWrap}>
                {customRules.length ? (
                  customRules.map((rule) => {
                    const checked = Boolean(selectedTrade.customRuleChecks?.[String(rule.id)]);
                    return (
                      <span
                        key={rule.id}
                        style={{
                          ...styles.viewChecklistPill,
                          ...(checked ? styles.viewChecklistPillActive : {}),
                        }}
                      >
                        {checked ? "✓" : "○"} {rule.rule_name}
                      </span>
                    );
                  })
                ) : (
                  [["BOS", selectedTrade.bosConfirmed], ["IFVG", selectedTrade.ifvgConfirmed], ["SMT", selectedTrade.smtConfirmed], ["Session", selectedTrade.sessionConfirmed], ["Liquidity", selectedTrade.liquidityConfirmed]].map(([label, checked]) => (
                    <span key={label} style={{ ...styles.viewChecklistPill, ...(checked ? styles.viewChecklistPillActive : {}) }}>
                      {checked ? "✓" : "○"} {label}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div style={styles.notesBox}>
              <div style={styles.viewLabel}>Notes</div>
              <div style={styles.notesText}>{selectedTrade.notes || "No notes yet."}</div>
            </div>

            <div style={styles.screenshotBox}>
              <div style={styles.viewLabel}>Trade Screenshot</div>
              {selectedTrade.screenshot ? (
                <img
                  src={selectedTrade.screenshot}
                  alt="Trade screenshot"
                  style={styles.viewScreenshot}
                />
              ) : (
                <div style={styles.placeholderText}>No screenshot added yet.</div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.editButtonLarge}
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedTrade);
                }}
              >
                Edit Trade
              </button>
              <button
                style={styles.deleteButtonLarge}
                onClick={() => handleDeleteTrade(selectedTrade.id)}
              >
                Delete Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaybookModal({
  rules,
  newRule,
  setNewRule,
  savingRule,
  rulesMessage,
  onAddRule,
  onDeleteRule,
  onClose,
}) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.playbookModal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.playbookEyebrow}>MY PLAYBOOK</div>
            <h2 style={styles.modalTitle}>Trading Rules</h2>
            <p style={styles.playbookSubtext}>
              These rules show up inside Add Trade so you can track discipline and rule compliance.
            </p>
          </div>

          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.playbookAddRow}>
          <input
            value={newRule}
            onChange={(event) => setNewRule(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onAddRule();
            }}
            placeholder="Example: Wait until 9:45 AM"
            style={styles.playbookInput}
          />
          <button
            type="button"
            onClick={onAddRule}
            disabled={savingRule}
            style={styles.playbookAddButton}
          >
            {savingRule ? "Adding..." : "+ Add Rule"}
          </button>
        </div>

        {rulesMessage ? <div style={styles.playbookMessage}>{rulesMessage}</div> : null}

        <div style={styles.playbookList}>
          {rules.length ? (
            rules.map((rule) => (
              <div key={rule.id} style={styles.playbookRuleRow}>
                <div style={styles.playbookRuleLeft}>
                  <span style={styles.playbookCheck}>✓</span>
                  <span style={styles.playbookRuleName}>{rule.rule_name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  style={styles.playbookDeleteButton}
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <div style={styles.playbookEmpty}>
              No rules yet. Add rules like “No news trades,” “Trade with HTF bias,” or “Max 2 trades per day.”
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TradeForm({
  form,
  userPlan,
  propAccounts = [],
  setActivePage,
  handleChange,
  handleFileChange,
  removeScreenshot,
  liveRPreview,
  customRules = [],
  customRuleChecks = {},
  handleCustomRuleChange,
  onCancel,
  onSave,
  saveLabel = "Save Trade",
}) {
  return (
    <>
      <div style={styles.formGrid}>

        <label style={{ ...styles.field, ...styles.fullWidth }}>
          Account / Prop Firm
          <select
            value={form.accountId || ""}
            onChange={(e) => {
              const selected = getAccountById(propAccounts, e.target.value);
              handleChange("accountId", e.target.value);
              handleChange("accountName", selected?.name || "");
              handleChange("accountFirm", selected?.firm || "");
            }}
            style={styles.input}
          >
            <option value="" style={{ backgroundColor: "#0f172a", color: "#ffffff" }}>Unassigned trade</option>
            {propAccounts.map((account) => (
              <option key={account.id} value={account.id} style={{ backgroundColor: "#0f172a", color: "#ffffff" }}>
                {getAccountLabel(account)}
              </option>
            ))}
          </select>

          {propAccounts.length === 0 && (
            <div style={styles.accountHelpBox}>
              No prop firm accounts yet. Create one on the Accounts page, then assign trades to it here.
              <button
                type="button"
                style={styles.inlineLinkButton}
                onClick={() => setActivePage?.("accounts")}
              >
                Open Accounts
              </button>
            </div>
          )}
        </label>

        <div>
          <label style={styles.label}>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Symbol</label>
          <select
            value={form.symbol}
            onChange={(e) => handleChange("symbol", e.target.value)}
            style={{
              ...styles.input,
              appearance: "none",
              WebkitAppearance: "none",
              backgroundColor: "#162334",
              color: "#ffffff",
            }}
          >
            <option style={{ background: "#162334", color: "#ffffff" }}>NQ</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>ES</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>MNQ</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>MES</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>Gold</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>BTC</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Setup</label>
          <input
            type="text"
            placeholder="IFVG, liquidity sweep, ORB..."
            value={form.setup}
            onChange={(e) => handleChange("setup", e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Side</label>
          <select
            value={form.side}
            onChange={(e) => handleChange("side", e.target.value)}
            style={{
              ...styles.input,
              appearance: "none",
              WebkitAppearance: "none",
              backgroundColor: "#162334",
              color: "#ffffff",
            }}
          >
            <option style={{ background: "#162334", color: "#ffffff" }}>Long</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>Short</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Session</label>
          <select
            value={form.session}
            onChange={(e) => handleChange("session", e.target.value)}
            style={{
              ...styles.input,
              appearance: "none",
              WebkitAppearance: "none",
              backgroundColor: "#162334",
              color: "#ffffff",
            }}
          >
            <option style={{ background: "#162334", color: "#ffffff" }}>Premarket</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>NY Open</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>Midday</option>
            <option style={{ background: "#162334", color: "#ffffff" }}>Power Hour</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Grade</label>
          {userPlan !== "essential" && userPlan !== "pro" ? (
            <div style={styles.lockedFeatureBox}>
              Setup grading is available on Essential.
            </div>
          ) : (
            <select
              value={form.grade}
              onChange={(e) => handleChange("grade", e.target.value)}
              style={{
                ...styles.input,
                appearance: "none",
                WebkitAppearance: "none",
                backgroundColor: "#162334",
                color: "#ffffff",
              }}
            >
              <option style={{ background: "#162334", color: "#ffffff" }}>A+</option>
              <option style={{ background: "#162334", color: "#ffffff" }}>A</option>
              <option style={{ background: "#162334", color: "#ffffff" }}>B</option>
              <option style={{ background: "#162334", color: "#ffffff" }}>C</option>
            </select>
          )}
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={styles.label}>Mistakes</label>
          <input
            type="text"
            placeholder="FOMO, early entry, moved stop..."
            value={form.mistakes}
            onChange={(e) => handleChange("mistakes", e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <div style={styles.preTradeSection}>
            <div style={styles.preTradeTitle}>Pre-Trade Plan</div>
            <div style={styles.preTradeSubtitle}>
              Plan the trade before reviewing the result. This makes it easier to separate a valid loss from a broken-rule trade.
            </div>

            <div style={styles.preTradeGrid}>
              <div>
                <label style={styles.label}>Why am I taking this trade?</label>
                <textarea
                  placeholder="Example: 5m BOS confirmed, IFVG entry, clean liquidity target..."
                  value={form.tradeReason}
                  onChange={(e) => handleChange("tradeReason", e.target.value)}
                  style={styles.preTradeTextarea}
                />
              </div>

              <div>
                <label style={styles.label}>What would invalidate this trade?</label>
                <textarea
                  placeholder="Example: price closes back through structure, IFVG fails, target is no longer clean..."
                  value={form.tradeInvalidation}
                  onChange={(e) => handleChange("tradeInvalidation", e.target.value)}
                  style={styles.preTradeTextarea}
                />
              </div>
            </div>

            <div style={styles.checklistTitle}>Rules Checklist</div>
            <div style={styles.rulesGrid}>
              {customRules.length ? (
                customRules.map((rule) => (
                  <label key={rule.id} style={styles.ruleCheck}>
                    <input
                      type="checkbox"
                      checked={Boolean(customRuleChecks[String(rule.id)])}
                      onChange={(e) => handleCustomRuleChange?.(rule.id, e.target.checked)}
                      style={styles.checkbox}
                    />
                    <span>{rule.rule_name}</span>
                  </label>
                ))
              ) : (
                [["bosConfirmed", "BOS Confirmed"], ["ifvgConfirmed", "IFVG Entry"], ["smtConfirmed", "SMT Present"], ["sessionConfirmed", "Correct Session Time"], ["liquidityConfirmed", "Liquidity Target"]].map(([field, label]) => (
                  <label key={field} style={styles.ruleCheck}>
                    <input type="checkbox" checked={Boolean(form[field])} onChange={(e) => handleChange(field, e.target.checked)} style={styles.checkbox} />
                    <span>{label}</span>
                  </label>
                ))
              )}
            </div>
            {!customRules.length && (
              <div style={{ marginTop: "10px", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 700 }}>
                Add your own rules in Settings to replace these default checklist items.
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={styles.label}>Entry</label>
          <input
            type="number"
            placeholder="19842.25"
            value={form.entry}
            onChange={(e) => handleChange("entry", e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Stop</label>
          <input
            type="number"
            placeholder="19822.25"
            value={form.stop}
            onChange={(e) => handleChange("stop", e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Target</label>
          <input
            type="number"
            placeholder="19882.25"
            value={form.target}
            onChange={(e) => handleChange("target", e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>P/L ($)</label>
          <input
            type="number"
            placeholder="530, 0, or -135"
            value={form.pnl}
            onChange={(e) => handleChange("pnl", e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={styles.label}>R Preview</label>
          <div style={styles.rPreviewBox}>
            {liveRPreview === null ? "Enter entry, stop, and target" : `${liveRPreview}R`}
          </div>
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={styles.label}>Trade Screenshot</label>
          {userPlan !== "essential" && userPlan !== "pro" ? (
            <div style={styles.lockedFeatureBox}>
              Screenshot uploads are available on Essential.
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              {form.screenshot ? (
                <div style={styles.uploadPreviewWrap}>
                  <img
                    src={form.screenshot}
                    alt="Trade screenshot preview"
                    style={styles.uploadPreview}
                  />
                  <button
                    type="button"
                    style={styles.removeImageButton}
                    onClick={removeScreenshot}
                  >
                    Remove Screenshot
                  </button>
                </div>
              ) : (
                <div style={styles.uploadHint}>Upload a chart screenshot for this trade.</div>
              )}
            </>
          )}
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={styles.label}>Notes</label>
          <textarea
            placeholder="What did you do well? What needs work?"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            style={styles.textarea}
          />
        </div>
      </div>

      <div style={styles.modalActions}>
        <button style={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button style={styles.saveButton} onClick={onSave}>
          {saveLabel}
        </button>
      </div>
    </>
  );
}

function parseLocalDate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const filterButton = (active) => ({
  border: active
    ? "1px solid rgba(96,165,250,0.5)"
    : "1px solid rgba(255,255,255,0.08)",
  background: active
    ? "linear-gradient(180deg, rgba(96,165,250,0.22), rgba(37,99,235,0.14))"
    : "rgba(255,255,255,0.04)",
  color: "#fff",
  borderRadius: "12px",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
});

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #162334 0%, #101b2b 35%, #0c1522 100%)",
    color: "#fff",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  topbar: {
    height: "76px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    background: "rgba(18,30,46,0.9)",
  },
  topLogo: {
    fontSize: "22px",
    fontWeight: 800,
    cursor: "pointer",
  },
  topNav: {
    display: "flex",
    gap: "34px",
  },
  topNavButton: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "18px",
    padding: "0 0 6px 0",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    font: "inherit",
  },
  activeTopNav: {
    borderBottom: "2px solid #60a5fa",
    color: "#fff",
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  userPill: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "999px",
    padding: "10px 16px",
  },
  content: {
    padding: "36px 32px",
  },
  headingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  heading: {
    fontSize: "56px",
    margin: 0,
    fontWeight: 800,
  },
  quickAddButton: {
    background: "linear-gradient(180deg,#3b82f6,#2563eb)",
    color: "#fff",
    border: "1px solid rgba(96,165,250,0.3)",
    padding: "14px 24px",
    borderRadius: "14px",
    fontSize: "17px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(37,99,235,0.28)",
  },


  playbookButton: {
    border: "1px solid rgba(147,197,253,0.24)",
    background: "rgba(96,165,250,0.10)",
    color: "#bfdbfe",
    borderRadius: "14px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  statCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "15px",
    marginBottom: "10px",
  },
  statValue: {
    fontSize: "30px",
    fontWeight: 800,
  },
  analyticsCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
    marginBottom: "20px",
  },
  analyticsHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  analyticsTitle: {
    fontSize: "28px",
    fontWeight: 700,
  },
  analyticsSubtext: {
    marginTop: "6px",
    color: "rgba(255,255,255,0.64)",
    fontSize: "15px",
  },
  analyticsTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },
  insightsCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(96,165,250,0.08), rgba(255,255,255,0.02))",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
    marginBottom: "20px",
  },
  insightsHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  insightsTitle: {
    fontSize: "28px",
    fontWeight: 700,
  },
  insightsSubtext: {
    marginTop: "6px",
    color: "rgba(255,255,255,0.64)",
    fontSize: "15px",
  },
  insightsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    padding: "18px 20px",
  },
  insightBox: {
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(10,18,30,0.52)",
    borderRadius: "14px",
    padding: "16px",
  },
  insightLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "8px",
  },
  insightValue: {
    color: "#f8fafc",
    fontSize: "22px",
    fontWeight: 800,
    lineHeight: 1.2,
  },
  insightMeta: {
    marginTop: "8px",
    color: "rgba(255,255,255,0.62)",
    fontSize: "14px",
    fontWeight: 600,
  },
  card: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    flexWrap: "wrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  searchInput: {
    minWidth: "260px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
  },
  filterWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  tableTitle: {
    fontSize: "30px",
    fontWeight: 700,
  },
  tableSubtext: {
    marginTop: "6px",
    color: "rgba(255,255,255,0.64)",
    fontSize: "15px",
  },
  addButton: {
    background: "linear-gradient(180deg,#3b82f6,#2563eb)",
    color: "#fff",
    border: "1px solid rgba(96,165,250,0.3)",
    padding: "12px 22px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(37,99,235,0.28)",
  },
  activeDateFilterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(59,130,246,0.07)",
    flexWrap: "wrap",
  },
  accountPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.12)",
    border: "1px solid rgba(96,165,250,0.20)",
    color: "#bfdbfe",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  accountHelpBox: {
    marginTop: "6px",
    padding: "11px 12px",
    borderRadius: "12px",
    background: "rgba(37,99,235,0.10)",
    border: "1px solid rgba(96,165,250,0.18)",
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  inlineLinkButton: {
    marginLeft: "8px",
    border: "none",
    background: "transparent",
    color: "#93c5fd",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
    padding: 0,
  },

  activeDateFilterText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: "14px",
    fontWeight: 600,
  },
  clearDateButton: {
    border: "1px solid rgba(96,165,250,0.28)",
    background: "rgba(96,165,250,0.10)",
    color: "#93c5fd",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tableScroll: {
    maxHeight: "400px",
    overflowY: "auto",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "18px 20px",
    color: "rgba(255,255,255,0.75)",
    fontSize: "16px",
    fontWeight: 500,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  td: {
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontSize: "16px",
    color: "rgba(255,255,255,0.92)",
    verticalAlign: "top",
  },
  emptyState: {
    padding: "28px",
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
    fontSize: "16px",
  },
  rowClickable: {
    cursor: "pointer",
  },
  actionWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  viewButton: {
    border: "1px solid rgba(96,165,250,0.25)",
    background: "rgba(96,165,250,0.10)",
    color: "#93c5fd",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  editButton: {
    border: "1px solid rgba(250,204,21,0.22)",
    background: "rgba(250,204,21,0.08)",
    color: "#facc15",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteButton: {
    border: "1px solid rgba(248,113,113,0.25)",
    background: "rgba(248,113,113,0.08)",
    color: "#f87171",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  proCard: {
    marginTop: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
    borderRadius: "14px",
    padding: "22px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
  },
  proLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  proTitle: {
    fontSize: "34px",
    fontWeight: 700,
  },
  proText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "18px",
  },
  proButton: {
    background: "linear-gradient(180deg,#4f97ff,#2d72eb)",
    color: "#fff",
    border: "1px solid rgba(96,165,250,0.3)",
    padding: "14px 28px",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  calendarCard: {
    marginTop: "20px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    flexWrap: "wrap",
  },
  calendarTitle: {
    fontSize: "30px",
    fontWeight: 700,
  },
  calendarSubtext: {
    marginTop: "6px",
    color: "rgba(255,255,255,0.64)",
    fontSize: "15px",
  },
  calendarHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  monthNavButton: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
  },
  calendarMonthLabel: {
    minWidth: "180px",
    textAlign: "center",
    fontSize: "18px",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  todayButton: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    borderRadius: "12px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  calendarStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "14px",
    padding: "18px 20px 0 20px",
  },
  calendarStatCard: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "14px",
    padding: "16px",
  },
  calendarStatLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: "13px",
    marginBottom: "8px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  calendarStatValue: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#fff",
  },
  calendarGridWrap: {
    padding: "20px",
  },
  calendarWeekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "10px",
  },
  calendarWeekDay: {
    textAlign: "center",
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "6px 0",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "10px",
  },
  calendarDay: {
    minHeight: "118px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(10,18,30,0.85), rgba(10,18,30,0.65))",
    padding: "12px",
    cursor: "pointer",
    textAlign: "left",
    color: "#fff",
    transition: "all 0.18s ease",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  calendarDayOutsideMonth: {
    opacity: 0.45,
  },
  calendarDayGreen: {
    border: "1px solid rgba(74,222,128,0.26)",
    background:
      "linear-gradient(180deg, rgba(18,45,34,0.96), rgba(11,29,22,0.88))",
    boxShadow: "0 10px 25px rgba(34,197,94,0.08)",
  },
  calendarDayRed: {
    border: "1px solid rgba(248,113,113,0.24)",
    background:
      "linear-gradient(180deg, rgba(49,22,26,0.96), rgba(30,13,17,0.88))",
    boxShadow: "0 10px 25px rgba(239,68,68,0.08)",
  },
  calendarDayFlat: {
    border: "1px solid rgba(250,204,21,0.22)",
    background:
      "linear-gradient(180deg, rgba(46,38,15,0.96), rgba(30,24,9,0.88))",
    boxShadow: "0 10px 25px rgba(250,204,21,0.06)",
  },
  calendarDaySelected: {
    outline: "2px solid rgba(96,165,250,0.8)",
    outlineOffset: "1px",
    transform: "translateY(-1px)",
  },
  calendarDayTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  calendarDayNumber: {
    fontSize: "15px",
    fontWeight: 800,
  },
  todayDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#38bdf8",
    boxShadow: "0 0 14px rgba(56,189,248,0.65)",
  },
  calendarDayBody: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  calendarDayPnl: {
    fontSize: "19px",
    fontWeight: 800,
  },
  calendarDayTrades: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px",
    fontWeight: 600,
  },
  calendarNoTrades: {
    color: "rgba(255,255,255,0.34)",
    fontSize: "13px",
    fontWeight: 600,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: "760px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #162334 0%, #101b2b 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
    padding: "24px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  viewModal: {
    width: "100%",
    maxWidth: "860px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #162334 0%, #101b2b 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
    padding: "24px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 800,
  },
  closeButton: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "18px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "rgba(255,255,255,0.8)",
    fontSize: "14px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    resize: "vertical",
  },
  fileInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    boxSizing: "border-box",
  },
  uploadHint: {
    marginTop: "10px",
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
  },
  uploadPreviewWrap: {
    marginTop: "12px",
  },
  uploadPreview: {
    width: "100%",
    maxHeight: "260px",
    objectFit: "contain",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.2)",
  },
  removeImageButton: {
    marginTop: "12px",
    border: "1px solid rgba(248,113,113,0.25)",
    background: "rgba(248,113,113,0.08)",
    color: "#f87171",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  rPreviewBox: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(96,165,250,0.22)",
    background: "rgba(96,165,250,0.08)",
    color: "#93c5fd",
    fontSize: "15px",
    fontWeight: 700,
    boxSizing: "border-box",
  },
  viewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
    marginBottom: "18px",
  },
  viewCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "16px",
  },
  viewLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: "13px",
    marginBottom: "8px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  viewValue: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: 700,
  },
  notesBox: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "16px",
  },
  notesText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: "16px",
    lineHeight: 1.6,
  },
  screenshotBox: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "8px",
  },
  viewScreenshot: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.2)",
  },
  placeholderText: {
    color: "#93c5fd",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  lockedFeatureBox: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(96,165,250,0.18)",
    background: "rgba(96,165,250,0.08)",
    color: "#93c5fd",
    fontSize: "14px",
    fontWeight: 700,
    boxSizing: "border-box",
  },
  cancelButton: {
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "12px 18px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  saveButton: {
    background: "linear-gradient(180deg,#3b82f6,#2563eb)",
    color: "#fff",
    border: "1px solid rgba(96,165,250,0.3)",
    padding: "12px 20px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(37,99,235,0.28)",
  },
  editButtonLarge: {
    background: "rgba(250,204,21,0.10)",
    color: "#facc15",
    border: "1px solid rgba(250,204,21,0.25)",
    padding: "12px 18px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteButtonLarge: {
    background: "rgba(248,113,113,0.10)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.25)",
    padding: "12px 18px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  pageMobile: {
    overflowX: "hidden",
  },
  topbarMobile: {
    display: "none",
  },
  topLogoMobile: {
    fontSize: "20px",
  },
  topNavMobile: {
    display: "none",
  },
  topRightMobile: {
    display: "none",
  },
  contentMobile: {
    padding: "22px 16px 112px",
  },
  headingRowMobile: {
    alignItems: "stretch",
    marginBottom: "18px",
  },
  headingMobile: {
    fontSize: "42px",
    lineHeight: 1,
  },
  quickAddButtonMobile: {
    width: "100%",
    padding: "15px 18px",
    fontSize: "16px",
  },
  statsGridMobile: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  statCardMobile: {
    padding: "16px",
    minHeight: "96px",
  },
  cardMobile: {
    borderRadius: "18px",
    marginBottom: "18px",
  },
  sectionHeaderMobile: {
    padding: "16px",
  },
  sectionTitleMobile: {
    fontSize: "26px",
    lineHeight: 1.15,
  },
  sectionSubtextMobile: {
    fontSize: "14px",
    lineHeight: 1.45,
  },
  insightsGridMobile: {
    gridTemplateColumns: "1fr",
    padding: "14px",
  },
  insightBoxMobile: {
    padding: "15px",
  },
  tableHeaderMobile: {
    alignItems: "stretch",
    padding: "16px",
  },
  headerRightMobile: {
    width: "100%",
    alignItems: "stretch",
    flexDirection: "column",
  },
  searchInputMobile: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  filterWrapMobile: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  addButtonMobile: {
    width: "100%",
  },
  calendarHeaderMobile: {
    padding: "16px",
    alignItems: "stretch",
  },
  calendarHeaderActionsMobile: {
    width: "100%",
    justifyContent: "space-between",
  },
  calendarStatsRowMobile: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    padding: "14px 14px 0 14px",
  },
  calendarStatCardMobile: {
    padding: "13px",
  },
  calendarGridWrapMobile: {
    padding: "14px",
    overflowX: "auto",
  },
  calendarGridMobile: {
    minWidth: "620px",
  },
  calendarDayMobile: {
    minHeight: "94px",
    padding: "9px",
  },
  proCardMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: "16px",
    padding: "20px",
  },
  proButtonMobile: {
    width: "100%",
  },

  preTradeSection: {
    border: "1px solid rgba(96,165,250,0.24)",
    background:
      "linear-gradient(180deg, rgba(96,165,250,0.09), rgba(255,255,255,0.03))",
    borderRadius: "18px",
    padding: "18px",
    margin: "2px 0 4px",
  },
  preTradeTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    marginBottom: "5px",
  },
  preTradeSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: "13px",
    lineHeight: 1.45,
    marginBottom: "16px",
  },
  preTradeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  preTradeTextarea: {
    width: "100%",
    minHeight: "92px",
    resize: "vertical",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "#1f2d40",
    color: "#ffffff",
    borderRadius: "13px",
    padding: "13px 14px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    boxSizing: "border-box",
  },
  checklistTitle: {
    marginTop: "16px",
    marginBottom: "10px",
    color: "#bfdbfe",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  rulesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "10px",
  },
  ruleCheck: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.045)",
    borderRadius: "12px",
    padding: "10px 11px",
    color: "rgba(255,255,255,0.82)",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#60a5fa",
    cursor: "pointer",
  },
  viewChecklistWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },
  viewChecklistPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.045)",
    color: "rgba(255,255,255,0.62)",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 900,
  },
  viewChecklistPillActive: {
    border: "1px solid rgba(96,165,250,0.35)",
    background: "rgba(96,165,250,0.14)",
    color: "#bfdbfe",
  },

  actionInsightsCard: {
    marginTop: "20px",
    marginBottom: "20px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.88))",
    border: "1px solid rgba(96,165,250,0.24)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
    overflow: "hidden",
  },
  actionInsightsTop: {
    padding: "24px 26px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background:
      "radial-gradient(circle at top left, rgba(96,165,250,0.16), transparent 34%)",
  },
  actionInsightsEyebrow: {
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.14em",
    marginBottom: "8px",
  },
  actionInsightsTitle: {
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: 950,
    letterSpacing: "-0.04em",
    lineHeight: 1.1,
  },
  actionInsightsSubtext: {
    marginTop: "8px",
    color: "rgba(255,255,255,0.64)",
    fontSize: "15px",
    lineHeight: 1.5,
    fontWeight: 600,
  },
  actionInsightsList: {
    display: "grid",
    gridTemplateColumns: "1fr",
  },
  actionInsightRow: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
    padding: "20px 26px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  actionIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "rgba(96,165,250,0.14)",
    border: "1px solid rgba(96,165,250,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  actionTitle: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 900,
    marginBottom: "6px",
  },
  actionText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: "14px",
    lineHeight: 1.55,
    fontWeight: 600,
  },

  playbookModal: {
    width: "100%",
    maxWidth: "720px",
    maxHeight: "88vh",
    overflowY: "auto",
    background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(5,13,27,0.98))",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 28px 80px rgba(0,0,0,0.46)",
    boxSizing: "border-box",
  },

  playbookEyebrow: {
    color: "#93c5fd",
    fontSize: "11px",
    fontWeight: 950,
    letterSpacing: "0.16em",
    marginBottom: "8px",
  },

  playbookSubtext: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.66)",
    fontSize: "14px",
    lineHeight: 1.55,
    maxWidth: "520px",
  },

  playbookAddRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  playbookInput: {
    flex: 1,
    minWidth: "240px",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(148,163,184,0.06)",
    color: "white",
    fontSize: "14px",
    outline: "none",
  },

  playbookAddButton: {
    padding: "13px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(96,165,250,0.45)",
    background: "linear-gradient(180deg,#3b82f6 0%,#2563eb 100%)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  playbookMessage: {
    color: "#bfdbfe",
    fontSize: "13px",
    fontWeight: 750,
    marginBottom: "12px",
  },

  playbookList: {
    display: "grid",
    gap: "10px",
    marginTop: "12px",
  },

  playbookRuleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "12px 14px",
  },

  playbookRuleLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  playbookCheck: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
    color: "#86efac",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 950,
    flexShrink: 0,
  },

  playbookRuleName: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    lineHeight: 1.4,
  },

  playbookDeleteButton: {
    border: "1px solid rgba(248,113,113,0.24)",
    background: "rgba(248,113,113,0.08)",
    color: "#f87171",
    borderRadius: "10px",
    padding: "8px 11px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },

  playbookEmpty: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "14px",
    lineHeight: 1.55,
    border: "1px dashed rgba(255,255,255,0.12)",
    borderRadius: "14px",
    padding: "14px",
  },

};