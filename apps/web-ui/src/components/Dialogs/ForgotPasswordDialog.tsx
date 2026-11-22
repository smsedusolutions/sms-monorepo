import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Visibility,
  VisibilityOff,
  CheckCircleRounded,
  LockOutlined,
  EmailOutlined,
} from '@mui/icons-material';
import { AppInput } from '../shared/AppInput';
import { AppButton } from '../shared/AppButton';
import {
  useRequestPasswordResetOtp,
  useVerifyPasswordResetOtp,
  useResetPasswordWithOtp,
} from '../../queries/Auth';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccessRedirect?: (email: string) => void;
  primaryColor?: string;
}

type Step = 'email' | 'otp' | 'password' | 'success';

// ── 6-Digit Individual OTP Input Boxes ──────────────────────
interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  primaryColor: string;
}

const SixDigitOtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  disabled,
  hasError,
  primaryColor,
}) => {
  const theme = useTheme();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Array of 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawChar = e.target.value.replace(/\D/g, '');
    if (!rawChar) {
      // Empty / deleted
      const updated = digits.slice();
      updated[index] = '';
      onChange(updated.join(''));
      return;
    }

    // Single digit input
    const char = rawChar.slice(-1);
    const updated = digits.slice();
    updated[index] = char;
    const combined = updated.join('').slice(0, 6);
    onChange(combined);

    // Auto advance to next box
    if (index < 5 && char) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const targetIdx = Math.min(pasted.length, 5);
    inputsRef.current[targetIdx]?.focus();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: 0.75, sm: 1.25 },
        my: 2.5,
      }}
      onPaste={handlePaste}
    >
      {digits.map((digit, idx) => (
        <Box
          key={idx}
          component="input"
          ref={(el: HTMLInputElement | null) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={idx === 0}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, e)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(idx, e)}
          sx={{
            width: { xs: 44, sm: 54 },
            height: { xs: 50, sm: 58 },
            borderRadius: '14px',
            border: '1.5px solid',
            borderColor: hasError
              ? theme.palette.error.main
              : digit
              ? primaryColor
              : theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(0,0,0,0.12)',
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.015)',
            color: theme.palette.text.primary,
            fontSize: { xs: '1.25rem', sm: '1.45rem' },
            fontWeight: 800,
            textAlign: 'center',
            outline: 'none',
            fontFamily: 'monospace',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: digit
              ? `0 0 0 1px ${alpha(primaryColor, 0.25)}`
              : 'none',
            '&:focus': {
              borderColor: primaryColor,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#fff',
              boxShadow: `0 0 0 3px ${alpha(primaryColor, 0.15)}`,
              transform: 'translateY(-1px)',
            },
          }}
        />
      ))}
    </Box>
  );
};

