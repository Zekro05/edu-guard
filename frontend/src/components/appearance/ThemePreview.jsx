// src/components/appearance/ThemePreview.jsx

import React from "react";
import {
  GraduationCap,
  Bell,
  Users,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

export default function ThemePreview({ mode }) {
  const dark = mode === "dark";

  return (
    <div
      className="overflow-hidden rounded-2xl border p-4 sm:p-6"
      style={{
        background: "var(--app-bg)",
        borderColor: "var(--border-color)",
        color: "var(--text-primary)",
      }}
    >
      {/* Preview header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: "var(--accent)",
              color: "#ffffff",
            }}
          >
            <GraduationCap size={23} />
          </div>

          <div>
            <h3 className="font-bold tracking-tight">
              GuidEd
            </h3>

            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Student Guidance
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Preview notifications"
          className="rounded-xl border p-2.5"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--border-color)",
          }}
        >
          <Bell size={18} />
        </button>
      </div>

      {/* Preview content */}
      <div className="mb-4">
        <p
          className="text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Welcome back,
        </p>

        <h3 className="text-xl font-bold">
          School Administrator
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PreviewStat
          icon={<Users size={20} />}
          label="Total Students"
          value="248"
        />

        <PreviewStat
          icon={<ClipboardList size={20} />}
          label="Pending Reports"
          value="12"
        />
      </div>

      <div
        className="mt-4 rounded-xl border p-4"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">
            Guidance Overview
          </span>

          <TrendingUp
            size={18}
            style={{ color: "var(--accent)" }}
          />
        </div>

        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: "var(--accent-soft)" }}
        >
          <div
            className="h-full w-3/4 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        </div>

        <p
          className="mt-2 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          Sample dashboard visualization
        </p>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold"
        style={{
          background: "var(--button-primary-bg)",
          color: "var(--button-primary-text)",
        }}
      >
        Preview Primary Button
      </button>

      <p
        className="mt-3 text-center text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {dark ? "Dark mode preview" : "Light mode preview"}
      </p>
    </div>
  );
}

function PreviewStat({ icon, label, value }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="mb-3 inline-flex rounded-lg p-2"
        style={{
          background: "var(--accent-soft)",
          color: "var(--accent)",
        }}
      >
        {icon}
      </div>

      <p
        className="text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}