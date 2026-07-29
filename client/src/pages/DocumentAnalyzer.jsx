import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeDocument } from '../services/analyzeService';
import { downloadReport } from '../services/reportService';
import FileDropzone from '../components/shared/FileDropzone';
import RiskMeter from '../components/shared/RiskMeter';
import ThreatBadge from '../components/shared/ThreatBadge';
import ProgressBar from '../components/ui/ProgressBar';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { formatFileSize, formatDuration } from '../utils/formatters';

export default function DocumentAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return toast.error('Please upload a document first');
    setLoading(true);
    setResult(null);
    setProgress(0);
    try {
      const res = await analyzeDocument(file, (evt) => {
        setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      setResult(res.data.scan);
      toast.success('Document analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!result?._id) return;
    setDownloading(true);
    try {
      const res = await downloadReport(result._id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `doc-threat-report-${result._id}.pdf`;
      link.click();
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          📄 <span>Document <span className="text-gradient-cyber">Analyzer</span></span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Upload PDF or DOCX files to detect embedded threats, macros, and malicious content</p>
      </div>

      {/* Upload card */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-wrap gap-2 text-xs">
          {['PDF', 'DOCX'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 font-medium">{t}</span>
          ))}
          <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">Max 20MB</span>
        </div>

        <FileDropzone onFile={setFile} />

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Uploading & analyzing…</span>
              <span className="text-cyber-cyan font-mono">{progress}%</span>
            </div>
            <ProgressBar value={progress} color="#00d4ff" showValue={false} />
          </div>
        )}

        <Button onClick={handleAnalyze} loading={loading} disabled={!file} fullWidth className="h-12 text-base">
          {loading ? 'AI is analyzing…' : '🔍 Analyze Document'}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Risk meter */}
            <div className="glass-card p-8 flex flex-col items-center">
              <h2 className="text-lg font-semibold text-white mb-6">Document Threat Assessment</h2>
              <RiskMeter score={result.threatScore} level={result.threatLevel} size="lg" />
            </div>

            {/* Document info */}
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">📋 Document Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'File Name', value: result.originalName },
                  { label: 'File Size', value: formatFileSize(result.fileSize) },
                  { label: 'Pages', value: result.pages || 'N/A' },
                  { label: 'Scan Time', value: formatDuration(result.scanDuration) },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/3 text-center">
                    <p className="text-gray-500 text-xs">{label}</p>
                    <p className="text-white font-medium text-sm mt-1 truncate" title={value}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Malicious indicators */}
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">🚨 Malicious Indicators</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Macros Found', value: result.macrosFound, danger: true },
                  { label: 'Hidden Objects', value: result.hiddenObjects, danger: true },
                  { label: 'Embedded Links', value: result.embeddedLinks?.length > 0, danger: true },
                ].map(({ label, value }) => (
                  <div key={label} className={`p-4 rounded-xl border flex items-center gap-3 ${value ? 'bg-cyber-red/10 border-cyber-red/30' : 'bg-cyber-green/5 border-cyber-green/20'}`}>
                    <span className={`text-2xl ${value ? 'text-cyber-red' : 'text-cyber-green'}`}>{value ? '⚠️' : '✅'}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className={`text-xs ${value ? 'text-cyber-red' : 'text-cyber-green'}`}>{value ? 'Detected' : 'Not Found'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {result.embeddedLinks?.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">Embedded Links:</p>
                  {result.embeddedLinks.map((link, i) => (
                    <div key={i} className="font-mono text-xs text-cyber-orange bg-cyber-orange/5 border border-cyber-orange/20 px-3 py-2 rounded-lg mb-1 truncate">
                      {link}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score & features */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-white font-semibold">Risk Score</h3>
              <ProgressBar value={result.threatScore} label="Threat Score" size="lg" />
              <ProgressBar value={result.confidenceScore} label="AI Confidence" color="#00d4ff" />
            </div>

            {/* Detected features */}
            {result.detectedFeatures?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Detected Features</h3>
                <div className="space-y-2">
                  {result.detectedFeatures.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-cyber-red">▸</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation & Recommendation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-3">🤖 AI Explanation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{result.aiExplanation}</p>
              </div>
              <div className={`glass-card p-6 border ${result.threatLevel === 'safe' ? 'border-cyber-green/20' : 'border-cyber-red/20'}`}>
                <h3 className="text-white font-semibold mb-3">💡 Recommendation</h3>
                <p className={`text-sm leading-relaxed ${result.threatLevel === 'safe' ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {result.recommendation}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={handleDownload} loading={downloading} variant="outline" className="flex-1">
                📥 Download PDF Report
              </Button>
              <Button onClick={() => { setResult(null); setFile(null); }} variant="ghost" className="flex-1">
                🔄 New Analysis
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
