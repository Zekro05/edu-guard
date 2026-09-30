// src/components/settings/AppearanceSettings.jsx

import React from "react";
import {
  Sun,
  Moon,
  Check,
  RotateCcw,
  Palette,
  Sparkles,
  Monitor,
} from "lucide-react";

import { useTheme } from "../../hooks/useTheme";

/* =========================================================
   PALETTE CONFIGURATION
========================================================= */

const PALETTES = [
  {
    id: "forest",
    name: "Forest",
    description: "GuidEd's signature green",
    light: "#2E7D32",
    dark: "#34D399",
    preview: [
      "#1B5E20",
      "#2E7D32",
      "#66BB6A",
      "#EAF6ED",
    ],
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calm blue and teal",
    light: "#0369A1",
    dark: "#38BDF8",
    preview: [
      "#075985",
      "#0369A1",
      "#38BDF8",
      "#E0F2FE",
    ],
  },
  {
    id: "violet",
    name: "Violet",
    description: "Modern purple interface",
    light: "#7C3AED",
    dark: "#A78BFA",
    preview: [
      "#5B21B6",
      "#7C3AED",
      "#A78BFA",
      "#F3E8FF",
    ],
  },
  {
    id: "amber",
    name: "Amber",
    description: "Warm and energetic",
    light: "#D97706",
    dark: "#FBBF24",
    preview: [
      "#92400E",
      "#D97706",
      "#FBBF24",
      "#FEF3C7",
    ],
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soft red and rose tones",
    light: "#E11D48",
    dark: "#FB7185",
    preview: [
      "#9F1239",
      "#E11D48",
      "#FB7185",
      "#FFE4E6",
    ],
  },
  {
    id: "slate",
    name: "Slate",
    description: "Neutral professional theme",
    light: "#475569",
    dark: "#94A3B8",
    preview: [
      "#334155",
      "#475569",
      "#94A3B8",
      "#E2E8F0",
    ],
  },
];

/* =========================================================
   APPEARANCE SETTINGS
========================================================= */

