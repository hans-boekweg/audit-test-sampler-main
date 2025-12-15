// (c) All Rights Reserved by Hans Boekweg.

import React, { useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { BarChart3, Play, RefreshCw } from "lucide-react";
import FileUpload from "./components/FileUpload";
import ConfigPanel from "./components/ConfigPanel";
import SummaryCards from "./components/SummaryCards";
import DataGrid from "./components/DataGrid";
import type { Transaction, SamplingConfig, SamplingResults } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { performSampling } from "./utils/samplingLogic";

// FinTech Theme - Clean whites, soft grays, deep navies
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#1a2b4a",
      light: "#3d5a80",
      dark: "#0d1b2a",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a2b4a",
      secondary: "#6b7c93",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 20px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.35)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [config, setConfig] = useState<SamplingConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<SamplingResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleDataLoaded = useCallback((data: Transaction[]) => {
    setRawData(data);
    setResults(null);
    setError(null);
    setSnackbar({
      open: true,
      message: `Successfully loaded ${data.length} transactions`,
      severity: "success",
    });
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: "error",
    });
  }, []);

  const handleRunSampling = useCallback(() => {
    if (rawData.length === 0) {
      handleError("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const samplingResults = performSampling(rawData, config);
        setResults(samplingResults);

        if (samplingResults.samples.length === 0) {
          setSnackbar({
            open: true,
            message: "No material accounts found matching the criteria",
            severity: "error",
          });
        } else {
          setSnackbar({
            open: true,
            message: `Selected ${samplingResults.samples.length} samples from ${samplingResults.summary.totalMaterialAccounts} material accounts`,
            severity: "success",
          });
        }
      } catch (err) {
        handleError(
          `Sampling error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [rawData, config, handleError]);

  const handleReset = useCallback(() => {
    setRawData([]);
    setResults(null);
    setConfig(DEFAULT_CONFIG);
    setError(null);
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
        {/* Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e8eaed",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart3 size={24} color="#ffffff" />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: "secondary.main",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  Audit Sampler Pro
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  Professional Expense Sampling Tool
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={handleReset}
                disabled={rawData.length === 0}
                sx={{
                  borderColor: "#e0e4e8",
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: "#c0c8d0",
                    backgroundColor: "#fafbfc",
                  },
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<Play size={18} />}
                onClick={handleRunSampling}
                disabled={rawData.length === 0 || isProcessing}
              >
                {isProcessing ? "Processing..." : "Run Sampling"}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "350px 1fr" },
              gap: 4,
            }}
          >
            {/* Left Sidebar */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* File Upload */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    mb: 1.5,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontSize: "0.7rem",
                  }}
                >
                  Data Source
                </Typography>
                <FileUpload
                  onDataLoaded={handleDataLoaded}
                  onError={handleError}
                  isProcessing={isProcessing}
                />
              </Box>

              {/* Configuration Panel */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    mb: 1.5,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontSize: "0.7rem",
                  }}
                >
                  Settings
                </Typography>
                <ConfigPanel
                  config={config}
                  onConfigChange={setConfig}
                  disabled={isProcessing}
                />
              </Box>

              {/* Data Info */}
              {rawData.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                    borderRadius: 2,
                    border: "1px solid rgba(25, 118, 210, 0.12)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Data Loaded
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {rawData.length.toLocaleString()} transactions ready for
                    sampling
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Main Content Area */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Summary Cards */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    mb: 1.5,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontSize: "0.7rem",
                  }}
                >
                  Dashboard
                </Typography>
                <SummaryCards summary={results?.summary || null} />
              </Box>

              {/* Data Grid */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    mb: 1.5,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontSize: "0.7rem",
                  }}
                >
                  Results
                </Typography>
                <DataGrid samples={results?.samples || []} />
              </Box>
            </Box>
          </Box>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: "auto",
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e8eaed",
          }}
        >
          <Container maxWidth="xl">
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block",
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} All Rights Reserved by Hans Boekweg.
              Built for secure, client-side audit sampling.
            </Typography>
          </Container>
        </Box>

        {/* Snackbar Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App;
