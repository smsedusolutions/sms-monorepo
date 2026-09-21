import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export const StatsCounter: React.FC = () => {
  const metrics = [
    { value: '500+', label: 'Schools & Colleges', sub: 'Empowered Across India' },
    { value: '50,000+', label: 'Active Students', sub: 'Managed Daily with 0 Data Loss' },
    { value: '99.9%', label: 'Cloud Uptime SLA', sub: 'High Availability Cluster' },
    { value: '100%', label: 'Paperless Operations', sub: 'Digital Fee & Exam Gradebooks' },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 },
        position: 'relative',
        zIndex: 5,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E293B 100%)',
            p: { xs: 4, sm: 6, md: 7 },
            boxShadow: '0 20px 50px -10px rgba(30, 27, 75, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow dots */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: { xs: 4, lg: 6 },
              textAlign: 'center',
            }}
          >
            {metrics.map((m, idx) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: '2.5rem', sm: '3.2rem', md: '3.6rem' },
                      fontWeight: 900,
                      lineHeight: 1,
                      mb: 1,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #BAE6FD 50%, #38BDF8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {m.value}
                  </Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
                    {m.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                    {m.sub}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