const AppearanceSettings = () => {
  const theme = useTheme();

  const mode = theme?.mode || "light";
  const palette = theme?.palette || "forest";

  const setMode = theme?.setMode;
  const setPalette = theme?.setPalette;

  const resetAppearance =
    theme?.resetAppearance ||
    theme?.resetTheme ||
    theme?.reset;

  const darkMode = mode === "dark";

  const currentPalette =
    PALETTES.find(
      (item) => item.id === palette
    ) || PALETTES[0];

  /* =======================================================
     HANDLERS
  ======================================================= */

  const handleModeChange = (nextMode) => {
    if (typeof setMode === "function") {
      setMode(nextMode);
    }
  };

  const handlePaletteChange = (nextPalette) => {
    if (typeof setPalette === "function") {
      setPalette(nextPalette);
    }
  };

  const handleReset = () => {
    if (typeof resetAppearance === "function") {
      resetAppearance();
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* ===================================================
          INTRO
      =================================================== */}

      <div>
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              darkMode
                ? "bg-emerald-950/60 text-emerald-300"
                : "bg-green-50 text-green-700"
            }`}
          >
            <Palette size={22} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-xl font-black tracking-tight ${
                  darkMode
                    ? "text-slate-100"
                    : "text-gray-900"
                }`}
              >
                Appearance
              </h4>

              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  darkMode
                    ? "bg-emerald-950/50 text-emerald-300"
                    : "bg-green-50 text-green-700"
                }`}
              >
                <Sparkles size={11} />
                Personalization
              </span>
            </div>

            <p
              className={`mt-1.5 text-sm leading-relaxed max-w-2xl ${
                darkMode
                  ? "text-slate-400"
                  : "text-gray-500"
              }`}
            >
              Customize how GuidEd looks across the
              application. Your appearance preferences
              are saved automatically and applied
              throughout the system.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          CURRENT APPEARANCE SUMMARY
      =================================================== */}

      <section
        className={`rounded-2xl border p-5 ${
          darkMode
            ? "bg-[#101F17] border-emerald-950/60"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p
              className={`text-[10px] uppercase tracking-widest font-bold ${
                darkMode
                  ? "text-slate-600"
                  : "text-gray-400"
              }`}
            >
              Current appearance
            </p>

            <div className="flex items-center gap-3 mt-2">
              <div
                className="w-8 h-8 rounded-xl shadow-sm border border-black/5"
                style={{
                  backgroundColor: darkMode
                    ? currentPalette.dark
                    : currentPalette.light,
                }}
              />

              <div>
                <p
                  className={`text-sm font-bold ${
                    darkMode
                      ? "text-slate-100"
                      : "text-gray-900"
                  }`}
                >
                  {currentPalette.name}
                </p>

                <p
                  className={`text-xs ${
                    darkMode
                      ? "text-slate-500"
                      : "text-gray-400"
                  }`}
                >
                  {darkMode
                    ? "Dark mode"
                    : "Light mode"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              darkMode
                ? "border-emerald-950/60 bg-[#0C1913] text-slate-300 hover:bg-[#14251B] hover:text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <RotateCcw size={14} />
            Reset appearance
          </button>
        </div>
      </section>

      {/* ===================================================
          COLOR MODE
      =================================================== */}

      <section>
        <div className="mb-4">
          <h5
            className={`text-sm font-black ${
              darkMode
                ? "text-slate-100"
                : "text-gray-900"
            }`}
          >
            Color mode
          </h5>

          <p
            className={`mt-1 text-xs ${
              darkMode
                ? "text-slate-500"
                : "text-gray-400"
            }`}
          >
            Choose how GuidEd should display its
            interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LIGHT MODE */}

          <button
            type="button"
            onClick={() =>
              handleModeChange("light")
            }
            className={`group relative text-left rounded-2xl border p-5 transition-all duration-200 ${
              !darkMode
                ? "bg-green-50 border-green-200 shadow-sm"
                : "bg-[#0C1913] border-emerald-950/60 hover:bg-[#101F17]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    !darkMode
                      ? "bg-white text-green-600"
                      : "bg-[#101F17] text-slate-400"
                  }`}
                >
                  <Sun size={19} />
                </div>

                <div>
                  <p
                    className={`text-sm font-bold ${
                      !darkMode
                        ? "text-green-800"
                        : "text-slate-200"
                    }`}
                  >
                    Light mode
                  </p>

                  <p
                    className={`text-xs mt-0.5 ${
                      !darkMode
                        ? "text-green-600"
                        : "text-slate-500"
                    }`}
                  >
                    Bright and clean
                  </p>
                </div>
              </div>

              {!darkMode && (
                <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <Check size={15} />
                </span>
              )}
            </div>

            {/* PREVIEW */}

            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                <span className="w-16 h-2 rounded-full bg-gray-200" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="h-12 rounded-lg bg-gray-100" />
                <span className="h-12 rounded-lg bg-green-50" />
                <span className="h-12 rounded-lg bg-gray-100" />
              </div>
            </div>
          </button>

          {/* DARK MODE */}

          <button
            type="button"
            onClick={() =>
              handleModeChange("dark")
            }
            className={`group relative text-left rounded-2xl border p-5 transition-all duration-200 ${
              darkMode
                ? "bg-emerald-950/30 border-emerald-800/70 shadow-sm"
                : "bg-white border-gray-100 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode
                      ? "bg-emerald-950/60 text-emerald-300"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Moon size={19} />
                </div>

                <div>
                  <p
                    className={`text-sm font-bold ${
                      darkMode
                        ? "text-emerald-200"
                        : "text-gray-800"
                    }`}
                  >
                    Dark mode
                  </p>

                  <p
                    className={`text-xs mt-0.5 ${
                      darkMode
                        ? "text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    Comfortable in low light
                  </p>
                </div>
              </div>

              {darkMode && (
                <span className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                  <Check size={15} />
                </span>
              )}
            </div>

            {/* PREVIEW */}

            <div className="mt-5 rounded-xl border border-emerald-950/70 bg-[#07110D] p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="w-16 h-2 rounded-full bg-slate-700" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="h-12 rounded-lg bg-[#0C1913]" />
                <span className="h-12 rounded-lg bg-emerald-950/60" />
                <span className="h-12 rounded-lg bg-[#101F17]" />
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ===================================================
          COLOR PALETTES
      =================================================== */}

      <section>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h5
              className={`text-sm font-black ${
                darkMode
                  ? "text-slate-100"
                  : "text-gray-900"
              }`}
            >
              Color palette
            </h5>

            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                darkMode
                  ? "bg-[#101F17] text-slate-500"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {PALETTES.length} themes
            </span>
          </div>

          <p
            className={`mt-1 text-xs ${
              darkMode
                ? "text-slate-500"
                : "text-gray-400"
            }`}
          >
            Choose an accent palette for the GuidEd
            interface.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {PALETTES.map((item) => {
            const selected =
              palette === item.id;

            const accentColor = darkMode
              ? item.dark
              : item.light;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  handlePaletteChange(
                    item.id
                  )
                }
                className={`group relative text-left rounded-2xl border p-4 transition-all duration-200 ${
                  selected
                    ? darkMode
                      ? "bg-[#101F17] border-emerald-700/70 shadow-sm"
                      : "bg-gray-50 border-green-200 shadow-sm"
                    : darkMode
                      ? "bg-[#0C1913] border-emerald-950/60 hover:bg-[#101F17] hover:border-emerald-900"
                      : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* PALETTE ICON */}

                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor:
                          accentColor,
                      }}
                    >
                      <Palette
                        size={19}
                        className="text-white"
                      />
                    </div>

                    <div>
                      <p
                        className={`text-sm font-bold ${
                          darkMode
                            ? "text-slate-100"
                            : "text-gray-900"
                        }`}
                      >
                        {item.name}
                      </p>

                      <p
                        className={`text-xs mt-0.5 ${
                          darkMode
                            ? "text-slate-500"
                            : "text-gray-400"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {selected && (
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          accentColor,
                        color: "#ffffff",
                      }}
                    >
                      <Check size={14} />
                    </span>
                  )}
                </div>

                {/* COLOR STRIP */}

                <div className="flex gap-1.5 mt-4">
                  {item.preview.map(
                    (color, index) => (
                      <span
                        key={`${item.id}-${index}`}
                        className="h-2.5 flex-1 rounded-full"
                        style={{
                          backgroundColor:
                            color,
                        }}
                      />
                    )
                  )}
                </div>

                {/* ACTIVE INDICATOR */}

                {selected && (
                  <div
                    className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                    style={{
                      backgroundColor:
                        accentColor,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          LIVE PREVIEW
      =================================================== */}

      <section
        className={`rounded-2xl border overflow-hidden ${
          darkMode
            ? "bg-[#0C1913] border-emerald-950/60"
            : "bg-white border-gray-100"
        }`}
      >
        <div
          className={`px-5 py-4 border-b ${
            darkMode
              ? "border-emerald-950/60"
              : "border-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Monitor
              size={16}
              className={
                darkMode
                  ? "text-emerald-400"
                  : "text-green-600"
              }
            />

            <h5
              className={`text-sm font-black ${
                darkMode
                  ? "text-slate-100"
                  : "text-gray-900"
              }`}
            >
              Live preview
            </h5>
          </div>

          <p
            className={`text-xs mt-1 ${
              darkMode
                ? "text-slate-500"
                : "text-gray-400"
            }`}
          >
            Preview how the selected appearance
            looks inside GuidEd.
          </p>
        </div>

        <div
          className={`p-5 ${
            darkMode
              ? "bg-[#07110D]"
              : "bg-[#F4F7FB]"
          }`}
        >
          <div
            className={`rounded-2xl border overflow-hidden ${
              darkMode
                ? "bg-[#0C1913] border-emerald-950/60"
                : "bg-white border-gray-200"
            }`}
          >
            {/* PREVIEW HEADER */}

            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                darkMode
                  ? "border-emerald-950/60"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor:
                      darkMode
                        ? currentPalette.dark
                        : currentPalette.light,
                  }}
                >
                  <Sparkles
                    size={14}
                    className="text-white"
                  />
                </div>

                <div>
                  <p
                    className={`text-xs font-bold ${
                      darkMode
                        ? "text-slate-100"
                        : "text-gray-900"
                    }`}
                  >
                    GuidEd Dashboard
                  </p>

                  <p
                    className={`text-[10px] ${
                      darkMode
                        ? "text-slate-500"
                        : "text-gray-400"
                    }`}
                  >
                    Student Guidance
                  </p>
                </div>
              </div>

              <span
                className="w-7 h-7 rounded-lg"
                style={{
                  backgroundColor:
                    darkMode
                      ? currentPalette.dark
                      : currentPalette.light,
                  opacity: 0.9,
                }}
              />
            </div>

            {/* PREVIEW CONTENT */}

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-[#101F17] border-emerald-950/50"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${
                    darkMode
                      ? "text-slate-600"
                      : "text-gray-400"
                  }`}
                >
                  Students
                </p>

                <p
                  className={`mt-2 text-xl font-black ${
                    darkMode
                      ? "text-slate-100"
                      : "text-gray-900"
                  }`}
                >
                  1,248
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-[#101F17] border-emerald-950/50"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${
                    darkMode
                      ? "text-slate-600"
                      : "text-gray-400"
                  }`}
                >
                  Reports
                </p>

                <p
                  className={`mt-2 text-xl font-black ${
                    darkMode
                      ? "text-slate-100"
                      : "text-gray-900"
                  }`}
                >
                  86
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-[#101F17] border-emerald-950/50"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${
                    darkMode
                      ? "text-slate-600"
                      : "text-gray-400"
                  }`}
                >
                  Status
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        darkMode
                          ? currentPalette.dark
                          : currentPalette.light,
                    }}
                  />

                  <span
                    className={`text-sm font-bold ${
                      darkMode
                        ? "text-slate-200"
                        : "text-gray-800"
                    }`}
                  >
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          INFORMATION
      =================================================== */}

      <div
        className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
          darkMode
            ? "bg-emerald-950/20 text-slate-500 border border-emerald-950/50"
            : "bg-green-50 text-green-700 border border-green-100"
        }`}
      >
        <strong
          className={
            darkMode
              ? "text-emerald-300"
              : "text-green-800"
          }
        >
          Appearance settings are global.
        </strong>{" "}
        Your selected mode and color palette are
        automatically saved and applied across
        supported GuidEd pages.
      </div>
    </div>
  );
};

export default AppearanceSettings;