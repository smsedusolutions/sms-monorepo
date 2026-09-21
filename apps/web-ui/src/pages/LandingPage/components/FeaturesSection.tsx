import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  School,
  Groups,
  Description,
  CalendarMonth,
  AccountBalanceWallet,
  DirectionsBus,
  EventAvailable,
  Badge,
  Email,
  QueryStats,
  CheckCircle,
} from '@mui/icons-material';
import { use3DTilt } from '../hooks/use3DTilt';
import type { ServiceFeature } from '../types';

const FEATURES_DATA: ServiceFeature[] = [
  {
    id: 'student-mgmt',
    title: 'Student Management',
    tagline: 'Comprehensive 360° student lifecycle',
    iconName: 'School',
    category: 'core',
    description: 'Effortlessly manage student registrations, digital enrollments, documents, roll numbers, and academic histories in a single secure cloud hub.',
    highlights: ['Digital Admissions', 'Document Vault', 'ID Card Generation', 'Promotions Engine'],
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    accentColor: '#3B82F6',
  },
  {
    id: 'attendance-mgmt',
    title: 'Attendance Management',
    tagline: 'Automated real-time attendance',
    iconName: 'Groups',
    category: 'operations',
    description: 'Instant RFID, biometric, and teacher mobile roll-call tracking with instant automated SMS & WhatsApp notification to parents for absences.',
    highlights: ['RFID / Biometric Sync', 'Instant Absent Alerts', 'Monthly Muster Rolls', 'Leave Workflow'],
    gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    accentColor: '#10B981',
  },
  {
    id: 'exam-mgmt',
    title: 'Exam Management',
    tagline: 'End-to-end evaluation & gradebook',
    iconName: 'Description',
    category: 'academic',
    description: 'Design exam timetables, allocate hall tickets, grade tests with customizable grading scales, and generate beautiful printable PDF report cards.',
    highlights: ['Hall Ticket Generator', 'Marks & Grade Entry', 'Rank & Percentile AI', 'CBSE / ICSE Report Cards'],
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    accentColor: '#8B5CF6',
  },
  {
    id: 'timetable-mgmt',
    title: 'Timetable Management',
    tagline: 'AI conflict-free scheduling',
    iconName: 'CalendarMonth',
    category: 'academic',
    description: 'Eliminate scheduling clashes with smart period balancing, room allocations, and 1-click substitute teacher assignments for absent educators.',
    highlights: ['Conflict Detection', 'Smart Substitute Engine', 'Teacher Workload Balancer', 'Export to PDF & App'],
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
    accentColor: '#0EA5E9',
  },
  {
    id: 'fees-mgmt',
    title: 'Fees Management',
    tagline: 'Frictionless digital fee collections',
    iconName: 'AccountBalanceWallet',
    category: 'operations',
    description: 'Define custom fee structures, collect online tuition & transport fees, issue digital receipts, and automate overdue reminder notifications.',
    highlights: ['Online UPI / Card Gateway', 'Instant GST Receipts', 'Defaulter Follow-ups', 'Scholarship & Discounts'],
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    accentColor: '#F59E0B',
  },
  {
    id: 'transport-mgmt',
    title: 'Transport Management',
    tagline: 'Real-time GPS student bus tracking',
    iconName: 'DirectionsBus',
    category: 'operations',
    description: 'Live vehicle telemetry on interactive maps, driver verification, bus route planning, and proximity alerts when the bus approaches the pickup stop.',
    highlights: ['Live GPS Tracking', 'Geofence Alerts', 'Driver & Vehicle Records', 'Parent ETA Broadcast'],
    gradient: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
    accentColor: '#F97316',
  },
  {
    id: 'events-mgmt',
    title: 'Events Management',
    tagline: 'Engaging campus calendar & PTMs',
    iconName: 'EventAvailable',
    category: 'engagement',
    description: 'Coordinate school sports days, cultural festivals, academic holidays, and Parent-Teacher Meeting (PTM) slot bookings without confusion.',
    highlights: ['Interactive Calendar', 'PTM Slot Reservations', 'Holiday Schedule', 'RSVP & Photo Galleries'],
    gradient: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    accentColor: '#EC4899',
  },
  {
    id: 'staff-mgmt',
    title: 'Staff Management',
    tagline: 'Empower educators and administration',
    iconName: 'Badge',
    category: 'core',
    description: 'Centralized faculty records, bio-data, qualification tracking, staff leave approvals, payroll generation, and classroom assignments.',
    highlights: ['Faculty Dossiers', 'Staff Attendance & Leave', 'Payroll & Payslips', 'Role Permissions Engine'],
    gradient: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
    accentColor: '#6366F1',
  },
  {
    id: 'comm-mgmt',
    title: 'Communication & Notifications',
    tagline: 'Instant omnichannel announcements',
    iconName: 'Email',
    category: 'engagement',
    description: 'Broadcast urgent circulars, homework alerts, emergency notices, and fee alerts via in-app push notifications, SMS, and WhatsApp.',
    highlights: ['Emergency Broadcasts', 'Web Push Notifications', 'Email Newsletters', '2-Way Parent Messaging'],
    gradient: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    accentColor: '#EF4444',
  },
  {
    id: 'reports-mgmt',
    title: 'Reports & Analytics',
    tagline: 'Actionable educational intelligence',
    iconName: 'QueryStats',
    category: 'academic',
    description: 'Dynamic visual dashboards, attendance percentage trends, fee collection forecasts, exam pass ratios, and 1-click Excel/PDF data exports.',
    highlights: ['Predictive Pass Ratios', 'Financial Revenue Trends', 'Export to Excel / PDF', 'Principal Summary View'],
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
    accentColor: '#14B8A6',
  },
];

