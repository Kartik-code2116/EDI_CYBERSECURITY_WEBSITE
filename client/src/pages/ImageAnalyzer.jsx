import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeImage } from '../services/analyzeService';
import RiskMeter from '../components/shared/RiskMeter';
import ProgressBar from '../components/ui/ProgressBar';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const ACCEPTED = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
const MAX_MB = 5;

// Maps EDI classification string → design-system severity
const classToLevel = (cls = '') => {
  const c = cls.toLowerCase();
  if (c.includes('high') || c.includes('malicious')) return 'malicious';
  if (c.includes('suspicious'))                        return 'suspicious';
  if (c.includes('low'))                               return 'warning';
  return 'safe';
};

const classToColor = (cls = '') => {
  const c = cls.toLowerCase();
  if (c.includes('high')) return { text: 'text-cyber-red',    bg: 'bg-cyber-red/10',    border: 'border-cyber-red/40'    };
  if (c.includes('susp')) return { text: 'text-cyber-orange', bg: 'bg-cyber-orange/10', border: 'border-cyber-orange/40' };
  if (c.includes('low'))  return { text: 'text-cyber-yellow', bg: 'bg-cyber-yellow/10', border: 'border-cyber-yellow/40' };
  return                         { text: 'text-cyber-green',  bg: 'bg-cyber-green/10',  border: 'border-cyber-green/40'  };
};

