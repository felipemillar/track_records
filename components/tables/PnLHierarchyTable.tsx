import React, { useState } from 'react';
import { PnLHierarchy, formatCurrency, MONTH_NAMES } from '../../utils/analytics';

export interface DrillDownState {
  year: number | null;
  month: number | null;
  date: string | null;
}

interface Props {
  data: PnLHierarchy;
  activeFilter: DrillDownState;
  onFilter: (filter: DrillDownState) => void;
}

export const PnLHierarchyTable: React.FC<Props> = ({ data, activeFilter, onFilter }) => {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleYear = (year: number) => {
    const newSet = new Set(expandedYears);
    if (newSet.has(year)) {
      newSet.delete(year);
    } else {
      newSet.add(year);
    }
    setExpandedYears(newSet);
  };

  const toggleMonth = (year: number, month: number) => {
    const key = `${year}-${month}`;
    const newSet = new Set(expandedMonths);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedMonths(newSet);
  };

  const sortedYears = Object.keys(data).map(Number).sort((a, b) => b - a);

  const PnLCell = ({ value }: { value: number }) => (
    <span className={`font-mono font-medium ${value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
      {formatCurrency(value)}
    </span>
  );

  // Botón para activar el filtro en el dashboard
  const FilterButton = ({ isActive, onClick }: { isActive: boolean, onClick: (e: React.MouseEvent) => void }) => (
    <button
      onClick={onClick}
      title={isActive ? "Quitar filtro" : "Filtrar gráficos por este periodo"}
      className={`ml-3 p-1 rounded transition-all ${
        isActive 
          ? 'bg-emerald-500 text-white shadow shadow-emerald-500/50' 
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
      }`}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  );

  return (
    <div className="overflow-hidden bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 font-semibold text-slate-300 text-sm uppercase tracking-wider flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span>Navegador Temporal</span>
          {(activeFilter.year || activeFilter.month || activeFilter.date) && (
            <button 
              onClick={() => onFilter({ year: null, month: null, date: null })}
              className="text-[10px] bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-300 px-2 py-0.5 rounded transition-colors"
            >
              Limpiar Filtro
            </button>
          )}
        </div>
        <span>PnL Neto (CLP)</span>
      </div>
      <div className="divide-y divide-slate-700">
        {sortedYears.map(year => {
          const yearData = data[year];
          const isYearExpanded = expandedYears.has(year);
          const isYearActive = activeFilter.year === year && activeFilter.month === null && activeFilter.date === null;
          const sortedMonths = Object.keys(yearData.months).map(Number).sort((a, b) => a - b);

          return (
            <div key={year} className={`transition-colors ${isYearActive ? 'bg-slate-700/30' : 'bg-slate-800'}`}>
              {/* YEAR ROW */}
              <div className="flex justify-between items-center px-4 py-3 hover:bg-slate-700 transition-colors select-none group">
                <div className="flex items-center gap-2">
                  <div 
                    onClick={() => toggleYear(year)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-slate-400 text-xs w-4">
                      {isYearExpanded ? '▼' : '▶'}
                    </span>
                    <span className={`font-bold text-sm ${isYearActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                      Año {year}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-900 px-1.5 rounded ml-2">{yearData.count} camps</span>
                  </div>
                  <FilterButton 
                    isActive={isYearActive} 
                    onClick={(e) => { e.stopPropagation(); onFilter(isYearActive ? { year: null, month: null, date: null } : { year, month: null, date: null }); }} 
                  />
                </div>
                <PnLCell value={yearData.totalPnL} />
              </div>

              {/* MONTHS LIST */}
              {isYearExpanded && (
                <div className="bg-slate-800/50">
                  {sortedMonths.map(month => {
                    const monthData = yearData.months[month];
                    const monthKey = `${year}-${month}`;
                    const isMonthExpanded = expandedMonths.has(monthKey);
                    const isMonthActive = activeFilter.year === year && activeFilter.month === month && activeFilter.date === null;
                    const sortedDays = Object.keys(monthData.days).sort();

                    return (
                      <div key={monthKey} className={isMonthActive ? 'bg-slate-700/40' : ''}>
                        {/* MONTH ROW */}
                        <div className="flex justify-between items-center pl-10 pr-4 py-2 hover:bg-slate-700/50 transition-colors border-t border-slate-700/50 select-none">
                           <div className="flex items-center gap-2">
                              <div 
                                onClick={() => toggleMonth(year, month)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <span className="text-slate-500 text-[10px] w-3">
                                  {isMonthExpanded ? '▼' : '▶'}
                                </span>
                                <span className={`font-medium text-sm ${isMonthActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {MONTH_NAMES[month - 1]}
                                </span>
                                <span className="text-[10px] text-slate-500 ml-2">{monthData.count} camps</span>
                              </div>
                              <FilterButton 
                                isActive={isMonthActive} 
                                onClick={(e) => { e.stopPropagation(); onFilter(isMonthActive ? { year: null, month: null, date: null } : { year, month, date: null }); }} 
                              />
                           </div>
                          <PnLCell value={monthData.totalPnL} />
                        </div>

                        {/* DAYS LIST */}
                        {isMonthExpanded && (
                          <div className="bg-slate-900/30 border-t border-slate-700/30">
                            {sortedDays.map(date => {
                              const dayData = monthData.days[date];
                              const isDayActive = activeFilter.date === date;
                              return (
                                <div key={date} className={`flex justify-between items-center pl-16 pr-4 py-1.5 hover:bg-slate-700/30 ${isDayActive ? 'bg-emerald-900/20' : ''}`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs ${isDayActive ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>{date}</span>
                                    <span className="text-[10px] text-slate-600">({dayData.count})</span>
                                    <FilterButton 
                                        isActive={isDayActive} 
                                        onClick={(e) => { e.stopPropagation(); onFilter(isDayActive ? { year: null, month: null, date: null } : { year, month, date }); }} 
                                      />
                                  </div>
                                  <span className="text-xs">
                                     <PnLCell value={dayData.totalPnL} />
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};