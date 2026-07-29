import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-2 text-sm">
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-cyber-cyan font-semibold">
          {payload[0].value} scan{payload[0].value !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export default function ScanHistoryChart({ data = [] }) {
  const navigate = useNavigate();

  // Build 30-day chart data from real API data
  // data = [{ _id: { year, month, day }, count }]
  const chartData = data.map(d => {
    const date = new Date(d._id.year, d._id.month - 1, d._id.day);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: d.count,
    };
  });

  const isEmpty = chartData.length === 0;
  const totalScans = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <div
      className="glass-card p-6 cursor-pointer hover:border-cyber-cyan/20 hover:shadow-cyber transition-all duration-300"
      onClick={() => navigate('/history')}
      title="Click to view full scan history"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Scan History (30 Days)</h3>
          {!isEmpty && (
            <p className="text-gray-500 text-xs mt-0.5">
              {totalScans} scan{totalScans !== 1 ? 's' : ''} in last 30 days
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/history'); }}
          className="text-xs text-cyber-cyan hover:text-cyan-300 transition-colors"
        >
          View all →
        </button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="text-5xl opacity-20">📈</div>
          <p className="text-gray-600 text-sm">No scans in the last 30 days</p>
          <p className="text-gray-700 text-xs">Start scanning to build your history</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} onClick={() => navigate('/history')}>
            <defs>
              <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#00d4ff"
              strokeWidth={2}
              fill="url(#scanGrad)"
              dot={chartData.length <= 10 ? { fill: '#00d4ff', r: 3, strokeWidth: 0 } : false}
              activeDot={{ r: 5, fill: '#00d4ff', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <p className="text-gray-700 text-xs text-center mt-2">
        Click anywhere to view full scan history
      </p>
    </div>
  );
}
