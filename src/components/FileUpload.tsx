// (c) All Rights Reserved by Hans Boekweg.

import React, { useCallback, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { Upload, FileSpreadsheet, X, CheckCircle } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Transaction } from "../types";
import {
  parseRawData,
  detectHierarchicalGLFormat,
  parseHierarchicalGL,
} from "../utils/samplingLogic";

interface FileUploadProps {
  onDataLoaded: (data: Transaction[]) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onDataLoaded,
  onError,
  isProcessing,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const processFile = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      setUploadProgress(10);

      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      try {
        if (fileExtension === "csv") {
          // Parse CSV with Papaparse
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              setUploadProgress(70);
              if (results.errors.length > 0) {
                console.warn("CSV parsing warnings:", results.errors);
              }
              const transactions = parseRawData(
                results.data as Record<string, unknown>[]
              );
              setUploadProgress(100);
              onDataLoaded(transactions);
            },
            error: (error) => {
              onError(`CSV parsing error: ${error.message}`);
              setUploadedFile(null);
            },
          });
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
          // Parse Excel with SheetJS
          const reader = new FileReader();
          reader.onload = (e) => {
            setUploadProgress(40);
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: "array" });
              setUploadProgress(60);

              // Get the first sheet
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];

              // Convert to array of arrays to detect hierarchical GL format
              const rawData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
              }) as unknown[][];
              setUploadProgress(70);

              let transactions: Transaction[];

              // Detect if this is a hierarchical GL format (account names in column A, data in subsequent columns)
              // Check for header row pattern: first few rows are title/headers, then a row with column names
              const isHierarchicalGL = detectHierarchicalGLFormat(rawData);

              if (isHierarchicalGL) {
                transactions = parseHierarchicalGL(rawData);
              } else {
                // Standard flat format - use original parsing
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                transactions = parseRawData(
                  jsonData as Record<string, unknown>[]
                );
              }

              setUploadProgress(100);
              onDataLoaded(transactions);
            } catch (err) {
              onError(
                `Excel parsing error: ${
                  err instanceof Error ? err.message : "Unknown error"
                }`
              );
              setUploadedFile(null);
            }
          };
          reader.onerror = () => {
            onError("Failed to read file");
            setUploadedFile(null);
          };
          reader.readAsArrayBuffer(file);
        } else {
          onError(
            "Unsupported file format. Please upload a CSV or Excel file."
          );
          setUploadedFile(null);
        }
      } catch (err) {
        onError(
          `File processing error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setUploadedFile(null);
      }
    },
    [onDataLoaded, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleClearFile = useCallback(() => {
    setUploadedFile(null);
    setUploadProgress(0);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        backgroundColor: isDragActive ? "rgba(25, 118, 210, 0.04)" : "#fafbfc",
        border: "2px dashed",
        borderColor: isDragActive ? "primary.main" : "#e0e4e8",
        borderRadius: 3,
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
        "&:hover": {
          borderColor: "primary.light",
          backgroundColor: "rgba(25, 118, 210, 0.02)",
        },
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        id="file-upload"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      {!uploadedFile ? (
        <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={32} color="#1976d2" />
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                sx={{ color: "#1a2b4a", fontWeight: 600, mb: 0.5 }}
              >
                Upload General Ledger File
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7c93" }}>
                Drag and drop your CSV or Excel file here, or click to browse
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#9ba8b9", mt: 1, display: "block" }}
              >
                Supported formats: .csv, .xlsx, .xls
              </Typography>
            </Box>
          </Box>
        </label>
      ) : (
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor:
                    uploadProgress === 100
                      ? "rgba(46, 125, 50, 0.08)"
                      : "rgba(25, 118, 210, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {uploadProgress === 100 ? (
                  <CheckCircle size={24} color="#2e7d32" />
                ) : (
                  <FileSpreadsheet size={24} color="#1976d2" />
                )}
              </Box>
              <Box>
                <Typography
                  variant="body1"
                  sx={{ color: "#1a2b4a", fontWeight: 500 }}
                >
                  {uploadedFile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b7c93" }}>
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={handleClearFile}
              sx={{ color: "#9ba8b9" }}
            >
              <X size={18} />
            </IconButton>
          </Box>

          {uploadProgress < 100 && (
            <Box sx={{ width: "100%" }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#e8eaed",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: "#6b7c93", mt: 1, display: "block" }}
              >
                {isProcessing ? "Processing data..." : "Parsing file..."}
              </Typography>
            </Box>
          )}

          {uploadProgress === 100 && (
            <Alert
              severity="success"
              sx={{
                backgroundColor: "rgba(46, 125, 50, 0.08)",
                border: "none",
                "& .MuiAlert-icon": {
                  color: "#2e7d32",
                },
              }}
            >
              File uploaded successfully! Review the configuration and run
              sampling.
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default FileUpload;
