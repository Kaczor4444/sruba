
import React, { useState, useEffect, useCallback } from 'react';
import { BoltParams, HeadType, SocketType, TipType } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import ThreePreview from './components/ThreePreview.tsx';
import VisualPreview from './components/VisualPreview.tsx';
import { generateBlenderScript } from './services/scriptGenerator.ts';
import { downloadSTL, download3MF } from './services/stlExporter.ts';

type ViewMode = 'tech' | '3d';

const App: React.FC = () => {
  const [params, setParams] = useState<BoltParams>({
    d: 4.0,
    pitch: 0.7,
    headS: 7.0,
    headH: 3.0,
    length: 20.0,
    threadDepth: 0.35,
    headType: HeadType.ROUND,
    socketType: SocketType.HEX,
    socketDepthPercent: 70,
    tipType: TipType.FLAT,
    tipLength: 5.0,
    quantity: 1,
    hasNut: false,
    nutHeight: 3.2,
    hasWasher: false,
    washerThickness: 1.0,
    washerOuterD: 9.0
  });

  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [script, setScript] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setScript(generateBlenderScript(params));
  }, [params]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [script]);

  const totalItems = params.quantity * (1 + (params.hasNut ? 1 : 0) + (params.hasWasher ? 1 : 0));

  return (
    <div className="flex h-screen overflow-hidden text-slate-100">
      <Sidebar params={params} setParams={setParams} />
      
      <main className="flex-1 flex flex-col p-8 overflow-y-auto bg-slate-950">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Bolt Configuration</h2>
            <p className="text-slate-400 text-sm">Precision geometry for Blender & 3D Printing.</p>
          </div>
          <div className="flex gap-2">
             <button
              onClick={() => download3MF(params)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors flex flex-col items-center justify-center leading-tight shadow-lg shadow-orange-900/20"
              title="Best for Blender & 3D Software"
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <i className="fa-solid fa-cube"></i>
                Export GLTF
              </div>
              <span className="text-[9px] opacity-80 uppercase font-mono">Universal Format</span>
            </button>
             <button
              onClick={() => downloadSTL(params)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 flex flex-col items-center justify-center leading-tight"
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <i className="fa-solid fa-layer-group text-slate-400"></i>
                Export STL
              </div>
              <span className="text-[9px] opacity-60 uppercase font-mono">Merged Group</span>
            </button>
             <button
              onClick={() => {
                const blob = new Blob([script], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bolt_${params.d}mm.py`;
                a.click();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 flex items-center justify-center"
              title="Download Blender Python Script"
            >
              <i className="fa-solid fa-download text-blue-400 text-lg"></i>
            </button>
            <button
              onClick={handleCopy}
              className={`px-6 py-2 ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2`}
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              {copied ? 'Copied!' : 'Copy Python'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
          <div className="flex flex-col gap-4 min-h-[500px]">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
              <button 
                onClick={() => setViewMode('tech')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'tech' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <i className="fa-solid fa-ruler-combined"></i>
                Technical Drawing
              </button>
              <button 
                onClick={() => setViewMode('3d')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === '3d' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <i className="fa-solid fa-vr-cardboard"></i>
                3D Preview
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {viewMode === 'tech' ? (
                <VisualPreview params={params} />
              ) : (
                <ThreePreview params={params} />
              )}
            </div>
          </div>

          <div className="bg-[#0d1117] rounded-xl border border-slate-800 flex flex-col relative overflow-hidden h-full">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <i className="fa-brands fa-python text-blue-400"></i>
                blender_script.py
              </span>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Batch: {params.quantity} sets</span>
            </div>
            <pre className="p-4 overflow-auto text-[13px] font-mono leading-relaxed text-blue-100 flex-1 whitespace-pre scrollbar-thin scrollbar-thumb-slate-700">
              <code dangerouslySetInnerHTML={{ 
                __html: script
                  .replace(/# .*/g, '<span class="text-slate-500 italic">$&</span>')
                  .replace(/def |if |for |import |in |as |while |range /g, '<span class="text-pink-400">$&</span>')
                  .replace(/bpy|math/g, '<span class="text-yellow-300">$&</span>')
                  .replace(/\b\d+\.?\d*\b/g, '<span class="text-orange-300">$&</span>')
                  .replace(/'[^']*'/g, '<span class="text-green-300">$&</span>')
              }} />
            </pre>
          </div>
        </div>

        <footer className="mt-8 pt-4 border-t border-slate-900 text-slate-600 text-[10px] text-center flex justify-between items-center">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-blue-500"></i>
            Tip: Use GLTF export for Blender & other 3D software with separate objects.
          </span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><i className="fa-solid fa-shield-halved"></i> 100% Manifold</span>
            <span className="flex items-center gap-1"><i className="fa-solid fa-microchip"></i> V1.6.0 Stable</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
