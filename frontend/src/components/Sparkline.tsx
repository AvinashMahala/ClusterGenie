import React from 'react';

interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  padding?: number;
}

export const Sparkline: React.FC<Props> = ({ values, width = 160, height = 36, color = '#6366f1', padding = 4 }) => {
  if (!values || values.length === 0) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => {
    const x = padding + (i * ((width - padding * 2) / Math.max(1, values.length - 1)));
    const y = height - padding - ((v - min) / Math.max(0.0001, max - min) * (height - padding * 2));
    return `${x},${y}`;
  });
  const path = `M ${pts.join(' L ')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id="spark-g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${path} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#spark-g1)" stroke="none" opacity={0.8} />
      {pts.length > 0 && (
        <circle cx={Number(pts[pts.length - 1].split(',')[0])} cy={Number(pts[pts.length - 1].split(',')[1])} r={3} fill="#3730a3" />
      )}
    </svg>
  );
};

export default Sparkline;