// ── Main ForgotPasswordDialog Component ─────────────────────
const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  open,
  onClose,
  initialEmail = '',
  onSuccessRedirect,
  primaryColor,
}) => {
  const theme = useTheme();
  const primary = primaryColor || theme.palette.primary.main;

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const requestOtpMutation = useRequestPasswordResetOtp();
  const verifyOtpMutation = useVerifyPasswordResetOtp();
  const resetPasswordMutation = useResetPasswordWithOtp();

  // Reset state on open
  useEffect(() => {
    if (open) {
      setEmail(initialEmail || '');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setStep('email');
      setResendTimer(0);
    }
  }, [open, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      await requestOtpMutation.mutateAsync({ email: trimmed });
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'No account found with this email. Please verify and try again.'
      );
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (otp.length < 6) {
      setErrorMessage('Please enter all 6 digits of your verification code');
      return;
    }

    try {
      await verifyOtpMutation.mutateAsync({ email: email.trim(), otp: otp.trim() });
      setStep('password');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid or expired verification code');
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset password. Please try again.');
    }
  };

  const handleFinish = () => {
    onClose();
    if (onSuccessRedirect) {
      onSuccessRedirect(email.trim());
    }
  };

  const isSubmitting =
    requestOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    resetPasswordMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: { xs: '92vw', sm: 490 },
          borderRadius: { xs: 3, sm: '24px' },
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 24px 70px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 24px 60px -10px rgba(15, 23, 42, 0.16), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          p: { xs: 3, sm: 4.5 },
          overflow: 'hidden',
          position: 'relative',
        },
      }}
    >
      {/* Top Floating Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          mb: 2.5,
        }}
      >
        {/* Back Button for multi-step */}
        {step !== 'email' && step !== 'success' ? (
          <IconButton
            onClick={() => {
              setErrorMessage('');
              if (step === 'otp') setStep('email');
              if (step === 'password') setStep('otp');
            }}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              p: 0.75,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: theme.palette.divider,
              '&:hover': { color: theme.palette.text.primary, bgcolor: 'action.hover' },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        ) : (
          <Box sx={{ width: 32 }} />
        )}

        {/* Subtle Pill Step Indicator */}
        {step !== 'success' && (
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
            <Box
              sx={{
                width: 28,
                height: 4,
                borderRadius: 2,
                bgcolor: primary,
                transition: 'all 0.3s ease',
              }}
            />
            <Box
              sx={{
                width: 28,
                height: 4,
                borderRadius: 2,
                bgcolor:
                  step === 'otp' || step === 'password'
                    ? primary
                    : alpha(theme.palette.divider, 0.6),
                transition: 'all 0.3s ease',
              }}
            />
            <Box
              sx={{
                width: 28,
                height: 4,
                borderRadius: 2,
                bgcolor:
                  step === 'password'
                    ? primary
                    : alpha(theme.palette.divider, 0.6),
                transition: 'all 0.3s ease',
              }}
            />
          </Box>
        )}

        {/* Close Button */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            p: 0.75,
            borderRadius: '10px',
            '&:hover': { color: theme.palette.text.primary, bgcolor: 'action.hover' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Error Alert */}
      {errorMessage && (
        <Fade in>
          <Alert
            severity="error"
            onClose={() => setErrorMessage('')}
            sx={{
              mb: 3,
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </Alert>
        </Fade>
      )}

      {/* ── STEP 1: Enter Email ──────────────────────────────── */}
      {step === 'email' && (
        <Box component="form" onSubmit={handleSendOtp}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: theme.palette.text.primary,
                fontSize: { xs: '1.45rem', sm: '1.65rem' },
                lineHeight: 1.25,
                mb: 1,
              }}
            >
              Reset your password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.55,
                fontSize: '0.92rem',
              }}
            >
              Enter the email address registered with your school portal and we’ll send you a 6-digit
              verification code.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.75,
                fontSize: '0.82rem',
              }}
            >
              Email Address
            </Typography>
            <AppInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@school.edu"
              autoFocus
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  height: 48,
                },
              }}
            />
          </Box>

          <AppButton
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || !email.trim()}
            sx={{
              height: 48,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              bgcolor: primary,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(primary, 0.9),
                boxShadow: `0 6px 16px ${alpha(primary, 0.28)}`,
              },
            }}
          >
            {isSubmitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>Sending Code...</span>
              </Box>
            ) : (
              'Send Verification Code'
            )}
          </AppButton>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Remember your password?{' '}
              <Typography
                component="span"
                onClick={onClose}
                sx={{
                  fontWeight: 700,
                  color: primary,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Sign In
              </Typography>
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── STEP 2: Enter 6-Digit OTP ────────────────────────── */}
      {step === 'otp' && (
        <Box component="form" onSubmit={handleVerifyOtp}>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: theme.palette.text.primary,
                fontSize: { xs: '1.45rem', sm: '1.65rem' },
                lineHeight: 1.25,
                mb: 1,
              }}
            >
              Check your email
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.55,
                fontSize: '0.92rem',
              }}
            >
              We sent a 6-digit verification code to{' '}
              <Box
                component="span"
                sx={{ fontWeight: 700, color: theme.palette.text.primary }}
              >
                {email}
              </Box>
            </Typography>
          </Box>

          {/* 6 Individual Digit Inputs */}
          <SixDigitOtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={isSubmitting}
            hasError={!!errorMessage}
            primaryColor={primary}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              px: 0.5,
            }}
          >
            <Typography
              variant="caption"
              onClick={() => {
                setStep('email');
                setOtp('');
                setErrorMessage('');
              }}
              sx={{
                color: theme.palette.text.secondary,
                cursor: 'pointer',
                fontWeight: 600,
                '&:hover': { color: primary, textDecoration: 'underline' },
              }}
            >
              Change email
            </Typography>

            {resendTimer > 0 ? (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
              >
                Resend in {resendTimer}s
              </Typography>
            ) : (
              <Typography
                variant="caption"
                onClick={() => handleSendOtp()}
                sx={{
                  color: primary,
                  cursor: 'pointer',
                  fontWeight: 700,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Resend code
              </Typography>
            )}
          </Box>

          <AppButton
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || otp.length !== 6}
            sx={{
              height: 48,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              bgcolor: primary,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(primary, 0.9),
                boxShadow: `0 6px 16px ${alpha(primary, 0.28)}`,
              },
            }}
          >
            {isSubmitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>Verifying...</span>
              </Box>
            ) : (
              'Verify & Continue'
            )}
          </AppButton>
        </Box>
      )}

      {/* ── STEP 3: Enter New Password ───────────────────────── */}
      {step === 'password' && (
        <Box component="form" onSubmit={handleResetPassword}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: theme.palette.text.primary,
                fontSize: { xs: '1.45rem', sm: '1.65rem' },
                lineHeight: 1.25,
                mb: 1,
              }}
            >
              Create new password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.55,
                fontSize: '0.92rem',
              }}
            >
              Your new password must be at least 6 characters long.
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.75,
                fontSize: '0.82rem',
              }}
            >
              New Password
            </Typography>
            <AppInput
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  height: 48,
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.75,
                fontSize: '0.82rem',
              }}
            >
              Confirm New Password
            </Typography>
            <AppInput
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  height: 48,
                },
              }}
            />
          </Box>

          <AppButton
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || !newPassword || !confirmPassword}
            sx={{
              height: 48,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              bgcolor: primary,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(primary, 0.9),
                boxShadow: `0 6px 16px ${alpha(primary, 0.28)}`,
              },
            }}
          >
            {isSubmitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>Updating Password...</span>
              </Box>
            ) : (
              'Save New Password'
            )}
          </AppButton>
        </Box>
      )}

      {/* ── STEP 4: Success State ────────────────────────────── */}
      {step === 'success' && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              bgcolor: alpha(primary, 0.1),
              color: primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <CheckCircleRounded sx={{ fontSize: 40 }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Password updated!
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              mb: 3.5,
              maxWidth: 340,
              mx: 'auto',
              fontSize: '0.92rem',
            }}
          >
            Your account password has been updated securely. You can now use your new password to sign
            in.
          </Typography>

          <AppButton
            fullWidth
            variant="contained"
            onClick={handleFinish}
            sx={{
              height: 48,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              bgcolor: primary,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(primary, 0.9),
                boxShadow: `0 6px 16px ${alpha(primary, 0.28)}`,
              },
            }}
          >
            Return to Sign In
          </AppButton>
        </Box>
      )}
    </Dialog>
  );
};

export default ForgotPasswordDialog;
