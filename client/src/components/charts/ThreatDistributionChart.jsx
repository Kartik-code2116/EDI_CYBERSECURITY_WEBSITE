import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  safe:       '#00ff88',
  warning:    '#ffcc00',
  suspicious: '#ff8800',
  malicious:  '#ff3366',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-2 text-sm">
        <p style={{ color: COLORS[payload[0].name] || '#00d4ff' }} className="font-semibold capitalize">
          {payload[0].name}
        </p>
        <p className="text-white">{payload[0].value} scan{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

export default function ThreatDistributionChart({ data = [] }) {
  const navigate = useNavigate();

  // Build chart data from real API data only — no defaults
  const chartData = data
    .filter(d => d._id && d.count > 0)
    .map(d => ({ name: d._id, value: d.count }));

  const isEmpty = chartData.length === 0;

  const handleClick = (entry) => {
    if (entry?.name) {
      // Navigate to scan history filtered by the clicked threat level
      navigate(`/history?threatLevel=${entry.name}`);
    } else {
      navigate('/history');
    }
  };

  const handleSliceClick = (data) => {
    if (data?.name) navigate(`/history?threatLevel=${data.name}`);
  };

  return (
    <div
      className="glass-card p-6 cursor-pointer hover:border-cyber-cyan/20 hover:shadow-cyber transition-all duration-300"
      title="Click to view filtered scan history"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Threat Distribution</h3>
        <button
          onClick={() => navigate('/history')}
          className="text-xs text-cyber-cyan hover:text-cyan-300 transition-colors"
        >
          View all →
        </button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="text-5xl opacity-20">🥧</div>
          <p className="text-gray-600 text-sm">No scan data yet</p>
          <p className="text-gray-700 text-xs">Run an analysis to see threat distribution</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              onClick={handleSliceClick}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={COLORS[entry.name] || '#00d4ff'}
                  stroke="transparent"
                  style={{ filter: `drop-shadow(0 0 6px ${COLORS[entry.name] || '#00d4ff'})` }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              onClick={handleClick}
              formatter={(value) => (
                <span
                  className="text-gray-300 capitalize text-xs cursor-pointer hover:underline"
                  style={{ color: COLORS[value] }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      <p className="text-gray-700 text-xs text-center mt-2">
        Click a segment to filter history by threat level
      </p>
    </div>
  );
}
