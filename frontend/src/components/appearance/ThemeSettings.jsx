// src/components/appearance/ThemeSettings.jsx

import React from "react";
import {
  Sun,
  Moon,
  Palette,
  Check,
  RotateCcw,
  Leaf,
  Monitor,
  ShieldCheck,
} from "lucide-react";

import { useTheme } from "../../hooks/useTheme";
import ThemePreview from "./ThemePreview";

const FOREST_COLORS = [
  {
    name: "Background",
    light: "#F3F7F2",
    dark: "#101A14",
  },
  {
    name: "Surface",
    light: "#FFFFFF",
    dark: "#1B2920",
  },
  {
    name: "Accent",
    light: "#1B5E20",
    dark: "#66BB6A",
  },
];

export default function ThemeSettings() {
  const {
    mode,
    palette,
    setMode,
    setPalette,
    resetAppearance,
  } = useTheme();

  const isDark = mode === "dark";

  return (
    <main
      className="min-h-screen w-full p-4 sm:p-6 lg:p-8"
      style={{
        background: "var(--app-bg)",
        color: "var(--text-primary)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Page heading */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <Palette size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Appearance & Personalization
              </h1>

              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Customize how GuidEd looks on your device.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
          {/* Settings panel */}
          <section className="space-y-6 xl:col-span-3">
            {/* Appearance mode */}
            <SettingsCard
              icon={<Monitor size={20} />}
              title="Display mode"
              description="Choose how GuidEd appears across the application."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ModeOption
                  selected={mode === "light"}
                  icon={<Sun size={22} />}
                  title="Light mode"
                  description="Bright backgrounds and dark text"
                  onClick={() => setMode("light")}
                />

                <ModeOption
                  selected={mode === "dark"}
                  icon={<Moon size={22} />}
                  title="Dark mode"
                  description="Dark backgrounds and light text"
                  onClick={() => setMode("dark")}
                />
              </div>
            </SettingsCard>

            {/* Palette selection */}
            <SettingsCard
              icon={<Leaf size={20} />}
              title="Color palette"
              description="GuidEd's forest-green identity, optimized for each display mode."
            >
              <button
                type="button"
                onClick={() => setPalette("forest")}
                aria-pressed={palette === "forest"}
                className="w-full rounded-2xl border-2 p-4 text-left transition"
                style={{
                  borderColor:
                    palette === "forest"
                      ? "var(--accent)"
                      : "var(--border-color)",
                  background: "var(--card-muted)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        background: "var(--accent)",
                        color: "#ffffff",
                      }}
                    >
                      <Leaf size={24} />
                    </div>

                    <div>
                      <p className="font-semibold">
                        GuidEd Forest
                      </p>

                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Official forest-green theme
                      </p>
                    </div>
                  </div>

                  {palette === "forest" && (
                    <span
                      className="flex items-center gap-1 text-sm font-medium"
                      style={{ color: "var(--accent)" }}
                    >
                      <Check size={17} />
                      Selected
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {FOREST_COLORS.map((color) => (
                    <div key={color.name}>
                      <div
                        className="h-10 rounded-lg border"
                        style={{
                          background: isDark
                            ? color.dark
                            : color.light,
                          borderColor: "var(--border-color)",
                        }}
                      />

                      <p
                        className="mt-2 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {color.name}
                      </p>

                      <p
                        className="text-xs font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {isDark ? color.dark : color.light}
                      </p>
                    </div>
                  ))}
                </div>
              </button>

              <p
                className="mt-3 text-xs leading-5"
                style={{ color: "var(--text-secondary)" }}
              >
                The palette automatically changes its
                background, surface, text, and accent colors
                when you switch display modes.
              </p>
            </SettingsCard>

            {/* Accessibility / info */}
            <div
              className="flex items-start gap-3 rounded-2xl border p-4"
              style={{
                background: "var(--card-muted)",
                borderColor: "var(--border-color)",
              }}
            >
              <ShieldCheck
                size={21}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--accent)" }}
              />

              <div>
                <p className="text-sm font-semibold">
                  Consistent across GuidEd
                </p>

                <p
                  className="mt-1 text-sm leading-6"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Your selected appearance applies to pages
                  that use GuidEd's shared theme variables.
                  Incident risk and report status indicators
                  retain their semantic colors.
                </p>
              </div>
            </div>

            {/* Reset */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetAppearance}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--card-bg)",
                  color: "var(--text-primary)",
                }}
              >
                <RotateCcw size={16} />
                Reset to default
              </button>
            </div>
          </section>

          {/* Preview panel */}
          <aside className="xl:col-span-2">
            <div
              className="rounded-2xl border p-4 sm:p-5"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">
                    Live preview
                  </h2>

                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Changes appear instantly
                  </p>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent-text)",
                  }}
                >
                  {isDark ? "Dark" : "Light"}
                </span>
              </div>

              <ThemePreview mode={mode} />

              <p
                className="mt-4 text-xs leading-5"
                style={{ color: "var(--text-secondary)" }}
              >
                Preview colors are illustrative. Your
                existing pages will reflect the theme as
                their components are connected to the
                shared CSS variables.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section
      className="rounded-2xl border p-5 sm:p-6"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="mb-5 flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          {icon}
        </div>

        <div>
          <h2 className="font-bold">{title}</h2>

          <p
            className="mt-1 text-sm leading-5"
            style={{ color: "var(--text-secondary)" }}
          >
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function ModeOption({
  selected,
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="rounded-xl border p-4 text-left transition"
      style={{
        borderColor: selected
          ? "var(--accent)"
          : "var(--border-color)",
        background: selected
          ? "var(--accent-soft)"
          : "var(--card-bg)",
        color: "var(--text-primary)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          style={{
            color: selected
              ? "var(--accent)"
              : "var(--text-secondary)",
          }}
        >
          {icon}
        </span>

        {selected && (
          <Check
            size={18}
            style={{ color: "var(--accent)" }}
          />
        )}
      </div>

      <p className="mt-3 font-semibold">{title}</p>

      <p
        className="mt-1 text-xs leading-5"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
    </button>
  );
}