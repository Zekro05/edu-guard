import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "../../assets/styles/theme/useTheme";
import { API, useAuthStore } from "../../store/authStore";

export default function IncidentHistory() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { colors } = useTheme();

  const [incidents, setIncidents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // STATUS
  // =========================================================

  const formatStatus = (status, action) => {
    const s = status ? String(status).toLowerCase().trim() : "";
    const a = action ? String(action).toLowerCase().trim() : "";

    // =========================================================
    // ACTION HAS PRIORITY
    // =========================================================

    // ADMIN ACCEPTED
    if (a === "accepted" || a.includes("accepted")) {
      return "Accepted";
    }

    // ADMIN REJECTED
    if (a === "rejected" || a.includes("rejected")) {
      return "Rejected";
    }

    // ACTION TAKEN / UNDER REVIEW
    if (
      a === "action taken" ||
      a === "action_taken" ||
      a === "taken" ||
      a === "reviewing" ||
      a === "review" ||
      a === "under review" ||
      a === "under_review"
    ) {
      return "Under Review";
    }

    // =========================================================
    // FALLBACK TO INCIDENT STATUS
    // =========================================================

    if (s === "accepted" || s.includes("accepted")) {
      return "Accepted";
    }

    if (s === "rejected" || s.includes("rejected")) {
      return "Rejected";
    }

    if (s === "resolved" || s.includes("resolved")) {
      return "Resolved";
    }

    if (
      s === "reviewing" ||
      s === "review" ||
      s === "under review" ||
      s === "under_review" ||
      s.includes("review")
    ) {
      return "Under Review";
    }

    if (s === "pending" || s.includes("pending")) {
      return "Pending";
    }

    return "Pending";
  };

  // =========================================================
  // FETCH INCIDENTS
  // =========================================================

  const fetchIncidents = async () => {
    try {
      const res = await API.get("/api/incidents");

      const data = Array.isArray(res.data) ? res.data : [];

      console.log("RAW INCIDENTS:", data);

      const formatted = data.map((item) => {
        return {
          id: item._id,

          reportId: item.reportId?._id || item.reportId,

          title: item.title || "Incident Report",

          createdAt: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "No Date",

          // Status comes ONLY from incident.status
          status: formatStatus(item.status, item.action),

          risk: item.level ? `${item.level} Risk` : "Unknown Risk",

          category: item.category || "Uncategorized",
        };
      });

      console.log("FORMATTED INCIDENTS:", formatted);

      setIncidents(formatted);
    } catch (error) {
      console.log("Incident History Error:", error?.response?.data || error);

      setIncidents([]);
    }
  };

  // =========================================================
  // LOAD INCIDENTS
  // =========================================================

  useEffect(() => {
    if (user?._id) {
      fetchIncidents();
    }
  }, [user?._id]);

  // =========================================================
  // REFRESH
  // =========================================================

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchIncidents();
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalRecords = incidents.length;

  // Resolved + Completed are considered finished
  const resolvedCount = incidents.filter(
    (i) => i.status === "Resolved" || i.status === "Completed",
  ).length;

  // Pending + Accepted + Under Review
  const reviewCount = incidents.filter(
    (i) =>
      i.status === "Pending" ||
      i.status === "Under Review" ||
      i.status === "Accepted",
  ).length;

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    switch (status) {
      // =====================================================
      // COMPLETED / RESOLVED
      // =====================================================

      case "Completed":
      case "Resolved":
        return {
          backgroundColor: colors.success + "18",
          color: colors.success,
          icon: "checkmark-circle",
        };

      // =====================================================
      // REJECTED
      // =====================================================

      case "Rejected":
        return {
          backgroundColor: "#EF4444" + "18",
          color: "#EF4444",
          icon: "close-circle",
        };

      // =====================================================
      // ACCEPTED
      // =====================================================

      case "Accepted":
        return {
          backgroundColor: colors.primary + "18",
          color: colors.primary,
          icon: "checkmark-circle-outline",
        };

      // =====================================================
      // UNDER REVIEW
      // =====================================================

      case "Under Review":
        return {
          backgroundColor: colors.warning + "18",
          color: colors.warning,
          icon: "time-outline",
        };

      // =====================================================
      // PENDING
      // =====================================================

      case "Pending":
      default:
        return {
          backgroundColor: colors.warning + "18",
          color: colors.warning,
          icon: "hourglass-outline",
        };
    }
  };

  // =========================================================
  // RENDER
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
      ====================================================== */}

      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={{
          paddingTop: 25,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 26,
          borderBottomRightRadius: 26,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* BACK BUTTON */}

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
          </TouchableOpacity>

          {/* TITLE */}

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
              My Incident History
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                marginTop: 3,
              }}
            >
              Review your reported incidents
            </Text>
          </View>

          {/* HEADER ICON */}

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={21}
              color={colors.textInverse}
            />
          </View>
        </View>
      </LinearGradient>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ===================================================
            SUMMARY CARD
        ==================================================== */}

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 18,
            shadowColor: colors.shadow,
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: {
              width: 0,
              height: 4,
            },
            elevation: 3,
          }}
        >
          {/* TOTAL */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: colors.primary + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="documents-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View
                style={{
                  marginLeft: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                  }}
                >
                  Total Records
                </Text>

                <Text
                  style={{
                    fontSize: 25,
                    fontWeight: "800",
                    color: colors.textPrimary,
                    marginTop: 1,
                  }}
                >
                  {totalRecords}
                </Text>
              </View>
            </View>

            {/* RECORD BADGE */}

            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor:
                  totalRecords > 0 ? colors.primary + "12" : colors.elevated,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color:
                    totalRecords > 0 ? colors.primary : colors.textSecondary,
                }}
              >
                {totalRecords === 0
                  ? "No Records"
                  : totalRecords === 1
                    ? "1 Record"
                    : `${totalRecords} Records`}
              </Text>
            </View>
          </View>

          {/* DIVIDER */}

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 18,
            }}
          />

          {/* STATUS SUMMARY */}

          <View
            style={{
              flexDirection: "row",
            }}
          >
            {/* RESOLVED */}

            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: colors.success + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.success}
                />
              </View>

              <View
                style={{
                  marginLeft: 9,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  Resolved
                </Text>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: colors.textPrimary,
                  }}
                >
                  {resolvedCount}
                </Text>
              </View>
            </View>

            {/* IN REVIEW */}

            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: colors.warning + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.warning}
                />
              </View>

              <View
                style={{
                  marginLeft: 9,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  In Review
                </Text>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: colors.textPrimary,
                  }}
                >
                  {reviewCount}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ===================================================
            SECTION TITLE
        ==================================================== */}

        {incidents.length > 0 && (
          <View
            style={{
              marginBottom: 12,
              marginLeft: 3,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: colors.textPrimary,
              }}
            >
              Incident Records
            </Text>

            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 3,
              }}
            >
              Your reported disciplinary records
            </Text>
          </View>
        )}

        {/* ===================================================
            EMPTY STATE
        ==================================================== */}

        {incidents.length === 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 26,
              paddingHorizontal: 25,
              paddingVertical: 38,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              shadowOpacity: 0.07,
              shadowRadius: 12,
              shadowOffset: {
                width: 0,
                height: 5,
              },
              elevation: 3,
            }}
          >
            {/* ICON */}

            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.primary + "12",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: colors.primary + "12",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={34}
                  color={colors.primary}
                />
              </View>
            </View>

            {/* TITLE */}

            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: colors.textPrimary,
                textAlign: "center",
              }}
            >
              No Incident Records
            </Text>

            {/* DESCRIPTION */}

            <Text
              style={{
                fontSize: 14,
                lineHeight: 21,
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 9,
                maxWidth: 310,
              }}
            >
              You currently have no disciplinary incidents recorded in the
              system.
            </Text>

            {/* INFO */}

            <View
              style={{
                width: "100%",
                marginTop: 24,
                padding: 14,
                borderRadius: 16,
                backgroundColor: colors.background,
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 12,
                  lineHeight: 18,
                  color: colors.textSecondary,
                }}
              >
                Your incident history will appear here if an incident is
                officially recorded under your student account.
              </Text>
            </View>
          </View>
        )}

        {/* ===================================================
            INCIDENT CARDS
        ==================================================== */}

        {incidents.map((item) => {
          const statusStyle = getStatusStyle(item.status);

          return (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 22,
                marginBottom: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                shadowOpacity: 0.07,
                shadowRadius: 10,
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                elevation: 3,
              }}
            >
              {/* TOP ACCENT */}

              <View
                style={{
                  height: 4,
                  backgroundColor: statusStyle.color,
                }}
              />

              <View
                style={{
                  padding: 17,
                }}
              >
                {/* TITLE + STATUS */}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  {/* TITLE */}

                  <View
                    style={{
                      flex: 1,
                      paddingRight: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: colors.textPrimary,
                      }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>

                    {/* DATE */}

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textSecondary}
                      />

                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginLeft: 5,
                        }}
                      >
                        {item.createdAt}
                      </Text>
                    </View>
                  </View>

                  {/* STATUS */}

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 9,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: statusStyle.backgroundColor,
                    }}
                  >
                    <Ionicons
                      name={statusStyle.icon}
                      size={14}
                      color={statusStyle.color}
                    />

                    <Text
                      style={{
                        marginLeft: 4,
                        fontSize: 11,
                        fontWeight: "700",
                        color: statusStyle.color,
                      }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* DETAILS */}

                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 17,
                  }}
                >
                  {/* RISK */}

                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={17}
                      color={
                        item.risk === "Low Risk"
                          ? colors.success
                          : colors.warning
                      }
                    />

                    <View
                      style={{
                        marginLeft: 7,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.textSecondary,
                        }}
                      >
                        Risk Level
                      </Text>

                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: colors.textPrimary,
                          marginTop: 1,
                        }}
                      >
                        {item.risk}
                      </Text>
                    </View>
                  </View>

                  {/* CATEGORY */}

                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={17}
                      color={colors.primary}
                    />

                    <View
                      style={{
                        marginLeft: 7,
                        flex: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.textSecondary,
                        }}
                      >
                        Category
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: colors.textPrimary,
                          marginTop: 1,
                        }}
                      >
                        {item.category}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* DIVIDER */}

                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginVertical: 15,
                  }}
                />

                {/* VIEW DETAILS */}

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => {
                    if (!item.reportId) {
                      console.log("Missing reportId:", item);
                      return;
                    }

                    router.push({
                      pathname: "/historyDetails",
                      params: {
                        id: item.reportId,
                      },
                    });
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary + "10",
                    borderRadius: 13,
                    paddingVertical: 11,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    View Incident Details
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={colors.primary}
                    style={{
                      marginLeft: 7,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
