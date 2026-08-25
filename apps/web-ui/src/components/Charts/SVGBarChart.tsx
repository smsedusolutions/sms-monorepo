/**
 * SVGBarChart — Lightweight grouped column chart.
 * Drop-in replacement for react-google-charts ColumnChart.
 * Zero external dependencies. No network requests.
 *
 * data format:
 *   [['Label', 'Series1', 'Series2', ...],   // header row
 *    ['W1', 3, 2, 1],                          // data rows
 *    ...]
 */

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface SVGBarChartProps {
  data: (string | number)[][];
  colors?: string[];
  height?: number;
  yMin?: number;
}

const DEFAULT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

const SVGBarChart: React.FC<SVGBarChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
  height = 180,
  yMin = 0,
}) => {
  const parsed = useMemo(() => {
    if (!data || data.length < 2) return null;
    const [header, ...rows] = data;
    const categoryLabel = header[0] as string;
    const seriesLabels = (header as (string | number)[]).slice(1).map(String);
    const parsedRows = rows.map(row => ({
      label: String(row[0]),
      values: (row as (string | number)[]).slice(1).map(v => Number(v) || 0),
    }));
    return { categoryLabel, seriesLabels, rows: parsedRows };
  }, [data]);

  if (!parsed || parsed.rows.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>No data</Typography>
      </Box>
    );
  }

  const { seriesLabels, rows } = parsed;
  const numSeries = seriesLabels.length;

  const allValues = rows.flatMap(r => r.values);
  const maxVal = Math.max(...allValues, 1);

  // Chart dimensions
  const marginLeft = 30;
  const marginRight = 8;
  const marginTop = 8;
  const marginBottom = 32;
  const svgW = 400; // viewBox width (scales with container)
  const svgH = height;
  const chartW = svgW - marginLeft - marginRight;
  const chartH = svgH - marginTop - marginBottom;

  const groupWidth = chartW / rows.length;
  const barPad = groupWidth * 0.15;
  const barW = (groupWidth - barPad * 2) / numSeries;

  // Y-axis ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = yMin + (maxVal - yMin) * (i / tickCount);
    return { val, y: marginTop + chartH - (val / maxVal) * chartH };
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Legend */}
      {numSeries > 1 && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 0.75, px: `${marginLeft}px` }}>
          {seriesLabels.map((label, i) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: colors[i % colors.length] }} />
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748b' }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: '100%', height, display: 'block' }}
        aria-label="Bar chart"
      >
        {/* Horizontal grid lines */}
        {ticks.map(tick => (
          <g key={tick.val}>
            <line x1={marginLeft} y1={tick.y} x2={svgW - marginRight} y2={tick.y}
              stroke="#f1f5f9" strokeWidth={1} />
            <text x={marginLeft - 3} y={tick.y} textAnchor="end" dominantBaseline="middle"
              fill="#94a3b8" style={{ fontSize: '9px', fontFamily: 'inherit' }}>
              {Math.round(tick.val)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {rows.map((row, ri) => {
          const groupX = marginLeft + ri * groupWidth + barPad;
          return (
            <g key={row.label}>
              {row.values.map((val, si) => {
                const barHeight = Math.max(1, (val / maxVal) * chartH);
                const x = groupX + si * barW;
                const y = marginTop + chartH - barHeight;
                return (
                  <rect key={si}
                    x={x} y={y}
                    width={Math.max(1, barW - 1.5)} height={barHeight}
                    fill={colors[si % colors.length]}
                    rx={2} ry={2}
                    opacity={0.88}
                  >
                    <title>{seriesLabels[si]}: {val}</title>
                  </rect>
                );
              })}
              {/* X-axis label */}
              <text
                x={groupX + (groupWidth - barPad * 2) / 2}
                y={marginTop + chartH + 12}
                textAnchor="middle"
                fill="#94a3b8"
                style={{ fontSize: '9px', fontFamily: 'inherit' }}
              >
                {row.label}
              </text>
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={marginLeft} y1={marginTop + chartH}
          x2={svgW - marginRight} y2={marginTop + chartH}
          stroke="#e2e8f0" strokeWidth={1}
        />
      </svg>
    </Box>
  );
};

export default SVGBarChart;
