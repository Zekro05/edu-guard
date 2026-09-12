import { useEffect, useMemo, useState } from "react";
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Timer,
  CalendarDays,
  HandHelping,
  User2,
  Clock3,
  CalendarRange,
  ClipboardList,
  PhoneCall,
  Users,
  ShieldAlert,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuthStore } from "../../store/authStore";

const InterventionPrintableReport = ({
  cases = [],
  interventions = [],
  onClose,
}) => {
  const { user } = useAuthStore();

  /* =========================================================
     STATE
  ========================================================= */

  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");

  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateInput(new Date()),
  );

  const [customStartDate, setCustomStartDate] = useState(() => {
    const now = new Date();

    return toLocalDateInput(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );
  });

  const [customEndDate, setCustomEndDate] = useState(() =>
    toLocalDateInput(new Date()),
  );

  const [generatedAt, setGeneratedAt] = useState(
    () => new Date(),
  );

  /* =========================================================
     LOGGED-IN USER
  ========================================================= */

  const generatedBy = useMemo(() => {
    const fullName =
      [
        user?.firstName,
        user?.middleName,
        user?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
      user?.name?.trim() ||
      fullName ||
      user?.email?.trim() ||
      "GuidEd Administrator"
    );
  }, [user]);

  const generatedByRole = useMemo(() => {
    if (!user?.role) {
      return "Administrator";
    }

    return String(user.role)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );
  }, [user]);

  /* =========================================================
     HELPERS
  ========================================================= */

  function toLocalDateInput(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

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

  const formatLongDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "long",
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
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatInputDate = (value) => {
    if (!value) return "N/A";

    const [year, month, day] =
      value.split("-").map(Number);

    if (!year || !month || !day) {
      return "N/A";
    }

    return new Date(
      year,
      month - 1,
      day,
    ).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const parseInputDateStart = (value) => {
    if (!value) return null;

    const [year, month, day] =
      value.split("-").map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0,
    );
  };

  const parseInputDateEnd = (value) => {
    if (!value) return null;

    const [year, month, day] =
      value.split("-").map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999,
    );
  };

  const getStudentFromCase = (incidentId) => {
    const found = cases.find(
      (c) =>
        String(c.incidentId) ===
        String(incidentId),
    );

    return found || {};
  };

  const getInterventionStatus = (
    intervention,
  ) => {
    if (intervention.status === "completed") {
      return "Completed";
    }

    return "Ongoing";
  };

  /* =========================================================
     PERIOD INFORMATION
  ========================================================= */

  const periodLabel = useMemo(() => {
    const labels = {
      all: "All Recorded Interventions",
      daily: "Daily Report",
      weekly: "Weekly Report",
      monthly: "Monthly Report",
      yearly: "Yearly Report",
      custom: "Custom Date Range",
    };

    return (
      labels[period] ||
      "All Recorded Interventions"
    );
  }, [period]);

  const dateRange = useMemo(() => {
    const now = new Date();

    if (period === "daily") {
      const start =
        parseInputDateStart(selectedDate);

      const end =
        parseInputDateEnd(selectedDate);

      return {
        start,
        end,
        label: formatInputDate(
          selectedDate,
        ),
      };
    }

    if (period === "weekly") {
      const reference =
        parseInputDateStart(
          selectedDate,
        ) || now;

      const start = new Date(reference);

      const day = start.getDay();

      start.setDate(
        start.getDate() - day,
      );

      start.setHours(
        0,
        0,
        0,
        0,
      );

      const end = new Date(start);

      end.setDate(
        end.getDate() + 6,
      );

      end.setHours(
        23,
        59,
        59,
        999,
      );

      return {
        start,
        end,
        label: `${formatDate(
          start,
        )} – ${formatDate(end)}`,
      };
    }

    if (period === "monthly") {
      const reference =
        parseInputDateStart(
          selectedDate,
        ) || now;

      const start = new Date(
        reference.getFullYear(),
        reference.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );

      const end = new Date(
        reference.getFullYear(),
        reference.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      return {
        start,
        end,
        label: `${formatDate(
          start,
        )} – ${formatDate(end)}`,
      };
    }

    if (period === "yearly") {
      const reference =
        parseInputDateStart(
          selectedDate,
        ) || now;

      const start = new Date(
        reference.getFullYear(),
        0,
        1,
        0,
        0,
        0,
        0,
      );

      const end = new Date(
        reference.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999,
      );

      return {
        start,
        end,
        label: `${formatDate(
          start,
        )} – ${formatDate(end)}`,
      };
    }

    if (period === "custom") {
      const start =
        parseInputDateStart(
          customStartDate,
        );

      const end =
        parseInputDateEnd(
          customEndDate,
        );

      if (!start || !end) {
        return {
          start: null,
          end: null,
          label: "Select a start and end date",
        };
      }

      if (start > end) {
        return {
          start,
          end,
          label: "Invalid date range",
        };
      }

      return {
        start,
        end,
        label: `${formatDate(
          start,
        )} – ${formatDate(end)}`,
      };
    }

    return {
      start: null,
      end: null,
      label: "All available records",
    };
  }, [
    period,
    selectedDate,
    customStartDate,
    customEndDate,
  ]);

  const customRangeIsValid =
    period !== "custom" ||
    (dateRange.start &&
      dateRange.end &&
      dateRange.start <= dateRange.end);

  /* =========================================================
     REFRESH GENERATED TIMESTAMP
  ========================================================= */

  useEffect(() => {
    setGeneratedAt(new Date());
  }, [
    period,
    status,
    selectedDate,
    customStartDate,
    customEndDate,
  ]);

  /* =========================================================
     NORMALIZED INTERVENTIONS
  ========================================================= */

  const normalizedInterventions =
    useMemo(() => {
      return interventions.map(
        (intervention) => {
          const incidentId =
            intervention.incidentId?._id ||
            intervention.incidentId;

          const caseData =
            getStudentFromCase(
              incidentId,
            );

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
              getInterventionStatus(
                intervention,
              ),

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
        },
      );
    }, [interventions, cases]);

  /* =========================================================
     FILTERED INTERVENTIONS
  ========================================================= */

  const filteredInterventions =
    useMemo(() => {
      let result = [
        ...normalizedInterventions,
      ];

      /* STATUS */

      if (status !== "all") {
        result = result.filter(
          (item) => {
            if (status === "ongoing") {
              return (
                item.status !==
                "completed"
              );
            }

            if (
              status === "completed"
            ) {
              return (
                item.status ===
                "completed"
              );
            }

            return true;
          },
        );
      }

      /* DATE RANGE */

      if (period !== "all") {
        if (!customRangeIsValid) {
          return [];
        }

        const start =
          dateRange.start;

        const end =
          dateRange.end;

        result = result.filter(
          (item) => {
            if (!item.createdAt) {
              return false;
            }

            const created =
              new Date(
                item.createdAt,
              );

            if (
              Number.isNaN(
                created.getTime(),
              )
            ) {
              return false;
            }

            return (
              created >= start &&
              created <= end
            );
          },
        );
      }

      return result.sort(
        (a, b) =>
          new Date(
            b.createdAt || 0,
          ) -
          new Date(
            a.createdAt || 0,
          ),
      );
    }, [
      normalizedInterventions,
      period,
      status,
      dateRange,
      customRangeIsValid,
    ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const total =
      filteredInterventions.length;

    const completed =
      filteredInterventions.filter(
        (item) =>
          item.status ===
          "completed",
      ).length;

    const ongoing =
      filteredInterventions.filter(
        (item) =>
          item.status !==
          "completed",
      ).length;

    const warnings =
      filteredInterventions.filter(
        (item) =>
          String(item.type)
            .toLowerCase() ===
          "warning",
      ).length;

    const parentCalls =
      filteredInterventions.filter(
        (item) =>
          String(item.type)
            .toLowerCase() ===
          "call a parent",
      ).length;

    const communityService =
      filteredInterventions.filter(
        (item) =>
          String(item.type)
            .toLowerCase() ===
          "community service",
      ).length;

    const suspensions =
      filteredInterventions.filter(
        (item) =>
          String(item.type)
            .toLowerCase() ===
          "suspension",
      ).length;

    const actions =
      warnings +
      parentCalls +
      communityService +
      suspensions;

    return {
      total,
      completed,
      ongoing,
      warnings,
      parentCalls,
      communityService,
      suspensions,
      actions,
    };
  }, [filteredInterventions]);

  /* =========================================================
     STATUS LABEL
  ========================================================= */

  const statusLabel = useMemo(() => {
    if (status === "ongoing") {
      return "Ongoing";
    }

    if (status === "completed") {
      return "Completed";
    }

    return "All Statuses";
  }, [status]);

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

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      const margin = 12;

      /* =====================================================
         HEADER
      ===================================================== */

      doc.setFillColor(
        22,
        101,
        52,
      );

      doc.roundedRect(
        margin,
        10,
        pageWidth - margin * 2,
        31,
        4,
        4,
        "F",
      );

      /* LOGO */

      try {
        const response =
          await fetch(
            "/school-logo.webp",
          );

        if (response.ok) {
          const blob =
            await response.blob();

          const reader =
            new FileReader();

          const logoData =
            await new Promise(
              (
                resolve,
                reject,
              ) => {
                reader.onloadend =
                  () =>
                    resolve(
                      reader.result,
                    );

                reader.onerror =
                  reject;

                reader.readAsDataURL(
                  blob,
                );
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

      doc.setTextColor(
        255,
        255,
        255,
      );

      doc.setFontSize(17);
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.text(
        "GuidEd",
        margin + 29,
        20,
      );

      doc.setFontSize(8);
      doc.setFont(
        "helvetica",
        "normal",
      );

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
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.text(
        "Intervention Report",
        pageWidth -
          margin -
          65,
        20,
      );

      doc.setFontSize(8);
      doc.setFont(
        "helvetica",
        "normal",
      );

      doc.text(
        periodLabel,
        pageWidth -
          margin -
          65,
        26,
      );

      /* =====================================================
         REPORT METADATA
      ===================================================== */

      let currentY = 47;

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
        margin,
        currentY,
        pageWidth -
          margin * 2,
        28,
        3,
        3,
        "FD",
      );

      const metadataX =
        margin + 5;

      const metadataWidth =
        (pageWidth -
          margin * 2 -
          10) /
        3;

      /* ROW 1 */

      doc.setTextColor(
        107,
        114,
        128,
      );

      doc.setFontSize(6.5);
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.text(
        "REPORT PERIOD",
        metadataX,
        currentY + 7,
      );

      doc.text(
        "DATE RANGE",
        metadataX +
          metadataWidth,
        currentY + 7,
      );

      doc.text(
        "STATUS",
        metadataX +
          metadataWidth * 2,
        currentY + 7,
      );

      doc.setTextColor(
        31,
        41,
        55,
      );

      doc.setFontSize(8);
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.text(
        periodLabel,
        metadataX,
        currentY + 13,
      );

      doc.text(
        dateRange.label,
        metadataX +
          metadataWidth,
        currentY + 13,
      );

      doc.text(
        statusLabel,
        metadataX +
          metadataWidth * 2,
        currentY + 13,
      );

      /* ROW 2 */

      doc.setTextColor(
        107,
        114,
        128,
      );

      doc.setFontSize(6.5);
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.text(
        "GENERATED BY",
        metadataX,
        currentY + 20,
      );

      doc.text(
        "GENERATED ON",
        metadataX +
          metadataWidth,
        currentY + 20,
      );

      doc.text(
        "TOTAL RECORDS",
        metadataX +
          metadataWidth * 2,
        currentY + 20,
      );

      doc.setTextColor(
        31,
        41,
        55,
      );

      doc.setFontSize(7.5);
      doc.setFont(
        "helvetica",
        "normal",
      );

      doc.text(
        generatedBy,
        metadataX,
        currentY + 25,
      );

      doc.text(
        formatDateTime(
          generatedAt,
        ),
        metadataX +
          metadataWidth,
        currentY + 25,
      );

      doc.text(
        String(
          filteredInterventions.length,
        ),
        metadataX +
          metadataWidth * 2,
        currentY + 25,
      );

      currentY += 37;

      /* =====================================================
         SUMMARY
      ===================================================== */

      doc.setTextColor(
        31,
        41,
        55,
      );

      doc.setFontSize(12);
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.text(
        "Intervention Overview",
        margin,
        currentY,
      );

      currentY += 7;

      const cardGap = 4;

      const cardWidth =
        (pageWidth -
          margin * 2 -
          cardGap * 3) /
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
          value:
            summary.completed,
        },
        {
          label: "ACTIONS",
          value:
            summary.actions,
        },
      ];

      cards.forEach(
        (card, index) => {
          const x =
            margin +
            index *
              (cardWidth +
                cardGap);

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
          doc.setFont(
            "helvetica",
            "bold",
          );

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
          doc.setFont(
            "helvetica",
            "bold",
          );

          doc.text(
            String(
              card.value,
            ),
            x + 5,
            currentY + 17,
          );
        },
      );

      currentY += 30;

      /* =====================================================
         ACTION BREAKDOWN
      ===================================================== */

      doc.setFontSize(11);
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.setTextColor(
        31,
        41,
        55,
      );

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
          fillColor: [
            240,
            253,
            244,
          ],
          textColor: [
            22,
            101,
            52,
          ],
        },
        bodyStyles: {
          textColor: [
            55,
            65,
            81,
          ],
        },
      });

      currentY =
        (doc.lastAutoTable
          ?.finalY ||
          currentY) + 8;

      /* =====================================================
         INTERVENTION DETAILS
      ===================================================== */

      doc.setFontSize(11);
      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.setTextColor(
        31,
        41,
        55,
      );

      doc.text(
        "Intervention Details",
        margin,
        currentY,
      );

      currentY += 4;

      /* =====================================================
         TABLE
      ===================================================== */

      if (
        filteredInterventions.length >
        0
      ) {
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
              formatDate(
                item.createdAt,
              ),
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
          body: tableRows,
          theme: "grid",
          styles: {
            fontSize: 6.5,
            cellPadding: 2.5,
            valign: "middle",
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: [
              22,
              101,
              52,
            ],
            textColor: [
              255,
              255,
              255,
            ],
            fontStyle:
              "bold",
            fontSize: 6.5,
          },
          bodyStyles: {
            textColor: [
              55,
              65,
              81,
            ],
          },
          alternateRowStyles: {
            fillColor: [
              249,
              250,
              251,
            ],
          },
          columnStyles: {
            0: {
              cellWidth: 8,
              halign:
                "center",
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
          didDrawPage: () => {
            drawPdfFooter(
              doc,
              pageWidth,
              pageHeight,
              margin,
            );
          },
        });
      } else {
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
          margin,
          currentY,
          pageWidth -
            margin * 2,
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

        doc.setFontSize(9);
        doc.setFont(
          "helvetica",
          "bold",
        );

        doc.text(
          "No intervention records found for the selected filters.",
          pageWidth / 2,
          currentY + 13,
          {
            align: "center",
          },
        );

        drawPdfFooter(
          doc,
          pageWidth,
          pageHeight,
          margin,
        );
      }

      /* =====================================================
         SAVE
      ===================================================== */

      let filenameRange =
        "all-recorded";

      if (
        period === "custom" &&
        customStartDate &&
        customEndDate
      ) {
        filenameRange = `${customStartDate}-to-${customEndDate}`;
      } else if (
        period !== "all"
      ) {
        filenameRange =
          dateRange.start &&
          dateRange.end
            ? `${toLocalDateInput(
                dateRange.start,
              )}-to-${toLocalDateInput(
                dateRange.end,
              )}`
            : period;
      }

      doc.save(
        `GuidEd-Intervention-Report-${filenameRange}.pdf`,
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
                {filteredInterventions.length ===
                1
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
            FILTER CONTROLS
        =================================================== */}

        <div
          className="
            px-6
            py-4
            bg-white
            border-b
            border-gray-100
            shrink-0
          "
        >
          {/* PERIOD */}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Report Period
              </p>

              <span className="text-[10px] font-medium text-gray-400">
                {dateRange.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-gray-100 p-1">
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
                {
                  id: "custom",
                  label: "Custom Range",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setPeriod(
                      item.id,
                    )
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
                      period ===
                      item.id
                        ? "bg-white text-green-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECOND ROW */}

          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mt-4">
            {/* STATUS */}

            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                Intervention Status
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
                      setStatus(
                        item.id,
                      )
                    }
                    className={`
                      h-9
                      px-3.5
                      rounded-xl
                      text-xs
                      font-semibold
                      transition
                      ${
                        status ===
                        item.id
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

            {/* DATE CONTROLS */}

            {period !== "all" && (
              <div className="flex flex-col sm:flex-row gap-3">
                {period ===
                "custom" ? (
                  <>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                        From
                      </p>

                      <div className="relative">
                        <CalendarDays
                          size={14}
                          className="
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            text-gray-400
                            pointer-events-none
                          "
                        />

                        <input
                          type="date"
                          value={
                            customStartDate
                          }
                          onChange={(
                            event,
                          ) =>
                            setCustomStartDate(
                              event
                                .target
                                .value,
                            )
                          }
                          className="
                            h-9
                            pl-9
                            pr-3
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            text-xs
                            font-medium
                            text-gray-700
                            outline-none
                            focus:ring-2
                            focus:ring-green-100
                            focus:border-green-500
                          "
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                        To
                      </p>

                      <div className="relative">
                        <CalendarDays
                          size={14}
                          className="
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            text-gray-400
                            pointer-events-none
                          "
                        />

                        <input
                          type="date"
                          value={
                            customEndDate
                          }
                          onChange={(
                            event,
                          ) =>
                            setCustomEndDate(
                              event
                                .target
                                .value,
                            )
                          }
                          className="
                            h-9
                            pl-9
                            pr-3
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            text-xs
                            font-medium
                            text-gray-700
                            outline-none
                            focus:ring-2
                            focus:ring-green-100
                            focus:border-green-500
                          "
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                      Reference Date
                    </p>

                    <div className="relative">
                      <CalendarDays
                        size={14}
                        className="
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-gray-400
                          pointer-events-none
                        "
                      />

                      <input
                        type="date"
                        value={
                          selectedDate
                        }
                        onChange={(
                          event,
                        ) =>
                          setSelectedDate(
                            event
                              .target
                              .value,
                          )
                        }
                        className="
                          h-9
                          pl-9
                          pr-3
                          rounded-xl
                          border
                          border-gray-200
                          bg-white
                          text-xs
                          font-medium
                          text-gray-700
                          outline-none
                          focus:ring-2
                          focus:ring-green-100
                          focus:border-green-500
                        "
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INVALID RANGE */}

          {period ===
            "custom" &&
            !customRangeIsValid && (
              <div className="mt-3 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs font-medium text-red-600">
                The start date must be earlier
                than or equal to the end date.
              </div>
            )}
        </div>

        {/* ===================================================
            REPORT
        =================================================== */}

        <div
          id="intervention-printable-report"
          className="
            case-printable-report
            flex-1
            overflow-y-auto
            p-6
          "
        >
          <div className="case-report-paper max-w-[1400px] mx-auto">
            {/* =================================================
                SCHOOL HEADER
            ================================================= */}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                    <img
                      src="/school-logo.webp"
                      alt="School Logo"
                      className="w-12 h-12 object-contain"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black text-gray-900">
                      Guid
                      <span className="text-green-600">
                        Ed
                      </span>
                    </h1>

                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                      Student Guidance
                    </p>

                    <p className="text-xs text-gray-500 mt-2">
                      Our Lady of the Holy
                      Rosary School
                      <br />
                      General Trias Campus
                    </p>
                  </div>
                </div>

                <div className="lg:text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                    <HandHelping
                      size={13}
                    />

                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Intervention Management
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-gray-900 mt-3">
                    Intervention Report
                  </h2>

                  <p className="text-xs text-gray-400 mt-1">
                    {periodLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                REPORT METADATA
            ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
              <ReportMetaCard
                icon={
                  <ClipboardList
                    size={16}
                  />
                }
                label="Report Period"
                value={periodLabel}
              />

              <ReportMetaCard
                icon={
                  <CalendarRange
                    size={16}
                  />
                }
                label="Date Range"
                value={
                  dateRange.label
                }
              />

              <ReportMetaCard
                icon={
                  <User2 size={16} />
                }
                label="Generated By"
                value={
                  generatedBy
                }
                secondary={
                  generatedByRole
                }
              />

              <ReportMetaCard
                icon={
                  <Clock3 size={16} />
                }
                label="Generated On"
                value={formatDateTime(
                  generatedAt,
                )}
              />
            </div>

            {/* FILTER BADGES */}

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mr-1">
                Applied Filters
              </span>

              <ReportBadge
                icon={
                  <CheckCircle2
                    size={12}
                  />
                }
                label={`Status: ${statusLabel}`}
              />

              <ReportBadge
                icon={
                  <CalendarDays
                    size={12}
                  />
                }
                label={`Range: ${dateRange.label}`}
              />

              <ReportBadge
                icon={
                  <FileText size={12} />
                }
                label={`${filteredInterventions.length} record${
                  filteredInterventions.length ===
                  1
                    ? ""
                    : "s"
                }`}
              />
            </div>

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
              <SummaryCard
                icon={
                  <FileText size={17} />
                }
                label="Total Interventions"
                value={
                  summary.total
                }
              />

              <SummaryCard
                icon={
                  <Timer size={17} />
                }
                label="Ongoing"
                value={
                  summary.ongoing
                }
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
              />

              <SummaryCard
                icon={
                  <CheckCircle2
                    size={17}
                  />
                }
                label="Completed"
                value={
                  summary.completed
                }
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
              />

              <SummaryCard
                icon={
                  <HandHelping
                    size={17}
                  />
                }
                label="Actions Taken"
                value={
                  summary.actions
                }
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
            </div>

            {/* =================================================
                ACTION BREAKDOWN
            ================================================= */}

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <HandHelping
                    size={16}
                    className="text-green-600"
                  />

                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Actions Taken
                    </h3>

                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Breakdown of intervention
                      actions recorded.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-gray-500">
                  {summary.actions} total
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ActionCard
                  icon={
                    <ShieldAlert
                      size={15}
                    />
                  }
                  label="Warning"
                  value={
                    summary.warnings
                  }
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                />

                <ActionCard
                  icon={
                    <PhoneCall
                      size={15}
                    />
                  }
                  label="Call a Parent"
                  value={
                    summary.parentCalls
                  }
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                />

                <ActionCard
                  icon={
                    <Users size={15} />
                  }
                  label="Community Service"
                  value={
                    summary.communityService
                  }
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                />

                <ActionCard
                  icon={
                    <Timer size={15} />
                  }
                  label="Suspension"
                  value={
                    summary.suspensions
                  }
                  iconBg="bg-red-50"
                  iconColor="text-red-600"
                />
              </div>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList
                      size={16}
                      className="text-green-600"
                    />

                    <h3 className="text-sm font-bold text-gray-900">
                      Intervention Records
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    Complete list of interventions
                    and actions recorded during
                    the selected period.
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Records
                  </span>

                  <span className="ml-2 text-xs font-black text-gray-900">
                    {
                      filteredInterventions.length
                    }
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <TableHeader>
                        #
                      </TableHeader>

                      <TableHeader>
                        Student
                      </TableHeader>

                      <TableHeader>
                        Student ID
                      </TableHeader>

                      <TableHeader>
                        Offense
                      </TableHeader>

                      <TableHeader>
                        Action
                      </TableHeader>

                      <TableHeader className="min-w-[280px]">
                        Intervention Plan /
                        Description
                      </TableHeader>

                      <TableHeader>
                        Status
                      </TableHeader>

                      <TableHeader>
                        Created
                      </TableHeader>

                      <TableHeader>
                        Intervention By
                      </TableHeader>

                      <TableHeader>
                        Approved By
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInterventions.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="10"
                          className="px-5 py-16 text-center"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                            <HandHelping
                              size={24}
                              className="text-gray-300"
                            />
                          </div>

                          <p className="text-sm font-semibold text-gray-500">
                            No interventions found
                          </p>

                          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                            No intervention
                            records match
                            the selected
                            period and
                            status.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredInterventions.map(
                        (
                          item,
                          index,
                        ) => (
                          <tr
                            key={
                              item._id ||
                              `${item.incidentId}-${index}`
                            }
                            className="
                              border-b
                              border-gray-100
                              last:border-b-0
                              hover:bg-gray-50/70
                              transition
                            "
                          >
                            <td className="px-4 py-4 text-xs font-semibold text-gray-400 align-top">
                              {String(
                                index +
                                  1,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </td>

                            <td className="px-4 py-4 align-top">
                              <p className="text-xs font-bold text-gray-900">
                                {
                                  item.studentName
                                }
                              </p>

                              {item.grade !==
                                "N/A" && (
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {
                                    item.grade
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4 text-xs text-gray-600 align-top whitespace-nowrap">
                              {
                                item.studentCode
                              }
                            </td>

                            <td className="px-4 py-4 text-xs text-gray-600 align-top max-w-[180px]">
                              {
                                item.offense
                              }
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
                                {
                                  item.type
                                }
                              </span>
                            </td>

                            <td className="px-4 py-4 align-top min-w-[280px]">
                              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {
                                  item.description
                                }
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
                                {
                                  item.statusLabel
                                }
                              </span>
                            </td>

                            <td className="px-4 py-4 text-xs text-gray-500 align-top whitespace-nowrap">
                              {formatDate(
                                item.createdAt,
                              )}
                            </td>

                            <td className="px-4 py-4 text-xs text-gray-600 align-top">
                              {
                                item.interventionBy
                              }
                            </td>

                            <td className="px-4 py-4 text-xs text-gray-600 align-top">
                              {
                                item.approvedBy
                              }
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="mt-5 mb-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Prepared By
                  </p>

                  <p className="text-xs font-bold text-gray-700 mt-1">
                    {generatedBy}
                  </p>

                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {generatedByRole}
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Generated On
                  </p>

                  <p className="text-xs font-semibold text-gray-700 mt-1">
                    {formatDateTime(
                      generatedAt,
                    )}
                  </p>

                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {dateRange.label}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-[10px] text-gray-400">
                  GuidEd • Intervention Management
                </p>

                <p className="text-[10px] text-gray-400">
                  Our Lady of the Holy Rosary
                  School • General Trias
                  Campus
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          PRINT STYLES
      ===================================================== */}

      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            body * {
              visibility: hidden;
            }

            #intervention-printable-report,
            #intervention-printable-report * {
              visibility: visible;
            }

            #intervention-printable-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              padding: 0 !important;
              background: white !important;
            }

            .case-report-paper {
              max-width: none !important;
              width: 100% !important;
            }

            .case-report-paper > div {
              box-shadow: none !important;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            thead {
              display: table-header-group;
            }

            .rounded-3xl,
            .rounded-2xl {
              border-radius: 0 !important;
            }
          }
        `}
      </style>
    </div>
  );
};

