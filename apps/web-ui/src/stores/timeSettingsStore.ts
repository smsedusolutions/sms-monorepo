import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimeFormat = '12h' | '24h';

interface TimeSettingsState {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
}

export const useTimeSettingsStore = create<TimeSettingsState>()(
  persist(
    (set) => ({
      timeFormat: '12h',
      setTimeFormat: (timeFormat: TimeFormat) => set({ timeFormat }),
    }),
    {
      name: 'time-settings-storage',
    }
  )
);
