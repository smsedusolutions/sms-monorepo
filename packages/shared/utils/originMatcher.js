/**
 * Helper to match an origin against an allowed pattern
 * Supporting wildcards like https://*.vercel.app, https://*vercel.app, *.vercel.app, http://localhost:*
 * @param {string} origin - The request's origin header (e.g. 'https://smsedusolutions.vercel.app')
 * @param {string} allowedPattern - An allowed origin pattern (e.g. 'https://*.vercel.app')
 * @returns {boolean} - True if the origin matches the pattern
 */
function normalizeOrigin(url) {
    if (!url || typeof url !== 'string') return '';
    return url
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\/+$/, '')
        .toLowerCase();
}

function matchOrigin(origin, allowedPattern) {
    if (!origin || !allowedPattern) return false;

    const normOrigin = normalizeOrigin(origin);
    const normPattern = normalizeOrigin(allowedPattern);

    if (!normOrigin || !normPattern) return false;

    // 1. Universal wildcard or exact match
    if (normPattern === '*' || normOrigin === normPattern) return true;

    // 2. Direct host comparison without protocol (e.g. origin: https://sms.vercel.app, pattern: sms.vercel.app)
    const originNoProto = normOrigin.replace(/^[a-z]+:\/\//, '');
    const patternNoProto = normPattern.replace(/^[a-z]+:\/\//, '');

    if (originNoProto === patternNoProto) return true;

    // 3. Check if pattern contains wildcard
    if (normPattern.includes('*')) {
        try {
            const hasProtocol = /^[a-z]+:\/\//.test(normPattern);
            const protocolPrefix = hasProtocol ? '^' : '^(?:https?:\\/\\/|wss?:\\/\\/)?';

            const parts = normPattern.split('*');
            const escapedParts = parts.map(part => part.replace(/[.+^${}()|[\]\\]/g, '\\$&'));

            // Replace wildcard separator with safe character class
            const regexBody = escapedParts.join('[a-zA-Z0-9-.:]*');
            const regexStr = `${protocolPrefix}${regexBody}$`;

            return new RegExp(regexStr, 'i').test(normOrigin);
        } catch (err) {
            console.error('[matchOrigin] Regex error:', err);
            return false;
        }
    }

    return false;
}

module.exports = { matchOrigin, normalizeOrigin };