/* =========================================================
   PDF FOOTER
========================================================= */

const drawPdfFooter = (
  doc,
  pageWidth,
  pageHeight,
  margin,
) => {
  doc.setFontSize(7);

  doc.setFont(
    "helvetica",
    "normal",
  );

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
};

/* =========================================================
   TABLE HEADER
========================================================= */

const TableHeader = ({
  children,
  className = "",
}) => (
  <th
    className={`
      px-4
      py-3
      text-[10px]
      uppercase
      tracking-wider
      font-bold
      text-gray-400
      ${className}
    `}
  >
    {children}
  </th>
);

/* =========================================================
   REPORT META CARD
========================================================= */

const ReportMetaCard = ({
  icon,
  label,
  value,
  secondary,
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm min-w-0">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
          {label}
        </p>

        <p
          className="
            text-xs
            font-bold
            text-gray-800
            mt-1
            break-words
          "
        >
          {value}
        </p>

        {secondary && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {secondary}
          </p>
        )}
      </div>
    </div>
  </div>
);

/* =========================================================
   REPORT BADGE
========================================================= */

const ReportBadge = ({
  icon,
  label,
}) => (
  <span
    className="
      inline-flex
      items-center
      gap-1.5
      px-2.5
      py-1.5
      rounded-lg
      bg-gray-50
      border
      border-gray-100
      text-[10px]
      font-semibold
      text-gray-500
    "
  >
    <span className="text-green-600">
      {icon}
    </span>

    {label}
  </span>
);

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

const ActionCard = ({
  icon,
  label,
  value,
  iconBg = "bg-gray-50",
  iconColor = "text-gray-600",
}) => (
  <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
    <div
      className={`
        w-8
        h-8
        rounded-lg
        flex
        items-center
        justify-center
        ${iconBg}
        ${iconColor}
      `}
    >
      {icon}
    </div>

    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-3">
      {label}
    </p>

    <p className="text-xl font-black text-gray-900 mt-1">
      {value}
    </p>

    <p className="text-[10px] text-gray-400 mt-1">
      recorded action
      {value === 1 ? "" : "s"}
    </p>
  </div>
);

export default InterventionPrintableReport;