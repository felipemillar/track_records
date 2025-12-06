import React, { useState, useMemo } from 'react';
import { parseCsvData } from './services/mockData';
import { Campaign, FilterState, OracleModule } from './types';
import { calculateKPIs, createHistogramData, formatVolumeUSD, buildPnLHierarchy } from './utils/analytics';
import { Sidebar } from './components/Sidebar';
import { Card, KpiCard } from './components/ui/Layout';
import { DistributionChart, SimpleBarChart, ScatterPlot, ComparisonBarChart } from './components/charts/CommonCharts';
import { PnLHierarchyTable, DrillDownState } from './components/tables/PnLHierarchyTable';

const TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'price_edge', label: 'Edge de Precio' },
  { id: 'temporal', label: 'Módulos Temporales' },
  { id: 'size_risk', label: 'Tamaño y Riesgo' },
  { id: 'pnl_vs_price', label: 'PnL vs Precio' },
  { id: 'explorer', label: 'Explorador' },
];

export default function App() {
  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Estado para el filtro jerárquico (Tabla PnL)
  const [drillDown, setDrillDown] = useState<DrillDownState>({ year: null, month: null, date: null });

  const [filters, setFilters] = useState<FilterState>({
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    directions: ['buy', 'sell'],
    modules: ['M1', 'M2', 'M3'],
    minVol: 0,
    maxVol: 100000000,
    minDur: 0,
    maxDur: 480, // 8 horas
    excludeFlat: false,
  });

  // Manejador de Archivo CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedData = parseCsvData(text);
      
      // Ajustar fechas predeterminadas basadas en la data
      if (parsedData.length > 0) {
        const sorted = [...parsedData].sort((a, b) => a.entry_timestamp - b.entry_timestamp);
        setFilters(prev => ({
          ...prev,
          startDate: sorted[0].entry_date,
          endDate: sorted[sorted.length - 1].entry_date
        }));
      }

      setData(parsedData);
      setFileLoaded(true);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  // Lógica de Filtro Combinada (Sidebar + DrillDown Table)
  const filteredData = useMemo(() => {
    if (!fileLoaded) return [];
    
    // 1. Filtro base de Sidebar
    const startTs = new Date(filters.startDate).getTime();
    const endTs = new Date(filters.endDate).getTime() + 86400000; 

    return data.filter(d => {
      // Check Sidebar Filters
      if (d.entry_timestamp < startTs || d.entry_timestamp > endTs) return false;
      if (!filters.directions.includes(d.direction)) return false;
      if (!filters.modules.includes(d.oracle_module)) return false;
      if (d.vol_total < filters.minVol) return false;
      if (d.trade_dur_min > filters.maxDur) return false;
      if (filters.excludeFlat && Math.abs(d.price_diff) < 0.1) return false;

      // Check DrillDown Filters (Desde la tabla PnL)
      if (drillDown.date && d.entry_date !== drillDown.date) return false;
      if (drillDown.month && d.month !== drillDown.month && !drillDown.date) return false; // Si hay fecha exacta, ignoramos mes genérico
      if (drillDown.year && d.year !== drillDown.year) return false;

      return true;
    });
  }, [data, filters, fileLoaded, drillDown]);

  // Datos para la tabla PnL (Debe ser sobre la data filtrada por sidebar, pero IGNORANDO el drilldown actual
  // para que el usuario pueda seguir navegando por la tabla aunque haya seleccionado un mes específico)
  const dataForHierarchy = useMemo(() => {
    if (!fileLoaded) return [];
    const startTs = new Date(filters.startDate).getTime();
    const endTs = new Date(filters.endDate).getTime() + 86400000; 
    return data.filter(d => {
      if (d.entry_timestamp < startTs || d.entry_timestamp > endTs) return false;
      if (!filters.directions.includes(d.direction)) return false;
      if (!filters.modules.includes(d.oracle_module)) return false;
      if (d.vol_total < filters.minVol) return false;
      if (d.trade_dur_min > filters.maxDur) return false;
      if (filters.excludeFlat && Math.abs(d.price_diff) < 0.1) return false;
      return true;
    });
  }, [data, filters, fileLoaded]);

  // KPIs
  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  
  // Jerarquía PnL
  const pnlHierarchy = useMemo(() => buildPnLHierarchy(dataForHierarchy), [dataForHierarchy]);

  // --- RENDERIZADO: PANTALLA DE CARGA ---
  if (!fileLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
            <h1 className="text-3xl font-bold text-emerald-400 mb-2">Oracle Dashboard Agent</h1>
            <p className="text-slate-400 text-sm mb-6">
              Analítica de Campañas Institucionales USDCLP
            </p>
            
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-10 hover:border-emerald-500 hover:bg-slate-800/50 transition-colors group cursor-pointer relative">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <svg className="w-10 h-10 text-slate-500 group-hover:text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {loading ? (
                  <span className="text-emerald-500 animate-pulse">Procesando archivo...</span>
                ) : (
                  <>
                    <span className="text-slate-300 font-medium">Sube tu archivo CSV</span>
                    <span className="text-slate-500 text-xs mt-1">trades_usdclp_clusters_final_campaigns...</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Nota: 1 Lote = 100,000 USD (Conversión Automática)</p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: PESTAÑAS ---

  const renderSummaryTab = () => {
    const priceDiffHist = createHistogramData(filteredData, 'price_diff', 0.5);
    const dailyCounts: Record<string, number> = {};
    filteredData.forEach(d => dailyCounts[d.entry_date] = (dailyCounts[d.entry_date] || 0) + 1);
    const avgDailyCampaigns = (Object.values(dailyCounts).reduce((a, b) => a + b, 0) / Object.keys(dailyCounts).length || 0).toFixed(1);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* 1. KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            label="Campañas Filtradas" 
            value={kpis.count} 
            subValue={`Promedio Diario: ${avgDailyCampaigns === 'NaN' ? 0 : avgDailyCampaigns}`} 
            description="Número total de campañas que cumplen con los criterios de fecha, módulo y filtros seleccionados."
          />
          <KpiCard 
            label="Win Rate (Precio)" 
            value={`${kpis.winRatePrice.toFixed(1)}%`} 
            trend={kpis.winRatePrice > 50 ? 'up' : 'down'}
            subValue={`Objetivo > 55%`}
            description="Porcentaje de campañas donde el precio de salida fue mejor que el precio de entrada (Edge > 0)."
          />
           <KpiCard 
            label="Esperanza (Precio)" 
            value={`${kpis.expectancyPrice.toFixed(2)}`} 
            trend={kpis.expectancyPrice > 0 ? 'up' : 'down'}
            subValue="Ticks por campaña"
            description="Valor esperado en ticks por cada operación: (Prob. Ganar * Ganancia Promedio) - (Prob. Perder * Pérdida Promedio)."
          />
           <KpiCard 
            label="Esperanza (PnL)" 
            value={`$${Math.round(kpis.expectancyPnL).toLocaleString()}`} 
            trend={kpis.expectancyPnL > 0 ? 'up' : 'down'}
            subValue="CLP por campaña"
            description="Valor monetario esperado (CLP) por cada campaña lanzada, considerando el promedio de ganancias y pérdidas."
          />
        </div>

        {/* 2. Charts (Moved to TOP) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card 
            title="Distribución de Edge (Ticks)" 
            description="Histograma que muestra la frecuencia de resultados. Un sesgo hacia la derecha (verde) indica ventaja estadística consistente."
          >
            <DistributionChart data={priceDiffHist} xKey="bin" yKey="count" />
          </Card>
          
          <Card 
            title="Resultados de Campaña" 
            description="Comparación entre la efectividad de la lectura de precio vs el resultado monetario final. Ayuda a detectar problemas de ejecución o comisiones."
          >
             <div className="h-[300px] flex items-center justify-center">
                <ComparisonBarChart 
                   data={[
                     { name: 'Precio', win: kpis.winRatePrice, loss: 100 - kpis.winRatePrice },
                     { name: 'PnL', win: kpis.winRatePnL, loss: 100 - kpis.winRatePnL }
                   ]} 
                   xKey="name" bar1Key="win" bar2Key="loss" 
                />
             </div>
          </Card>
        </div>

        {/* 3. Drill-down Table (Moved to BOTTOM) */}
        <Card 
          title="Explorador de Periodos (Click en la mira para filtrar dashboard)"
          description="Tabla interactiva para navegar en el tiempo. Expande los años y meses para ver detalles diarios. Usa el icono de mira (⌖) para aislar un periodo en todo el dashboard."
        >
          <div className="bg-slate-900/50 p-2 text-xs text-slate-400 mb-2 rounded flex items-center gap-2">
            <span className="text-emerald-400 font-bold">Tip:</span> 
            Usa el icono <span className="bg-slate-700 p-0.5 rounded text-white">⌖</span> para filtrar los gráficos superiores por Año, Mes o Día específico.
          </div>
          <PnLHierarchyTable 
            data={pnlHierarchy} 
            activeFilter={drillDown} 
            onFilter={(newFilter) => setDrillDown(newFilter)}
          />
        </Card>
      </div>
    );
  };

  const renderPriceEdgeTab = () => {
    const diffByDir = [
      { name: 'Compra', value: calculateKPIs(filteredData.filter(d => d.direction === 'buy')).avgPriceDiff },
      { name: 'Venta', value: calculateKPIs(filteredData.filter(d => d.direction === 'sell')).avgPriceDiff }
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard 
            label="Edge Promedio" 
            value={kpis.avgPriceDiff.toFixed(2)} 
            trend={kpis.avgPriceDiff > 0 ? 'up' : 'down'} 
            subValue="Ticks" 
            description="Diferencia promedio entre VWAP de entrada y salida. Positivo significa que el Oracle compra barato y vende caro."
          />
          <KpiCard 
            label="Edge Mediano" 
            value={kpis.medianPriceDiff.toFixed(2)} 
            trend={kpis.medianPriceDiff > 0 ? 'up' : 'down'} 
            subValue="Ticks" 
            description="El valor central de los resultados. Es más robusto ante valores extremos (outliers) que el promedio."
          />
          <KpiCard 
            label="Duración Promedio" 
            value={`${kpis.avgDuration.toFixed(1)} min`} 
            subValue="Tiempo en mercado" 
            description="Tiempo medio desde el primer click de entrada hasta el cierre de la posición."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card 
            title="Edge por Dirección" 
            description="Comparativa de rentabilidad en ticks entre posiciones Largas (Compra) y Cortas (Venta)."
          >
             <SimpleBarChart data={diffByDir} xKey="name" yKey="value" color="#8b5cf6" />
          </Card>
          <Card 
            title="Distribución Fina de Precio"
            description="Vista detallada de la distribución de ticks con bins más pequeños (0.25) para detectar patrones precisos."
          >
            <DistributionChart data={createHistogramData(filteredData, 'price_diff', 0.25)} xKey="bin" yKey="count" />
          </Card>
        </div>

        <Card 
          title="Duración vs Impacto en Precio"
          description="Analiza si las campañas más largas tienden a capturar más valor o si el edge se diluye con el tiempo."
        >
          <ScatterPlot 
            data={filteredData.map(d => ({ x: d.trade_dur_min, y: d.price_diff, price_diff: d.price_diff }))} 
            xKey="x" yKey="y" xLabel="Duración (min)" yLabel="Edge Precio (ticks)" 
          />
        </Card>
      </div>
    );
  };

  const renderTemporalTab = () => {
    const modules: OracleModule[] = ['M1', 'M2', 'M3'];
    const moduleStats = modules.map(mod => {
      const subset = filteredData.filter(d => d.oracle_module === mod);
      const k = calculateKPIs(subset);
      return {
        module: mod,
        count: k.count,
        avgPriceDiff: parseFloat(k.avgPriceDiff.toFixed(2)),
        winRate: parseFloat(k.winRatePrice.toFixed(1)),
        avgVol: k.avgVolume // Pass raw volume, format in render
      };
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Card 
          title="Desempeño por Módulo Horario"
          description="Resumen detallado de estadísticas clave desglosadas por las tres franjas horarias operativas del Oracle."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs uppercase bg-slate-800 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3 text-right">Edge Prom.</th>
                  <th className="px-4 py-3 text-right">Tasa Acierto %</th>
                  <th className="px-4 py-3 text-right">Vol Prom (USD)</th>
                </tr>
              </thead>
              <tbody>
                {moduleStats.map(m => (
                  <tr key={m.module} className="border-b border-slate-700 hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-200">{m.module}</td>
                    <td className="px-4 py-3 text-right">{m.count}</td>
                    <td className={`px-4 py-3 text-right font-bold ${m.avgPriceDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{m.avgPriceDiff}</td>
                    <td className="px-4 py-3 text-right">{m.winRate}%</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatVolumeUSD(m.avgVol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card 
            title="Edge Promedio por Módulo"
            description="Muestra qué momento del día ofrece la mayor ventaja competitiva en precio."
          >
             <SimpleBarChart data={moduleStats} xKey="module" yKey="avgPriceDiff" color="#0ea5e9" />
          </Card>
          <Card 
            title="Tasa de Acierto por Módulo (%)"
            description="Probabilidad de cerrar con precio positivo según el horario de apertura."
          >
             <SimpleBarChart data={moduleStats} xKey="module" yKey="winRate" color="#10b981" />
          </Card>
        </div>
      </div>
    );
  };

  const renderSizeRiskTab = () => {
    const buckets = ['Small', 'Medium', 'Large'];
    const bucketStats = buckets.map(b => {
      const subset = filteredData.filter(d => d.size_bucket === b);
      const k = calculateKPIs(subset);
      return {
        bucket: b,
        avgPriceDiff: parseFloat(k.avgPriceDiff.toFixed(2)),
        winRate: parseFloat(k.winRatePrice.toFixed(1))
      };
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card 
            title="Edge por Tamaño (Terciles)"
            description="Compara si el tamaño de la posición (Pequeño, Mediano, Grande) afecta la calidad de la ejecución."
           >
             <SimpleBarChart data={bucketStats} xKey="bucket" yKey="avgPriceDiff" color="#f59e0b" />
           </Card>
           <Card 
            title="Tasa de Acierto por Tamaño"
            description="Porcentaje de éxito clasificado por el volumen de la campaña."
           >
             <SimpleBarChart data={bucketStats} xKey="bucket" yKey="winRate" color="#10b981" />
           </Card>
        </div>
        
        <Card 
          title="Volumen vs Edge"
          description="Gráfico de dispersión para identificar si un mayor volumen correlaciona con mejor o peor precio (ej: slippage)."
        >
          <ScatterPlot 
            data={filteredData.map(d => ({ x: d.vol_total, y: d.price_diff, price_diff: d.price_diff }))}
            xKey="x" yKey="y" xLabel="Volumen Total (USD)" yLabel="Edge Precio (ticks)"
          />
        </Card>
      </div>
    );
  };

  const renderPnlTab = () => {
    // Quadrants Logic
    const q1 = filteredData.filter(d => d.price_diff > 0 && d.pnl_total > 0).length; // Good/Good
    const q2 = filteredData.filter(d => d.price_diff < 0 && d.pnl_total > 0).length; // Bad Price/Good PnL (Lucky?)
    const q3 = filteredData.filter(d => d.price_diff < 0 && d.pnl_total < 0).length; // Bad/Bad
    const q4 = filteredData.filter(d => d.price_diff > 0 && d.pnl_total < 0).length; // Good Price/Bad PnL (Fees? Slip?)

    const total = filteredData.length || 1;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <KpiCard 
            label="Óptimo (Precio+ PnL+)" 
            value={`${((q1/total)*100).toFixed(1)}%`} 
            trend="up" 
            description="Campañas ideales: Buena lectura de mercado (Edge > 0) y Ganancia financiera (PnL > 0)."
           />
           <KpiCard 
            label="Ineficiente (Precio+ PnL-)" 
            value={`${((q4/total)*100).toFixed(1)}%`} 
            trend="down" 
            description="Mala conversión: Buena lectura de precio (Edge > 0) pero pérdida financiera (PnL < 0). Causas: Comisiones, Swap, mala salida."
           />
           <KpiCard 
            label="Suerte (Precio- PnL+)" 
            value={`${((q2/total)*100).toFixed(1)}%`} 
            trend="neutral" 
            description="Ganancia sin Edge: El precio fue en contra del Oracle (Edge < 0) pero se ganó dinero. Probable ruido o suerte."
           />
           <KpiCard 
            label="Pérdida (Precio- PnL-)" 
            value={`${((q3/total)*100).toFixed(1)}%`} 
            trend="down" 
            description="Fallo Total: Mala lectura de dirección y pérdida financiera."
           />
        </div>

        <Card 
          title="Correlación PnL vs Edge de Precio"
          description="Mapa para visualizar la consistencia. Lo ideal es una correlación positiva (nube diagonal ascendente)."
        >
           <ScatterPlot 
             data={filteredData.map(d => ({ x: d.price_diff, y: d.pnl_total, price_diff: d.price_diff }))}
             xKey="x" yKey="y" xLabel="Edge Precio (ticks)" yLabel="PnL (CLP)"
           />
        </Card>
      </div>
    );
  };

  const renderExplorerTab = () => {
    // Mostrar toda la data filtrada sin límite
    const displayData = filteredData;

    return (
      <div className="animate-in fade-in duration-500 h-[calc(100vh-200px)] flex flex-col">
        <div className="flex-1 overflow-auto bg-slate-900 border border-slate-700 rounded-lg">
          <table className="w-full text-xs text-left text-slate-400 relative">
            <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Fecha</th>
                <th className="px-4 py-3 whitespace-nowrap">Hora</th>
                <th className="px-4 py-3 whitespace-nowrap">Dir</th>
                <th className="px-4 py-3 whitespace-nowrap">Mód</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Vol (USD)</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">VWAP In</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">VWAP Out</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Edge</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">PnL</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Dur (m)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayData.map(row => (
                <tr key={row.cluster_final_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2 font-mono text-slate-500">{row.cluster_final_id}</td>
                  <td className="px-4 py-2">{row.entry_date}</td>
                  <td className="px-4 py-2">{row.entry_hour}</td>
                  <td className={`px-4 py-2 uppercase font-bold text-[10px] ${row.direction === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>{row.direction}</td>
                  <td className="px-4 py-2"><span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{row.oracle_module}</span></td>
                  <td className="px-4 py-2 text-right text-slate-300">{formatVolumeUSD(row.vol_total)}</td>
                  <td className="px-4 py-2 text-right">{row.price_vwap_entry.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{row.price_vwap_exit.toFixed(2)}</td>
                  <td className={`px-4 py-2 text-right font-bold ${row.price_diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{row.price_diff.toFixed(2)}</td>
                  <td className={`px-4 py-2 text-right ${row.pnl_total > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{row.pnl_total.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{row.trade_dur_min.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayData.length === 0 && (
            <div className="p-8 text-center text-slate-500">No hay campañas que coincidan con los filtros.</div>
          )}
        </div>
        <div className="mt-2 text-xs text-slate-500 text-right">
          Mostrando {displayData.length} de {filteredData.length} campañas
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 overflow-hidden text-slate-200 font-sans">
      <Sidebar filters={filters} setFilters={setFilters} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navigation / Tabs */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 shrink-0 z-20">
          <div className="flex space-x-1 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f172a]">
          <div className="max-w-7xl mx-auto pb-10">
            {activeTab === 'summary' && renderSummaryTab()}
            {activeTab === 'price_edge' && renderPriceEdgeTab()}
            {activeTab === 'temporal' && renderTemporalTab()}
            {activeTab === 'size_risk' && renderSizeRiskTab()}
            {activeTab === 'pnl_vs_price' && renderPnlTab()}
            {activeTab === 'explorer' && renderExplorerTab()}
          </div>
        </div>
      </main>
    </div>
  );
}