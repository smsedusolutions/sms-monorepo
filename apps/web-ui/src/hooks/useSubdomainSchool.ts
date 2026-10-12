import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export interface SchoolLoginTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customLoginHtml?: string;
}

export interface SchoolBranding {
  schoolName: string;
  schoolLogo?: string;
  schoolAddress?: string;
  schoolEmail?: string;
  schoolContact?: string;
  schoolWebsite?: string;
  schoolTagline?: string;
  loginTheme?: SchoolLoginTheme;
}

export type SubdomainSchool = SchoolBranding;

interface UseSubdomainSchoolReturn {
  school: SchoolBranding | null;
  isLoading: boolean;
  isNotFound: boolean;
  subdomain: string | null;
}

const PLATFORM_API_URL =
  import.meta.env.VITE_PLATFORM_API_URL || 'http://localhost:5000';

// Cache key for sessionStorage
const CACHE_KEY_PREFIX = 'school_branding_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Extracts subdomain from current hostname.
 * "greenvalley.spexzee.me" → "greenvalley"
 * "localhost" / bare domain → null
 */
const extractSubdomainFromHost = (): string | null => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Needs at least 3 parts: subdomain.domain.tld
  if (parts.length >= 3) {
    const sub = parts[0];
    // Ignore "www"
    return sub !== 'www' ? sub : null;
  }
  return null;
};

/**
 * Reads ?school= query param from URL.
 * Used for local development testing without a real subdomain.
 */
const getQueryParamSchool = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('school');
};

/**
 * Hook: useSubdomainSchool
 *
 * Detects current school from:
 *   1. ?school= query param (only available in dev/local — controlled by useRef flag)
 *   2. subdomain of the current URL (production)
 *
 * Returns school branding info for the login page.
 */
const useSubdomainSchool = (): UseSubdomainSchoolReturn => {
  const [school, setSchool] = useState<SchoolBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // useRef to determine if query-param fallback is allowed.
  // In production (real subdomain detected), this stays false.
  // In local dev (localhost / no subdomain), it flips to true.
  const isDevQueryParamAllowed = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSchoolBranding = async (subdomain: string) => {
      // Check sessionStorage cache first
      const cacheKey = `${CACHE_KEY_PREFIX}${subdomain}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            if (!cancelled) {
              setSchool(data);
              setIsLoading(false);
            }
            return;
          }
        }
      } catch {
        // ignore cache errors
      }

      try {
        const response = await axios.get(
          `${PLATFORM_API_URL}/api/admin/school/public/by-subdomain/${subdomain}`
        );
        if (!cancelled && response.data?.success) {
          const schoolData: SchoolBranding = response.data.data;
          setSchool(schoolData);

          // Cache the result
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ data: schoolData, timestamp: Date.now() })
            );
          } catch {
            // ignore storage errors
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          const status = err?.response?.status;
          if (status === 404) {
            setIsNotFound(true);
          }
          // For all errors: fall back to default branding (school stays null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const run = async () => {
      // Step 1: Try to extract subdomain from hostname
      const subdomainFromHost = extractSubdomainFromHost();

      if (subdomainFromHost) {
        // Production path — real subdomain detected
        // Query param fallback is NOT allowed
        isDevQueryParamAllowed.current = false;
        await fetchSchoolBranding(subdomainFromHost);
        return;
      }

      // Step 2: No real subdomain → this is local dev
      // Allow ?school= query param
      isDevQueryParamAllowed.current = true;
      const subdomainFromQuery = getQueryParamSchool();

      if (subdomainFromQuery) {
        await fetchSchoolBranding(subdomainFromQuery);
        return;
      }

      // Step 3: No subdomain, no query param → show default SMS branding
      if (!cancelled) {
        setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const subdomain =
    extractSubdomainFromHost() ||
    (isDevQueryParamAllowed.current ? getQueryParamSchool() : null);

  return { school, isLoading, isNotFound, subdomain };
};

export default useSubdomainSchool;
