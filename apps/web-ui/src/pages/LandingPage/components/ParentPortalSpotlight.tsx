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
          ref={ref}
          style={style}
          sx={{
            position: 'relative',
            borderRadius: { xs: '24px', md: '32px' },
            p: { xs: 3.5, sm: 5, md: 7 },
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #064E3B 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4), 0 0 35px rgba(16, 185, 129, 0.15)',
            overflow: 'hidden',
          }}
        >
          {glareStyle && <Box style={glareStyle} />}

          {/* Ambient Glows */}
          <Box
            sx={{
              position: 'absolute',
              top: '-10%',
              right: '-5%',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-15%',
              left: '10%',
              width: 350,
              height: 350,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

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
                  px: 2,
                  py: 0.6,
                  borderRadius: '50px',
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  mb: 2.5,
                }}
              >
                <EscalatorWarning sx={{ color: '#34D399', fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#34D399', letterSpacing: '0.05em' }}>
                  PARENTS PORTAL SPOTLIGHT
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.15,
                  mb: 2,
                }}
              >
                Keep Parents Informed & Fully Engaged in Real-Time
              </Typography>

              {/* Exact quote from Image 1 */}
              <Typography
                sx={{
                  fontSize: { xs: '1rem', sm: '1.15rem' },
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.7,
                  mb: 4,
                  maxWidth: 620,
                }}
              >
                "Keep parents informed and engaged with real-time updates on attendance, performance,
                fees, timetable, events and more."
              </Typography>

              {/* Feature points */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4.5 }}>
                {[
                  { title: 'Instant Attendance Alerts', desc: 'SMS & push alerts the second roll call is marked.' },
                  { title: 'Digital Fee Payments', desc: 'Secure UPI & card payments with instant PDF receipts.' },
                  { title: 'Exam Grade Cards', desc: 'View subject breakdowns, marks, and teacher comments.' },
                  { title: 'Live Bus Tracking', desc: 'See your child’s school bus on an interactive map.' },
                ].map((item) => (
                  <Box key={item.title} sx={{ display: 'flex', gap: 1.2 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 20, mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* CTA */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: '#10B981',
                    color: 'white',
                    fontWeight: 800,
                    borderRadius: '50px',
                    px: 3.5,
                    py: 1.3,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
                    '&:hover': {
                      bgcolor: '#059669',
                    },
                  }}
                >
                  Access Parent Portal
                </Button>
                <Button
                  variant="outlined"
                  onClick={onOpenDemo}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    fontWeight: 700,
                    borderRadius: '50px',
                    px: 3,
                    py: 1.3,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  Request Parent App Demo
                </Button>
              </Box>
            </Box>

            {/* Right Card / Interactive Parent App Cards Preview */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                {
                  icon: <NotificationsActive sx={{ color: '#34D399' }} />,
                  title: 'Morning Bus Departure Alert',
                  subtitle: 'Route 12 has departed campus. ETA at your stop: 7:42 AM',
                  tag: 'Live Telemetry',
                  time: 'Just now',
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
                  subtitle: 'Payment ₹18,500 successfully received. Receipt #SMS-2026-9812 generated.',
                  tag: 'Verified Paid',
                  time: 'Yesterday',
                },
              ].map((card, idx) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.4 }}
                >
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '16px',
                      p: 2.2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(52, 211, 153, 0.4)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                        <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem' }}>
                          {card.title}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.72rem' }}>
                          {card.time}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.82rem', lineHeight: 1.5, mb: 1 }}>
                        {card.subtitle}
                      </Typography>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1.2,
                          py: 0.3,
                          borderRadius: '6px',
                          bgcolor: 'rgba(52, 211, 153, 0.15)',
                          color: '#34D399',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {card.tag}
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
