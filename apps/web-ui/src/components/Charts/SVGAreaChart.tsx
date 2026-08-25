/**
 * SVGAreaChart — Lightweight SVG area / line chart.
 * Drop-in replacement for react-google-charts AreaChart / LineChart.
 * Zero external dependencies. No network requests.
 *
 * data format:
 *   [['Date', 'Value'],    // header row
 *    ['01 Aug', 1],         // data rows — values can be 0, 0.5, or 1
 *    ...]
 */

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface SVGAreaChartProps {
  data: (string | number)[][];
  colors?: string[];
  height?: number;
  /** If true, fills the area under the line */
  filled?: boolean;
  yMin?: number;
  yMax?: number;
  /** Show only every Nth x-axis label to avoid crowding */
  xLabelStep?: number;
}

const SVGAreaChart: React.FC<SVGAreaChartProps> = ({
  data,
  colors = ['#6366f1'],
  height = 180,
  filled = true,
  yMin,
  yMax,
  xLabelStep,
}) => {
  const parsed = useMemo(() => {
    if (!data || data.length < 3) return null;
    const [, ...rows] = data;
    return rows.map(row => ({
      label: String(row[0]),
      value: Number(row[1]) ?? 0,
    }));
  }, [data]);

  if (!parsed || parsed.length < 2) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          Not enough data
        </Typography>
      </Box>
    );
  }

  const values = parsed.map(p => p.value);
  const computedMin = yMin !== undefined ? yMin : Math.min(...values);
  const computedMax = yMax !== undefined ? yMax : Math.max(...values, computedMin + 1);
  const range = computedMax - computedMin || 1;

  const marginLeft = 28;
  const marginRight = 8;
  const marginTop = 8;
  const marginBottom = 30;
  const svgW = 400;
  const svgH = height;
  const chartW = svgW - marginLeft - marginRight;
  const chartH = svgH - marginTop - marginBottom;

  const color = colors[0] || '#6366f1';

  const points = parsed.map((pt, i) => ({
    x: marginLeft + (i / (parsed.length - 1)) * chartW,
    y: marginTop + chartH - ((pt.value - computedMin) / range) * chartH,
    label: pt.label,
    value: pt.value,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath = [
    `M ${points[0].x} ${marginTop + chartH}`,
    ...points.map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${marginTop + chartH}`,
    'Z',
  ].join(' ');

  // Y-axis ticks (3)
  const yTicks = [0, 0.5, 1].map(t => {
    const val = computedMin + t * range;
    const y = marginTop + chartH - t * chartH;
    return { val, y };
  });

  // X-axis label density
  const step = xLabelStep ?? Math.max(1, Math.floor(parsed.length / 6));

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: '100%', height, display: 'block' }}
      aria-label="Area chart"
    >
      {/* Grid lines */}
      {yTicks.map(tick => (
        <g key={tick.val}>
          <line x1={marginLeft} y1={tick.y} x2={svgW - marginRight} y2={tick.y}
            stroke="#f1f5f9" strokeWidth={1} />
          <text x={marginLeft - 3} y={tick.y} textAnchor="end" dominantBaseline="middle"
            fill="#94a3b8" style={{ fontSize: '9px', fontFamily: 'inherit' }}>
            {tick.val % 1 === 0 ? tick.val : tick.val.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      {filled && (
        <path d={areaPath} fill={color} fillOpacity={0.15} />
      )}

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={color} fillOpacity={0.85}>
          <title>{pt.label}: {pt.value}</title>
        </circle>
      ))}

      {/* X-axis labels */}
      {points.map((pt, i) =>
        i % step === 0 ? (
          <text key={i} x={pt.x} y={marginTop + chartH + 13} textAnchor="middle"
            fill="#94a3b8" style={{ fontSize: '8px', fontFamily: 'inherit' }}>
            {pt.label}
          </text>
        ) : null
      )}

      {/* Baseline */}
      <line x1={marginLeft} y1={marginTop + chartH} x2={svgW - marginRight} y2={marginTop + chartH}
        stroke="#e2e8f0" strokeWidth={1} />
    </svg>
  );
};

export default SVGAreaChart;
