// (c) All Rights Reserved by Hans Boekweg.

import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  TextField,
  InputAdornment,
  TablePagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, Download, ArrowUpDown } from "lucide-react";
import * as XLSX from "xlsx";
import type { SelectedSample } from "../types";
import { formatCurrency } from "../utils/samplingLogic";

interface DataGridProps {
  samples: SelectedSample[];
}

type SortField = "accountGroup" | "amount" | "date" | "description";
type SortDirection = "asc" | "desc";

const DataGrid: React.FC<DataGridProps> = ({ samples }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("amount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedSamples = useMemo(() => {
    let result = [...samples];

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (sample) =>
          sample.accountGroup.toLowerCase().includes(query) ||
          sample.description.toLowerCase().includes(query) ||
          sample.accountNumber.toLowerCase().includes(query) ||
          (sample.vendor && sample.vendor.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "accountGroup":
          comparison = a.accountGroup.localeCompare(b.accountGroup);
          break;
        case "amount":
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [samples, searchQuery, sortField, sortDirection]);

  const paginatedSamples = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedSamples.slice(start, start + rowsPerPage);
  }, [filteredAndSortedSamples, page, rowsPerPage]);

  const handleExport = () => {
    const exportData = samples.map((sample) => ({
      "Account Name": sample.accountGroup,
      "Account Number": sample.accountNumber,
      Date: sample.date,
      Description: sample.description,
      Amount: sample.amount,
      Reference: sample.reference || "",
      Vendor: sample.vendor || "",
      "Selection Reason":
        sample.selectionReason === "OVER_SCOPE"
          ? "Over Scope"
          : "High Value Key Item",
      "Group Total Balance": sample.groupTotalBalance,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Samples");

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(
      workbook,
      `audit_samples_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  if (samples.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          backgroundColor: "#fafbfc",
          border: "1px solid #e8eaed",
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <ArrowUpDown size={48} color="#d0d5dd" />
        <Typography variant="h6" sx={{ color: "#9ba8b9", mt: 2 }}>
          No samples selected
        </Typography>
        <Typography variant="body2" sx={{ color: "#b8c1cc" }}>
          Upload a file and run sampling to see results
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        border: "1px solid #e8eaed",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2.5,
          borderBottom: "1px solid #e8eaed",
        }}
      >
        <Typography variant="h6" sx={{ color: "#1a2b4a", fontWeight: 600 }}>
          Selected Samples ({samples.length})
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search samples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#9ba8b9" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 250,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#fafbfc",
              },
            }}
          />
          <Tooltip title="Export to Excel">
            <IconButton
              onClick={handleExport}
              sx={{
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.12)",
                },
              }}
            >
              <Download size={20} color="#1976d2" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: "#fafbfc", fontWeight: 600 }}>
                <TableSortLabel
                  active={sortField === "accountGroup"}
                  direction={
                    sortField === "accountGroup" ? sortDirection : "asc"
                  }
                  onClick={() => handleSort("accountGroup")}
                >
                  Account
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: "#fafbfc", fontWeight: 600 }}>
                <TableSortLabel
                  active={sortField === "date"}
                  direction={sortField === "date" ? sortDirection : "asc"}
                  onClick={() => handleSort("date")}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: "#fafbfc", fontWeight: 600 }}>
                <TableSortLabel
                  active={sortField === "description"}
                  direction={
                    sortField === "description" ? sortDirection : "asc"
                  }
                  onClick={() => handleSort("description")}
                >
                  Description
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="right"
                sx={{ backgroundColor: "#fafbfc", fontWeight: 600 }}
              >
                <TableSortLabel
                  active={sortField === "amount"}
                  direction={sortField === "amount" ? sortDirection : "asc"}
                  onClick={() => handleSort("amount")}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: "#fafbfc", fontWeight: 600 }}>
                Selection
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSamples.map((sample, index) => (
              <TableRow
                key={sample.id || index}
                sx={{
                  "&:hover": {
                    backgroundColor: "#fafbfc",
                  },
                }}
              >
                <TableCell>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "#1a2b4a" }}
                    >
                      {sample.accountGroup}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6b7c93" }}>
                      {sample.accountNumber}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "#1a2b4a" }}>
                    {sample.date}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#1a2b4a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={sample.description}
                  >
                    {sample.description}
                  </Typography>
                  {sample.vendor && (
                    <Typography variant="caption" sx={{ color: "#6b7c93" }}>
                      {sample.vendor}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: sample.amount >= 0 ? "#1a2b4a" : "#d32f2f",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatCurrency(sample.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      sample.selectionReason === "OVER_SCOPE"
                        ? "Over Scope"
                        : "High Value"
                    }
                    size="small"
                    sx={{
                      backgroundColor:
                        sample.selectionReason === "OVER_SCOPE"
                          ? "rgba(46, 125, 50, 0.1)"
                          : "rgba(25, 118, 210, 0.1)",
                      color:
                        sample.selectionReason === "OVER_SCOPE"
                          ? "#2e7d32"
                          : "#1976d2",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredAndSortedSamples.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderTop: "1px solid #e8eaed",
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              color: "#6b7c93",
            },
        }}
      />
    </Paper>
  );
};

export default DataGrid;
