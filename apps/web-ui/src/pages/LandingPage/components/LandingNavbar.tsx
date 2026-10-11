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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  PhoneInTalk,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SmsEduLogo, ThreeVLogo } from './BrandLogos';

interface LandingNavbarProps {
  onOpenDemo: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onOpenDemo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

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
        bgcolor: isScrolled
          ? 'rgba(255, 255, 255, 0.96)'
          : 'rgba(255, 255, 255, 0.92)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: isScrolled
          ? '0 2px 10px rgba(0, 0, 0, 0.05)'
          : 'none',
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
            <SmsEduLogo size={42} />
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
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: '#0284C7',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: -4,
                    left: 0,
                    bgcolor: '#0284C7',
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

          {/* Actions: Hotline + Book Demo + Login */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Quick Phone Hotline button */}
            <Button
              component="a"
              href="tel:+916361888927"
              startIcon={<PhoneInTalk sx={{ fontSize: 18, color: '#0284C7' }} />}
              sx={{
                display: { xs: 'none', lg: 'inline-flex' },
                color: '#0F172A',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: '6px',
                px: 2,
                py: 0.8,
                bgcolor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#F1F5F9',
                },
              }}
            >
              +91 6361888927
            </Button>

            {/* Book Demo Button */}
            <Button
              variant="outlined"
              onClick={onOpenDemo}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                borderColor: '#CBD5E1',
                color: '#0F172A',
                fontWeight: 700,
                borderRadius: '6px',
                px: 2.2,
                py: 0.85,
                fontSize: '0.88rem',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#94A3B8',
                  bgcolor: '#F8FAFC',
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
                background: '#0F172A !important',
                bgcolor: '#0F172A !important',
                color: '#FFFFFF !important',
                fontWeight: 700,
                borderRadius: '6px',
                px: { xs: 2, sm: 2.8 },
                py: 0.85,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                textTransform: 'none',
                boxShadow: 'none',
                border: '1px solid #0F172A',
                '&:hover': {
                  background: '#1E293B !important',
                  bgcolor: '#1E293B !important',
                  borderColor: '#1E293B',
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
                color: '#1E293B',
                bgcolor: '#F1F5F9',
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
            bgcolor: '#FFFFFF',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <SmsEduLogo size={36} />
            <IconButton onClick={() => setMobileOpen(false)}>
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
                    color: '#334155',
                    '&:hover': {
                      bgcolor: '#F8FAFC',
                      color: '#0284C7',
                    },
                  }}
                >
                  <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2, borderTop: '1px solid #E2E8F0' }}>
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
              borderColor: '#CBD5E1',
              color: '#0F172A',
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
              bgcolor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '6px',
              py: 1.1,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#1E293B',
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
