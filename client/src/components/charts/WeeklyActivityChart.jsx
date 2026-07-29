import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-2 text-sm">
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-cyber-purple-light font-semibold">
          {payload[0].value} scan{payload[0].value !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export default function WeeklyActivityChart({ data = [] }) {
  const navigate = useNavigate();
  const todayIndex = new Date().getDay(); // 0=Sun … 6=Sat

  // Build all 7 days — fill missing days with 0 (no mock random values)
  // MongoDB $dayOfWeek returns 1=Sun … 7=Sat
  const chartData = DAYS.map((day, i) => {
    const found = data.find(d => d._id === i + 1); // MongoDB 1-indexed
    return { day, count: found ? found.count : 0 };
  });

  const isEmpty = chartData.every(d => d.count === 0);
  const totalThisWeek = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <div
      className="glass-card p-6 cursor-pointer hover:border-cyber-cyan/20 hover:shadow-cyber transition-all duration-300"
      onClick={() => navigate('/history')}
      title="Click to view scan history"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Weekly Activity</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {isEmpty ? 'No scans this week' : `${totalThisWeek} scan${totalThisWeek !== 1 ? 's' : ''} this week`}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/history'); }}
          className="text-xs text-cyber-cyan hover:text-cyan-300 transition-colors"
        >
          View all →
        </button>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          barSize={28}
          onClick={() => navigate('/history')}
        >
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#a855f7" stopOpacity={1} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(124,58,237,0.08)' }}
          />
          <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={i === todayIndex ? '#a855f7' : 'url(#barGrad)'}
                style={{
                  filter: i === todayIndex ? 'drop-shadow(0 0 6px #a855f7)' : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-gray-700 text-xs text-center mt-2">
        Today highlighted · Click to view full history
      </p>
    </div>
  );
}
