import { useState, useEffect } from "react";

export interface IconData {
  body: string;
  width: number;
  height: number;
  left: number;
  top: number;
}

// Global in-memory cache for all fetched icons in the browser session
const iconCache = new Map<string, IconData>();

// In-flight batch requests to avoid duplicate network calls
const inFlightRequests = new Map<string, Promise<void>>();

// Redundant CDN/API hosts for Iconify
const API_HOSTS = [
  "https://api.iconify.design",
  "https://api.simplesvg.com",
  "https://api.unisvg.com",
];

/**
 * Normalizes an icon name to prefix:name format
 * e.g. "mdi/home" -> "mdi:home", "mdi:home" -> "mdi:home"
 */
export function normalizeIconName(icon: string): string {
  if (!icon) return "";
  const trimmed = icon.trim();
  if (trimmed.includes(":")) return trimmed;
  if (trimmed.includes("/")) return trimmed.replace("/", ":");
  return trimmed;
}

/**
 * Fetches a batch of icon definitions for a single prefix
 */
async function fetchPrefixBatch(prefix: string, names: string[]): Promise<void> {
  if (!names.length) return;

  const query = names.join(",");
  const flightKey = `${prefix}:${query}`;
  if (inFlightRequests.has(flightKey)) {
    return inFlightRequests.get(flightKey);
  }

  const promise = (async () => {
    let succeeded = false;
    for (const host of API_HOSTS) {
      try {
        const url = `${host}/${prefix}.json?icons=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) {
          continue;
        }

        const data = await res.json();
        const defaultWidth = data.width || 24;
        const defaultHeight = data.height || 24;
        const defaultLeft = data.left || 0;
        const defaultTop = data.top || 0;

        const icons = data.icons || {};
        const aliases = data.aliases || {};

        // Helper to resolve an icon, following aliases if needed
        const resolve = (name: string): any => {
          if (icons[name]) return icons[name];
          if (aliases[name]) {
            const parent = typeof aliases[name] === "string" ? aliases[name] : aliases[name]?.parent;
            if (parent && icons[parent]) {
              return { ...icons[parent], ...aliases[name] };
            }
          }
          return null;
        };

        for (const name of names) {
          const item = resolve(name);
          if (item && item.body) {
            iconCache.set(`${prefix}:${name}`, {
              body: item.body,
              width: item.width || defaultWidth,
              height: item.height || defaultHeight,
              left: item.left ?? defaultLeft,
              top: item.top ?? defaultTop,
            });
          }
        }

        succeeded = true;
        break;
      } catch (err) {
        // Try next host
      }
    }

    if (!succeeded) {
      console.warn(`[IconifyLoader] Could not fetch icons for prefix "${prefix}" from any host.`);
    }
  })();

  inFlightRequests.set(flightKey, promise);
  try {
    await promise;
  } finally {
    inFlightRequests.delete(flightKey);
  }
}

/**
 * Loads a list of icons in batch (grouped by prefix) to avoid Cloudflare 429 rate limiting.
 */
export async function loadIcons(iconList: string[]): Promise<void> {
  const byPrefix = new Map<string, Set<string>>();

  for (const raw of iconList) {
    if (!raw) continue;
    const name = normalizeIconName(raw);
    if (iconCache.has(name)) continue;

    const colonIdx = name.indexOf(":");
    if (colonIdx === -1) continue;

    const prefix = name.substring(0, colonIdx);
    const icon = name.substring(colonIdx + 1);

    if (!byPrefix.has(prefix)) {
      byPrefix.set(prefix, new Set());
    }
    byPrefix.get(prefix)!.add(icon);
  }

  const promises: Promise<void>[] = [];
  for (const [prefix, set] of byPrefix.entries()) {
    // Break into chunks of 40 to avoid overly long query strings
    const allNames = Array.from(set);
    const chunkSize = 40;
    for (let i = 0; i < allNames.length; i += chunkSize) {
      const chunk = allNames.slice(i, i + chunkSize);
      promises.push(fetchPrefixBatch(prefix, chunk));
    }
  }

  await Promise.all(promises);
}

/**
 * Gets icon data synchronously if already in memory
 */
export function getCachedIcon(icon: string): IconData | undefined {
  if (!icon) return undefined;
  const name = normalizeIconName(icon);
  return iconCache.get(name);
}

/**
 * React hook to load and return IconData for a single icon
 */
export function useIcon(icon: string): IconData | undefined {
  const normalized = normalizeIconName(icon);
  const [data, setData] = useState<IconData | undefined>(() => getCachedIcon(normalized));

  useEffect(() => {
    if (!normalized) return;
    const cached = getCachedIcon(normalized);
    if (cached) {
      setData(cached);
      return;
    }

    let isMounted = true;
    loadIcons([normalized]).then(() => {
      if (isMounted) {
        setData(getCachedIcon(normalized));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [normalized]);

  return data;
}

