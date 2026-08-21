/**
 * useConsent — DPDP Act compliance hook
 *
 * Manages user consent choices for non-essential data processors.
 * Consent is stored in localStorage under the key "dpdp_consent_v1".
 *
 * Purposes tracked:
 *  - "analytics" — Google Charts (gstatic.com); non-essential
 *
 * A null value means the banner has not yet been shown / dismissed.
 * Changing consent here triggers a re-render in subscribers.
 */

import { useState, useEffect, useCallback } from 'react';

export const CONSENT_KEY = 'dpdp_consent_v1';
export const CONSENT_VERSION = 'v1.0-2026-08-21';

export interface ConsentState {
  version: string;
  timestamp: string;
  analytics: boolean;   // Google Charts (non-essential)
  decided: boolean;     // user has seen and responded to the banner
}

const DEFAULT_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  timestamp: '',
  analytics: false,
  decided: false,
};

function readFromStorage(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    // Re-prompt if the version has changed (new legal text)
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToStorage(state: ConsentState): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (private mode, quota exceeded)
  }
}

export function useConsent() {
  const [consent, setConsentState] = useState<ConsentState>(() => {
    const stored = readFromStorage();
    return stored ?? DEFAULT_CONSENT;
  });

  // Keep in sync if another tab changes storage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) {
        const stored = readFromStorage();
        if (stored) setConsentState(stored);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const acceptAll = useCallback(() => {
    const next: ConsentState = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      analytics: true,
      decided: true,
    };
    writeToStorage(next);
    setConsentState(next);
  }, []);

  const acceptNecessaryOnly = useCallback(() => {
    const next: ConsentState = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      analytics: false,
      decided: true,
    };
    writeToStorage(next);
    setConsentState(next);
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setConsentState(DEFAULT_CONSENT);
  }, []);

  return {
    consent,
    hasAnalyticsConsent: consent.analytics && consent.decided,
    hasDecided: consent.decided,
    acceptAll,
    acceptNecessaryOnly,
    resetConsent,
  };
}
