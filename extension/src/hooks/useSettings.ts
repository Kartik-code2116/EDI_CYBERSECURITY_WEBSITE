import { useState, useEffect } from 'react';
import type { ExtensionSettings } from '../types';
import { getSettings, saveSettings } from '../services/storage';

export function useSettings() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const updateSettings = async (updates: Partial<ExtensionSettings>) => {
    setSaving(true);
    try {
      await saveSettings(updates);
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
    } finally {
      setSaving(false);
    }
  };

  return { settings, updateSettings, saving };
}
