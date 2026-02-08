
import React from 'react';
import { BoltParams, HeadType, TipType } from '../types.ts';

interface VisualPreviewProps {
  params: BoltParams;
}

const VisualPreview: React.FC<VisualPreviewProps> = ({ params }) => {
  const scale = 4; 
  const padding = 60;
  // Zmniejszony odstęp wizualny do 4*scale (~0.8mm-1.0mm w skali rzeczywistej)
  const kitClearance = 4 * scale; 
  
  // Bolt Dimensions
  const hW = (params.headS * scale) / 2;
  const hH = params.headH * scale;
  const sW = (params.d * scale) / 2;
  const sL = params.length * scale;
  const tL = (params.tipType !== TipType.FLAT) ? params.tipLength * scale : 0;
  const tD = params.threadDepth * scale;

  // Nut & Washer Dimensions
  const nW = (params.headS * scale) / 2;
  const nH = params.nutHeight * scale;
  const wW = (params.washerOuterD * scale) / 2;
  const wH = params.washerThickness * scale;

  // Layout Calculations
  const activeParts = 1 + (params.hasNut ? 1 : 0) + (params.hasWasher ? 1 : 0);
  const sideViewWidth = (params.headS * scale * activeParts) + (padding * 2) + (kitClearance * (activeParts - 1));
  const sideViewHeight = Math.max(hH + sL + tL, nH, wH) + padding * 2;
  const boltCenterX = padding + hW;

  // Top View Calculations
  const topViewWidth = (params.headS * scale * activeParts) + (padding * 1.5) + (kitClearance * (activeParts - 1));
  const topViewHeight = Math.max(params.headS, params.washerOuterD) * scale + padding;
  const tCenterY = topViewHeight / 2;

  const DimensionArrow = ({ x1, y1, x2, y2, label, vertical = false, color = "blue-400" }: { x1: number, y1: number, x2: number, y2: number, label: string, vertical?: boolean, color?: string }) => (
    <g className={`text-[9px] font-mono fill-${color} stroke-${color}/50`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.5" strokeDasharray="2 1" />
      <path d={vertical ? `M ${x1-2} ${y1+5} L ${x1} ${y1} L ${x1+2} ${y1+5}` : `M ${x1+5} ${y1-2} L ${x1} ${y1} L ${x1+5} ${y1+2}`} fill="none" strokeWidth="1" />
      <path d={vertical ? `M ${x2-2} ${y2-5} L ${x2} ${y2} L ${x2+2} ${y2-5}` : `M ${x2-5} ${y2-2} L ${x2} ${y2} L ${x2-5} ${y2+2}`} fill="none" strokeWidth="1" />
      <text 
        x={vertical ? x1 - 8 : (x1 + x2) / 2} 
        y={vertical ? (y1 + y2) / 2 : y1 - 8} 
        textAnchor="middle" 
        stroke="none"
        transform={vertical ? `rotate(-90, ${x1-8}, ${(y1+y2)/2})` : ''}
      >
        {label}
      </text>
    </g>
  );

  const renderSocketTopView = (cx: number, cy: number, radius: number) => {
    const r = radius * 0.5;
    switch(params.headType) {
      case HeadType.ROUND_SLOT:
        return <rect x={cx - radius} y={cy - 1.5} width={radius * 2} height={3} fill="#1e293b" />;
      case HeadType.ROUND_PHILLIPS:
        return (
          <g>
            <rect x={cx - radius * 0.7} y={cy - 1.5} width={radius * 1.4} height={3} fill="#1e293b" />
            <rect x={cx - 1.5} y={cy - radius * 0.7} width={3} height={radius * 1.4} fill="#1e293b" />
          </g>
        );
      case HeadType.HEX_SOCKET:
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (i * 60) * Math.PI / 180;
          pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
        }
        return <polygon points={pts.join(' ')} fill="#1e293b" />;
      case HeadType.TORX:
        const torxPts = [];
        for (let i = 0; i < 12; i++) {
          const a = (i * 30 - 90) * Math.PI / 180;
          const dist = i % 2 === 0 ? r : r * 0.7;
          torxPts.push(`${cx + dist * Math.cos(a)},${cy + dist * Math.sin(a)}`);
        }
        return <polygon points={torxPts.join(' ')} fill="#1e293b" />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col items-center justify-start p-4 relative overflow-auto bg-grid">
        <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900/80 px-2 py-1 rounded">
          Technical Drawing Schema (Batch Kit)
        </div>

        <div className="flex flex-col items-center mt-10">
          <span className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-tighter">Side Elevation</span>
          <svg width={sideViewWidth} height={sideViewHeight}>
            <g transform={`translate(${boltCenterX}, ${padding})`}>
              <rect x={-hW} y={0} width={hW * 2} height={hH} fill="#475569" stroke="#94a3b8" strokeWidth="1" />
              <rect x={-sW} y={hH} width={sW * 2} height={sL} fill="#334155" stroke="#64748b" strokeWidth="1" />
              {Array.from({ length: Math.floor(params.length / params.pitch) }).map((_, i) => (
                <line key={i} x1={-sW} y1={hH + (i * params.pitch * scale)} x2={sW + tD} y2={hH + (i * params.pitch * scale) + (params.pitch * scale * 0.5)} stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
              ))}
              {params.tipType === TipType.POINTED && <path d={`M ${-sW} ${hH + sL} L ${sW} ${hH + sL} L 0 ${hH + sL + tL} Z`} fill="#334155" stroke="#64748b" />}
              {params.tipType === TipType.DOG_POINT && <rect x={-(sW * 0.7)} y={hH + sL} width={sW * 1.4} height={tL} fill="#334155" stroke="#64748b" />}
              
              <DimensionArrow x1={hW + 10} y1={0} x2={hW + 10} y2={hH} label={`${params.headH}mm`} vertical />
              <DimensionArrow x1={sW + 15} y1={hH} x2={sW + 15} y2={hH + sL} label={`${params.length}mm`} vertical />
            </g>

            {params.hasNut && (
              <g transform={`translate(${boltCenterX + hW + kitClearance + nW}, ${padding})`}>
                <rect x={-nW} y={0} width={nW * 2} height={nH} fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                <line x1={-sW-1} y1={-5} x2={-sW-1} y2={nH+5} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1={sW+1} y1={-5} x2={sW+1} y2={nH+5} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 2" />
                <DimensionArrow x1={nW + 10} y1={0} x2={nW + 10} y2={nH} label={`${params.nutHeight}mm`} vertical color="orange-400" />
                <text x={0} y={nH + 15} textAnchor="middle" className="text-[8px] fill-slate-500 uppercase font-bold">Nut</text>
              </g>
            )}

            {params.hasWasher && (
              <g transform={`translate(${boltCenterX + hW + (params.hasNut ? nW * 2 + kitClearance : 0) + kitClearance + wW}, ${padding})`}>
                <rect x={-wW} y={0} width={wW * 2} height={wH} fill="#64748b" stroke="#94a3b8" strokeWidth="1" />
                <DimensionArrow x1={wW + 10} y1={0} x2={wW + 10} y2={wH} label={`${params.washerThickness}mm`} vertical color="slate-400" />
                <text x={0} y={wH + 15} textAnchor="middle" className="text-[8px] fill-slate-500 uppercase font-bold">Washer</text>
              </g>
            )}
          </svg>
        </div>

        <div className="flex flex-col items-center mt-6">
          <span className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-tighter">Plan (Top)</span>
          <svg width={topViewWidth} height={topViewHeight}>
            <g transform={`translate(${padding + hW}, ${tCenterY})`}>
              {params.headType === HeadType.HEX ? (
                <polygon points={Array.from({length: 6}).map((_, i) => {
                  const a = (i * 60) * Math.PI / 180;
                  return `${hW * Math.cos(a)},${hW * Math.sin(a)}`;
                }).join(' ')} fill="#475569" stroke="#94a3b8" />
              ) : params.headType === HeadType.SQUARE ? (
                <rect x={-hW} y={-hW} width={hW * 2} height={hW * 2} fill="#475569" stroke="#94a3b8" />
              ) : (
                <circle cx={0} cy={0} r={hW} fill="#475569" stroke="#94a3b8" />
              )}
              {renderSocketTopView(0, 0, hW)}
            </g>

            {params.hasNut && (
              <g transform={`translate(${padding + hW * 2 + kitClearance + nW}, ${tCenterY})`}>
                <polygon points={Array.from({length: 6}).map((_, i) => {
                  const a = (i * 60) * Math.PI / 180;
                  return `${nW * Math.cos(a)},${nW * Math.sin(a)}`;
                }).join(' ')} fill="#334155" stroke="#94a3b8" />
                <circle cx={0} cy={0} r={sW + 2} fill="#0f172a" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1 1" />
              </g>
            )}

            {params.hasWasher && (
              <g transform={`translate(${padding + hW * 2 + (params.hasNut ? nW * 2 + kitClearance : 0) + kitClearance + wW}, ${tCenterY})`}>
                <circle cx={0} cy={0} r={wW} fill="#475569" stroke="#94a3b8" />
                <circle cx={0} cy={0} r={sW + 1} fill="#0f172a" stroke="#94a3b8" />
              </g>
            )}
          </svg>
        </div>
      </div>
      
      <div className="flex gap-6 justify-center text-[10px] font-mono text-slate-500 bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500"></div><span>D = {params.d}mm</span></div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400"></div><span>Nut Height = {params.nutHeight}mm</span></div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-400"></div><span>Washer = {params.washerThickness}mm</span></div>
      </div>
    </div>
  );
};

export default VisualPreview;
