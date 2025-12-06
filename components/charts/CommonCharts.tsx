import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine
} from 'recharts';

const AXIS_STYLE = { fontSize: 11, fill: '#94a3b8' };
const TOOLTIP_STYLE = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f1f5f9' };

export const SimpleBarChart = ({ data, xKey, yKey, color = '#6366f1' }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
      <XAxis dataKey={xKey} tick={AXIS_STYLE} stroke="#475569" />
      <YAxis tick={AXIS_STYLE} stroke="#475569" />
      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: '#334155', opacity: 0.4}} />
      <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const ComparisonBarChart = ({ data, xKey, bar1Key, bar2Key, color1 = '#10b981', color2 = '#f43f5e' }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
      <XAxis dataKey={xKey} tick={AXIS_STYLE} stroke="#475569" />
      <YAxis tick={AXIS_STYLE} stroke="#475569" />
      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: '#334155', opacity: 0.4}} />
      <Legend wrapperStyle={{ color: '#cbd5e1' }} />
      <Bar dataKey={bar1Key} fill={color1} radius={[4, 4, 0, 0]} name="Winners" />
      <Bar dataKey={bar2Key} fill={color2} radius={[4, 4, 0, 0]} name="Losers" />
    </BarChart>
  </ResponsiveContainer>
);

export const DistributionChart = ({ data, xKey, yKey, referenceLineX = 0 }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} barCategoryGap={1}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
      <XAxis 
        dataKey={xKey} 
        tick={AXIS_STYLE} 
        stroke="#475569" 
        tickFormatter={(val) => typeof val === 'number' ? val.toFixed(1) : val}
      />
      <YAxis tick={AXIS_STYLE} stroke="#475569" />
      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: '#334155', opacity: 0.4}} labelFormatter={(l) => `Bin: ${l}`} />
      <ReferenceLine x={referenceLineX} stroke="#fbbf24" strokeDasharray="3 3" />
      <Bar dataKey={yKey} name="Count">
        {data.map((entry: any, index: number) => (
          <Cell key={`cell-${index}`} fill={entry[xKey] >= 0 ? '#10b981' : '#f43f5e'} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const ScatterPlot = ({ data, xKey, yKey, xLabel, yLabel, zKey }: any) => (
  <ResponsiveContainer width="100%" height={350}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
      <XAxis type="number" dataKey={xKey} name={xLabel} tick={AXIS_STYLE} stroke="#475569" label={{ value: xLabel, position: 'bottom', fill: '#94a3b8', fontSize: 12 }} />
      <YAxis type="number" dataKey={yKey} name={yLabel} tick={AXIS_STYLE} stroke="#475569" label={{ value: yLabel, angle: -90, position: 'left', fill: '#94a3b8', fontSize: 12 }} />
      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
      <ReferenceLine y={0} stroke="#94a3b8" />
      <ReferenceLine x={0} stroke="#94a3b8" />
      <Scatter name="Campaigns" data={data} fill="#8884d8">
        {data.map((entry: any, index: number) => {
           // Color logic: if PriceDiff (usually yKey) > 0 Green, else Red
           const val = entry.price_diff || entry.pnl_total; 
           return <Cell key={`cell-${index}`} fill={val > 0 ? '#10b981' : '#f43f5e'} opacity={0.6} />
        })}
      </Scatter>
    </ScatterChart>
  </ResponsiveContainer>
);