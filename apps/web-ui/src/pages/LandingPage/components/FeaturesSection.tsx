import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Chip,
} from '@mui/material';
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
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    accentColor: '#0284C7',
  },
  {
    id: 'attendance-mgmt',
    title: 'Attendance Management',
    tagline: 'Automated real-time attendance',
    iconName: 'Groups',
    category: 'operations',
    description: 'RFID, biometric, and teacher mobile roll-call tracking with automated SMS and WhatsApp notifications to parents for recorded absences.',
    highlights: ['RFID & Biometric Sync', 'Instant Absent Alerts', 'Monthly Muster Rolls', 'Leave Workflow'],
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    accentColor: '#059669',
  },
  {
    id: 'exam-mgmt',
    title: 'Exam Management',
    tagline: 'End-to-end evaluation & gradebook',
    iconName: 'Description',
    category: 'academic',
    description: 'Design exam timetables, allocate hall tickets, grade tests with customizable grading scales, and generate printable PDF report cards.',
    highlights: ['Hall Ticket Generator', 'Marks & Grade Entry', 'Rank & Percentile Computation', 'CBSE & State Board Cards'],
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    accentColor: '#0284C7',
  },
  {
    id: 'timetable-mgmt',
    title: 'Timetable Management',
    tagline: 'Automated conflict-free scheduling',
    iconName: 'CalendarMonth',
    category: 'academic',
    description: 'Eliminate scheduling clashes with period balancing, classroom allocations, and quick substitute teacher assignments for absent educators.',
    highlights: ['Conflict Detection', 'Substitute Engine', 'Teacher Workload Balancer', 'Export to PDF & App'],
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
    highlights: ['Online UPI & Card Gateway', 'Instant GST Receipts', 'Defaulter Follow-ups', 'Scholarship & Discounts'],
    gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    accentColor: '#D97706',
  },
  {
    id: 'transport-mgmt',
    title: 'Transport Management',
    tagline: 'Real-time GPS student bus tracking',
    iconName: 'DirectionsBus',
    category: 'operations',
    description: 'Live vehicle telemetry on interactive maps, driver verification, bus route planning, and proximity alerts when the bus approaches the pickup stop.',
    highlights: ['Live GPS Tracking', 'Geofence Alerts', 'Driver & Vehicle Records', 'Parent ETA Broadcast'],
    gradient: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
    accentColor: '#EA580C',
  },
  {
    id: 'events-mgmt',
    title: 'Events Management',
    tagline: 'Campus calendar & parent-teacher meetings',
    iconName: 'EventAvailable',
    category: 'engagement',
    description: 'Coordinate school sports days, cultural festivals, academic holidays, and Parent-Teacher Meeting (PTM) slot bookings without confusion.',
    highlights: ['Interactive Calendar', 'PTM Slot Reservations', 'Holiday Schedule', 'RSVP & Photo Galleries'],
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    accentColor: '#0284C7',
  },
  {
    id: 'staff-mgmt',
    title: 'Staff Management',
    tagline: 'Empower educators and administration',
    iconName: 'Badge',
    category: 'core',
    description: 'Centralized faculty records, bio-data, qualification tracking, staff leave approvals, payroll generation, and classroom assignments.',
    highlights: ['Faculty Dossiers', 'Staff Attendance & Leave', 'Payroll & Payslips', 'Role Permissions Engine'],
    gradient: 'linear-gradient(135deg, #334155 0%, #0F172A 100%)',
    accentColor: '#334155',
  },
  {
    id: 'comm-mgmt',
    title: 'Communication & Notifications',
    tagline: 'Instant announcements across channels',
    iconName: 'Email',
    category: 'engagement',
    description: 'Broadcast circulars, homework assignments, emergency notices, and fee alerts via in-app push notifications, SMS, and WhatsApp.',
    highlights: ['Emergency Broadcasts', 'Web Push Notifications', 'Email Bulletins', '2-Way Parent Messaging'],
    gradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    accentColor: '#DC2626',
  },
  {
    id: 'reports-mgmt',
    title: 'Reports & Analytics',
    tagline: 'Actionable educational intelligence',
    iconName: 'QueryStats',
    category: 'academic',
    description: 'Visual dashboards, attendance percentage trends, fee collection forecasts, exam pass ratios, and single-click Excel and PDF data exports.',
    highlights: ['Pass Ratio Analysis', 'Financial Revenue Trends', 'Export to Excel / PDF', 'Principal Summary View'],
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    accentColor: '#059669',
  },
];

