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

export default function Journal() {
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

      const activePlan =
        profileData?.subscription_status === "active"
          ? profileData?.plan || "free"
          : "free";

      if (isMounted) {
        setUserPlan(activePlan);
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
        notes: trade.notes || "",
        screenshot: trade.screenshot || "",
      }));

      if (isMounted) {
        setTrades(mappedTrades);
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
          String(trade.mistakes || "").toLowerCase().includes(term)
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
    setShowAddModal(true);
  };

  const openViewModal = (trade) => {
    setSelectedTrade(trade);
    setShowViewModal(true);
  };

  const openEditModal = (trade) => {
    setForm({
      id: trade.id,
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
      notes: trade.notes || "",
      screenshot: trade.screenshot || "",
    });
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

    if (userPlan === "free" && trades.length >= 50) {
      alert("Free plan limit reached. Upgrade to Essential for unlimited journal entries.");
      return;
    }

    const pnlNumber = Number(form.pnl);
    const entryNum = form.entry === "" ? null : Number(form.entry);
    const stopNum = form.stop === "" ? null : Number(form.stop);
    const targetNum = form.target === "" ? null : Number(form.target);

    const tradeToInsert = {
      user_id: user.id,
      date: form.date,
      symbol: form.symbol,
      side: form.side,
      pnl: pnlNumber,
      entry: entryNum,
      stop: stopNum,
      target: targetNum,
      notes: form.notes,
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

    const newTrade = {
      id: data.id,
      date: data.date,
      symbol: data.symbol,
      setup: form.setup,
      side: data.side,
      session: form.session,
      grade: form.grade,
      mistakes: form.mistakes,
      result: pnlNumber > 0 ? "Win" : pnlNumber < 0 ? "Loss" : "Break-Even",
      pnl: Number(data.pnl || 0),
      entry: data.entry ?? "",
      stop: data.stop ?? "",
      target: data.target ?? "",
      rMultiple: null,
      notes: data.notes,
      screenshot: form.screenshot || "",
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
      alert("Could not update trade.");
      return;
    }

    const updatedTrade = {
      id: data.id,
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
      notes: data.notes,
      screenshot: data.screenshot || "",
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

  const handleDeleteTrade = async (id) => {
    const confirmed = window.confirm("Delete this trade?");
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting trade:", error);
      alert(`Could not delete trade: ${error.message}`);
      return;
    }

    setTrades((prev) => prev.filter((trade) => trade.id !== id));

    if (selectedTrade && selectedTrade.id === id) {
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
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.topLogo}>
          <span style={{ color: "#f8fafc" }}>Trade</span>
          <span style={{ color: "#60a5fa" }}>Archive</span>
        </div>

        <div style={styles.topNav}>
          <span style={styles.topNavItem}>Dashboard</span>
          <span style={{ ...styles.topNavItem, ...styles.activeTopNav }}>Journal</span>
          <span style={styles.topNavItem}>Backtest</span>
          <span style={styles.topNavItem}>Pricing</span>
        </div>

        <div style={styles.topRight}>
          <span style={styles.topRightText}>Settings</span>
          <span style={styles.divider}>|</span>
          <span style={styles.topRightText}>Logout</span>
          <div style={styles.userPill}>User ▾</div>
        </div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.heading}>Journal</h1>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Trades</div>
            <div style={styles.statValue}>{stats.totalTrades}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Win Rate</div>
            <div style={{ ...styles.statValue, color: "#4ade80" }}>{stats.winRate}%</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Wins / Losses</div>
            <div style={styles.statValue}>
              <span style={{ color: "#4ade80" }}>{stats.wins}</span>
              <span style={{ color: "rgba(255,255,255,0.45)" }}> / </span>
              <span style={{ color: "#f87171" }}>{stats.losses}</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Break-Evens</div>
            <div style={{ ...styles.statValue, color: "#facc15" }}>{stats.breakeven}</div>
          </div>

          <div style={styles.statCard}>
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

          <div style={styles.statCard}>
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
        </div>

        <div style={styles.analyticsCard}>
          <div style={styles.analyticsHeader}>
            <div>
              <div style={styles.analyticsTitle}>Setup Analytics</div>
              <div style={styles.analyticsSubtext}>
                See which setups actually make money and which ones need to be cut
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
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

        <div style={styles.card}>
          <div style={styles.tableHeader}>
            <div>
              <div style={styles.tableTitle}>Trade Journal</div>
              <div style={styles.tableSubtext}>
                Track setups, execution, and what is actually working
              </div>
            </div>

            <div style={styles.headerRight}>
              <input
                type="text"
                placeholder="Search symbol, setup, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />

              <div style={styles.filterWrap}>
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

              <button style={styles.addButton} onClick={openAddModal}>
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
                Clear Date Filter
              </button>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
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
                    <td style={styles.emptyState} colSpan="10">
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

        <div style={styles.calendarCard}>
          <div style={styles.calendarHeader}>
            <div>
              <div style={styles.calendarTitle}>Performance Calendar</div>
              <div style={styles.calendarSubtext}>
                See your green and red days across the month
              </div>
            </div>

            <div style={styles.calendarHeaderActions}>
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

          <div style={styles.calendarStatsRow}>
            <div style={styles.calendarStatCard}>
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

            <div style={styles.calendarStatCard}>
              <div style={styles.calendarStatLabel}>Trades</div>
              <div style={styles.calendarStatValue}>{calendarData.monthlyTrades}</div>
            </div>

            <div style={styles.calendarStatCard}>
              <div style={styles.calendarStatLabel}>Win Rate</div>
              <div style={styles.calendarStatValue}>{calendarData.monthlyWinRate}%</div>
            </div>

            <div style={styles.calendarStatCard}>
              <div style={styles.calendarStatLabel}>Green Days</div>
              <div style={{ ...styles.calendarStatValue, color: "#4ade80" }}>
                {calendarData.greenDays}
              </div>
            </div>

            <div style={styles.calendarStatCard}>
              <div style={styles.calendarStatLabel}>Red Days</div>
              <div style={{ ...styles.calendarStatValue, color: "#f87171" }}>
                {calendarData.redDays}
              </div>
            </div>
          </div>

          <div style={styles.calendarGridWrap}>
            <div style={styles.calendarWeekHeader}>
              {dayNames.map((day) => (
                <div key={day} style={styles.calendarWeekDay}>
                  {day}
                </div>
              ))}
            </div>

            <div style={styles.calendarGrid}>
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
                      ...styles.calendarDay,
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

        <div style={styles.proCard}>
          <div style={styles.proLeft}>
            <div style={styles.proTitle}>
              Upgrade to <span style={{ color: "#60a5fa" }}>PRO</span>
            </div>
            <div style={styles.proText}>Unlock advanced features and analytics</div>
          </div>
          <button style={styles.proButton}>Get Pro</button>
        </div>
      </div>

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
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              removeScreenshot={removeScreenshot}
              liveRPreview={liveRPreview}
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
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              removeScreenshot={removeScreenshot}
              liveRPreview={liveRPreview}
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

function TradeForm({
  form,
  userPlan,
  handleChange,
  handleFileChange,
  removeScreenshot,
  liveRPreview,
  onCancel,
  onSave,
  saveLabel = "Save Trade",
}) {
  return (
    <>
      <div style={styles.formGrid}>
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
          {userPlan === "free" ? (
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
              <button type="button" style={styles.removeImageButton} onClick={removeScreenshot}>
                Remove Screenshot
              </button>
            </div>
          ) : (
            <div style={styles.uploadHint}>Upload a chart screenshot for this trade.</div>
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
  },
  topNav: {
    display: "flex",
    gap: "34px",
  },
  topNavItem: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "18px",
    paddingBottom: "6px",
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
  topRightText: {
    color: "rgba(255,255,255,0.82)",
  },
  divider: {
    color: "rgba(255,255,255,0.35)",
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
  heading: {
    fontSize: "56px",
    margin: "0 0 24px 0",
    fontWeight: 800,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
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
};