const express = require('express');
const router = express.Router();
const { createHTMLWithInsights } = require('../utils/speedInsights');

/**
 * Example route demonstrating Speed Insights integration
 * This creates an HTML page with Speed Insights tracking enabled
 */
router.get('/', (_req, res) => {
    const content = `
        <h1>📊 SMS User Service - Status Dashboard</h1>
        <div class="container">
            <h2>Service Information</h2>
            <p><strong>Status:</strong> <span style="color: #00d000;">✓ Operational</span></p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Speed Insights:</strong> <span style="color: #0070f3;">✓ Enabled</span></p>
        </div>
        
        <div class="container">
            <h2>About Speed Insights</h2>
            <p>This page demonstrates Vercel Speed Insights integration. The tracking script measures:</p>
            <ul>
                <li><strong>CLS</strong> - Cumulative Layout Shift</li>
                <li><strong>FCP</strong> - First Contentful Paint</li>
                <li><strong>FID</strong> - First Input Delay</li>
                <li><strong>LCP</strong> - Largest Contentful Paint</li>
                <li><strong>TTFB</strong> - Time to First Byte</li>
            </ul>
            <p>Performance data is automatically collected and sent to Vercel for analysis.</p>
        </div>
        
        <div class="container">
            <h2>API Endpoints</h2>
            <p>This is primarily a REST API service. For API performance monitoring, use Vercel's monitoring features.</p>
            <ul>
                <li>GET /health - Health check endpoint</li>
                <li>GET /api/status - This status page (HTML with Speed Insights)</li>
                <li>GET / - Welcome message</li>
                <li>Various /api/school/:schoolId/* endpoints for school management</li>
            </ul>
        </div>
    `;

    const html = createHTMLWithInsights('SMS User Service - Status', content);
    res.set('Content-Type', 'text/html');
    res.send(html);
});

module.exports = router;
