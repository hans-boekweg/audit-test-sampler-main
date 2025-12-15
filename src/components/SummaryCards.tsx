// (c) All Rights Reserved by Hans Boekweg.

import React from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { SamplingSummary } from "../types";
import { formatCurrency, formatPercentage } from "../utils/samplingLogic";

interface SummaryCardsProps {
  summary: SamplingSummary | null;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = "#1976d2",
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      backgroundColor: "#ffffff",
      border: "1px solid #e8eaed",
      borderRadius: 3,
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: accentColor,
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: "#6b7c93",
            fontWeight: 600,
            letterSpacing: 1,
            fontSize: "0.7rem",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: "#1a2b4a",
            fontWeight: 700,
            mt: 0.5,
            mb: 0.5,
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {trend === "up" && <TrendingUp size={14} color="#2e7d32" />}
            {trend === "down" && <TrendingDown size={14} color="#d32f2f" />}
            <Typography variant="caption" sx={{ color: "#6b7c93" }}>
              {subtitle}
            </Typography>
          </Box>
        )}
      </Box>
      {icon && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            backgroundColor: `${accentColor}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
      )}
    </Box>
  </Paper>
);

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  if (!summary) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: "#fafbfc",
              border: "1px solid #e8eaed",
              borderRadius: 3,
              height: 120,
            }}
          >
            <Typography variant="body2" sx={{ color: "#9ba8b9" }}>
              No data loaded
            </Typography>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
          mb: 3,
        }}
      >
        <StatCard
          title="Material Accounts"
          value={summary.totalMaterialAccounts}
          subtitle={`${summary.totalTransactionsReviewed} transactions reviewed`}
          accentColor="#1976d2"
        />
        <StatCard
          title="Total Value Tested"
          value={formatCurrency(summary.totalValueTested)}
          subtitle="Sum of selected samples"
          accentColor="#2e7d32"
        />
        <StatCard
          title="Coverage"
          value={formatPercentage(summary.coveragePercentage)}
          subtitle={`of ${formatCurrency(
            summary.totalMaterialBalance
          )} material balance`}
          trend={summary.coveragePercentage >= 50 ? "up" : "down"}
          accentColor="#ed6c02"
        />
        <StatCard
          title="Sample Breakdown"
          value={summary.overScopeCount + summary.highValueCount}
          subtitle={`${summary.overScopeCount} over scope, ${summary.highValueCount} high value`}
          accentColor="#9c27b0"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip
          label={`Over Scope Items: ${summary.overScopeCount}`}
          size="small"
          sx={{
            backgroundColor: "rgba(46, 125, 50, 0.1)",
            color: "#2e7d32",
            fontWeight: 500,
          }}
        />
        <Chip
          label={`High Value Items: ${summary.highValueCount}`}
          size="small"
          sx={{
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            color: "#1976d2",
            fontWeight: 500,
          }}
        />
      </Box>
    </Box>
  );
};

export default SummaryCards;
