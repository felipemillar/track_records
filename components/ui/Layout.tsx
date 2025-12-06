import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// Componente Tooltip Reutilizable con Portal y Posicionamiento Inteligente
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({ top: 0, left: 0, placement: 'top' });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipHeightEstimate = 120; // Estimación de altura del tooltip
      const spaceAbove = rect.top;
      
      // Si hay menos de 150px arriba, mostramos abajo
      const placeTop = spaceAbove > 150;

      setPosition({
        top: placeTop ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        placement: placeTop ? 'top' : 'bottom'
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className="inline-flex items-center ml-2 relative"
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-4 h-4 text-slate-500 hover:text-emerald-400 cursor-help transition-colors"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      
      {isVisible && createPortal(
        <div 
          className="fixed z-[9999] w-64 p-3 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: position.top,
            left: position.left,
            transform: `translate(-50%, ${position.placement === 'top' ? '-100%' : '0'})`
          }}
        >
          <div className="relative z-10 leading-relaxed">
            {text}
          </div>
          
          {/* Flecha visual del tooltip */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-600 transform rotate-45 ${
              position.placement === 'top' 
                ? 'bottom-[-7px] border-t-0 border-l-0' // Flecha abajo si tooltip está arriba
                : 'top-[-7px] border-r-0 border-b-0 border-l border-t' // Flecha arriba si tooltip está abajo
            }`}
          ></div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const Card: React.FC<{ title: string; description?: string; children: React.ReactNode; className?: string }> = ({ title, description, children, className = '' }) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 p-4 shadow-sm flex flex-col ${className}`}>
    <div className="flex items-center mb-3">
      <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{title}</h3>
      {description && <InfoTooltip text={description} />}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

export const KpiCard: React.FC<{ label: string; description?: string; value: string | number; subValue?: string; trend?: 'up' | 'down' | 'neutral' }> = ({ label, description, value, subValue, trend }) => {
  let color = 'text-slate-100';
  if (trend === 'up') color = 'text-emerald-400';
  if (trend === 'down') color = 'text-rose-400';

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 shadow-sm hover:border-slate-600 transition-colors">
      <div className="flex items-center mb-1">
        <div className="text-slate-400 text-xs font-medium uppercase">{label}</div>
        {description && <InfoTooltip text={description} />}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subValue && <div className="text-slate-500 text-xs mt-1">{subValue}</div>}
    </div>
  );
};
