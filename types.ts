export type Direction = 'buy' | 'sell';
export type OracleModule = 'M1' | 'M2' | 'M3';
export type SizeBucket = 'Small' | 'Medium' | 'Large';

export interface Campaign {
  cluster_final_id: string;
  symbol: string;
  direction: Direction;
  entry_date: string; // YYYY-MM-DD
  entry_hour: string; // HH:MM:SS
  exit_date: string;
  exit_hour: string;
  vol_total: number;
  price_vwap_entry: number;
  price_vwap_exit: number;
  price_diff: number; // The "edge" in price
  pnl_total: number; // Financial result
  clicks: number;
  n_micro_clusters: number;
  entry_exec_sec: number;
  exit_exec_sec: number;
  trade_dur_min: number;

  // Derived fields used for faster filtering/grouping
  entry_timestamp: number; // for sorting
  oracle_module: OracleModule;
  day_of_week: number; // 0=Sun, 1=Mon...
  year: number;
  month: number;
  size_bucket?: SizeBucket; // Assigned dynamically based on dataset distribution
}

export interface FilterState {
  startDate: string;
  endDate: string;
  directions: Direction[];
  modules: OracleModule[];
  minVol: number;
  maxVol: number;
  minDur: number;
  maxDur: number;
  excludeFlat: boolean; // |price_diff| < 0.1
}

export interface KPIs {
  count: number;
  avgPriceDiff: number;
  medianPriceDiff: number;
  winRatePrice: number; // % > 0
  winRatePnL: number; // % > 0
  expectancyPrice: number;
  expectancyPnL: number;
  avgVolume: number;
  avgDuration: number;
}