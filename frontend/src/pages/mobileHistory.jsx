import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useTheme } from "../../assets/styles/theme/useTheme";
import { createStyles } from "../../assets/styles/studentstyle/historyDetails.styles";

const BASE_URL = "https://edu-guard-backend.onrender.com";

export default function HistoryDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        return null;
      }

      const user = JSON.parse(stored);

      return user?.token || null;
    } catch (error) {
      console.log("Token error:", error);
      return null;
    }
  };

  // =========================================================
  // HTML ESCAPE
  // Prevent special characters from breaking the PDF HTML
  // =========================================================

  const escapeHtml = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // =========================================================
  // AI ANALYSIS
  // =========================================================

  const getAIAnalysis = async (report, token) => {
    try {
      setAiLoading(true);

      const response = await fetch(`${BASE_URL}/api/gemini/analyze-incident`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentName: report?.studentName || "Unknown",
          offense: report?.offense || "N/A",
          location: report?.location || "N/A",
          description: report?.description || "",
          reporterType: report?.reporterType || "N/A",
          status: report?.status || "Pending",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Gemini Error:", data);
        return null;
      }

      return data;
    } catch (error) {
      console.log("Gemini Fetch Error:", error);
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  // =========================================================
  // GET REPORT DETAILS
  // =========================================================

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please sign in again.",
        );
        return;
      }

      // =====================================================
      // GET REPORT
      // =====================================================

      const reportRes = await fetch(`${BASE_URL}/api/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const report = await reportRes.json();

      if (!reportRes.ok) {
        console.log("Report API error:", report);

        Alert.alert(
          "Unable to Load Report",
          report?.message || "The report could not be loaded.",
        );

        return;
      }

      console.log("========== HISTORY DETAILS ==========");
      console.log("REPORT ID:", report?._id);
      console.log("INCIDENT ID:", report?.incidentId);
      console.log("INCIDENT ACTION:", report?.actionTaken);
      console.log("INTERVENTIONS:", report?.interventions);
      console.log("====================================");

      // =====================================================
      // AI ANALYSIS
      // =====================================================

      const aiData = await getAIAnalysis(report, token);

      console.log("AI DATA:", aiData);

      // =====================================================
      // REPORTER
      // =====================================================

      let reportedBy = "Anonymous";

      if (report?.reporterId) {
        if (typeof report.reporterId === "string") {
          reportedBy = report.reporterId;
        } else {
          reportedBy =
            report.reporterId?.name ||
            report.reporterId?.fullName ||
            report.reporterId?.email ||
            "Anonymous";
        }
      }

      // =====================================================
      // DATE
      // =====================================================

      let submittedDate = "N/A";

      if (report?.date) {
        const parsedDate = new Date(report.date);

        if (!isNaN(parsedDate.getTime())) {
          submittedDate = parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
      }

      const interventionActions = Array.isArray(report?.interventions)
        ? report.interventions.map((intervention) => {
            const formattedType = intervention?.type
              ? intervention.type
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
              : "Intervention";

            if (intervention?.description) {
              return `${formattedType}: ${intervention.description}`;
            }

            return formattedType;
          })
        : [];

      const actionsTaken = [report?.actionTaken, ...interventionActions]
        .filter(Boolean)
        .join("\n\n");

      console.log("FINAL ACTIONS TAKEN:", actionsTaken);

      // =====================================================
      // MERGE DATA
      // =====================================================

      setIncident({
        reportId: report?._id || id,

        submittedDate,

        submittedTime: report?.time || "N/A",

        student: report?.studentName || "Unknown",

        studentEmail: report?.studentEmail || "N/A",

        reportedBy,

        reporterRole: report?.reporterType || "N/A",

        location: report?.location || "Unknown",

        offense: report?.offense || "N/A",

        incidentType: report?.incidentType || "N/A",

        status: report?.status || "Pending",

        category: aiData?.category || report?.offense || "Not available",

        confidence:
          aiData?.confidence !== undefined && aiData?.confidence !== null
            ? `${aiData.confidence}`
            : "Not available",

        riskLevel: aiData?.riskLevel || "Not available",

        pattern: aiData?.pattern || "No pattern analysis available.",

        prediction: aiData?.prediction || "No prediction available.",

        description: report?.description || "No description available.",

        actionsTaken: actionsTaken || "No actions recorded.",

        aiRemarks: aiData?.remarks || "No AI remarks available.",

        recommendation:
          aiData?.recommendation || "No recommendation available.",

        createdAt: report?.createdAt || null,
      });
    } catch (error) {
      console.log("Fetch details error:", error);

      Alert.alert("Error", "Something went wrong while loading the report.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GENERATE PDF
  // =========================================================

  const generatePDF = async () => {
    if (!incident) {
      return;
    }

    try {
      setPdfLoading(true);

      const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8" />

<style>

@page {
  size: A4;
  margin: 40px;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  color: #1f2937;
  background: #ffffff;
  margin: 0;
  padding: 0;
}

.header {
  background: #1B5E20;
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 25px;
}

.logo-title {
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 5px;
}

.logo-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.report-title {
  font-size: 21px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #1B5E20;
}

.section {
  margin-bottom: 22px;
}

.section-title {
  font-size: 17px;
  font-weight: bold;
  color: #1B5E20;
  border-bottom: 2px solid #1B5E20;
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
}

.info-table td {
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}

.label {
  width: 32%;
  font-weight: bold;
  color: #4b5563;
}

.value {
  color: #111827;
}

.ai-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 15px;
}

.ai-item {
  margin-bottom: 12px;
}

.ai-label {
  font-weight: bold;
  color: #166534;
  margin-bottom: 3px;
}

.ai-value {
  color: #374151;
  line-height: 1.5;
}

.description {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 15px;
  border-radius: 10px;
  line-height: 1.6;
}

.status {
  display: inline-block;
  background: #dcfce7;
  color: #166534;
  padding: 5px 10px;
  border-radius: 15px;
  font-weight: bold;
}

.warning {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 12px;
}

.footer {
  margin-top: 35px;
  padding-top: 15px;
  border-top: 1px solid #d1d5db;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

</style>

</head>

<body>

<div class="header">

  <div class="logo-title">
    GuidED
  </div>

  <div class="logo-subtitle">
    Student Discipline Management System
  </div>

</div>

<div class="report-title">
  Incident Report
</div>

<div class="section">

  <div class="section-title">
    Report Information
  </div>

  <table class="info-table">

    <tr>
      <td class="label">Report ID</td>
      <td class="value">${escapeHtml(incident.reportId)}</td>
    </tr>

    <tr>
      <td class="label">Status</td>
      <td class="value">
        <span class="status">
          ${escapeHtml(incident.status)}
        </span>
      </td>
    </tr>

    <tr>
      <td class="label">Student</td>
      <td class="value">${escapeHtml(incident.student)}</td>
    </tr>

    <tr>
      <td class="label">Student Email</td>
      <td class="value">${escapeHtml(incident.studentEmail)}</td>
    </tr>

    <tr>
      <td class="label">Reported By</td>
      <td class="value">${escapeHtml(incident.reportedBy)}</td>
    </tr>

    <tr>
      <td class="label">Reporter Role</td>
      <td class="value">${escapeHtml(incident.reporterRole)}</td>
    </tr>

    <tr>
      <td class="label">Date</td>
      <td class="value">${escapeHtml(incident.submittedDate)}</td>
    </tr>

    <tr>
      <td class="label">Time</td>
      <td class="value">${escapeHtml(incident.submittedTime)}</td>
    </tr>

    <tr>
      <td class="label">Location</td>
      <td class="value">${escapeHtml(incident.location)}</td>
    </tr>

    <tr>
      <td class="label">Offense</td>
      <td class="value">${escapeHtml(incident.offense)}</td>
    </tr>

    <tr>
      <td class="label">Incident Type</td>
      <td class="value">${escapeHtml(incident.incidentType)}</td>
    </tr>

  </table>

</div>

<div class="section">

  <div class="section-title">
    Incident Description
  </div>

  <div class="description">
    ${escapeHtml(incident.description)}
  </div>

</div>

<div class="section">

  <div class="section-title">
    AI Analysis
  </div>

  <div class="ai-box">

    <div class="ai-item">
      <div class="ai-label">Category</div>
      <div class="ai-value">
        ${escapeHtml(incident.category)}
      </div>
    </div>

    <div class="ai-item">
      <div class="ai-label">Confidence</div>
      <div class="ai-value">
        ${escapeHtml(incident.confidence)}
      </div>
    </div>

    <div class="ai-item">
      <div class="ai-label">Risk Level</div>
      <div class="ai-value">
        ${escapeHtml(incident.riskLevel)}
      </div>
    </div>

    <div class="ai-item">
      <div class="ai-label">Pattern Analysis</div>
      <div class="ai-value">
        ${escapeHtml(incident.pattern)}
      </div>
    </div>

    <div class="ai-item">
      <div class="ai-label">Prediction</div>
      <div class="ai-value">
        ${escapeHtml(incident.prediction)}
      </div>
    </div>

    <div class="ai-item">
      <div class="ai-label">AI Remarks</div>
      <div class="ai-value">
        ${escapeHtml(incident.aiRemarks)}
      </div>
    </div>

    <div class="ai-item">
      <div class="ai-label">Recommendation</div>
      <div class="ai-value">
        ${escapeHtml(incident.recommendation)}
      </div>
    </div>

  </div>

  <div class="warning">
    AI-generated analysis is provided as an advisory support tool and
    should not replace official school procedures or human judgment.
  </div>

</div>

<div class="section">

  <div class="section-title">
    Actions Taken
  </div>

  <div class="description">
    ${escapeHtml(incident.actionsTaken)}
  </div>

</div>

<div class="footer">

  GuidED — Student Discipline Management System

  <br />

  This document contains information from the selected incident report.

</div>

</body>

</html>
`;

      const result = await Print.printToFileAsync({
        html,
      });

      console.log("PDF generated:", result.uri);

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert(
          "PDF Created",
          "The PDF was created, but sharing is not available on this device.",
        );
        return;
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Incident Report",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.log("PDF Error:", error);

      Alert.alert(
        "PDF Error",
        "Unable to create the PDF report. Please try again.",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />

        <Text
          style={{
            marginTop: 12,
            color: colors.textPrimary,
            fontSize: 15,
          }}
        >
          Loading report...
        </Text>
      </View>
    );
  }

  // =========================================================
  // NO INCIDENT
  // =========================================================

  if (!incident) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
          padding: 30,
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={60}
          color={colors.textSecondary}
        />

        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: "700",
            marginTop: 15,
            textAlign: "center",
          }}
        >
          No incident details found
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          The report may have been removed or is currently unavailable.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 25,
            backgroundColor: colors.primary,
            paddingHorizontal: 25,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: colors.textInverse,
              fontWeight: "700",
            }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* =====================================================
            HEADER
        ===================================================== */}

      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 30,
          paddingHorizontal: 20,
          paddingBottom: 25,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={23} color={colors.textInverse} />
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
              marginLeft: 14,
            }}
          >
            <Text
              style={{
                color: colors.textInverse,
                fontSize: 21,
                fontWeight: "800",
              }}
            >
              Incident Details
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
              }}
              numberOfLines={1}
            >
              Report #{incident.reportId}
            </Text>
          </View>

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color={colors.textInverse}
            />
          </View>
        </View>

        {/* AI STATUS */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 22,
          }}
        >
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: "#86efac",
              marginRight: 8,
            }}
          />

          <Text
            style={{
              color: colors.textInverse,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            AI Analysis Available
          </Text>
        </View>
      </LinearGradient>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        {/* =====================================================
            EXPORT PDF BUTTON
        ===================================================== */}

        <View
          style={{
            paddingHorizontal: 16,
            marginTop: 16,
          }}
        >
          <TouchableOpacity
            onPress={generatePDF}
            disabled={pdfLoading}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.primary + "35",
              borderRadius: 16,
              padding: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",

              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,

              opacity: pdfLoading ? 0.6 : 1,
            }}
          >
            {pdfLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="document-attach-outline"
                size={21}
                color={colors.primary}
              />
            )}

            <Text
              style={{
                marginLeft: 9,
                color: colors.primary,
                fontWeight: "700",
                fontSize: 15,
              }}
            >
              {pdfLoading ? "Creating PDF..." : "Export / Share PDF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* =====================================================
            REPORT SUMMARY
        ===================================================== */}

        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 18,

            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View
              style={{
                marginLeft: 12,
                flex: 1,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                Report Information
              </Text>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Basic incident information
              </Text>
            </View>
          </View>

          {/* STATUS */}

          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              STATUS
            </Text>

            <Text
              style={{
                color: colors.primary,
                fontSize: 16,
                fontWeight: "800",
                marginTop: 3,
              }}
            >
              {incident.status}
            </Text>
          </View>

          {/* INFO ROWS */}

          {[
            ["Student", incident.student, "person-outline"],
            ["Reported By", "Anonymous", "person-circle-outline"],
            ["Date", incident.submittedDate, "calendar-outline"],
            ["Time", incident.submittedTime, "time-outline"],
            ["Location", incident.location, "location-outline"],
            ["Offense", incident.offense, "warning-outline"],
          ].map(([label, value, icon]) => (
            <View
              key={label}
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Ionicons
                name={icon}
                size={19}
                color={colors.primary}
                style={{
                  width: 28,
                  marginTop: 2,
                }}
              />

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                  }}
                >
                  {label}
                </Text>

                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* =====================================================
            AI ANALYSIS
        ===================================================== */}

        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 18,

            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="sparkles-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 12,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                AI Analysis
              </Text>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                AI-assisted incident assessment
              </Text>
            </View>

            {aiLoading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {/* AI ITEMS */}

          {[
            ["Category", incident.category, "pricetag-outline"],
            ["Confidence", incident.confidence, "analytics-outline"],
            ["Risk Level", incident.riskLevel, "shield-checkmark-outline"],
            ["Pattern Analysis", incident.pattern, "git-branch-outline"],
            ["Prediction", incident.prediction, "trending-up-outline"],
          ].map(([label, value, icon]) => (
            <View
              key={label}
              style={{
                backgroundColor: colors.background,
                borderRadius: 14,
                padding: 13,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name={icon} size={18} color={colors.primary} />

                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "700",
                    fontSize: 13,
                    marginLeft: 8,
                  }}
                >
                  {label}
                </Text>
              </View>

              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 14,
                  lineHeight: 21,
                  marginTop: 7,
                }}
              >
                {value}
              </Text>
            </View>
          ))}

          {/* AI REMARKS */}

          <View
            style={{
              marginTop: 4,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "800",
                marginBottom: 7,
              }}
            >
              AI Remarks
            </Text>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              {incident.aiRemarks}
            </Text>
          </View>

          {/* RECOMMENDATION */}

          <View
            style={{
              marginTop: 15,
              backgroundColor: colors.primarySoft,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 7,
              }}
            >
              <Ionicons name="bulb-outline" size={19} color={colors.primary} />

              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "800",
                  fontSize: 14,
                  marginLeft: 7,
                }}
              >
                Recommendation
              </Text>
            </View>

            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              {incident.recommendation}
            </Text>
          </View>

          {/* AI DISCLAIMER */}

          <View
            style={{
              marginTop: 15,
              flexDirection: "row",
              backgroundColor: "#fff7ed",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#c2410c"
            />

            <Text
              style={{
                flex: 1,
                color: "#9a3412",
                fontSize: 12,
                lineHeight: 18,
                marginLeft: 8,
              }}
            >
              AI-generated analysis is advisory only and does not replace human
              judgment or official school disciplinary procedures.
            </Text>
          </View>
        </View>

        {/* =====================================================
            DESCRIPTION
        ===================================================== */}

        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 18,

            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 13,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={21}
              color={colors.primary}
            />

            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 17,
                fontWeight: "800",
                marginLeft: 9,
              }}
            >
              Incident Description
            </Text>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              lineHeight: 22,
            }}
          >
            {incident.description}
          </Text>
        </View>

        {/* =====================================================
            ACTIONS TAKEN
        ===================================================== */}

        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 18,

            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 13,
            }}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={21}
              color={colors.primary}
            />

            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 17,
                fontWeight: "800",
                marginLeft: 9,
              }}
            >
              Actions Taken
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 18,

              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* HEADER */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  backgroundColor: colors.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View
                style={{
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 17,
                    fontWeight: "800",
                  }}
                >
                  Actions Taken
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Disciplinary actions and interventions
                </Text>
              </View>
            </View>

            {/* ACTION */}

            {incident.actionsTaken &&
            incident.actionsTaken !== "No actions recorded." ? (
              incident.actionsTaken.split("\n\n").map((action, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    padding: 13,
                    marginBottom:
                      index < incident.actionsTaken.split("\n\n").length - 1
                        ? 10
                        : 0,
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      backgroundColor: colors.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={17}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    style={{
                      flex: 1,
                      color: colors.textPrimary,
                      fontSize: 14,
                      lineHeight: 21,
                      marginLeft: 10,
                    }}
                  >
                    {action}
                  </Text>
                </View>
              ))
            ) : (
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  padding: 15,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 21,
                  }}
                >
                  No actions or interventions have been recorded yet.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <View
          style={{
            alignItems: "center",
            marginTop: 25,
            paddingHorizontal: 30,
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={25}
            color={colors.primary}
          />

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 11,
              textAlign: "center",
              marginTop: 7,
              lineHeight: 17,
            }}
          >
            This incident record is confidential and should only be accessed by
            authorized users.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
