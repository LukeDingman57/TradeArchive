import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "tradearchive_settings_v1";

const defaultSettings = {
  preferences: {
    theme: "Dark",
    timezone: "Local time",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12 hour",
  },

  journal: {
    defaultRisk: "200",
    defaultInstrument: "MNQ",
    defaultAccount: "",
    defaultRR: "1.4",
    autoSaveDrafts: true,
    rememberLastValues: true,
  },

  news: {
    currencies: ["USD"],
    impacts: ["High", "Medium"],
    range: "Today",
    showCountdowns: true,
    autoRefresh: true,
  },
};

const SettingsContext = createContext(null);

function mergeSettings(savedSettings = {}) {
  return {
    ...defaultSettings,
    ...savedSettings,

    preferences: {
      ...defaultSettings.preferences,
      ...(savedSettings.preferences || {}),
    },

    journal: {
      ...defaultSettings.journal,
      ...(savedSettings.journal || {}),
    },

    news: {
      ...defaultSettings.news,
      ...(savedSettings.news || {}),
    },
  };
}

function loadStoredSettings() {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return defaultSettings;
    }

    return mergeSettings(JSON.parse(storedValue));
  } catch (error) {
    console.error("Unable to load TradeArchive settings:", error);
    return defaultSettings;
  }
}

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function resolveTheme(themeSetting) {
  if (themeSetting === "Light") {
    return "light";
  }

  if (themeSetting === "System") {
    return getSystemTheme();
  }

  return "dark";
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadStoredSettings);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    resolveTheme(loadStoredSettings().preferences.theme)
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Unable to save TradeArchive settings:", error);
    }
  }, [settings]);

  useEffect(() => {
    const themeSetting = settings.preferences.theme;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    const applyTheme = () => {
      const nextTheme = resolveTheme(themeSetting);

      setResolvedTheme(nextTheme);

      document.documentElement.dataset.theme = nextTheme;
      document.body.dataset.theme = nextTheme;

      document.documentElement.style.colorScheme = nextTheme;
    };

    applyTheme();

    if (themeSetting !== "System") {
      return undefined;
    }

    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [settings.preferences.theme]);

  const updateSection = (section, field, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [section]: {
        ...currentSettings[section],
        [field]: value,
      },
    }));
  };

  const updatePreferences = (field, value) => {
    updateSection("preferences", field, value);
  };

  const updateJournalSettings = (field, value) => {
    updateSection("journal", field, value);
  };

  const updateNewsSettings = (field, value) => {
    updateSection("news", field, value);
  };

  const toggleArrayValue = (section, field, value) => {
    setSettings((currentSettings) => {
      const currentValues = currentSettings?.[section]?.[field] || [];

      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...currentSettings,
        [section]: {
          ...currentSettings[section],
          [field]: nextValues,
        },
      };
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const contextValue = useMemo(
    () => ({
      settings,
      resolvedTheme,
      updateSection,
      updatePreferences,
      updateJournalSettings,
      updateNewsSettings,
      toggleArrayValue,
      resetSettings,
    }),
    [settings, resolvedTheme]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider.");
  }

  return context;
}

export { defaultSettings, STORAGE_KEY };