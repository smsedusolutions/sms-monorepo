import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Fade,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  School as SchoolIcon,
  ArrowForward,
  VerifiedUser,
  LocationOn,
  Phone,
  Language,
} from '@mui/icons-material';
import { useLogin, useRecordConsent } from '../queries/Auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TokenService from '../queries/token/tokenService';
import { useUserStore } from '../stores/userStore';
import { useRoleStore } from '../stores/roleStore';
import { AppInput } from '../components/shared/AppInput';
import { AppButton } from '../components/shared/AppButton';
import useSubdomainSchool from '../hooks/useSubdomainSchool';
import LoginPageSkeleton from '../components/login/LoginPageSkeleton';
import CustomLoginPage from '../components/login/CustomLoginPage';
import LegalFooter from '../components/shared/LegalFooter';

interface LoginForm { email: string; password: string; }
interface LoginErrors { email?: string; password?: string; }

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  // DPDP Act §6 — explicit opt-in consent before processing personal data
  // [LEGAL REVIEW REQUIRED] Consent wording below must be reviewed by a lawyer
  const [consentGiven, setConsentGiven] = useState(false);

  const loginMutation = useLogin();
  const recordConsentMutation = useRecordConsent();
  const isLoading = loginMutation.isPending;
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { fetchProfile } = useUserStore();
  const { school, isLoading: isBrandingLoading } = useSubdomainSchool();

  const primary = school?.loginTheme?.primaryColor || '#6366F1';
  const accent = school?.loginTheme?.accentColor || '#8B5CF6';
  const panelBg = school?.loginTheme?.backgroundColor || '#0B0F1A';

  useEffect(() => {
    document.title = school?.schoolName
      ? `Login — ${school.schoolName}`
      : 'Login — SMS Edu Solution';
    if (school?.schoolLogo) {
      const link =
        (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
        document.createElement('link');
      link.rel = 'shortcut icon';
      link.href = school.schoolLogo;
      document.head.appendChild(link);
    }
  }, [school]);

  useEffect(() => {
    if (isAuthenticated) {
      const role = TokenService.getRole();
      if (role) navigate(getRedirectPath(role));
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name as keyof LoginErrors])
      setErrors((p) => ({ ...p, [name]: undefined }));
    if (loginError) setLoginError('');
  };

  const getRedirectPath = (role: string) => {
    if (!role) return '/';
    const base = useRoleStore.getState().getBasePath(role);
    if (base) return `${base}/dashboard`;
    const map: Record<string, string> = {
      super_admin: '/super-admin',
      sch_admin: '/school-admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
      driver: '/driver',
      principal: '/principal',
    };
    return map[role.toLowerCase()] ? `${map[role.toLowerCase()]}/dashboard` : '/';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: LoginErrors = {};
    if (!formData.email) errs.email = 'Email is required';
    if (!formData.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    loginMutation.mutate(
      { ...formData, rememberMe },
      {
        onSuccess: (res: any) => {
          if (res?.data?.token) {
            login(res.data.token);
            fetchProfile(); // fire-and-forget — don't block navigation

            // Record DPDP consent record in backend (fire-and-forget)
            const user = res?.data?.user;
            if (consentGiven && user) {
              recordConsentMutation.mutate({
                userId: user.userId || user.adminId || formData.email,
                schoolId: user.schoolId || null,
                role: user.role || 'student',
                email: user.email || formData.email,
                source: 'login',
              });
            }

            navigate(getRedirectPath(TokenService.getRole() || 'super_admin'));
          } else {
            setLoginError('Invalid server response - no token received');
          }
        },
        onError: (err: any) => {
          setLoginError(
            err?.response?.data?.message ||
            'Login failed. Please check credentials.'
          );
        },
      }
    );
  };

  const handleCustomLoginSubmit = (payload: {
    email: string;
    password: string;
  }) => {
    loginMutation.mutate(
      { ...payload, rememberMe },
      {
        onSuccess: (res: any) => {
          if (res?.data?.token) {
            login(res.data.token);
            fetchProfile(); // fire-and-forget — don't block navigation

            const user = res?.data?.user;
            if (user) {
              recordConsentMutation.mutate({
                userId: user.userId || user.adminId || payload.email,
                schoolId: user.schoolId || null,
                role: user.role || 'student',
                email: user.email || payload.email,
                source: 'login',
              });
            }

            navigate(
              getRedirectPath(TokenService.getRole() || 'super_admin')
            );
          }
        },
        onError: (err: any) =>
          setLoginError(
            err?.response?.data?.message || 'Login failed.'
          ),
      }
    );
  };

  // ─── Loading & Custom HTML states ─────────────────────────
  if (isBrandingLoading) return <LoginPageSkeleton />;
  if (school?.loginTheme?.customLoginHtml) {
    return (
      <CustomLoginPage
        html={school.loginTheme.customLoginHtml}
        onLoginSubmit={handleCustomLoginSubmit}
      />
    );
  }

  // ─── Main render ──────────────────────────────────────────
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: panelBg,
        overflow: 'hidden',
      }}
    >
      {/* ════════════════════════════════════════════
          LEFT PANEL — Dark branded side
      ════════════════════════════════════════════ */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          position: 'relative',
          p: '44px 56px',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* ── Decorative elements ── */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: 80,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primary}25 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        {/* ── Collab header ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* School logo + name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {school?.schoolLogo ? (
              <Box
                component="img"
                src={school.schoolLogo}
                alt={school.schoolName}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  objectFit: 'contain',
                  bgcolor: 'white',
                  p: '5px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${primary}, ${accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 6px 20px ${primary}50`,
                  flexShrink: 0,
                }}
              >
                <SchoolIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            )}
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'white',
                  lineHeight: 1.25,
                  letterSpacing: '-0.3px',
                  maxWidth: 180,
                }}
              >
                {school?.schoolName || 'SMS Edu Solution'}
              </Typography>
              {school && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.4,
                    mt: 0.5,
                    px: 0.8,
                    py: 0.2,
                    bgcolor: `${primary}25`,
                    borderRadius: '6px',
                  }}
                >
                  <VerifiedUser sx={{ fontSize: 9, color: primary }} />
                  <Typography
                    sx={{
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      color: primary,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Official School Portal
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {school && (
            <>
              {/* Vertical separator */}
              <Box
                sx={{
                  mx: 2.5,
                  width: '1px',
                  height: 40,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  flexShrink: 0,
                }}
              />
              {/* SMS logo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(99,102,241,0.4)',
                    flexShrink: 0,
                  }}
                >
                  <SchoolIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: 'white',
                      lineHeight: 1,
                      letterSpacing: '-0.3px',
                    }}
                  >
                    SMS Edu
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.35)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      mt: 0.2,
                    }}
                  >
                    Solutions
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>

        {/* ── Hero section ── */}
        <Box sx={{ my: 'auto', position: 'relative', zIndex: 1, py: 2 }}>
          {school ? (
            <>
              <Typography
                sx={{
                  fontSize: '1.6rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                Welcome to
              </Typography>
              <Typography
                sx={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: primary,
                  letterSpacing: '-1.5px',
                  mb: 2,
                }}
              >
                {school.schoolName}
              </Typography>
            </>
          ) : (
            <Typography
              sx={{
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 900,
                lineHeight: 1.08,
                mb: 2,
                background:
                  'linear-gradient(135deg, #F8FAFC 0%, #C7D2FE 60%, #A5B4FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1.5px',
              }}
            >
              Elevate Your School's Potential.
            </Typography>
          )}

          {/* Accent line */}
          <Box
            sx={{
              width: 44,
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${primary}, ${accent})`,
              mb: 2.5,
            }}
          />

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.8)',
              mb: 0.5,
            }}
          >
            {school?.schoolTagline || 'Smart. Simple. Connected.'}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.7,
              maxWidth: 360,
            }}
          >
            {school
              ? 'Powered by SMS Edu Solution — the all-in-one school management platform for a better tomorrow.'
              : 'The all-in-one solution for modern school management. Streamline administrative tasks and engage parents effortlessly.'}
          </Typography>
        </Box>

        {/* ── Bottom info section ── */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            mt: 'auto',
          }}
        >
          {school?.schoolAddress && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '9px',
                  bgcolor: `${primary}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LocationOn sx={{ fontSize: 16, color: primary }} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {school.schoolAddress}
              </Typography>
            </Box>
          )}

          {(school?.schoolEmail || school?.schoolContact) && (
            <Box sx={{ display: 'flex', gap: 1.25 }}>
              {school?.schoolEmail && (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 2,
                    py: 1.25,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                  }}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '8px',
                      bgcolor: '#10B98120',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Email sx={{ fontSize: 14, color: '#10B981' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      color: 'rgba(255,255,255,0.6)',
                      fontWeight: 500,
                    }}
                  >
                    {school.schoolEmail}
                  </Typography>
                </Box>
              )}
              {school?.schoolContact && (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 2,
                    py: 1.25,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                  }}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '8px',
                      bgcolor: '#F59E0B20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Phone sx={{ fontSize: 14, color: '#F59E0B' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      color: 'rgba(255,255,255,0.6)',
                      fontWeight: 500,
                    }}
                  >
                    {school.schoolContact}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {school?.schoolWebsite && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 2,
                py: 1.25,
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '8px',
                  bgcolor: '#3B82F620',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Language sx={{ fontSize: 14, color: '#3B82F6' }} />
              </Box>
              <Typography
                component="a"
                href={school.schoolWebsite}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: '0.78rem',
                  color: '#3B82F6',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {school.schoolWebsite.replace(/^https?:\/\//, '')}
              </Typography>
            </Box>
          )}

          {/* Stats when no school */}
          {!school && (
            <Box
              sx={{
                display: 'flex',
                gap: 5,
                pt: 3,
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {[
                ['500+', 'Schools'],
                ['50K+', 'Students'],
                ['99.9%', 'Uptime'],
              ].map(([num, label]) => (
                <Box key={label}>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.35rem',
                      color: 'white',
                      lineHeight: 1,
                    }}
                  >
                    {num}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.35)',
                      fontWeight: 500,
                      mt: 0.3,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* ════════════════════════════════════════════
          RIGHT PANEL — Floating card with curved left edge
      ════════════════════════════════════════════ */}
      <Box
        sx={{
          width: { xs: '100%', md: '520px', lg: '560px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 5,
          p: { xs: 0, md: '24px 32px 24px 0' },
        }}
      >
        <Fade in timeout={600}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: { xs: 0, md: '28px' },
              p: { xs: '32px 24px', sm: '40px 44px' },
              width: '100%',
              height: { xs: '100%', md: 'calc(100vh - 48px)' },
              maxHeight: { md: 'calc(100vh - 48px)' },
              overflowY: 'auto',
              boxShadow: {
                xs: 'none',
                md: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
              },
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Secure Login badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 24,
                right: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.4,
                bgcolor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
              }}
            >
              <VerifiedUser sx={{ fontSize: 11, color: '#16A34A' }} />
              <Typography
                sx={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#16A34A',
                  letterSpacing: '0.04em',
                }}
              >
                Secure Login
              </Typography>
            </Box>

            {/* Top spacer for the badge */}
            <Box sx={{ height: 8 }} />

            {/* Heading */}
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: '1.75rem',
                  color: '#0F172A',
                  letterSpacing: '-1px',
                  lineHeight: 1.2,
                  mb: 1,
                }}
              >
                Welcome Back! 👋
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.88rem',
                  color: '#64748B',
                  lineHeight: 1.5,
                }}
              >
                {school
                  ? `Sign in to access ${school.schoolName} portal`
                  : 'Enter your credentials to access your dashboard'}
              </Typography>
            </Box>

            {/* ── Form ── */}
            <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1 }}>
              {loginError && (
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: '12px', fontSize: '0.85rem' }}
                >
                  {loginError}
                </Alert>
              )}

              <AppInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="name@school.edu"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ fontSize: 18, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: primary },
                    '&.Mui-focused fieldset': { borderColor: primary },
                  },
                }}
              />

              <Box sx={{ position: 'relative', mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 3,
                    zIndex: 1,
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: primary,
                    fontSize: '0.75rem',
                    '&:hover': { opacity: 0.7 },
                  }}
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password?
                </Typography>
                <AppInput
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  placeholder="••••••••"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ fontSize: 18, color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94A3B8' }}
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: primary },
                      '&.Mui-focused fieldset': { borderColor: primary },
                    },
                  }}
                />
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{
                      color: '#CBD5E1',
                      '&.Mui-checked': { color: primary },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{ color: '#64748B', fontSize: '0.82rem' }}
                  >
                    Remember me for 30 days
                  </Typography>
                }
                sx={{ mb: 1.5, mt: 0.5 }}
              />

              {/* DPDP Act §6 — Per-purpose opt-in consent checkbox */}
              {/* [LEGAL REVIEW REQUIRED] Consent copy must be reviewed by a lawyer before go-live */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    size="small"
                    id="dpdp-consent-checkbox"
                    sx={{
                      color: '#CBD5E1',
                      '&.Mui-checked': { color: primary },
                      alignSelf: 'flex-start',
                      mt: '-2px',
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{ color: '#64748B', fontSize: '0.79rem', lineHeight: 1.5 }}
                  >
                    I have read and agree to the{' '}
                    <Typography
                      component="a"
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: primary, fontWeight: 700, fontSize: '0.79rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Privacy Policy
                    </Typography>
                    {' '}and consent to processing of my personal data for account management and platform services.
                  </Typography>
                }
                sx={{ mb: 3, mt: 0, alignItems: 'flex-start' }}
              />

              <AppButton
                fullWidth
                type="submit"
                variant="contained"
                loading={isLoading}
                disabled={!consentGiven}
                size="large"
                endIcon={!isLoading && <ArrowForward sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '12px',
                  background: consentGiven
                    ? `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`
                    : '#E2E8F0',
                  boxShadow: consentGiven ? `0 8px 24px ${primary}45` : 'none',
                  mb: 3,
                  '&:hover': consentGiven ? {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 12px 28px ${primary}60`,
                  } : {},
                  transition: 'all 0.2s ease',
                }}
              >
                Sign In
              </AppButton>

              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '0.82rem',
                }}
              >
                Don't have an account?{' '}
                <Typography
                  component="a"
                  href="mailto:smsystem.2000@gmail.com"
                  sx={{
                    fontWeight: 700,
                    color: primary,
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Contact Admin
                </Typography>
              </Typography>
            </Box>

            {/* Footer — DPDP Act compliant with working links + Grievance Officer */}
            <LegalFooter accentColor={primary} light />
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default LoginPage;