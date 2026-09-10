import { useMemo, useState } from "react";
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Clock3,
  Timer,
  CalendarDays,
  HandHelping,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const InterventionPrintableReport = ({
  cases = [],
  interventions = [],
  onClose,
}) => {
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStudentFromCase = (incidentId) => {
    const found = cases.find(
      (c) => String(c.incidentId) === String(incidentId),
    );

    return found || {};
  };

  const getInterventionStatus = (intervention) => {
    if (intervention.status === "completed") {
      return "Completed";
    }

    return "Ongoing";
  };

  const getPeriodStart = () => {
    const now = new Date();

    if (period === "daily") {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
    }

    if (period === "weekly") {
      const start = new Date(now);
      const day = start.getDay();

      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);

      return start;
    }

    if (period === "monthly") {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );
    }

    if (period === "yearly") {
      return new Date(
        now.getFullYear(),
        0,
        1,
      );
    }

    return null;
  };

  /* =========================================================
     NORMALIZED INTERVENTIONS
  ========================================================= */

  const normalizedInterventions = useMemo(() => {
    return interventions.map((intervention) => {
      const incidentId =
        intervention.incidentId?._id ||
        intervention.incidentId;

      const caseData = getStudentFromCase(incidentId);

      return {
        ...intervention,

        incidentId,

        studentName:
          intervention.studentName ||
          caseData.studentName ||
          "Unknown Student",

        studentCode:
          intervention.studentCode ||
          caseData.studentCode ||
          "N/A",

        grade:
          intervention.grade ||
          caseData.grade ||
          "N/A",

        offense:
          intervention.offense ||
          caseData.offense ||
          "No offense recorded",

        statusLabel:
          getInterventionStatus(intervention),

        type:
          intervention.type ||
          "Intervention",

        description:
          intervention.description ||
          "No intervention plan provided.",

        interventionBy:
          intervention.interventionBy ||
          "N/A",

        approvedBy:
          intervention.approvedBy ||
          "N/A",

        completedBy:
          intervention.completedBy ||
          "N/A",

        createdAt:
          intervention.createdAt ||
          intervention.date ||
          null,

        completedAt:
          intervention.completedAt ||
          intervention.resolvedAt ||
          null,
      };
    });
  }, [interventions, cases]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredInterventions = useMemo(() => {
    let result = [...normalizedInterventions];

    if (status !== "all") {
      result = result.filter((item) => {
        if (status === "ongoing") {
          return item.status !== "completed";
        }

        if (status === "completed") {
          return item.status === "completed";
        }

        return true;
      });
    }

    const start = getPeriodStart();

    if (start) {
      result = result.filter((item) => {
        if (!item.createdAt) return false;

        const created = new Date(item.createdAt);

        if (Number.isNaN(created.getTime())) {
          return false;
        }

        return created >= start;
      });
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0),
    );
  }, [normalizedInterventions, period, status]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const total = filteredInterventions.length;

    const completed = filteredInterventions.filter(
      (item) => item.status === "completed",
    ).length;

    const ongoing = filteredInterventions.filter(
      (item) => item.status !== "completed",
    ).length;

    const warnings = filteredInterventions.filter(
      (item) =>
        String(item.type).toLowerCase() === "warning",
    ).length;

    const parentCalls = filteredInterventions.filter(
      (item) =>
        String(item.type).toLowerCase() ===
        "call a parent",
    ).length;

    const communityService = filteredInterventions.filter(
      (item) =>
        String(item.type).toLowerCase() ===
        "community service",
    ).length;

    const suspensions = filteredInterventions.filter(
      (item) =>
        String(item.type).toLowerCase() ===
        "suspension",
    ).length;

    return {
      total,
      completed,
      ongoing,
      warnings,
      parentCalls,
      communityService,
      suspensions,
    };
  }, [filteredInterventions]);

  /* =========================================================
     PERIOD LABEL
  ========================================================= */

  const periodLabel = {
    all: "All Time",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  }[period];

  /* =========================================================
     PDF
  ========================================================= */

  const downloadPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 12;

      /* =====================================================
         HEADER
      ===================================================== */

      doc.setFillColor(22, 101, 52);

      doc.roundedRect(
        margin,
        10,
        pageWidth - margin * 2,
        29,
        4,
        4,
        "F",
      );

      /* LOGO */

      try {
        const response = await fetch("/school-logo.png");

        if (response.ok) {
          const blob = await response.blob();

          const reader = new FileReader();

          const logoData = await new Promise(
            (resolve, reject) => {
              reader.onloadend = () =>
                resolve(reader.result);

              reader.onerror = reject;

              reader.readAsDataURL(blob);
            },
          );

          doc.addImage(
            logoData,
            "PNG",
            margin + 4,
            14,
            20,
            20,
          );
        }
      } catch (error) {
        console.warn(
          "Could not load school logo:",
          error,
        );
      }

      doc.setTextColor(255, 255, 255);

      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");

      doc.text(
        "GuidEd",
        margin + 29,
        20,
      );

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.text(
        "STUDENT GUIDANCE",
        margin + 29,
        25,
      );

      doc.setFontSize(9);

      doc.text(
        "Our Lady of the Holy Rosary School - General Trias Campus",
        margin + 29,
        31,
      );

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");

      doc.text(
        "Intervention Report",
        pageWidth - margin - 65,
        20,
      );

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.text(
        `${periodLabel} • ${new Date().toLocaleDateString(
          "en-US",
        )}`,
        pageWidth - margin - 65,
        26,
      );

      /* =====================================================
         SUMMARY
      ===================================================== */

      let currentY = 47;

      doc.setTextColor(31, 41, 55);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");

      doc.text(
        "Intervention Overview",
        margin,
        currentY,
      );

      currentY += 7;

      const cardGap = 4;
      const cardWidth =
        (pageWidth - margin * 2 - cardGap * 3) /
        4;

      const cards = [
        {
          label: "TOTAL",
          value: summary.total,
        },
        {
          label: "ONGOING",
          value: summary.ongoing,
        },
        {
          label: "COMPLETED",
          value: summary.completed,
        },
        {
          label: "ACTIONS",
          value:
            summary.warnings +
            summary.parentCalls +
            summary.communityService +
            summary.suspensions,
        },
      ];

      cards.forEach((card, index) => {
        const x =
          margin +
          index * (cardWidth + cardGap);

        doc.setFillColor(
          248,
          250,
          252,
        );

        doc.setDrawColor(
          229,
          231,
          235,
        );

        doc.roundedRect(
          x,
          currentY,
          cardWidth,
          22,
          3,
          3,
          "FD",
        );

        doc.setTextColor(
          107,
          114,
          128,
        );

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");

        doc.text(
          card.label,
          x + 5,
          currentY + 7,
        );

        doc.setTextColor(
          17,
          24,
          39,
        );

        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");

        doc.text(
          String(card.value),
          x + 5,
          currentY + 17,
        );
      });

      currentY += 30;

      /* =====================================================
         ACTION BREAKDOWN
      ===================================================== */

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");

      doc.setTextColor(31, 41, 55);

      doc.text(
        "Intervention Action Breakdown",
        margin,
        currentY,
      );

      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "Warning",
            "Call a Parent",
            "Community Service",
            "Suspension",
          ],
        ],
        body: [
          [
            summary.warnings,
            summary.parentCalls,
            summary.communityService,
            summary.suspensions,
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          halign: "center",
        },
        headStyles: {
          fontStyle: "bold",
          fillColor: [240, 253, 244],
          textColor: [22, 101, 52],
        },
        bodyStyles: {
          textColor: [55, 65, 81],
        },
      });

      currentY =
        (doc.lastAutoTable?.finalY || currentY) +
        8;

      /* =====================================================
         INTERVENTION DETAILS
      ===================================================== */

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");

      doc.setTextColor(31, 41, 55);

      doc.text(
        "Intervention Details",
        margin,
        currentY,
      );

      currentY += 4;

      const tableRows =
        filteredInterventions.map(
          (item, index) => [
            index + 1,
            item.studentName,
            item.studentCode,
            item.offense,
            item.type,
            item.description,
            item.statusLabel,
            formatDate(item.createdAt),
            item.interventionBy,
            item.approvedBy,
            item.completedBy,
          ],
        );

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "#",
            "Student",
            "Student ID",
            "Offense",
            "Action",
            "Intervention Plan / Description",
            "Status",
            "Created",
            "Intervention By",
            "Approved By",
            "Completed By",
          ],
        ],
        body:
          tableRows.length > 0
            ? tableRows
            : [
                [
                  "",
                  "No interventions found",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                ],
              ],
        theme: "grid",
        styles: {
          fontSize: 6.5,
          cellPadding: 2.5,
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [22, 101, 52],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 6.5,
        },
        bodyStyles: {
          textColor: [55, 65, 81],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: {
            cellWidth: 8,
            halign: "center",
          },
          1: {
            cellWidth: 27,
          },
          2: {
            cellWidth: 20,
          },
          3: {
            cellWidth: 28,
          },
          4: {
            cellWidth: 22,
          },
          5: {
            cellWidth: 45,
          },
          6: {
            cellWidth: 18,
          },
          7: {
            cellWidth: 20,
          },
          8: {
            cellWidth: 24,
          },
          9: {
            cellWidth: 24,
          },
          10: {
            cellWidth: 24,
          },
        },
        didDrawPage: (data) => {
          /* FOOTER */

          doc.setFontSize(7);

          doc.setTextColor(
            156,
            163,
            175,
          );

          doc.text(
            "GuidEd • Intervention Management",
            margin,
            pageHeight - 7,
          );

          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            pageWidth - margin,
            pageHeight - 7,
            {
              align: "right",
            },
          );
        },
      });

      /* =====================================================
         FINAL FOOTER / SAVE
      ===================================================== */

      const dateString =
        new Date()
          .toISOString()
          .split("T")[0];

      doc.save(
        `GuidEd-Intervention-Report-${period}-${dateString}.pdf`,
      );
    } catch (error) {
      console.error(
        "Intervention PDF error:",
        error,
      );

      alert(
        "Failed to generate the intervention PDF. Please try again.",
      );
    }
  };

  /* =========================================================
     PRINT
  ========================================================= */

  const printReport = () => {
    window.print();
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        bg-gray-950/50
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-[1500px]
          h-[94vh]
          bg-[#F8FAFC]
          rounded-3xl
          shadow-2xl
          overflow-hidden
          flex
          flex-col
        "
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <div
          className="
            bg-white
            border-b
            border-gray-100
            px-6
            py-4
            flex
            items-center
            justify-between
            gap-4
            shrink-0
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-green-50
                text-green-600
                flex
                items-center
                justify-center
              "
            >
              <HandHelping size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Intervention Printable Report
              </h2>

              <p className="text-xs text-gray-400 mt-0.5">
                {filteredInterventions.length}{" "}
                intervention
                {filteredInterventions.length === 1
                  ? ""
                  : "s"}{" "}
                • {periodLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              className="
                h-10
                px-4
                rounded-xl
                bg-green-600
                hover:bg-green-700
                text-white
                text-xs
                font-semibold
                flex
                items-center
                gap-2
                transition
              "
            >
              <Download size={15} />
              <span className="hidden sm:inline">
                Download PDF
              </span>
            </button>

            <button
              onClick={printReport}
              className="
                h-10
                px-4
                rounded-xl
                border
                border-gray-200
                bg-white
                text-gray-600
                text-xs
                font-semibold
                flex
                items-center
                gap-2
                hover:bg-gray-50
                transition
              "
            >
              <Printer size={15} />
              <span className="hidden sm:inline">
                Print
              </span>
            </button>

            <button
              onClick={onClose}
              className="
                w-10
                h-10
                rounded-xl
                bg-gray-50
                border
                border-gray-200
                text-gray-500
                flex
                items-center
                justify-center
                hover:bg-gray-100
                transition
              "
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <div
          className="
            px-6
            py-4
            bg-white
            border-b
            border-gray-100
            flex
            flex-col
            lg:flex-row
            lg:items-center
            justify-between
            gap-4
            shrink-0
          "
        >
          {/* PERIOD */}

          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
              Report Period
            </p>

            <div className="flex gap-2 overflow-x-auto">
              {[
                {
                  id: "all",
                  label: "All Time",
                },
                {
                  id: "daily",
                  label: "Daily",
                },
                {
                  id: "weekly",
                  label: "Weekly",
                },
                {
                  id: "monthly",
                  label: "Monthly",
                },
                {
                  id: "yearly",
                  label: "Yearly",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setPeriod(item.id)
                  }
                  className={`
                    h-9
                    px-3.5
                    rounded-xl
                    text-xs
                    font-semibold
                    whitespace-nowrap
                    transition
                    ${
                      period === item.id
                        ? "bg-green-600 text-white"
                        : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* STATUS */}

          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
              Status
            </p>

            <div className="flex gap-2">
              {[
                {
                  id: "all",
                  label: "All",
                },
                {
                  id: "ongoing",
                  label: "Ongoing",
                },
                {
                  id: "completed",
                  label: "Completed",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setStatus(item.id)
                  }
                  className={`
                    h-9
                    px-3.5
                    rounded-xl
                    text-xs
                    font-semibold
                    transition
                    ${
                      status === item.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================
            REPORT
        =================================================== */}

        <div
          id="intervention-printable-report"
          className="
            flex-1
            overflow-y-auto
            p-6
          "
        >
          {/* SCHOOL HEADER */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <img
                  src="/school-logo.png"
                  alt="School Logo"
                  className="w-16 h-16 object-contain"
                />

                <div>
                  <h1 className="text-xl font-black text-gray-900">
                    Guid<span className="text-green-600">Ed</span>
                  </h1>

                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    Student Guidance
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    Our Lady of the Holy Rosary School
                    <br />
                    General Trias Campus
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  Intervention Report
                </p>

                <h2 className="text-xl font-black text-gray-900 mt-1">
                  {periodLabel}
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Generated{" "}
                  {formatDate(new Date())}
                </p>
              </div>
            </div>
          </div>

          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <SummaryCard
              icon={<FileText size={17} />}
              label="Total Interventions"
              value={summary.total}
            />

            <SummaryCard
              icon={<Timer size={17} />}
              label="Ongoing"
              value={summary.ongoing}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />

            <SummaryCard
              icon={<CheckCircle2 size={17} />}
              label="Completed"
              value={summary.completed}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />

            <SummaryCard
              icon={<HandHelping size={17} />}
              label="Actions Taken"
              value={
                summary.warnings +
                summary.parentCalls +
                summary.communityService +
                summary.suspensions
              }
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>

          {/* ACTION BREAKDOWN */}

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays
                size={16}
                className="text-gray-400"
              />

              <h3 className="text-sm font-bold text-gray-900">
                Actions Taken
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ActionCard
                label="Warning"
                value={summary.warnings}
              />

              <ActionCard
                label="Call a Parent"
                value={summary.parentCalls}
              />

              <ActionCard
                label="Community Service"
                value={
                  summary.communityService
                }
              />

              <ActionCard
                label="Suspension"
                value={summary.suspensions}
              />
            </div>
          </div>

          {/* TABLE */}

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">
                Intervention Records
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Complete list of interventions and
                actions recorded during the selected
                period.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      #
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Student
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Student ID
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Offense
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Action
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400 min-w-[280px]">
                      Intervention Plan / Description
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Status
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Created
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Intervention By
                    </th>

                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Approved By
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-5 py-16 text-center"
                      >
                        <HandHelping
                          size={28}
                          className="mx-auto text-gray-300 mb-3"
                        />

                        <p className="text-sm font-semibold text-gray-500">
                          No interventions found
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          No intervention records match
                          the selected period and status.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInterventions.map(
                      (item, index) => (
                        <tr
                          key={
                            item._id ||
                            `${item.incidentId}-${index}`
                          }
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                        >
                          <td className="px-4 py-4 text-xs font-semibold text-gray-400 align-top">
                            {index + 1}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-bold text-gray-900">
                              {item.studentName}
                            </p>

                            {item.grade !== "N/A" && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                {item.grade}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-xs text-gray-600 align-top">
                            {item.studentCode}
                          </td>

                          <td className="px-4 py-4 text-xs text-gray-600 align-top max-w-[180px]">
                            {item.offense}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className="
                                inline-flex
                                px-2.5
                                py-1
                                rounded-lg
                                bg-blue-50
                                text-blue-700
                                border
                                border-blue-100
                                text-[10px]
                                font-bold
                                capitalize
                                whitespace-nowrap
                              "
                            >
                              {item.type}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top min-w-[280px]">
                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                              {item.description}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`
                                inline-flex
                                px-2.5
                                py-1
                                rounded-lg
                                text-[10px]
                                font-bold
                                ${
                                  item.status ===
                                  "completed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                }
                              `}
                            >
                              {item.statusLabel}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-xs text-gray-500 align-top whitespace-nowrap">
                            {formatDate(
                              item.createdAt,
                            )}
                          </td>

                          <td className="px-4 py-4 text-xs text-gray-600 align-top">
                            {item.interventionBy}
                          </td>

                          <td className="px-4 py-4 text-xs text-gray-600 align-top">
                            {item.approvedBy}
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between mt-5 px-1 pb-4">
            <p className="text-[10px] text-gray-400">
              GuidEd • Intervention Management
            </p>

            <p className="text-[10px] text-gray-400">
              Generated on{" "}
              {formatDateTime(new Date())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  icon,
  label,
  value,
  iconBg = "bg-green-50",
  iconColor = "text-green-600",
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <div
      className={`
        w-9
        h-9
        rounded-xl
        flex
        items-center
        justify-center
        ${iconBg}
        ${iconColor}
      `}
    >
      {icon}
    </div>

    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-4">
      {label}
    </p>

    <p className="text-2xl font-black text-gray-900 mt-1">
      {value}
    </p>
  </div>
);

/* =========================================================
   ACTION CARD
========================================================= */

const ActionCard = ({ label, value }) => (
  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
      {label}
    </p>

    <p className="text-xl font-black text-gray-900 mt-2">
      {value}
    </p>

    <p className="text-[10px] text-gray-400 mt-1">
      recorded action{value === 1 ? "" : "s"}
    </p>
  </div>
);

export default InterventionPrintableReport;