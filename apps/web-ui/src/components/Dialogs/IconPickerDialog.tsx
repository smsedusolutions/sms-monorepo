import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  InputAdornment,
  CircularProgress,
  Grid,
  Tooltip,
  Chip,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { AppInput } from "../shared/AppInput";
import { AppButton } from "../shared/AppButton";
import { DynamicIcon, loadIcons } from "../../utils/Icons";

interface IconPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

const SUGGESTIONS = [
  "school",
  "dashboard",
  "book",
  "user",
  "people",
  "settings",
  "chart",
  "calendar",
  "mail",
  "security",
  "bell",
];

const API_HOSTS = [
  "https://api.iconify.design",
  "https://api.simplesvg.com",
  "https://api.unisvg.com",
];

const IconPickerDialog: React.FC<IconPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  currentIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [icons, setIcons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchIcons = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setIcons([]);
      return;
    }

    setIsLoading(true);
    try {
      let data: any = null;
      for (const host of API_HOSTS) {
        try {
          const response = await fetch(
            `${host}/search?query=${encodeURIComponent(trimmed)}&limit=60`,
          );
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch {
          // Try next fallback host
        }
      }

      if (data && data.icons && Array.isArray(data.icons)) {
        // Pre-load all icon definitions in batch by prefix
        // This takes only a few requests and prevents Cloudflare 429 rate limiting
        await loadIcons(data.icons);
        setIcons(data.icons);
      } else {
        setIcons([]);
      }
    } catch (error) {
      console.error("Failed to fetch icons:", error);
      setIcons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchIcons(searchTerm.trim());
      } else {
        setIcons([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (open) {
      if (currentIcon && !searchTerm) {
        const initialQuery = currentIcon.split(":").pop() || currentIcon;
        setSearchTerm(initialQuery);
      } else if (!searchTerm && icons.length === 0) {
        // Load default suggestions on first open
        setSearchTerm("school");
      } else if (searchTerm.trim() && icons.length === 0) {
        searchIcons(searchTerm.trim());
      }
    }
  }, [open]);

  const handleIconClick = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Select Icon
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <AppInput
          fullWidth
          placeholder="Search icons (e.g. school, people, user, chart)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm("")}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          autoFocus
        />
      </Box>

      {/* Suggested Search Chips */}
      <Box
        sx={{
          px: 3,
          pb: 1.5,
          display: "flex",
          gap: 0.75,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, mr: 0.5 }}
        >
          Suggested:
        </Typography>
        {SUGGESTIONS.map((tag) => {
          const isTagActive = searchTerm.toLowerCase() === tag;
          return (
            <Chip
              key={tag}
              label={tag}
              size="small"
              clickable
              onClick={() => setSearchTerm(tag)}
              variant={isTagActive ? "filled" : "outlined"}
              color={isTagActive ? "primary" : "default"}
              sx={{
                fontSize: "0.72rem",
                height: "24px",
                cursor: "pointer",
              }}
            />
          );
        })}
      </Box>

      <DialogContent dividers sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              width: "100%",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {icons.map((iconName) => {
              const isSelected = currentIcon === iconName;

              return (
                <Grid
                  size={{ xs: 4, sm: 3, md: 2 }}
                  key={iconName}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Tooltip title={iconName} arrow placement="top">
                    <Box sx={{ width: "100%" }}>
                      <AppButton
                        onClick={() => handleIconClick(iconName)}
                        variant={isSelected ? "contained" : "outlined"}
                        color={isSelected ? "primary" : "inherit"}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 1.5,
                          width: "100%",
                          minHeight: "90px",
                          borderColor: isSelected ? "primary.main" : "divider",
                          borderRadius: "10px",
                          backgroundColor: isSelected
                            ? undefined
                            : "background.paper",
                          "&:hover": {
                            backgroundColor: isSelected
                              ? "primary.dark"
                              : "action.hover",
                            borderColor: isSelected
                              ? "primary.dark"
                              : "primary.main",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          },
                          transition: "all 0.2s ease-in-out",
                          textTransform: "none",
                          gap: 1,
                        }}
                      >
                        <DynamicIcon
                          icon={iconName}
                          size={32}
                          color={isSelected ? "#ffffff" : "currentColor"}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            width: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                            fontSize: "0.65rem",
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {iconName.split(":").pop()}
                        </Typography>
                      </AppButton>
                    </Box>
                  </Tooltip>
                </Grid>
              );
            })}

            {!isLoading && icons.length === 0 && (
              <Box sx={{ width: "100%", textAlign: "center", py: 6 }}>
                {searchTerm.trim() ? (
                  <Typography color="text.secondary">
                    No icons found matching "{searchTerm}"
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Type a keyword above or select a suggestion to search for
                      icons.
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Browse thousands of icons powered by Iconify.
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} variant="text" color="inherit">
          Cancel
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default IconPickerDialog;
