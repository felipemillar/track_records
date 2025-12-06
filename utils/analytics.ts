import { Campaign, KPIs } from '../types';

// Constantes
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Formateador de Volumen (USD)
export const formatVolumeUSD = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString()}`;
};

export const formatCurrency = (value: number): string => {
  return `$ ${Math.round(value).toLocaleString('es-CL')}`;
};

export const calculateKPIs = (data: Campaign[]): KPIs => {
  if (data.length === 0) {
    return {
      count: 0,
      avgPriceDiff: 0,
      medianPriceDiff: 0,
      winRatePrice: 0,
      winRatePnL: 0,
      expectancyPrice: 0,
      expectancyPnL: 0,
      avgVolume: 0,
      avgDuration: 0,
    };
  }

  const count = data.length;
  
  // Price Stats
  const priceDiffs = data.map(d => d.price_diff).sort((a, b) => a - b);
  const totalPriceDiff = priceDiffs.reduce((sum, v) => sum + v, 0);
  const avgPriceDiff = totalPriceDiff / count;
  const medianPriceDiff = priceDiffs[Math.floor(count / 2)];

  // Win Rates
  const winsPrice = data.filter(d => d.price_diff > 0);
  const lossesPrice = data.filter(d => d.price_diff < 0);
  const winRatePrice = (winsPrice.length / count) * 100;

  const winsPnL = data.filter(d => d.pnl_total > 0);
  const winRatePnL = (winsPnL.length / count) * 100;

  // Expectancy Price
  const avgWinPrice = winsPrice.reduce((sum, d) => sum + d.price_diff, 0) / (winsPrice.length || 1);
  const avgLossPrice = Math.abs(lossesPrice.reduce((sum, d) => sum + d.price_diff, 0) / (lossesPrice.length || 1));
  const pWin = winsPrice.length / count;
  const expectancyPrice = (pWin * avgWinPrice) - ((1 - pWin) * avgLossPrice);

  // Expectancy PnL
  const lossesPnL = data.filter(d => d.pnl_total < 0);
  const avgWinPnL = winsPnL.reduce((sum, d) => sum + d.pnl_total, 0) / (winsPnL.length || 1);
  const avgLossPnL = Math.abs(lossesPnL.reduce((sum, d) => sum + d.pnl_total, 0) / (lossesPnL.length || 1));
  const pWinPnL = winsPnL.length / count;
  const expectancyPnL = (pWinPnL * avgWinPnL) - ((1 - pWinPnL) * avgLossPnL);

  const avgVolume = data.reduce((sum, d) => sum + d.vol_total, 0) / count;
  const avgDuration = data.reduce((sum, d) => sum + d.trade_dur_min, 0) / count;

  return {
    count,
    avgPriceDiff,
    medianPriceDiff,
    winRatePrice,
    winRatePnL,
    expectancyPrice,
    expectancyPnL,
    avgVolume,
    avgDuration,
  };
};

export const createHistogramData = (data: Campaign[], key: keyof Campaign, binSize: number) => {
  const bins: Record<string, number> = {};
  
  data.forEach(d => {
    const val = d[key] as number;
    const bin = Math.floor(val / binSize) * binSize;
    const binLabel = bin.toFixed(1);
    bins[binLabel] = (bins[binLabel] || 0) + 1;
  });

  return Object.keys(bins)
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .map(k => ({
      bin: parseFloat(k),
      count: bins[k]
    }));
};

// Estructura para la tabla jerárquica de PnL
export interface PnLHierarchy {
  [year: number]: {
    totalPnL: number;
    count: number;
    months: {
      [month: number]: {
        totalPnL: number;
        count: number;
        days: {
          [date: string]: {
            totalPnL: number;
            count: number;
          };
        };
      };
    };
  };
}

export const buildPnLHierarchy = (data: Campaign[]): PnLHierarchy => {
  const tree: PnLHierarchy = {};

  data.forEach(c => {
    const year = c.year;
    // La data viene con month base 1 (1-12) en mockData, nos aseguramos
    const month = c.month; 
    const date = c.entry_date;
    const pnl = c.pnl_total;

    // Nivel Año
    if (!tree[year]) {
      tree[year] = { totalPnL: 0, count: 0, months: {} };
    }
    tree[year].totalPnL += pnl;
    tree[year].count += 1;

    // Nivel Mes
    if (!tree[year].months[month]) {
      tree[year].months[month] = { totalPnL: 0, count: 0, days: {} };
    }
    tree[year].months[month].totalPnL += pnl;
    tree[year].months[month].count += 1;

    // Nivel Día
    if (!tree[year].months[month].days[date]) {
      tree[year].months[month].days[date] = { totalPnL: 0, count: 0 };
    }
    tree[year].months[month].days[date].totalPnL += pnl;
    tree[year].months[month].days[date].count += 1;
  });

  return tree;
};