
import React from 'react';
import { BoltParams, HeadType, SocketType, TipType } from '../types.ts';
import { BOLT_PRESETS } from '../presets.ts';

interface SidebarProps {
  params: BoltParams;
  setParams: React.Dispatch<React.SetStateAction<BoltParams>>;
}

const Sidebar: React.FC<SidebarProps> = ({ params, setParams }) => {
  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetKey = e.target.value;
    if (presetKey && BOLT_PRESETS[presetKey]) {
      setParams(BOLT_PRESETS[presetKey].params);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value);
    setParams(prev => {
      const newState = { ...prev, [name]: val };
      // Auto-suggest washer diameter if D changes
      if (name === 'd') {
        newState.washerOuterD = Math.max(newState.washerOuterD, (val as number) * 2.2);
      }
      return newState;
    });
  };

  const InputGroup = ({ label, name, value, min = 0.1, step = 0.1, unit = 'mm' }: { label: string, name: string, value: number, min?: number, step?: number, unit?: string }) => (
    <div className="mb-4">
      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{label} ({unit})</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={handleChange}
        min={min}
        step={step}
        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-200"
      />
    </div>
  );

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
          <i className="fa-solid fa-nut-bolt text-blue-500"></i>
          BoltGen Pro
        </h1>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Parametric Kit Generator</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Quick Presets Section */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-bolt text-blue-400"></i>
            <h3 className="text-sm font-bold text-white">Quick Presets</h3>
            <span className="text-[9px] bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full font-mono">ISO 4762</span>
          </div>
          <select
            onChange={handlePresetSelect}
            defaultValue=""
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-200 font-mono"
          >
            <option value="" disabled>Select standard size...</option>
            <optgroup label="M3 (3mm)">
              <option value="M3x10">M3×10 - Socket Head</option>
              <option value="M3x16">M3×16 - Socket Head</option>
            </optgroup>
            <optgroup label="M4 (4mm)">
              <option value="M4x20">M4×20 - Socket Head</option>
              <option value="M4x30">M4×30 - Socket Head</option>
            </optgroup>
            <optgroup label="M5 (5mm)">
              <option value="M5x25">M5×25 - Socket Head</option>
              <option value="M5x40">M5×40 - Socket Head</option>
            </optgroup>
            <optgroup label="M6 (6mm)">
              <option value="M6x30">M6×30 - Socket Head</option>
              <option value="M6x50">M6×50 - Socket Head</option>
            </optgroup>
            <optgroup label="M8 (8mm)">
              <option value="M8x40">M8×40 - Socket Head</option>
              <option value="M8x60">M8×60 - Socket Head</option>
            </optgroup>
            <optgroup label="M10 (10mm)">
              <option value="M10x50">M10×50 - Socket Head</option>
            </optgroup>
          </select>
          <p className="text-[9px] text-slate-500 mt-2 italic">
            <i className="fa-solid fa-info-circle"></i> All dimensions per ISO 4762 standard
          </p>
        </div>

        {/* 3D Printing Settings */}
        <section className="p-4 bg-gradient-to-br from-orange-900/30 to-red-900/20 border border-orange-800/50 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-print text-orange-400"></i>
            <h3 className="text-sm font-bold text-white">3D Printing</h3>
            <span className="text-[9px] bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded-full font-mono">Tolerances</span>
          </div>
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nozzle Size (mm)</label>
            <select
              name="nozzleSize"
              value={params.nozzleSize}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none text-slate-200 font-mono"
            >
              <option value={0.2}>0.2mm (High Precision)</option>
              <option value={0.4}>0.4mm (Standard)</option>
              <option value={0.6}>0.6mm (Fast Print)</option>
              <option value={0.8}>0.8mm (Very Fast)</option>
            </select>
          </div>
          <div className="text-[9px] text-slate-500 space-y-1">
            <p><i className="fa-solid fa-info-circle text-orange-400"></i> Larger nozzles = more clearance</p>
            <p className="pl-4">Bolt reduced by: {params.nozzleSize <= 0.2 ? '0.15' : params.nozzleSize <= 0.4 ? '0.2' : params.nozzleSize <= 0.6 ? '0.3' : '0.4'}mm</p>
            <p className="pl-4">Nut clearance: {params.nozzleSize <= 0.2 ? '0.25' : params.nozzleSize <= 0.4 ? '0.35' : params.nozzleSize <= 0.6 ? '0.5' : '0.6'}mm</p>
          </div>
        </section>

        {/* Batch Production Section */}
        <section className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-4">
          <h2 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase">
            <i className="fa-solid fa-layer-group"></i> Production Batch
          </h2>
          <InputGroup label="Quantity" name="quantity" value={params.quantity} min={1} step={1} unit="pcs" />
        </section>

        {/* Bolt Core Section */}
        <section>
          <h2 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <i className="fa-solid fa-bolt"></i> Bolt Geometry
          </h2>
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Head Type</label>
            <select
              name="headType"
              value={params.headType}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none text-slate-200"
            >
              <optgroup label="External">
                <option value={HeadType.HEX}>Hexagonal</option>
                <option value={HeadType.SQUARE}>Square</option>
              </optgroup>
              <optgroup label="Cylindrical">
                <option value={HeadType.ROUND}>Round (Cylindrical)</option>
                <option value={HeadType.BUTTON_HEAD}>Button Head (ISO 7380)</option>
              </optgroup>
              <optgroup label="Flush">
                <option value={HeadType.COUNTERSUNK}>Countersunk (Flat)</option>
              </optgroup>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Socket Type</label>
            <select
              name="socketType"
              value={params.socketType}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none text-slate-200"
            >
              <option value={SocketType.NONE}>None (Solid Head)</option>
              <option value={SocketType.HEX}>Hex Socket (Imbus)</option>
              <option value={SocketType.TORX}>Torx (Star)</option>
              <option value={SocketType.PHILLIPS}>Phillips (Cross)</option>
              <option value={SocketType.SLOT}>Slot (Flat)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center justify-between">
              <span>Socket Depth</span>
              <span className="text-xs text-slate-400 font-mono">{params.socketDepthPercent}%</span>
            </label>
            <input
              type="range"
              name="socketDepthPercent"
              value={params.socketDepthPercent}
              onChange={handleChange}
              min="0"
              max="100"
              step="5"
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>Shallow</span>
              <span>Deep</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup label="D (Nominal)" name="d" value={params.d} />
            <InputGroup label="Length" name="length" value={params.length} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Pitch" name="pitch" value={params.pitch} step={0.05} />
            <InputGroup label="Th. Depth" name="threadDepth" value={params.threadDepth} step={0.05} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Head Size" name="headS" value={params.headS} />
            <InputGroup label="Head Height" name="headH" value={params.headH} />
          </div>
        </section>

        {/* Nut Section */}
        <section className="p-4 bg-slate-800/30 border border-slate-700 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
              <i className="fa-solid fa-nut-bolt text-slate-400"></i> Nut
            </h2>
            <input 
              type="checkbox" 
              name="hasNut" 
              checked={params.hasNut} 
              onChange={handleChange}
              className="w-4 h-4 accent-blue-500"
            />
          </div>
          {params.hasNut && (
            <InputGroup label="Nut Thickness" name="nutHeight" value={params.nutHeight} />
          )}
        </section>

        {/* Washer Section */}
        <section className="p-4 bg-slate-800/30 border border-slate-700 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
              <i className="fa-solid fa-circle-dot text-slate-400"></i> Washer
            </h2>
            <input 
              type="checkbox" 
              name="hasWasher" 
              checked={params.hasWasher} 
              onChange={handleChange}
              className="w-4 h-4 accent-blue-500"
            />
          </div>
          {params.hasWasher && (
            <>
              <InputGroup label="Thickness" name="washerThickness" value={params.washerThickness} />
              <InputGroup label="Outer Dia." name="washerOuterD" value={params.washerOuterD} />
            </>
          )}
        </section>

        {/* Tip Section */}
        <section>
          <h2 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <i className="fa-solid fa-caret-down"></i> Tip End
          </h2>
          <div className="mb-4">
            <select
              name="tipType"
              value={params.tipType}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none text-slate-200"
            >
              <option value={TipType.FLAT}>Flat End</option>
              <option value={TipType.POINTED}>Pointed Cone</option>
              <option value={TipType.DOG_POINT}>Dog Point</option>
            </select>
          </div>
          {(params.tipType === TipType.POINTED || params.tipType === TipType.DOG_POINT) && (
            <InputGroup label="Tip Length" name="tipLength" value={params.tipLength} />
          )}
        </section>
      </div>
    </aside>
  );
};

export default Sidebar;
