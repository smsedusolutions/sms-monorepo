import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { TrustBadges } from './components/TrustBadges';
import { FeaturesSection } from './components/FeaturesSection';
import { ParentPortalSpotlight } from './components/ParentPortalSpotlight';
import { ManagedBy3vSection } from './components/ManagedBy3vSection';
import { LandingFooter } from './components/LandingFooter';
import { QuickDemoModal } from './components/QuickDemoModal';

const LandingPage: React.FC = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    document.title = 'SMS Edu Solutions | School Management System';
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        overflowX: 'hidden',
      }}
    >
      {/* Navigation Header */}
      <LandingNavbar onOpenDemo={() => setDemoOpen(true)} />

      {/* Main Page Content */}
      <Box component="main" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <HeroSection onOpenDemo={() => setDemoOpen(true)} />

        {/* Core Institutional Pillars */}
        <TrustBadges />

        {/* 10 Core Services & Capabilities */}
        <FeaturesSection />

        {/* Parent Portal Spotlight */}
        <ParentPortalSpotlight onOpenDemo={() => setDemoOpen(true)} />

        {/* Engineering & Infrastructure Partner Section */}
        <ManagedBy3vSection />
      </Box>

      {/* Institutional Footer & Legal Links */}
      <LandingFooter />

      {/* Live Demo Booking Modal */}
      <QuickDemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </Box>
  );
};

export default LandingPage;

