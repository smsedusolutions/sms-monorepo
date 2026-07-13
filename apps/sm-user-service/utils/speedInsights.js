/**
 * Vercel Speed Insights Utility for Express Backend
 * 
 * IMPORTANT: Vercel Speed Insights is designed for frontend applications to measure
 * browser-based web vitals (CLS, FCP, FID, LCP, TTFB). This utility provides integration
 * for scenarios where this Express backend serves HTML content.
 * 
 * Use Cases:
 * - Admin dashboards or web interfaces served by this backend
 * - Status pages or documentation pages
 * - Any HTML responses where you want to track client-side performance
 * 
 * For pure REST API endpoints (JSON responses), Speed Insights is not applicable.
 * Consider using Vercel's monitoring features for API performance tracking instead.
 */

/**
 * Injects Vercel Speed Insights script into HTML content
 * @param {string} html - The HTML content to inject the script into
 * @returns {string} - HTML with Speed Insights script injected
 */
function injectSpeedInsights(html) {
    // Speed Insights script that loads the tracking code
    const speedInsightsScript = `
    <script>
      window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/speed-insights/script.js"></script>`;

    // Try to inject before closing </body> tag
    if (html.includes('</body>')) {
        return html.replace('</body>', `${speedInsightsScript}\n</body>`);
    }
    
    // Fallback: inject before closing </html> tag
    if (html.includes('</html>')) {
        return html.replace('</html>', `${speedInsightsScript}\n</html>`);
    }
    
    // If no body or html tag, append at the end
    return html + speedInsightsScript;
}

/**
 * Express middleware to automatically inject Speed Insights into HTML responses
 * 
 * Usage:
 *   const { speedInsightsMiddleware } = require('./utils/speedInsights');
 *   app.use(speedInsightsMiddleware);
 * 
 * This middleware intercepts responses with Content-Type: text/html and injects
 * the Speed Insights tracking script automatically.
 */
function speedInsightsMiddleware(req, res, next) {
    const originalSend = res.send;

    res.send = function(data) {
        // Only inject if response is HTML
        const contentType = res.get('Content-Type');
        if (contentType && contentType.includes('text/html') && typeof data === 'string') {
            data = injectSpeedInsights(data);
        }
        
        originalSend.call(this, data);
    };

    next();
}

/**
 * Helper function to create HTML responses with Speed Insights enabled
 * @param {string} title - Page title
 * @param {string} content - HTML content for the page body
 * @returns {string} - Complete HTML page with Speed Insights
 */
function createHTMLWithInsights(title, content) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            color: #0070f3;
        }
        .container {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    ${content}
    <script>
      window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/speed-insights/script.js"></script>
</body>
</html>`;
}

module.exports = {
    injectSpeedInsights,
    speedInsightsMiddleware,
    createHTMLWithInsights
};
