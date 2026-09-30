import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "guided-appearance";
const LEGACY_THEME_KEY = "guided-theme";
const LEGACY_DARK_KEY = "guided-dark-mode";

export const DEFAULT_APPEARANCE = {
  mode: "light",
  palette: "forest",
};

export const VALID_MODES = ["light", "dark"];

export const VALID_PALETTES = [
  "forest",
  "ocean",
  "violet",
  "amber",
  "rose",
  "slate",
];

export const THEME_PALETTES = {
  forest: {
    id: "forest",
    name: "Forest",
    description: "GuidEd's signature green",
    light: {
      primary: "#2E7D32",
      primaryStrong: "#1B5E20",
      primarySoft: "#EAF6ED",
      surface: "#F4F8F5",
      text: "#172019",
      muted: "#647067",
      border: "#DCE8DF",
      accent: "#43A047",
    },
    dark: {
      primary: "#34D399",
      primaryStrong: "#0B3D18",
      primarySoft: "#0C2E20",
      surface: "#07110D",
      text: "#ECFDF5",
      muted: "#94A3A0",
      border: "#1E3A2B",
      accent: "#10B981",
    },
  },

  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Calm blue and teal",
    light: {
      primary: "#0369A1",
      primaryStrong: "#075985",
      primarySoft: "#E0F2FE",
      surface: "#F0F9FF",
      text: "#0C2433",
      muted: "#647B88",
      border: "#D5E7F0",
      accent: "#0284C7",
    },
    dark: {
      primary: "#38BDF8",
      primaryStrong: "#082F49",
      primarySoft: "#0C2A3D",
      surface: "#07131C",
      text: "#E0F2FE",
      muted: "#94A9B5",
      border: "#19445C",
      accent: "#0EA5E9",
    },
  },

  violet: {
    id: "violet",
    name: "Violet",
    description: "Modern purple interface",
    light: {
      primary: "#7C3AED",
      primaryStrong: "#5B21B6",
      primarySoft: "#F3E8FF",
      surface: "#F7F5FF",
      text: "#211532",
      muted: "#766A82",
      border: "#E6DDF2",
      accent: "#8B5CF6",
    },
    dark: {
      primary: "#A78BFA",
      primaryStrong: "#4C1D95",
      primarySoft: "#251543",
      surface: "#110D1C",
      text: "#F5F3FF",
      muted: "#A69DB5",
      border: "#3B2A52",
      accent: "#8B5CF6",
    },
  },

  amber: {
    id: "amber",
    name: "Amber",
    description: "Warm and energetic",
    light: {
      primary: "#D97706",
      primaryStrong: "#92400E",
      primarySoft: "#FEF3C7",
      surface: "#FFFBEB",
      text: "#2D2110",
      muted: "#7D705D",
      border: "#F0E2BF",
      accent: "#F59E0B",
    },
    dark: {
      primary: "#FBBF24",
      primaryStrong: "#78350F",
      primarySoft: "#3A2408",
      surface: "#1A1207",
      text: "#FFFBEB",
      muted: "#B8A88C",
      border: "#4B3210",
      accent: "#F59E0B",
    },
  },

  rose: {
    id: "rose",
    name: "Rose",
    description: "Soft red and rose tones",
    light: {
      primary: "#E11D48",
      primaryStrong: "#9F1239",
      primarySoft: "#FFE4E6",
      surface: "#FFF1F2",
      text: "#32131B",
      muted: "#80656D",
      border: "#F1D9DD",
      accent: "#F43F5E",
    },
    dark: {
      primary: "#FB7185",
      primaryStrong: "#881337",
      primarySoft: "#3B101C",
      surface: "#1C0B10",
      text: "#FFF1F2",
      muted: "#B99AA2",
      border: "#51202C",
      accent: "#F43F5E",
    },
  },

  slate: {
    id: "slate",
    name: "Slate",
    description: "Neutral professional theme",
    light: {
      primary: "#475569",
      primaryStrong: "#334155",
      primarySoft: "#E2E8F0",
      surface: "#F8FAFC",
      text: "#17202B",
      muted: "#64748B",
      border: "#DCE2E8",
      accent: "#64748B",
    },
    dark: {
      primary: "#94A3B8",
      primaryStrong: "#1E293B",
      primarySoft: "#172033",
      surface: "#0F172A",
      text: "#F1F5F9",
      muted: "#94A3B8",
      border: "#334155",
      accent: "#64748B",
    },
  },
};

function getInitialAppearance() {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        mode: VALID_MODES.includes(parsed?.mode)
          ? parsed.mode
          : DEFAULT_APPEARANCE.mode,

        palette: VALID_PALETTES.includes(parsed?.palette)
          ? parsed.palette
          : DEFAULT_APPEARANCE.palette,
      };
    }

    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);

    if (legacyTheme === "dark" || legacyTheme === "light") {
      return {
        mode: legacyTheme,
        palette: "forest",
      };
    }

    const legacyDark = localStorage.getItem(LEGACY_DARK_KEY);

    if (legacyDark === "true") {
      return {
        mode: "dark",
        palette: "forest",
      };
    }

    return DEFAULT_APPEARANCE;
  } catch (error) {
    console.error(
      "Unable to read GuidEd appearance settings:",
      error
    );

    return DEFAULT_APPEARANCE;
  }
}

