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
    { label: 'Features', href: '#features' },
    { label: '3D Preview', href: '#preview' },
    { label: 'Parents Portal', href: '#parents-portal' },
    { label: 'About 3v TechWorks', href: '#managed-by-3v' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
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
        transition: 'all 0.35s ease-in-out',
        background: isScrolled
          ? 'rgba(255, 255, 255, 0.88)'
          : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(16px)',
        borderBottom: isScrolled
          ? '1px solid rgba(226, 232, 240, 0.8)'
          : '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: isScrolled
          ? '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)'
          : 'none',
        py: isScrolled ? 1.2 : 1.8,
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
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: '#4F46E5',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: -4,
                    left: 0,
                    background: 'linear-gradient(90deg, #4F46E5, #06B6D4)',
                    transition: 'width 0.25s ease',
                    borderRadius: '2px',
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
                borderRadius: '50px',
                px: 2,
                py: 0.8,
                bgcolor: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(2, 132, 199, 0.15)',
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
                borderColor: '#4F46E5',
                color: '#4F46E5',
                fontWeight: 700,
                borderRadius: '50px',
                px: 2.2,
                py: 0.9,
                fontSize: '0.88rem',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#4338CA',
                  bgcolor: 'rgba(79, 70, 229, 0.06)',
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
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '50px',
                px: { xs: 2, sm: 2.8 },
                py: 0.9,
                fontSize: { xs: '0.85rem', sm: '0.92rem' },
                textTransform: 'none',
                boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.45)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 26px -4px rgba(79, 70, 229, 0.6)',
                  background: 'linear-gradient(135deg, #4338CA 0%, #0284C7 100%)',
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
                bgcolor: 'rgba(0,0,0,0.04)',
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
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(20px)',
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
                    borderRadius: '10px',
                    fontWeight: 600,
                    color: '#334155',
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                      color: '#4F46E5',
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
              borderRadius: '12px',
              py: 1.1,
              fontWeight: 700,
              textTransform: 'none',
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
              background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
              borderRadius: '12px',
              py: 1.1,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.45)',
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
