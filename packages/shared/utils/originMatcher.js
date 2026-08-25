/**
 * Helper to match an origin against an allowed pattern
 * Supporting wildcards like https://*.vercel.app, https://*.spexzee.me, or http://localhost:*
 * @param {string} origin - The request's origin header (e.g. 'https://sms-web-ui.vercel.app')
 * @param {string} allowedPattern - An allowed origin pattern (e.g. 'https://*.vercel.app')
 * @returns {boolean} - True if the origin matches the pattern
 */
function normalizeOrigin(url) {
    if (!url || typeof url !== 'string') return '';
    return url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
}

function matchOrigin(origin, allowedPattern) {
    if (!origin || !allowedPattern) return false;
    
    const normOrigin = normalizeOrigin(origin);
    const normPattern = normalizeOrigin(allowedPattern);
    
    if (!normOrigin || !normPattern) return false;
    if (normPattern === '*' || normOrigin === normPattern) return true;
    
    // Check if pattern contains wildcard
    if (normPattern.includes('*')) {
        // Escape regex characters except '*'
        const escaped = normPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        // Replace '*' with wildcard matcher for subdomains, ports or path segments
        const regexStr = '^' + escaped.replace(/\*/g, '[a-zA-Z0-9-.]+') + '$';
        try {
            return new RegExp(regexStr, 'i').test(normOrigin);
        } catch {
            return false;
        }
    }
    
    return false;
}

module.exports = { matchOrigin, normalizeOrigin };
