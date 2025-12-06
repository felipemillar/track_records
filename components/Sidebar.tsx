import React from 'react';
import { FilterState, OracleModule, Direction } from '../types';
import { formatVolumeUSD } from '../utils/analytics';

interface SidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters }) => {
  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArray = <T extends string>(current: T[], item: T): T[] => {
    return current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
  };

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 overflow-y-auto h-full flex flex-col gap-6 shrink-0">
      <div>
        <h1 className="text-xl font-bold text-emerald-400 tracking-tight">Oracle Agent</h1>
        <p className="text-xs text-slate-500 mt-1">Dashboard Institucional USDCLP</p>
      </div>

      {/* Date Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase">Rango de Fechas</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
          <input
            type="date"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>
      </div>

      {/* Direction */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase">Dirección</label>
        <div className="flex gap-2">
          {(['buy', 'sell'] as Direction[]).map(dir => (
            <button
              key={dir}
              onClick={() => handleChange('directions', toggleArray(filters.directions, dir))}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium uppercase transition-colors border ${
                filters.directions.includes(dir)
                  ? dir === 'buy' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
              }`}
            >
              {dir === 'buy' ? 'Compra' : 'Venta'}
            </button>
          ))}
        </div>
      </div>

      {/* Oracle Modules */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase">Módulos Horarios</label>
        <div className="grid grid-cols-3 gap-2">
          {(['M1', 'M2', 'M3'] as OracleModule[]).map(mod => (
            <button
              key={mod}
              onClick={() => handleChange('modules', toggleArray(filters.modules, mod))}
              className={`py-1.5 px-2 rounded text-xs font-medium transition-colors border ${
                filters.modules.includes(mod)
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-slate-600 space-y-0.5">
          <p>M1: Pre-10:30</p>
          <p>M2: 10:30-12:00</p>
          <p>M3: 12:00+</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        <label className="text-xs font-semibold text-slate-400 uppercase">Parámetros</label>
        
        {/* Min Vol */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Volumen Mínimo</span>
            <span>{formatVolumeUSD(filters.minVol)}</span>
          </div>
          <input 
            type="range" min="0" max="20000000" step="500000" // Max 20M USD
            value={filters.minVol}
            onChange={(e) => handleChange('minVol', Number(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Min Dur */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Duración Máxima (min)</span>
            <span>{filters.maxDur}</span>
          </div>
          <input 
            type="range" min="10" max="480" step="10"
            value={filters.maxDur}
            onChange={(e) => handleChange('maxDur', Number(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

         <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="excludeFlat"
              checked={filters.excludeFlat}
              onChange={(e) => handleChange('excludeFlat', e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="excludeFlat" className="text-xs text-slate-300">Excluir Flat (|diff| &lt; 0.1)</label>
         </div>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <button 
           onClick={() => setFilters({
              startDate: '2023-01-01',
              endDate: '2023-12-31',
              directions: ['buy', 'sell'],
              modules: ['M1', 'M2', 'M3'],
              minVol: 0,
              maxVol: 100000000,
              minDur: 0,
              maxDur: 480,
              excludeFlat: false,
           })}
           className="w-full py-2 bg-slate-800 text-slate-400 text-xs font-medium rounded hover:bg-slate-700 transition-colors"
        >
          Resetear Filtros
        </button>
      </div>
    </aside>
  );
};