const FeatureCard: React.FC<{ feature: ServiceFeature }> = ({ feature }) => {
  const { ref, style, glareStyle } = use3DTilt<HTMLDivElement>({
    maxRotation: 12,
    perspective: 1100,
    scale: 1.03,
  });

  const renderIcon = () => {
    switch (feature.iconName) {
      case 'School':
        return <School sx={{ fontSize: 26, color: 'white' }} />;
      case 'Groups':
        return <Groups sx={{ fontSize: 26, color: 'white' }} />;
      case 'Description':
        return <Description sx={{ fontSize: 26, color: 'white' }} />;
      case 'CalendarMonth':
        return <CalendarMonth sx={{ fontSize: 26, color: 'white' }} />;
      case 'AccountBalanceWallet':
        return <AccountBalanceWallet sx={{ fontSize: 26, color: 'white' }} />;
      case 'DirectionsBus':
        return <DirectionsBus sx={{ fontSize: 26, color: 'white' }} />;
      case 'EventAvailable':
        return <EventAvailable sx={{ fontSize: 26, color: 'white' }} />;
      case 'Badge':
        return <Badge sx={{ fontSize: 26, color: 'white' }} />;
      case 'Email':
        return <Email sx={{ fontSize: 26, color: 'white' }} />;
      case 'QueryStats':
        return <QueryStats sx={{ fontSize: 26, color: 'white' }} />;
      default:
        return <School sx={{ fontSize: 26, color: 'white' }} />;
    }
  };

  return (
    <Box
      ref={ref}
      style={style}
      sx={{
        position: 'relative',
        borderRadius: '20px',
        bgcolor: '#FFFFFF',
        p: { xs: 2.8, sm: 3.2 },
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          borderColor: feature.accentColor,
          boxShadow: `0 20px 40px -15px ${feature.accentColor}35`,
        },
      }}
    >
      {glareStyle && <Box style={glareStyle} />}

      {/* Top row: Icon + Category Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            background: feature.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 20px -4px ${feature.accentColor}50`,
          }}
        >
          {renderIcon()}
        </Box>
        <Chip
          size="small"
          label={feature.category.toUpperCase()}
          sx={{
            fontWeight: 800,
            fontSize: '0.65rem',
            letterSpacing: '0.05em',
            bgcolor: `${feature.accentColor}12`,
            color: feature.accentColor,
            border: `1px solid ${feature.accentColor}30`,
          }}
        />
      </Box>

      {/* Feature Title */}
      <Typography
        variant="h6"
        sx={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#0F172A',
          mb: 0.8,
          lineHeight: 1.25,
        }}
      >
        {feature.title}
      </Typography>

      {/* Feature Description */}
      <Typography
        sx={{
          fontSize: '0.88rem',
          color: '#64748B',
          lineHeight: 1.6,
          mb: 2.5,
          flex: 1,
        }}
      >
        {feature.description}
      </Typography>

      {/* Highlights Checkmark List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
        {feature.highlights.map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ fontSize: 16, color: feature.accentColor }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const FeaturesSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All 10 Features' },
    { id: 'core', label: 'Core & Staff' },
    { id: 'academic', label: 'Academic & Exams' },
    { id: 'operations', label: 'Operations & Fees' },
    { id: 'engagement', label: 'Communication' },
  ];

  const filteredFeatures = selectedCategory === 'all'
    ? FEATURES_DATA
    : FEATURES_DATA.filter((f) => f.category === selectedCategory);

  return (
    <Box
      id="features"
      sx={{
        py: { xs: 10, md: 14 },
        position: 'relative',
        zIndex: 5,
      }}
    >
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', mb: 6 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.6,
              borderRadius: '50px',
              bgcolor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#4F46E5',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Everything A Modern Institution Needs
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.2rem' },
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.025em',
              mb: 2,
            }}
          >
            Our Core Features
          </Typography>

          <Typography sx={{ fontSize: { xs: '1rem', sm: '1.12rem' }, color: '#64748B', lineHeight: 1.65 }}>
            Directly from the SMS EDU SOLUTIONS flagship suite. Ten deeply integrated modules
            engineered to automate every facet of your campus operations.
          </Typography>

          {/* Filter Categories */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1,
              mt: 4,
            }}
          >
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{
                  px: 1.5,
                  py: 2.2,
                  borderRadius: '50px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  bgcolor: selectedCategory === cat.id ? '#4F46E5' : 'rgba(255, 255, 255, 0.9)',
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#475569',
                  border: selectedCategory === cat.id ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                  boxShadow: selectedCategory === cat.id ? '0 6px 20px rgba(79, 70, 229, 0.35)' : 'none',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    bgcolor: selectedCategory === cat.id ? '#4338CA' : '#F1F5F9',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Features 3D Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3.5,
          }}
        >
          <AnimatePresence>
            {filteredFeatures.map((feature) => (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35 }}
              >
                <FeatureCard feature={feature} />
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  );
};
