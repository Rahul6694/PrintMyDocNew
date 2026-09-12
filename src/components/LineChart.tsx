"use client";

import { useState } from "react";

export type ChartPoint = { label: string; value: number };

export default function LineChart({
  points,
  formatValue,
  color = "var(--c-accent-500)",
}: {
  points: ChartPoint[];
  formatValue: (v: number) => string;
  color?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 600;
  const height = 200;
  const padding = 24;
  const max = Math.max(1, ...points.map((p) => p.value));

  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: padding + i * stepX,
    y: height - padding - (p.value / max) * (height - padding * 2),
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${path} L ${coords[coords.length - 1]?.x || padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44" preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padding}
            x2={width - padding}
            y1={padding + t * (height - padding * 2)}
            y2={padding + t * (height - padding * 2)}
            stroke="var(--c-700)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} fill={color} opacity={0.08} />
        <path d={path} fill="none" stroke={color} strokeWidth={2} />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hoverIndex === i ? 5 : 3}
            fill={color}
            stroke="var(--c-850)"
            strokeWidth={2}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}
      </svg>

      <div className="flex justify-between px-1 -mt-1 text-xs text-base-500">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>

      {hoverIndex !== null && (
        <div
          className="absolute bg-[#14151f] text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: `${(coords[hoverIndex].x / width) * 100}%`,
            top: `${(coords[hoverIndex].y / height) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <p className="font-semibold">{points[hoverIndex].label}</p>
          <p>{formatValue(points[hoverIndex].value)}</p>
        </div>
      )}
    </div>
  );
}
