import { useId } from "react";

// نقش هندسي إسلامي خفيف (نجمة ثمانية متكررة)، يرث لونه من currentColor
export function GeometricPattern({ className, size = 56 }: { className?: string; size?: number }) {
  const id = useId();
  const h = size / 2;
  const q = size * 0.2;
  const r = size * 0.283;
  return (
    <svg className={className} aria-hidden focusable="false">
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.25">
            <rect x={h - q} y={h - q} width={q * 2} height={q * 2} />
            <rect x={h - q} y={h - q} width={q * 2} height={q * 2} transform={`rotate(45 ${h} ${h})`} />
            <circle cx={h} cy={h} r={q * 0.55} />
            <path d={`M0 0 L${h - r} ${h - r} M${size} 0 L${h + r} ${h - r} M0 ${size} L${h - r} ${h + r} M${size} ${size} L${h + r} ${h + r}`} />
          </g>
        </pattern>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} mask={`url(#${id}-mask)`} />
    </svg>
  );
}
