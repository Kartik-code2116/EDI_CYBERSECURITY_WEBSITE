import { useNavigate } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-2 text-sm">
        <p className="text-gray-300 text-xs capitalize">{payload[0]?.payload?.subject}</p>
        <p className="text-cyber-purple-light font-semibold">Avg Score: {payload[0].value.toFixed(0)}</p>
      </div>
    );
  }
  return null;
};

// Map scan type to human-readable radar axis label
const TYPE_LABELS = {
  url:  'URL Threats',
  pdf:  'PDF Threats',
  docx: 'DOCX Threats',
};

export default function ThreatSeverityChart({ data = [] }) {
  const navigate = useNavigate();

  // Build radar data from real API aggregation
  // data = [{ _id: 'url'|'pdf'|'docx', avgScore, totalScans, malicious, suspicious }]
  const chartData = data.map(d => ({
    subject: TYPE_LABELS[d._id] || d._id?.toUpperCase() || 'Unknown',
    type: d._id,
    A: Math.round(d.avgScore || 0),
    total: d.totalScans || 0,
    malicious: d.malicious || 0,
    suspicious: d.suspicious || 0,
  }));

  const isEmpty = chartData.length === 0 || chartData.every(d => d.A === 0);

  const handleClick = () => navigate('/history');

  return (
    <div
      className="glass-card p-6 cursor-pointer hover:border-cyber-cyan/20 hover:shadow-cyber transition-all duration-300"
      onClick={handleClick}
      title="Click to view scan history"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Threat Severity Radar</h3>
          <p className="text-gray-500 text-xs mt-0.5">Average threat score by scan type</p>
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
          <div className="text-5xl opacity-20">🕸️</div>
          <p className="text-gray-600 text-sm">No severity data yet</p>
          <p className="text-gray-700 text-xs">Scan URLs and documents to populate</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />
              <Radar
                name="Avg Score"
                dataKey="A"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 4, strokeWidth: 0 }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          {/* Legend breakdown */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {chartData.map((d) => (
              <button
                key={d.type}
                onClick={(e) => { e.stopPropagation(); navigate(`/history?type=${d.type}`); }}
                className="text-center p-2 rounded-lg bg-white/3 hover:bg-white/8 transition-colors"
                title={`View ${d.type.toUpperCase()} scans`}
              >
                <p className="text-xs text-gray-500">{d.subject}</p>
                <p className="text-sm font-mono font-bold text-cyber-purple-light">{d.A}</p>
                <p className="text-xs text-gray-600">{d.total} scan{d.total !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-gray-700 text-xs text-center mt-2">
        Click a segment to filter by scan type
      </p>
    </div>
  );
}