const FeatureCard: React.FC<{ feature: ServiceFeature }> = ({ feature }) => {
  const renderIcon = () => {
    switch (feature.iconName) {
      case 'School':
        return <School sx={{ fontSize: 24, color: 'white' }} />;
      case 'Groups':
        return <Groups sx={{ fontSize: 24, color: 'white' }} />;
      case 'Description':
        return <Description sx={{ fontSize: 24, color: 'white' }} />;
      case 'CalendarMonth':
        return <CalendarMonth sx={{ fontSize: 24, color: 'white' }} />;
      case 'AccountBalanceWallet':
        return <AccountBalanceWallet sx={{ fontSize: 24, color: 'white' }} />;
      case 'DirectionsBus':
        return <DirectionsBus sx={{ fontSize: 24, color: 'white' }} />;
      case 'EventAvailable':
        return <EventAvailable sx={{ fontSize: 24, color: 'white' }} />;
      case 'Badge':
        return <Badge sx={{ fontSize: 24, color: 'white' }} />;
      case 'Email':
        return <Email sx={{ fontSize: 24, color: 'white' }} />;
      case 'QueryStats':
        return <QueryStats sx={{ fontSize: 24, color: 'white' }} />;
      default:
        return <School sx={{ fontSize: 24, color: 'white' }} />;
    }
  };

  return (
    <Box
      sx={{
        borderRadius: '8px',
        bgcolor: '#FFFFFF',
        p: { xs: 2.8, sm: 3 },
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: feature.accentColor,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {/* Top row: Icon + Category Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '6px',
            background: feature.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderIcon()}
        </Box>
        <Chip
          size="small"
          label={feature.category.toUpperCase()}
          sx={{
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.04em',
            borderRadius: '4px',
            bgcolor: '#F1F5F9',
            color: '#334155',
            border: '1px solid #CBD5E1',
          }}
        />
      </Box>

      {/* Feature Title */}
      <Typography
        variant="h6"
        sx={{
          fontSize: '1.18rem',
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
          lineHeight: 1.55,
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
    { id: 'all', label: 'All 10 Modules' },
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
        py: { xs: 8, md: 12 },
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
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
              px: 1.6,
              py: 0.6,
              borderRadius: '6px',
              bgcolor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0F172A',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Institutional Modules
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.9rem', sm: '2.5rem', md: '2.8rem' },
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.025em',
              mb: 1.5,
            }}
          >
            Core Institutional Modules
          </Typography>

          <Typography sx={{ fontSize: { xs: '0.98rem', sm: '1.05rem' }, color: '#64748B', lineHeight: 1.6 }}>
            Ten deeply integrated software modules designed to manage campus operations, records, and communication.
          </Typography>

          {/* Filter Categories - Rectangular 6px chips */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1,
              mt: 3.5,
            }}
          >
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{
                  px: 1.5,
                  py: 2,
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  bgcolor: selectedCategory === cat.id ? '#0F172A' : '#FFFFFF',
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#334155',
                  border: selectedCategory === cat.id ? '1px solid #0F172A' : '1px solid #CBD5E1',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedCategory === cat.id ? '#1E293B' : '#F8FAFC',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Features Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredFeatures.map((feature) => (
            <Box key={feature.id}>
              <FeatureCard feature={feature} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

