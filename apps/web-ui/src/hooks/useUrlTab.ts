import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

/**
 * Custom hook to synchronize tab state with the URL query parameter `tab`.
 * 
 * Works for both numeric indices (0, 1, 2) and string tab values ('all', 'read', 'unread').
 */
export function useUrlTab(
  defaultValue: number,
  tabMap?: string[],
  paramName?: string
): [number, (newVal: number) => void];

export function useUrlTab<T extends string>(
  defaultValue: T,
  tabMap?: string[],
  paramName?: string
): [T, (newVal: T) => void];

export function useUrlTab(
  defaultValue: any = 0,
  tabMap?: string[],
  paramName: string = 'tab'
): [any, (newVal: any) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const raw = searchParams.get(paramName);
    if (!raw) return defaultValue;

    if (tabMap && tabMap.length > 0) {
      const foundIdx = tabMap.indexOf(raw.toLowerCase());
      if (foundIdx !== -1) {
        return typeof defaultValue === 'number' ? foundIdx : tabMap[foundIdx];
      }
    }

    if (typeof defaultValue === 'number') {
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num >= 0) return num;
    }

    if (typeof defaultValue === 'string') {
      return raw;
    }

    return defaultValue;
  }, [searchParams, defaultValue, tabMap, paramName]);

  const setActiveTab = useCallback(
    (newVal: any) => {
      let tabValue: string;
      if (typeof newVal === 'number' && tabMap && tabMap[newVal]) {
        tabValue = tabMap[newVal];
      } else {
        tabValue = String(newVal);
      }

      const newParams = new URLSearchParams(searchParams);
      newParams.set(paramName, tabValue);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams, tabMap, paramName]
  );

  return [activeTab, setActiveTab];
}