export function ThemeProvider({ children }) {
  const [appearance, setAppearance] = useState(
    getInitialAppearance
  );

  const applyAppearance = useCallback((next) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    const mode =
      VALID_MODES.includes(next?.mode)
        ? next.mode
        : DEFAULT_APPEARANCE.mode;

    const paletteId =
      VALID_PALETTES.includes(next?.palette)
        ? next.palette
        : DEFAULT_APPEARANCE.palette;

    const paletteDefinition =
      THEME_PALETTES[paletteId] ||
      THEME_PALETTES.forest;

    const colors =
      paletteDefinition[mode] ||
      paletteDefinition.light;

    /*
     * ---------------------------------------------------------
     * DATA ATTRIBUTES
     * ---------------------------------------------------------
     */

    root.dataset.theme = mode;
    root.dataset.palette = paletteId;

    root.classList.toggle("dark", mode === "dark");

    root.style.colorScheme = mode;

    /*
     * ---------------------------------------------------------
     * GLOBAL GUIDED CSS VARIABLES
     * ---------------------------------------------------------
     */

    root.style.setProperty(
      "--guided-primary",
      colors.primary
    );

    root.style.setProperty(
      "--guided-primary-strong",
      colors.primaryStrong
    );

    root.style.setProperty(
      "--guided-primary-soft",
      colors.primarySoft
    );

    root.style.setProperty(
      "--guided-surface",
      colors.surface
    );

    root.style.setProperty(
      "--guided-text",
      colors.text
    );

    root.style.setProperty(
      "--guided-muted",
      colors.muted
    );

    root.style.setProperty(
      "--guided-border",
      colors.border
    );

    root.style.setProperty(
      "--guided-accent",
      colors.accent
    );

    /*
     * ---------------------------------------------------------
     * TAILWIND / GENERIC VARIABLE ALIASES
     * ---------------------------------------------------------
     *
     * These make it easier for existing GuidEd components
     * to use the active palette.
     */

    root.style.setProperty(
      "--color-primary",
      colors.primary
    );

    root.style.setProperty(
      "--color-primary-strong",
      colors.primaryStrong
    );

    root.style.setProperty(
      "--color-primary-soft",
      colors.primarySoft
    );

    root.style.setProperty(
      "--color-surface",
      colors.surface
    );

    root.style.setProperty(
      "--color-text",
      colors.text
    );

    root.style.setProperty(
      "--color-muted",
      colors.muted
    );

    root.style.setProperty(
      "--color-border",
      colors.border
    );

    root.style.setProperty(
      "--color-accent",
      colors.accent
    );

    /*
     * Used by components that need to know the active theme.
     */

    root.style.setProperty(
      "--guided-theme-mode",
      mode
    );

    root.style.setProperty(
      "--guided-theme-palette",
      paletteId
    );
  }, []);

  /*
   * Apply theme immediately whenever either mode OR palette
   * changes.
   */
  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance, applyAppearance]);

  /*
   * Persist theme settings.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appearance)
      );

      localStorage.setItem(
        LEGACY_THEME_KEY,
        appearance.mode
      );

      localStorage.setItem(
        LEGACY_DARK_KEY,
        String(appearance.mode === "dark")
      );
    } catch (error) {
      console.error(
        "Unable to save GuidEd appearance settings:",
        error
      );
    }
  }, [appearance]);

  const setMode = useCallback((mode) => {
    if (!VALID_MODES.includes(mode)) {
      console.warn(
        `GuidEd: Invalid theme mode "${mode}".`
      );
      return;
    }

    setAppearance((previous) => ({
      ...previous,
      mode,
    }));
  }, []);

  const toggleMode = useCallback(() => {
    setAppearance((previous) => ({
      ...previous,
      mode:
        previous.mode === "dark"
          ? "light"
          : "dark",
    }));
  }, []);

  const setPalette = useCallback((palette) => {
    if (!VALID_PALETTES.includes(palette)) {
      console.warn(
        `GuidEd: Invalid palette "${palette}".`
      );
      return;
    }

    setAppearance((previous) => ({
      ...previous,
      palette,
    }));
  }, []);

  const resetAppearance = useCallback(() => {
    setAppearance({
      ...DEFAULT_APPEARANCE,
    });
  }, []);

  const currentPalette =
    THEME_PALETTES[appearance.palette] ||
    THEME_PALETTES.forest;

  const value = useMemo(
    () => ({
      mode: appearance.mode,

      palette: appearance.palette,

      appearance,

      currentPalette,

      paletteDefinition: currentPalette,

      validModes: VALID_MODES,

      validPalettes: VALID_PALETTES,

      palettes: THEME_PALETTES,

      setMode,

      toggleMode,

      setPalette,

      resetAppearance,

      resetTheme: resetAppearance,

      reset: resetAppearance,

      setThemeMode: setMode,
    }),
    [
      appearance,
      currentPalette,
      setMode,
      toggleMode,
      setPalette,
      resetAppearance,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useThemeContext must be used inside ThemeProvider"
    );
  }

  return context;
}