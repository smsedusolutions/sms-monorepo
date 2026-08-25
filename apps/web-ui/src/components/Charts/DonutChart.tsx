/**
 * DonutChart — Lightweight SVG donut / pie chart.
 * Drop-in replacement for react-google-charts PieChart with pieHole.
 * Zero external dependencies. No network requests.
 */

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  holeRatio?: number;
  centerLabel?: string;
  centerSublabel?: string;
  centerColor?: string;
  showLegend?: boolean;
}

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const a = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 135,
  holeRatio = 0.6,
  centerLabel,
  centerSublabel,
  centerColor = '#1e293b',
  showLegend = false,
}) => {
  const total = useMemo(() => segments.reduce((s, seg) => s + (seg.value || 0), 0), [segments]);
  const nonEmpty = useMemo(() => segments.filter(s => (s.value || 0) > 0), [segments]);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const innerR = outerR * holeRatio;

  const slices = useMemo(() => {
    if (total === 0 || nonEmpty.length === 0) return [];
    let startDeg = 0;
    return nonEmpty.map(seg => {
      const pct = seg.value / total;
      const sweep = pct * 360;
      const endDeg = startDeg + sweep;
      const large = sweep > 180 ? 1 : 0;

      const outerStart = polar(cx, cy, outerR, startDeg);
      const outerEnd = polar(cx, cy, outerR, endDeg);
      const innerStart = polar(cx, cy, innerR, endDeg);
      const innerEnd = polar(cx, cy, innerR, startDeg);

      let path: string;
      if (pct >= 0.9999) {
        const midO = polar(cx, cy, outerR, 180);
        const midI = polar(cx, cy, innerR, 180);
        path = [
          `M ${outerStart.x} ${outerStart.y}`,
          `A ${outerR} ${outerR} 0 1 1 ${midO.x} ${midO.y}`,
          `A ${outerR} ${outerR} 0 1 1 ${outerStart.x} ${outerStart.y}`,
          `L ${innerEnd.x} ${innerEnd.y}`,
          `A ${innerR} ${innerR} 0 1 0 ${midI.x} ${midI.y}`,
          `A ${innerR} ${innerR} 0 1 0 ${innerEnd.x} ${innerEnd.y}`,
          'Z',
        ].join(' ');
      } else {
        path = [
          `M ${outerStart.x} ${outerStart.y}`,
          `A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
          `L ${innerStart.x} ${innerStart.y}`,
          `A ${innerR} ${innerR} 0 ${large} 0 ${innerEnd.x} ${innerEnd.y}`,
          'Z',
        ].join(' ');
      }

      startDeg = endDeg;
      return { path, color: seg.color, label: seg.label, value: seg.value };
    });
  }, [nonEmpty, total, cx, cy, outerR, innerR]);

  const centerFontSize = Math.round(size * 0.16);
  const subFontSize = Math.round(size * 0.09);

  const chart = (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {slices.length === 0 ? (
        <>
          <circle cx={cx} cy={cy} r={outerR} fill="#f1f5f9" />
          <circle cx={cx} cy={cy} r={innerR} fill="white" />
        </>
      ) : (
        slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5}>
            <title>{s.label}: {s.value}</title>
          </path>
        ))
      )}
      {centerLabel && (
        <text
          x={cx}
          y={cy - (centerSublabel ? subFontSize * 0.6 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={centerColor}
          style={{ fontSize: centerFontSize + 'px', fontWeight: 800, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {centerLabel}
        </text>
      )}
      {centerSublabel && (
        <text
          x={cx}
          y={cy + centerFontSize * 0.75}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          style={{ fontSize: subFontSize + 'px', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {centerSublabel}
        </text>
      )}
    </svg>
  );

  if (!showLegend) return chart;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ flexShrink: 0 }}>{chart}</Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        {segments.filter(s => s.value > 0).map(seg => (
          <Box key={seg.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: seg.color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#475569' }}>
              {seg.label}: <strong>{seg.value}</strong>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DonutChart;
