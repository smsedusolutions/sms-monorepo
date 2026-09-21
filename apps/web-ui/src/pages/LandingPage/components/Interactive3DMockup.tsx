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

  const { ref: tiltRef, style: tiltStyle, glareStyle } = use3DTilt<HTMLDivElement>({
    maxRotation: 8,
    perspective: 1400,
    scale: 1.01,
  });

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
        perspective: '1200px',
      }}
    >
      {/* Glare layer */}
      {glareStyle && <Box style={glareStyle} />}

      {/* Floating 3D Badge 1: 99.9% Uptime */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-24px',
          left: '5%',
          zIndex: 30,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '50px',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: '0 12px 28px -6px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Shield sx={{ fontSize: 16 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
              Enterprise Grade
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700 }}>
              99.9% Cloud Uptime
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Floating 3D Badge 2: One Platform A Brighter Future */}
      <motion.div
        animate={{ y: [8, -8, 8] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '8%',
          zIndex: 30,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            px: 2.2,
            py: 1,
            background: 'linear-gradient(135deg, #4338CA 0%, #06B6D4 100%)',
            color: 'white',
            borderRadius: '50px',
            boxShadow: '0 12px 30px -4px rgba(6, 182, 212, 0.4)',
          }}
        >
          <AutoGraph sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.02em' }}>
            One Platform — A Brighter Future
          </Typography>
        </Box>
      </motion.div>

      {/* ── LAPTOP CONTAINER (from Image 1) ── */}
      <Box
        sx={{
          bgcolor: '#1E293B',
          p: { xs: 1.5, sm: 2 },
          pb: { xs: 2.5, sm: 3 },
          borderRadius: { xs: '18px', sm: '24px' },
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255,255,255,0.1)',
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
            borderRadius: { xs: '10px', sm: '14px' },
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

            {/* Simulated Live Tabs */}
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
                    cursor: 'pointer',
                    bgcolor: activeTab === tab ? '#4F46E5' : 'rgba(0,0,0,0.04)',
                    color: activeTab === tab ? 'white' : '#64748B',
                    '&:hover': {
                      bgcolor: activeTab === tab ? '#4338CA' : 'rgba(0,0,0,0.08)',
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
                    borderRadius: '8px',
                    bgcolor: item.active ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    color: item.active ? '#818CF8' : '#64748B',
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
                    Welcome Back, Principal!
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                    Academic Year 2026-27 • Live Campus Metrics
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label="Live Sync"
                  color="success"
                  sx={{ fontSize: '0.6rem', height: 20, fontWeight: 700 }}
                />
              </Box>

              {/* 4 Metrics from Image 1: Students 1,248 | Teachers 82 | Classes 48 | Fees 92% */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 1,
                  mb: 2,
                }}
              >
                {[
                  { label: 'Students', value: '1,248', color: '#3B82F6', icon: <People sx={{ fontSize: 16 }} /> },
                  { label: 'Teachers', value: '82', color: '#8B5CF6', icon: <School sx={{ fontSize: 16 }} /> },
                  { label: 'Classes', value: '48', color: '#F59E0B', icon: <Class sx={{ fontSize: 16 }} /> },
                  { label: 'Fees Paid', value: '92%', color: '#10B981', icon: <AccountBalanceWallet sx={{ fontSize: 16 }} /> },
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      bgcolor: 'white',
                      p: 1,
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
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

              {/* Attendance Bar Chart + Fee Collection Donut from Image 1 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' }, gap: 1.5 }}>
                {/* Attendance Chart */}
                <Box
                  sx={{
                    bgcolor: 'white',
                    p: 1.2,
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E293B' }}>
                      Attendance Overview
                    </Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: '#10B981', fontWeight: 700 }}>
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
                            background: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.4s ease',
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
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E293B', mb: 1 }}>
                    Fee Collection
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: 'conic-gradient(#0284C7 0% 75%, #F59E0B 75% 90%, #EF4444 90% 100%)',
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
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#475569' }}>Pending (15%)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EF4444' }} />
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

      {/* ── 3D SMARTPHONE MOCKUP (PARENT PORTAL from Image 1) ── */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
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
            borderRadius: '26px',
            border: '2px solid #334155',
            boxShadow: '0 20px 45px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)',
          }}
        >
          {/* Dynamic Island / Speaker */}
          <Box
            sx={{
              width: 50,
              height: 5,
              borderRadius: '10px',
              bgcolor: '#1E293B',
              mx: 'auto',
              mb: 0.8,
            }}
          />

          {/* Phone Screen */}
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '20px',
              p: 1.2,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 265,
            }}
          >
            {/* Parent Portal Header */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <SmsEduLogo size={24} showText={false} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', mt: 0.2 }}>
                Parent Portal
              </Typography>
              <Typography sx={{ fontSize: '0.58rem', color: '#64748B' }}>
                Real-Time Updates
              </Typography>
            </Box>

            {/* 6 Action Tiles from Image 1 */}
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
                { label: 'Attendance', icon: <AssignmentTurnedIn sx={{ fontSize: 16 }} />, color: '#10B981' },
                { label: 'Academic Progress', icon: <BarChart sx={{ fontSize: 16 }} />, color: '#6366F1' },
                { label: 'Fees Paid', icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />, color: '#F59E0B' },
                { label: 'Timetable', icon: <DateRange sx={{ fontSize: 16 }} />, color: '#EC4899' },
                { label: 'Notifications', icon: <NotificationsActive sx={{ fontSize: 16 }} />, color: '#8B5CF6' },
              ].map((tile) => (
                <Box
                  key={tile.label}
                  onClick={() => setActiveParentTab(tile.label)}
                  sx={{
                    bgcolor: activeParentTab === tile.label ? 'rgba(99, 102, 241, 0.12)' : '#F8FAFC',
                    border: activeParentTab === tile.label ? '1px solid #6366F1' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    p: 0.7,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.04)',
                      borderColor: '#6366F1',
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
                borderRadius: '10px',
                mx: 'auto',
                mt: 1,
              }}
            />
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};
