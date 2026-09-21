import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Canvas3DBackground } from './components/Canvas3DBackground';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { TrustBadges } from './components/TrustBadges';
import { FeaturesSection } from './components/FeaturesSection';
import { ParentPortalSpotlight } from './components/ParentPortalSpotlight';
import { ManagedBy3vSection } from './components/ManagedBy3vSection';
import { StatsCounter } from './components/StatsCounter';
import { LandingFooter } from './components/LandingFooter';
import { QuickDemoModal } from './components/QuickDemoModal';

const LandingPage: React.FC = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    document.title = 'SMS EDU SOLUTIONS — Simplifying School Management for a Brighter Tomorrow';
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
      {/* 3D Particle Constellation Canvas */}
      <Canvas3DBackground />

      {/* Floating Glassmorphic Header */}
      <LandingNavbar onOpenDemo={() => setDemoOpen(true)} />

      {/* Main Page Content */}
      <Box component="main" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section with Interactive 3D Mockup */}
        <HeroSection onOpenDemo={() => setDemoOpen(true)} />

        {/* 4 Core Pillars / Trust Badges from Image 1 */}
        <TrustBadges />

        {/* 10 Core Services from Image 1 with 3D Tilt */}
        <FeaturesSection />

        {/* Highlighted Parents Portal Spotlight from Image 1 */}
        <ParentPortalSpotlight onOpenDemo={() => setDemoOpen(true)} />

        {/* 3v TechWorks Engineering Section from Image 2 */}
        <ManagedBy3vSection />

        {/* High-Impact Statistics */}
        <StatsCounter />
      </Box>

      {/* Branded Footer with Image 1 Contacts (Phones, Email, Web) & Legal Links */}
      <LandingFooter />

      {/* Live Demo & Booking Modal */}
      <QuickDemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </Box>
  );
};

export default LandingPage;
