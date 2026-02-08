
import React from 'react';
import { BoltParams, HeadType, TipType } from '../types.ts';

interface SidebarProps {
  params: BoltParams;
  setParams: React.Dispatch<React.SetStateAction<BoltParams>>;
}

const Sidebar: React.FC<SidebarProps> = ({ params, setParams }) => {
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
              <optgroup label="Sockets">
                <option value={HeadType.TORX}>Torx (Star)</option>
                <option value={HeadType.HEX_SOCKET}>Allen Socket</option>
                <option value={HeadType.ROUND_PHILLIPS}>Phillips</option>
                <option value={HeadType.ROUND_SLOT}>Slotted</option>
              </optgroup>
            </select>
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
