import React from 'react';

interface ScanButtonProps {
  onScan: () => void;
  isScanning: boolean;
  disabled?: boolean;
}

export const ScanButton: React.FC<ScanButtonProps> = ({ onScan, isScanning, disabled }) => {
  return (
    <button
      id="scan-button"
      className={`scan-button ${isScanning ? 'scanning' : ''}`}
      onClick={onScan}
      disabled={isScanning || disabled}
      aria-label={isScanning ? 'Scanning in progress' : 'Scan this website'}
    >
      <span className="scan-button-icon">
        {isScanning ? (
          <span className="spinner">◌</span>
        ) : (
          <span>🔍</span>
        )}
      </span>
      <span className="scan-button-label">
        {isScanning ? 'Scanning...' : 'Scan Website'}
      </span>
    </button>
  );
};
