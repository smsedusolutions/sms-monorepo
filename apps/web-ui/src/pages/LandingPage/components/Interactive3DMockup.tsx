import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  People,
  School,
  Class,
  AccountBalanceWallet,
  TrendingUp,
  NotificationsActive,
  DirectionsBus,
  DateRange,
  AssignmentTurnedIn,
  Person,
  CheckCircle,
  BarChart,
  Shield,
  AutoGraph,
} from '@mui/icons-material';
import { use3DTilt } from '../hooks/use3DTilt';
import { SmsEduLogo } from './BrandLogos';

export const Interactive3DMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'attendance'>('overview');
  const [activeParentTab, setActiveParentTab] = useState('Child');

  const { ref: tiltRef, style: tiltStyle } = use3DTilt<HTMLDivElement>();

  return (
    <Box
      ref={tiltRef}
      style={tiltStyle}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 720,
        mx: 'auto',
        my: { xs: 2, md: 0 },
      }}
    >
      {/* ── LAPTOP CONTAINER ── */}
      <Box
        sx={{
          bgcolor: '#1E293B',
          p: { xs: 1.5, sm: 2 },
          pb: { xs: 2.5, sm: 3 },
          borderRadius: '12px',
          boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(255,255,255,0.08)',
          position: 'relative',
          background: 'linear-gradient(145deg, #334155 0%, #1E293B 100%)',
        }}
      >
        {/* Laptop Camera dot */}
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: '#475569',
            mx: 'auto',
            mb: 1.2,
          }}
        />

        {/* Laptop Screen */}
        <Box
          sx={{
            bgcolor: '#F8FAFC',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: { xs: 320, sm: 400 },
          }}
        >
          {/* Laptop Topbar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              bgcolor: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmsEduLogo size={26} showText={true} />
            </Box>

            {/* Live Tabs */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {(['overview', 'fees', 'attendance'] as const).map((tab) => (
                <Chip
                  key={tab}
                  size="small"
                  label={tab.toUpperCase()}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    bgcolor: activeTab === tab ? '#0F172A' : 'rgba(0,0,0,0.04)',
                    color: activeTab === tab ? 'white' : '#64748B',
                    '&:hover': {
                      bgcolor: activeTab === tab ? '#1E293B' : 'rgba(0,0,0,0.08)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Laptop Main Body Layout: Sidebar + Dashboard content */}
          <Box sx={{ display: 'flex', flex: 1 }}>
            {/* Mini Sidebar */}
            <Box
              sx={{
                width: { xs: 44, sm: 110 },
                bgcolor: '#0F172A',
                color: '#94A3B8',
                p: { xs: 0.8, sm: 1.2 },
                display: 'flex',
                flexDirection: 'column',
                gap: 0.8,
              }}
            >
              {[
                { icon: <TrendingUp sx={{ fontSize: 16 }} />, label: 'Dashboard', active: true },
                { icon: <People sx={{ fontSize: 16 }} />, label: 'Students' },
                { icon: <School sx={{ fontSize: 16 }} />, label: 'Teachers' },
                { icon: <CheckCircle sx={{ fontSize: 16 }} />, label: 'Attendance' },
                { icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />, label: 'Fees' },
                { icon: <DateRange sx={{ fontSize: 16 }} />, label: 'Timetable' },
                { icon: <DirectionsBus sx={{ fontSize: 16 }} />, label: 'Transport' },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: { xs: 0.8, sm: 1 },
                    py: 0.6,
                    borderRadius: '6px',
                    bgcolor: item.active ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
                    color: item.active ? '#38BDF8' : '#64748B',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)',
                      color: '#CBD5E1',
                    },
                  }}
                >
                  {item.icon}
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Dashboard Content Area */}
            <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, bgcolor: '#F8FAFC' }}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.05rem' }, fontWeight: 800, color: '#0F172A' }}>
                    Welcome Back, Principal
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                    Academic Session 2026-27 • Campus Administration
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label="Campus Portal"
                  sx={{ fontSize: '0.6rem', height: 20, fontWeight: 700, borderRadius: '4px', bgcolor: '#E0F2FE', color: '#0369A1' }}
                />
              </Box>

              {/* 4 Sample Operational Metrics in Mockup */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 1,
                  mb: 2,
                }}
              >
                {[
                  { label: 'Students', value: '1,248', color: '#0284C7', icon: <People sx={{ fontSize: 16 }} /> },
                  { label: 'Teachers', value: '82', color: '#334155', icon: <School sx={{ fontSize: 16 }} /> },
                  { label: 'Classes', value: '48', color: '#D97706', icon: <Class sx={{ fontSize: 16 }} /> },
                  { label: 'Fees Paid', value: '92%', color: '#059669', icon: <AccountBalanceWallet sx={{ fontSize: 16 }} /> },
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      bgcolor: 'white',
                      p: 1,
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Box>
                    <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1.05rem' }, fontWeight: 800, color: '#0F172A' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Attendance Bar Chart + Fee Collection Donut */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' }, gap: 1.5 }}>
                {/* Attendance Chart */}
                <Box
                  sx={{
                    bgcolor: 'white',
                    p: 1.2,
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E293B' }}>
                      Attendance Overview
                    </Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: '#059669', fontWeight: 700 }}>
                      96.4% avg
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 75, pt: 1 }}>
                    {[
                      { day: 'Mon', height: 85 },
                      { day: 'Tue', height: 92 },
                      { day: 'Wed', height: 78 },
                      { day: 'Thu', height: 95 },
                      { day: 'Fri', height: 88 },
                      { day: 'Sat', height: 60 },
                    ].map((bar) => (
                      <Box key={bar.day} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <Box
                          sx={{
                            width: '45%',
                            height: `${bar.height}%`,
                            bgcolor: '#0284C7',
                            borderRadius: '2px 2px 0 0',
                          }}
                        />
                        <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', mt: 0.5, fontWeight: 600 }}>
                          {bar.day}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Fee Donut Representation */}
                <Box
                  sx={{
                    bgcolor: 'white',
                    p: 1.2,
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E293B', mb: 1 }}>
                    Fee Collection Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: 'conic-gradient(#0284C7 0% 75%, #D97706 75% 90%, #DC2626 90% 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          bgcolor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                        }}
                      >
                        92%
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0284C7' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#475569' }}>Paid (75%)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D97706' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#475569' }}>Pending (15%)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#DC2626' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#475569' }}>Overdue (10%)</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── SMARTPHONE MOCKUP (PARENT PORTAL) ── */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '-25px',
          right: '-15px',
          width: '210px',
          zIndex: 25,
        }}
      >
        <Box
          sx={{
            bgcolor: '#0F172A',
            p: 0.9,
            borderRadius: '16px',
            border: '2px solid #334155',
            boxShadow: '0 20px 45px -10px rgba(0,0,0,0.3)',
          }}
        >
          {/* Speaker dot */}
          <Box
            sx={{
              width: 50,
              height: 4,
              borderRadius: '4px',
              bgcolor: '#1E293B',
              mx: 'auto',
              mb: 0.8,
            }}
          />

          {/* Phone Screen */}
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '12px',
              p: 1.2,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 265,
            }}
          >
            {/* Parent Portal Header */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <SmsEduLogo size={22} showText={false} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', mt: 0.2 }}>
                Parent Portal
              </Typography>
              <Typography sx={{ fontSize: '0.58rem', color: '#64748B' }}>
                Campus Telemetry & Updates
              </Typography>
            </Box>

            {/* 6 Action Tiles */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 0.8,
                flex: 1,
              }}
            >
              {[
                { label: "Child's Profile", icon: <Person sx={{ fontSize: 16 }} />, color: '#0284C7' },
                { label: 'Attendance', icon: <AssignmentTurnedIn sx={{ fontSize: 16 }} />, color: '#059669' },
                { label: 'Academic Progress', icon: <BarChart sx={{ fontSize: 16 }} />, color: '#0284C7' },
                { label: 'Fees Paid', icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />, color: '#D97706' },
                { label: 'Timetable', icon: <DateRange sx={{ fontSize: 16 }} />, color: '#0F172A' },
                { label: 'Notifications', icon: <NotificationsActive sx={{ fontSize: 16 }} />, color: '#D97706' },
              ].map((tile) => (
                <Box
                  key={tile.label}
                  onClick={() => setActiveParentTab(tile.label)}
                  sx={{
                    bgcolor: activeParentTab === tile.label ? 'rgba(2, 132, 199, 0.08)' : '#F8FAFC',
                    border: activeParentTab === tile.label ? '1px solid #0284C7' : '1px solid #E2E8F0',
                    borderRadius: '6px',
                    p: 0.7,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: '#0284C7',
                    },
                  }}
                >
                  <Box sx={{ color: tile.color, mb: 0.3 }}>{tile.icon}</Box>
                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#1E293B', textAlign: 'center', lineHeight: 1.1 }}>
                    {tile.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Phone Home Bar */}
            <Box
              sx={{
                width: 45,
                height: 3,
                bgcolor: '#CBD5E1',
                borderRadius: '4px',
                mx: 'auto',
                mt: 1,
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
