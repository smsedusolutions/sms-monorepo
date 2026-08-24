import React, { useState, useEffect } from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  type SxProps,
  type Theme,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";

export interface AppSearchInputProps {
  onSearch: (value: string) => void;
  value?: string;
  initialValue?: string;
  placeholder?: string;
  label?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  minWidth?: number | string;
}

export const AppSearchInput: React.FC<AppSearchInputProps> = ({
  onSearch,
  value,
  initialValue = "",
  placeholder = "Search...",
  label = "Search",
  size = "small",
  fullWidth = false,
  sx,
  minWidth = 240,
}) => {
  const [searchTerm, setSearchTerm] = useState(value !== undefined ? value : initialValue);

  useEffect(() => {
    if (value !== undefined) {
      setSearchTerm(value);
    }
  }, [value]);

  const handleTriggerSearch = () => {
    onSearch(searchTerm.trim());
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTriggerSearch();
    }
  };

  return (
    <TextField
      label={label}
      variant="outlined"
      size={size}
      fullWidth={fullWidth}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      sx={{ minWidth, ...sx }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {searchTerm && (
              <Tooltip title="Clear search">
                <IconButton size="small" onClick={handleClear} edge="end" sx={{ mr: 0.5 }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Click to search">
              <IconButton size="small" color="primary" onClick={handleTriggerSearch} edge="end">
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
    />
  );
};
