import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileDropzone({ onFile, accept = '.pdf,.docx', maxSize = 20 }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const handleFile = useCallback((f) => {
    setError('');
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setError('Only PDF and DOCX files are accepted');
      return;
    }
    if (f.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }
    setFile(f);
    onFile(f);
  }, [onFile, maxSize]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleChange = (e) => handleFile(e.target.files[0]);

  const clearFile = () => { setFile(null); onFile(null); };

  return (
    <div className="space-y-3">
      <motion.label
        htmlFor="file-upload"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        animate={{ borderColor: dragOver ? '#00d4ff' : 'rgba(255,255,255,0.1)', backgroundColor: dragOver ? 'rgba(0,212,255,0.05)' : 'rgba(13,31,60,0.4)' }}
        className="block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
        style={{ borderColor: dragOver ? '#00d4ff' : 'rgba(255,255,255,0.1)' }}
      >
        <input id="file-upload" type="file" accept={accept} onChange={handleChange} className="hidden" />
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="text-5xl">📂</div>
              <div>
                <p className="text-white font-semibold">Drag & Drop your file here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1"><span className="text-cyber-red">📄</span> PDF</span>
                <span className="flex items-center gap-1"><span className="text-cyber-cyan">📝</span> DOCX</span>
                <span>Max {maxSize}MB</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="text-4xl">{file.name.endsWith('.pdf') ? '📄' : '📝'}</div>
              <p className="text-cyber-cyan font-semibold">{file.name}</p>
              <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); clearFile(); }}
                className="text-xs text-cyber-red hover:text-red-400 border border-cyber-red/30 px-3 py-1 rounded-lg hover:bg-cyber-red/10 transition-colors"
              >
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
