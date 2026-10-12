import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  PhoneInTalk,
  ArrowForward,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SmsEduLogo, ThreeVLogo } from './BrandLogos';
import { useLandingTheme } from '../context/LandingThemeContext';

interface LandingNavbarProps {
  onOpenDemo: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onOpenDemo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useLandingTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Modules', href: '#features' },
    { label: 'Parent Portal', href: '#parents-portal' },
    { label: 'Infrastructure', href: '#managed-by-3v' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('/')) {
      navigate(href);
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        transition: 'all 0.25s ease-in-out',
        bgcolor: isDark
          ? isScrolled
            ? 'rgba(11, 15, 25, 0.95)'
            : 'rgba(15, 23, 42, 0.92)'
          : isScrolled
          ? 'rgba(255, 255, 255, 0.96)'
          : 'rgba(255, 255, 255, 0.92)',
        borderBottom: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
        boxShadow: isScrolled
          ? isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.4)'
            : '0 2px 10px rgba(0, 0, 0, 0.05)'
          : 'none',
        backdropFilter: 'blur(8px)',
        py: isScrolled ? 1.2 : 1.6,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <Box
            component="a"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <SmsEduLogo size={42} variant={isDark ? 'dark' : 'light'} />
          </Box>

          {/* Desktop Navigation Links */}
          <Box
            component="nav"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 3.5,
            }}
          >
            {navLinks.map((link) => (
              <Box
                key={link.label}
                component="a"
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                sx={{
                  color: isDark ? '#94A3B8' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: isDark ? '#38BDF8' : '#0284C7',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: -4,
                    left: 0,
                    bgcolor: isDark ? '#38BDF8' : '#0284C7',
                    transition: 'width 0.2s ease',
                  },
                  '&:hover::after': {
                    width: '100%',
                  },
                }}
              >
                {link.label}
              </Box>
            ))}
          </Box>

          {/* Actions: Hotline + Theme Toggle + Book Demo + Login */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Quick Phone Hotline button */}
            <Button
              component="a"
              href="tel:+916361888927"
              startIcon={<PhoneInTalk sx={{ fontSize: 18, color: isDark ? '#38BDF8' : '#0284C7' }} />}
              sx={{
                display: { xs: 'none', lg: 'inline-flex' },
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: '6px',
                px: 2,
                py: 0.8,
                bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: isDark ? '#334155' : '#F1F5F9',
                },
              }}
            >
              +91 6361888927
            </Button>

            {/* Dark / Light Mode Toggle Button */}
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                sx={{
                  color: isDark ? '#F59E0B' : '#0F172A',
                  bgcolor: isDark ? '#1E293B' : '#F1F5F9',
                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                  borderRadius: '6px',
                  p: 0.9,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isDark ? '#334155' : '#E2E8F0',
                    borderColor: isDark ? '#475569' : '#94A3B8',
                  },
                }}
              >
                {isDark ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {/* Book Demo Button */}
            <Button
              variant="outlined"
              onClick={onOpenDemo}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                borderColor: isDark ? '#334155' : '#CBD5E1',
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontWeight: 700,
                borderRadius: '6px',
                px: 2.2,
                py: 0.85,
                fontSize: '0.88rem',
                textTransform: 'none',
                bgcolor: isDark ? 'transparent' : 'transparent',
                '&:hover': {
                  borderColor: isDark ? '#64748B' : '#94A3B8',
                  bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                },
              }}
            >
              Book Live Demo
            </Button>

            {/* Login / Portal Button */}
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
              sx={{
                background: isDark ? '#0284C7 !important' : '#0F172A !important',
                bgcolor: isDark ? '#0284C7 !important' : '#0F172A !important',
                color: '#FFFFFF !important',
                fontWeight: 700,
                borderRadius: '6px',
                px: { xs: 2, sm: 2.8 },
                py: 0.85,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                textTransform: 'none',
                boxShadow: 'none',
                border: isDark ? '1px solid #0284C7' : '1px solid #0F172A',
                '&:hover': {
                  background: isDark ? '#0369A1 !important' : '#1E293B !important',
                  bgcolor: isDark ? '#0369A1 !important' : '#1E293B !important',
                  borderColor: isDark ? '#0369A1' : '#1E293B',
                  boxShadow: 'none',
                },
              }}
            >
              Portal Login
            </Button>

            {/* Mobile Hamburger Toggle */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                color: isDark ? '#F8FAFC' : '#1E293B',
                bgcolor: isDark ? '#1E293B' : '#F1F5F9',
                border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                borderRadius: '6px',
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 290,
            bgcolor: isDark ? '#0F172A' : '#FFFFFF',
            color: isDark ? '#F8FAFC' : '#0F172A',
            borderLeft: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <SmsEduLogo size={36} variant={isDark ? 'dark' : 'light'} />
            <IconButton
              onClick={() => setMobileOpen(false)}
              sx={{
                color: isDark ? '#F8FAFC' : '#64748B',
                borderRadius: '6px',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ mt: 2 }}>
            {navLinks.map((link) => (
              <ListItem key={link.label} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavClick(link.href)}
                  sx={{
                    borderRadius: '6px',
                    fontWeight: 600,
                    color: isDark ? '#94A3B8' : '#334155',
                    '&:hover': {
                      bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                      color: isDark ? '#38BDF8' : '#0284C7',
                    },
                  }}
                >
                  <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2, borderTop: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
          {/* Mobile Theme Toggle Button */}
          <Button
            variant="outlined"
            onClick={toggleTheme}
            fullWidth
            startIcon={isDark ? <LightMode sx={{ color: '#F59E0B' }} /> : <DarkMode sx={{ color: '#0F172A' }} />}
            sx={{
              borderRadius: '6px',
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              borderColor: isDark ? '#334155' : '#CBD5E1',
              color: isDark ? '#F8FAFC' : '#0F172A',
              bgcolor: isDark ? '#1E293B' : '#F8FAFC',
              '&:hover': {
                bgcolor: isDark ? '#334155' : '#F1F5F9',
                borderColor: isDark ? '#475569' : '#94A3B8',
              },
            }}
          >
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setMobileOpen(false);
              onOpenDemo();
            }}
            fullWidth
            sx={{
              borderRadius: '6px',
              py: 1.1,
              fontWeight: 700,
              textTransform: 'none',
              borderColor: isDark ? '#334155' : '#CBD5E1',
              color: isDark ? '#F8FAFC' : '#0F172A',
              '&:hover': {
                bgcolor: isDark ? '#1E293B' : '#F8FAFC',
              },
            }}
          >
            Book Live Demo
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setMobileOpen(false);
              navigate('/login');
            }}
            fullWidth
            startIcon={<LoginIcon />}
            sx={{
              bgcolor: isDark ? '#0284C7' : '#0F172A',
              color: '#FFFFFF',
              borderRadius: '6px',
              py: 1.1,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              border: isDark ? '1px solid #0284C7' : '1px solid #0F172A',
              '&:hover': {
                bgcolor: isDark ? '#0369A1' : '#1E293B',
                boxShadow: 'none',
              },
            }}
          >
            Go to Login
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <ThreeVLogo height={28} />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};
