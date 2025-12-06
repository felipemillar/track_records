import { Campaign, OracleModule } from '../types';

// Ayudante para asignar módulo basado en la hora
// M1: < 10:30
// M2: 10:30 - 12:00
// M3: >= 12:00
export const getOracleModule = (timeStr: string): OracleModule => {
  if (!timeStr) return 'M3';
  const parts = timeStr.split(':');
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const totalMinutes = hh * 60 + mm;

  // M1: < 10:30 (10*60 + 30 = 630)
  if (totalMinutes < 630) return 'M1';
  // M2: 10:30 <= t < 12:00 (12*60 = 720)
  if (totalMinutes < 720) return 'M2';
  // M3: >= 12:00
  return 'M3';
};

export const parseCsvData = (csvText: string): Campaign[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Obtener headers y normalizarlos (trim, lowercase)
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Mapa para encontrar índices de columnas rápidamente
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => { colMap[h] = i; });

  const data: Campaign[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Asumimos CSV simple separado por comas. 
    // NOTA: Si el CSV tiene comas dentro de strings entre comillas, se necesitaría un parser más complejo.
    const values = line.split(',');

    // Helper para obtener valor seguro
    const getVal = (key: string) => {
      const idx = colMap[key];
      return idx !== undefined ? values[idx] : undefined;
    };

    const entry_date = getVal('entry_date') || '';
    const entry_hour = getVal('entry_hour') || '00:00:00';
    
    // CONVERSION DE VOLUMEN: 1 Lote = 100,000 USD
    // El CSV trae lotes, la app usa USD nominal.
    const rawLots = parseFloat(getVal('vol_total') || '0');
    const vol_total = rawLots * 100000;
    
    // Construir fecha timestamp para ordenamiento
    const entryTimestamp = new Date(`${entry_date}T${entry_hour}`).getTime();
    const dateObj = new Date(entryTimestamp);

    if (isNaN(entryTimestamp)) continue; // Saltar filas corruptas

    const campaign: Campaign = {
      cluster_final_id: getVal('cluster_final_id') || `ID-${i}`,
      symbol: getVal('symbol') || 'usdclp',
      direction: (getVal('direction')?.toLowerCase() === 'sell' ? 'sell' : 'buy'),
      entry_date,
      entry_hour,
      exit_date: getVal('exit_date') || '',
      exit_hour: getVal('exit_hour') || '',
      vol_total, // Ahora en USD
      price_vwap_entry: parseFloat(getVal('price_vwap_entry') || '0'),
      price_vwap_exit: parseFloat(getVal('price_vwap_exit') || '0'),
      price_diff: parseFloat(getVal('price_diff') || '0'),
      pnl_total: parseFloat(getVal('pnl_total') || '0'),
      clicks: parseInt(getVal('clicks') || '0', 10),
      n_micro_clusters: parseInt(getVal('n_micro_clusters') || '0', 10),
      entry_exec_sec: parseFloat(getVal('entry_exec_sec') || '0'),
      exit_exec_sec: parseFloat(getVal('exit_exec_sec') || '0'),
      trade_dur_min: parseFloat(getVal('trade_dur_min') || '0'),

      // Campos Derivados
      entry_timestamp: entryTimestamp,
      oracle_module: getOracleModule(entry_hour),
      day_of_week: dateObj.getDay(),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
    };

    data.push(campaign);
  }

  // Calcular Size Buckets (Terciles) dinámicamente
  if (data.length > 0) {
    const sortedByVol = [...data].sort((a, b) => a.vol_total - b.vol_total);
    const oneThird = Math.floor(data.length / 3);
    const smallThreshold = sortedByVol[oneThird]?.vol_total || 0;
    const mediumThreshold = sortedByVol[oneThird * 2]?.vol_total || 0;

    data.forEach(c => {
      if (c.vol_total <= smallThreshold) c.size_bucket = 'Small';
      else if (c.vol_total <= mediumThreshold) c.size_bucket = 'Medium';
      else c.size_bucket = 'Large';
    });
  }

  return data;
};