// ── Image dropzone (image-specific, inline) ─────────────────────────────────
function ImageDropzone({ onFile }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [error, setError]       = useState('');
  const inputRef = useRef();

  const processFile = useCallback((f) => {
    setError('');
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError(`Unsupported type. Accepted: ${ACCEPTED.join(', ')}`);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB} MB`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    onFile(f);
  }, [onFile]);

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); };
  const handleChange = (e) => processFile(e.target.files[0]);
  const clear = (e) => {
    e.preventDefault();
    setFile(null);
    setPreview(null);
    onFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <motion.label
        htmlFor="img-upload"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        animate={{ borderColor: dragOver ? '#00d4ff' : 'rgba(255,255,255,0.1)', backgroundColor: dragOver ? 'rgba(0,212,255,0.05)' : 'rgba(13,31,60,0.4)' }}
        className="block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
      >
        <input ref={inputRef} id="img-upload" type="file" accept={ACCEPTED.join(',')} onChange={handleChange} className="hidden" />
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="text-5xl">🖼️</div>
              <div>
                <p className="text-white font-semibold">Drag &amp; Drop an image here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-gray-500">
                {ACCEPTED.map(e => (
                  <span key={e} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase font-mono">{e.slice(1)}</span>
                ))}
                <span>Max {MAX_MB} MB</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <img
                src={preview}
                alt="preview"
                className="max-h-48 mx-auto rounded-xl object-contain border border-white/10"
              />
              <p className="text-cyber-cyan font-semibold text-sm">{file.name}</p>
              <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
              <button type="button" onClick={clear}
                className="text-xs text-cyber-red hover:text-red-400 border border-cyber-red/30 px-3 py-1 rounded-lg hover:bg-cyber-red/10 transition-colors">
                Remove
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>
      {error && <p className="text-cyber-red text-sm flex items-center gap-1.5"><span>⚠</span> {error}</p>}
    </div>
  );
}

// ── InfoRow helper ───────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-500 text-xs flex-shrink-0 w-32">{label}</span>
      <span className="text-white text-xs font-mono text-right break-all">{value ?? '—'}</span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ImageAnalyzer() {
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]     = useState(null);

  const handleAnalyze = async () => {
    if (!file) return toast.error('Please upload an image first');
    setLoading(true);
    setResult(null);
    setProgress(0);
    try {
      const res = await analyzeImage(file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      setResult(res.data);
      toast.success('Image analysis complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Analysis failed. Is the FastAPI backend running on port 8000?';
      toast.error(msg);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // The FastAPI response shape
  const img   = result?.image   ?? {};
  const risk  = result?.risk    ?? {};
  const cls   = img.classification ?? risk.severity ?? 'Safe / Benign';
  const score = img.risk_score  ?? risk.risk_score ?? 0;
  const col   = classToColor(cls);
  const level = classToLevel(cls);

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          🖼️ <span>Image <span className="text-gradient-cyber">Analyzer</span></span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload PNG, JPG, WEBP or BMP images to detect phishing content, QR codes, embedded URLs and OCR-based threats
        </p>
      </div>

      {/* Capabilities pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['Phishing Detection', 'QR Code Scanning', 'OCR Text Extraction', 'URL Risk Analysis', 'EXIF Inspection'].map(cap => (
          <span key={cap} className="px-3 py-1 rounded-full bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 font-medium">{cap}</span>
        ))}
      </div>

      {/* Upload card */}
      <div className="glass-card p-6 space-y-5">
        <ImageDropzone onFile={setFile} />

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
                Uploading &amp; analyzing image…
              </span>
              <span className="text-cyber-cyan font-mono">{progress}%</span>
            </div>
            <ProgressBar value={progress} color="#00d4ff" showValue={false} />
          </div>
        )}

        <Button id="analyze-image-btn" onClick={handleAnalyze} loading={loading} disabled={!file} fullWidth className="h-12 text-base">
          {loading ? 'AI is scanning image…' : '🔍 Analyze Image'}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Risk meter + classification badge */}
            <div className="glass-card p-8 flex flex-col items-center gap-4">
              <h2 className="text-lg font-semibold text-white">Image Threat Assessment</h2>
              <RiskMeter score={score} level={level} size="lg" />
              <span className={`px-5 py-2 rounded-full text-sm font-bold border ${col.text} ${col.bg} ${col.border}`}>
                {cls}
              </span>
              <div className="grid grid-cols-3 gap-6 mt-2 w-full max-w-sm text-center">
                <div>
                  <p className="text-gray-500 text-xs">Risk Score</p>
                  <p className={`text-xl font-bold font-mono ${col.text}`}>{score}<span className="text-sm">%</span></p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">QR Codes</p>
                  <p className="text-xl font-bold font-mono text-white">{img.qr_codes?.length ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">URLs Found</p>
                  <p className="text-xl font-bold font-mono text-white">{img.urls?.length ?? 0}</p>
                </div>
              </div>
            </div>

            {/* File metadata */}
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">📋 Image Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <InfoRow label="Filename"   value={img.filename} />
                  <InfoRow label="Format"     value={img.format} />
                  <InfoRow label="MIME Type"  value={img.mime_type} />
                  <InfoRow label="File Size"  value={img.file_size_bytes ? `${(img.file_size_bytes / 1024).toFixed(1)} KB` : null} />
                </div>
                <div>
                  <InfoRow label="Dimensions" value={img.width && img.height ? `${img.width} × ${img.height} px` : null} />
                  <InfoRow label="Color Mode" value={img.color_mode} />
                  <InfoRow label="OCR Engine" value={img.ocr_engine} />
                  <InfoRow label="SHA-256"    value={img.sha256 ? img.sha256.slice(0, 16) + '…' : null} />
                </div>
              </div>
            </div>

            {/* Phishing Indicators */}
            {img.indicators?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">🚨 Phishing Indicators Detected</h3>
                <div className="space-y-2">
                  {img.indicators.map((ind, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-cyber-red/5 border border-cyber-red/20">
                      <span className="text-cyber-red text-lg">⚠️</span>
                      <span className="text-gray-300 text-sm">{ind}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No threats found */}
            {img.indicators?.length === 0 && (
              <div className="glass-card p-6 flex items-center gap-4 border border-cyber-green/20">
                <span className="text-4xl">✅</span>
                <div>
                  <p className="text-cyber-green font-semibold">No Phishing Indicators Found</p>
                  <p className="text-gray-500 text-sm">This image appears to be free of suspicious content.</p>
                </div>
              </div>
            )}

            {/* Matched Rules breakdown */}
            {img.matched_rules?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">📏 Matched Detection Rules</h3>
                <div className="space-y-3">
                  {img.matched_rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{rule.label}</span>
                          <span className="text-cyber-orange font-mono">+{rule.weight} pts</span>
                        </div>
                        <ProgressBar value={rule.weight} max={30} showValue={false} size="sm" color="#ff8800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OCR Extracted Text */}
            {img.ocr_text && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-3">🔤 OCR Extracted Text</h3>
                <pre className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-black/20 rounded-xl p-4 max-h-48 overflow-y-auto border border-white/5">
                  {img.ocr_text}
                </pre>
              </div>
            )}

            {/* URLs found in image */}
            {img.urls?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">🔗 URLs Detected in Image</h3>
                <div className="space-y-2">
                  {img.urls.map((url, i) => (
                    <div key={i} className="font-mono text-xs text-cyber-orange bg-cyber-orange/5 border border-cyber-orange/20 px-3 py-2 rounded-lg break-all">
                      {url}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Codes */}
            {img.qr_codes?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">📷 QR Codes Detected</h3>
                <div className="space-y-3">
                  {img.qr_codes.map((qr, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${qr.is_url ? 'bg-cyber-red/5 border-cyber-red/25' : 'bg-white/3 border-white/10'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{qr.is_url ? '⚠️' : '📷'}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${qr.is_url ? 'bg-cyber-red/20 text-cyber-red' : 'bg-white/10 text-gray-400'}`}>
                          {qr.is_url ? 'Contains URL' : 'Non-URL Data'} · via {qr.decoder}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-gray-300 break-all">{qr.data}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk scores breakdown */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-white font-semibold">Risk Score Breakdown</h3>
              <ProgressBar value={score} max={100} label="Image Threat Score" size="lg" />
              {risk.confidence != null && (
                <ProgressBar value={Math.round(risk.confidence * 100)} max={100} label="AI Confidence" color="#00d4ff" />
              )}
            </div>

            {/* AI Explanation & Recommendation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-3">🤖 AI Explanation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{result.explanation || 'No explanation available.'}</p>
              </div>
              <div className={`glass-card p-6 border ${level === 'safe' ? 'border-cyber-green/20' : 'border-cyber-red/20'}`}>
                <h3 className="text-white font-semibold mb-3">💡 Recommendation</h3>
                <p className={`text-sm leading-relaxed ${level === 'safe' ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {result.recommendation || 'No recommendation available.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                id="new-image-scan-btn"
                onClick={() => { setResult(null); setFile(null); }}
                variant="ghost"
                className="flex-1"
              >
                🔄 New Analysis
              </Button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
