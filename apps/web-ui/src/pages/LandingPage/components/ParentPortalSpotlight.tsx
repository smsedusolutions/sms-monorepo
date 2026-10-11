import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import {
  EscalatorWarning,
  NotificationsActive,
  TrendingUp,
  CreditCard,
  CheckCircleOutline,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { use3DTilt } from '../hooks/use3DTilt';

export const ParentPortalSpotlight: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const { ref, style, glareStyle } = use3DTilt<HTMLDivElement>({
    maxRotation: 8,
    perspective: 1200,
    scale: 1.01,
  });

  return (
    <Box
      id="parents-portal"
      sx={{
        py: { xs: 8, md: 12 },
        position: 'relative',
        zIndex: 5,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            position: 'relative',
            borderRadius: '12px',
            p: { xs: 3.5, sm: 5, md: 6 },
            bgcolor: '#0F172A',
            border: '1px solid #334155',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' },
              gap: { xs: 5, lg: 6 },
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Left Content */}
            <Box>
              {/* Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.2,
                  px: 1.6,
                  py: 0.6,
                  borderRadius: '6px',
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  mb: 2.5,
                }}
              >
                <EscalatorWarning sx={{ color: '#34D399', fontSize: 18 }} />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#34D399', letterSpacing: '0.04em' }}>
                  PARENTS PORTAL SPOTLIGHT
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontSize: { xs: '1.8rem', sm: '2.4rem', md: '2.8rem' },
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.15,
                  mb: 2,
                }}
              >
                Keep Parents Informed & Fully Engaged in Real-Time
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: '0.98rem', sm: '1.1rem' },
                  color: '#94A3B8',
                  lineHeight: 1.65,
                  mb: 3.5,
                  maxWidth: 620,
                }}
              >
                Deliver transparent communication to parents with live attendance alerts,
                exam grade cards, digital fee payments with instant PDF receipts, and live bus tracking.
              </Typography>

              {/* Feature points */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
                {[
                  { title: 'Instant Attendance Alerts', desc: 'SMS and push notifications the minute roll call is recorded.' },
                  { title: 'Digital Fee Payments', desc: 'Secure UPI and card payments with instant digital receipts.' },
                  { title: 'Exam Grade Cards', desc: 'Detailed subject breakdowns, marks, and teacher comments.' },
                  { title: 'Live Bus Tracking', desc: 'Track school bus routes on an interactive map.' },
                ].map((item) => (
                  <Box key={item.title} sx={{ display: 'flex', gap: 1.2 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 18, mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* CTA - Rectangular 6px radius buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{
                    background: '#059669 !important',
                    bgcolor: '#059669 !important',
                    color: 'white !important',
                    fontWeight: 700,
                    borderRadius: '6px',
                    px: 3.2,
                    py: 1.2,
                    fontSize: '0.92rem',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      background: '#047857 !important',
                      bgcolor: '#047857 !important',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Access Parent Portal
                </Button>
                <Button
                  variant="outlined"
                  onClick={onOpenDemo}
                  sx={{
                    borderColor: '#475569',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: '6px',
                    px: 3,
                    py: 1.2,
                    fontSize: '0.92rem',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#94A3B8',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  Request Parent App Demo
                </Button>
              </Box>
            </Box>

            {/* Right Card / Parent App Cards Preview */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              {[
                {
                  icon: <NotificationsActive sx={{ color: '#34D399' }} />,
                  title: 'Morning Bus Departure Alert',
                  subtitle: 'Route 12 has departed campus. Scheduled ETA at your stop: 7:42 AM',
                  tag: 'Live Telemetry',
                  time: 'Live',
                },
                {
                  icon: <TrendingUp sx={{ color: '#38BDF8' }} />,
                  title: 'Term 1 Exam Report Card Ready',
                  subtitle: 'Ananya scored 94% in Mathematics and secured Rank #2 in Class 8-B.',
                  tag: 'Gradebook',
                  time: '2 hrs ago',
                },
                {
                  icon: <CreditCard sx={{ color: '#FBBF24' }} />,
                  title: 'Quarter 2 Tuition Fee Receipt',
                  subtitle: 'Payment ₹18,500 successfully received. Official Receipt #SMS-2026-9812 issued.',
                  tag: 'Receipt Generated',
                  time: 'Yesterday',
                },
              ].map((card) => (
                <Box
                  key={card.title}
                  sx={{
                    bgcolor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    p: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.8,
                    transition: 'border-color 0.2s ease',
                    '&:hover': {
                      borderColor: '#475569',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '6px',
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.92rem' }}>
                        {card.title}
                      </Typography>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                        {card.time}
                      </Typography>
                    </Box>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.45, mb: 0.8 }}>
                      {card.subtitle}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.2,
                        borderRadius: '4px',
                        bgcolor: 'rgba(52, 211, 153, 0.12)',
                        color: '#34D399',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      {card.tag}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

