// (c) All Rights Reserved by Hans Boekweg.

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Slider,
  Chip,
  Button,
  Divider,
  InputAdornment,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  X,
} from "lucide-react";
import type { SamplingConfig } from "../types";
import { DEFAULT_CONFIG } from "../types";

interface ConfigPanelProps {
  config: SamplingConfig;
  onConfigChange: (config: SamplingConfig) => void;
  disabled?: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onConfigChange,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");

  const handleTMChange = (value: number) => {
    onConfigChange({ ...config, tolerableMisstatement: value });
  };

  const handleScopeChange = (value: number) => {
    onConfigChange({ ...config, testingScope: value });
  };

  const handleSampleSizeChange = (_: Event, value: number | number[]) => {
    onConfigChange({ ...config, sampleSize: value as number });
  };

  const handleAddKeyword = () => {
    if (
      newKeyword.trim() &&
      !config.targetKeywords.includes(newKeyword.trim().toUpperCase())
    ) {
      onConfigChange({
        ...config,
        targetKeywords: [
          ...config.targetKeywords,
          newKeyword.trim().toUpperCase(),
        ],
      });
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    onConfigChange({
      ...config,
      targetKeywords: config.targetKeywords.filter((k) => k !== keyword),
    });
  };

  const handleReset = () => {
    onConfigChange(DEFAULT_CONFIG);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddKeyword();
    }
  };

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
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "#fafbfc",
          },
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Settings size={20} color="#1976d2" />
          <Typography variant="h6" sx={{ color: "#1a2b4a", fontWeight: 600 }}>
            Sampling Configuration
          </Typography>
        </Box>
        <IconButton size="small">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Divider />
        <Box sx={{ p: 3 }}>
          {/* Tolerable Misstatement */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#1a2b4a", fontWeight: 600, mb: 1 }}
            >
              Tolerable Misstatement (TM)
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#6b7c93", display: "block", mb: 1.5 }}
            >
              Accounts must exceed this threshold to be considered material
            </Typography>
            <TextField
              fullWidth
              type="number"
              size="small"
              value={config.tolerableMisstatement}
              onChange={(e) => handleTMChange(Number(e.target.value))}
              disabled={disabled}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fafbfc",
                },
              }}
            />
          </Box>

          {/* Testing Scope */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#1a2b4a", fontWeight: 600, mb: 1 }}
            >
              Testing Scope
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#6b7c93", display: "block", mb: 1.5 }}
            >
              Transactions above this value are prioritized for sampling
            </Typography>
            <TextField
              fullWidth
              type="number"
              size="small"
              value={config.testingScope}
              onChange={(e) => handleScopeChange(Number(e.target.value))}
              disabled={disabled}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fafbfc",
                },
              }}
            />
          </Box>

          {/* Sample Size */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ color: "#1a2b4a", fontWeight: 600 }}
              >
                Samples per Account
              </Typography>
              <Chip
                label={config.sampleSize}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7c93", display: "block", mb: 2 }}
            >
              Number of transactions to select from each material account
            </Typography>
            <Slider
              value={config.sampleSize}
              onChange={handleSampleSizeChange}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: "1" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
              ]}
              disabled={disabled}
              sx={{
                "& .MuiSlider-markLabel": {
                  fontSize: "0.75rem",
                  color: "#9ba8b9",
                },
              }}
            />
          </Box>

          {/* Target Keywords */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#1a2b4a", fontWeight: 600, mb: 1 }}
            >
              Target Keywords (Optional)
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#6b7c93", display: "block", mb: 1.5 }}
            >
              Filter to accounts containing these keywords. Leave empty to
              include all accounts.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#fafbfc",
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddKeyword}
                disabled={disabled || !newKeyword.trim()}
                sx={{ minWidth: "auto", px: 2 }}
              >
                <Plus size={18} />
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {config.targetKeywords.map((keyword) => (
                <Chip
                  key={keyword}
                  label={keyword}
                  size="small"
                  onDelete={
                    disabled ? undefined : () => handleRemoveKeyword(keyword)
                  }
                  deleteIcon={<X size={14} />}
                  sx={{
                    backgroundColor: "rgba(25, 118, 210, 0.08)",
                    color: "#1976d2",
                    fontWeight: 500,
                    "& .MuiChip-deleteIcon": {
                      color: "#1976d2",
                      "&:hover": {
                        color: "#1565c0",
                      },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Reset Button */}
          <Button
            variant="text"
            size="small"
            startIcon={<RotateCcw size={16} />}
            onClick={handleReset}
            disabled={disabled}
            sx={{
              color: "#6b7c93",
              "&:hover": {
                backgroundColor: "rgba(107, 124, 147, 0.08)",
              },
            }}
          >
            Reset to Defaults
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ConfigPanel;
