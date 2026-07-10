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
      theme: "Dark",
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

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadStoredSettings);
  const resolvedTheme = "dark";

  useEffect(() => {
    const nextSettings = mergeSettings(settings);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    } catch (error) {
      console.error("Unable to save TradeArchive settings:", error);
    }

    document.documentElement.dataset.theme = "dark";
    document.body.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";

    if (settings?.preferences?.theme !== "Dark") {
      setSettings(nextSettings);
    }
  }, [settings]);

  const updateSection = (section, field, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [section]: {
        ...currentSettings[section],
        [field]: section === "preferences" && field === "theme" ? "Dark" : value,
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
    [settings]
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
