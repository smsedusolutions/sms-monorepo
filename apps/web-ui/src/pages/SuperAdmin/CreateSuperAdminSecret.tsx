import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Paper,
  TextField,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  VpnKey,
  ArrowBack,
  CheckCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useApi from "../../queries/useApi";
import { useNotification } from "../../hooks/useNotification";
import { AppButton } from "../../components/shared/AppButton";

interface SecretResponse {
  success: boolean;
  message: string;
}

const CreateSuperAdminSecret: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotification();

  // Form states
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successCreated, setSuccessCreated] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate inputs
    if (!username.trim()) {
      setErrorMessage("Username is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await useApi<SecretResponse>("POST", "/api/auth/super-admin/request-otp", {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success) {
        notify.success(response.message || "Verification code sent successfully.");
        setStep(2);
      } else {
        setErrorMessage(response.message || "Failed to request verification code.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while requesting OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!otp.trim() || otp.length !== 6 || isNaN(Number(otp))) {
      setErrorMessage("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await useApi<SecretResponse>("POST", "/api/auth/super-admin/confirm-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (response.success) {
        notify.success("Super Admin created successfully!");
        setSuccessCreated(true);
        // Automatically redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setErrorMessage(response.message || "Verification failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const textInputStyles = {
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      borderRadius: "10px",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.12)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      "&:hover": {
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        "& fieldset": {
          borderColor: "rgba(255, 255, 255, 0.35)",
        },
      },
      "&.Mui-focused": {
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        boxShadow: "0 0 0 3px rgba(2, 132, 199, 0.25)",
        "& fieldset": {
          borderColor: "#0284C7",
        },
      },
    },
    "& .MuiInputBase-input::placeholder": {
      color: "rgba(255, 255, 255, 0.4)",
      opacity: 1,
    },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #0f172a inset !important",
      WebkitTextFillColor: "#fff !important",
      transition: "background-color 5000s ease-in-out 0s",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        bgcolor: "#0F172A",
        overflow: "hidden",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 450,
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: '8px',
          p: { xs: 3, md: 5 },
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          zIndex: 1,
          transition: "all 0.3s ease-in-out",
        }}
      >
        {successCreated ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              py: 4,
            }}
          >
            <CheckCircle
              sx={{
                fontSize: 80,
                color: "#10b981",
                mb: 3,
                animation: "pulse 2s infinite ease-in-out",
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.08)" },
                },
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff", mb: 2 }}>
              Account Created!
            </Typography>
            <Typography sx={{ color: "#94a3b8", mb: 4 }}>
              The Super Admin account has been registered successfully.
              You will be redirected to the login page shortly...
            </Typography>
            <CircularProgress size={24} sx={{ color: "#0284C7" }} />
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "0.5px",
                  mb: 1,
                }}
              >
                Secure Setup
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                {step === 1
                  ? "Configure credentials for new super administrator"
                  : "An OTP was sent to the master administrator email"}
              </Typography>
            </Box>

            {/* Error alerts */}
            {errorMessage && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#fca5a5",
                  borderRadius: 2,
                  "& .MuiAlert-icon": {
                    color: "#fca5a5",
                  },
                }}
              >
                {errorMessage}
              </Alert>
            )}

            {/* Step 1: Request Credentials */}
            {step === 1 && (
              <Box component="form" onSubmit={handleRequestOtp}>
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#cbd5e1", mb: 1 }}>
                    Username
                  </Typography>
                  <TextField
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. masteradmin"
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: "rgba(255, 255, 255, 0.6)" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textInputStyles}
                  />
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#cbd5e1", mb: 1 }}>
                    Email Address
                  </Typography>
                  <TextField
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. newadmin@example.com"
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: "rgba(255, 255, 255, 0.6)" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textInputStyles}
                  />
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#cbd5e1", mb: 1 }}>
                    Password
                  </Typography>
                  <TextField
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: "rgba(255, 255, 255, 0.6)" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={textInputStyles}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#cbd5e1", mb: 1 }}>
                    Confirm Password
                  </Typography>
                  <TextField
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: "rgba(255, 255, 255, 0.6)" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={textInputStyles}
                  />
                </Box>

                <AppButton
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: '6px',
                    bgcolor: "#0284C7",
                    "&:hover": {
                      bgcolor: "#0369A1",
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} sx={{ color: "#fff" }} />
                  ) : (
                    "Send Verification Code"
                  )}
                </AppButton>
              </Box>
            )}

            {/* Step 2: Confirm OTP */}
            {step === 2 && (
              <Box component="form" onSubmit={handleConfirmOtp}>
                <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 3, textAlign: "center" }}>
                  Please check the master administrator inbox. A 6-digit OTP code has been sent to verify this setup.
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#cbd5e1", mb: 1 }}>
                    Verification Code (OTP)
                  </Typography>
                  <TextField
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    fullWidth
                    inputProps={{ maxLength: 6 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKey sx={{ color: "rgba(255, 255, 255, 0.6)" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textInputStyles}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <AppButton
                    type="button"
                    variant="outlined"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      color: "#cbd5e1",
                      borderRadius: '6px',
                      "&:hover": {
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        background: "rgba(255, 255, 255, 0.05)",
                      },
                    }}
                    startIcon={<ArrowBack />}
                  >
                    Back
                  </AppButton>

                  <AppButton
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      flex: 2,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                      borderRadius: '6px',
                      bgcolor: "#059669",
                      "&:hover": {
                        bgcolor: "#047857",
                      },
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                      "Confirm & Create"
                    )}
                  </AppButton>
                </Box>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default CreateSuperAdminSecret;
