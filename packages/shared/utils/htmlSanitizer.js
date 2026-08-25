/**
 * Zero-dependency, safe HTML sanitizer for email templates and user input.
 * Eliminates ESM dependency issues while providing protection against XSS,
 * script execution, iframe hijacking, and malicious URI schemes.
 */

const DANGEROUS_TAGS = [
    'script',
    'iframe',
    'noscript',
    'embed',
    'object',
    'applet',
    'frameset',
    'frame',
    'svg',
    'math',
    'base',
];

/**
 * Strips all HTML tags to return clean plain text.
 * @param {string} str
 * @returns {string}
 */
function stripHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

/**
 * Sanitizes HTML content for email templates.
 * Strips dangerous tags, event handlers (onclick, onerror, onload, etc.), and javascript:/vbscript: URIs.
 * Preserves safe markup like headings, paragraphs, divs, tables, images, and inline styles.
 * @param {string} html
 * @returns {string}
 */
function sanitizeEmailHtml(html) {
    if (!html || typeof html !== 'string') return '';

    let clean = html;

    // 1. Remove dangerous tags and all nested content inside them
    for (const tag of DANGEROUS_TAGS) {
        const pairedRegex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
        clean = clean.replace(pairedRegex, '');
        const unclosedRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
        clean = clean.replace(unclosedRegex, '');
    }

    // 2. Remove all inline event handlers (onclick, onerror, onload, onmouseover, onfocus, etc.)
    clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 3. Neutralize javascript:, vbscript:, and data:text/html URI schemes in attributes
    clean = clean.replace(
        /(href|src|action|formaction)\s*=\s*(?:["']\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^"']*["']|(?:javascript|vbscript|data\s*:\s*text\/html)[^\s>]+)/gi,
        '$1="#"'
    );

    return clean;
}

module.exports = {
    stripHtml,
    sanitizeEmailHtml,
};
