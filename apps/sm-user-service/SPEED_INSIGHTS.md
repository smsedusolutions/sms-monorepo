# Vercel Speed Insights Integration

## Overview

This project has been configured with Vercel Speed Insights to monitor client-side performance metrics for any HTML pages served by this Express backend.

## Important Context

**Vercel Speed Insights is designed for frontend applications** to measure browser-based web vitals such as:
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **FID** (First Input Delay)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

Since this is primarily a **REST API backend service** that returns JSON responses, Speed Insights has limited applicability. However, the integration is set up for any HTML pages that may be added in the future.

## Installation

The package has been installed:

```bash
npm install @vercel/speed-insights
```

## Usage

### Option 1: Using the Utility Helper (Recommended)

For creating HTML pages with Speed Insights automatically included:

```javascript
const { createHTMLWithInsights } = require('./utils/speedInsights');

app.get('/dashboard', (req, res) => {
    const content = `
        <h1>Dashboard</h1>
        <p>Your content here...</p>
    `;
    
    const html = createHTMLWithInsights('My Dashboard', content);
    res.set('Content-Type', 'text/html');
    res.send(html);
});
```

### Option 2: Using the Middleware

To automatically inject Speed Insights into all HTML responses:

```javascript
const { speedInsightsMiddleware } = require('./utils/speedInsights');

// Add this middleware before your routes
app.use(speedInsightsMiddleware);

// Now any HTML response will automatically include Speed Insights
app.get('/page', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send('<html><body><h1>Hello</h1></body></html>');
});
```

### Option 3: Manual Injection

For more control, manually inject the script:

```javascript
const { injectSpeedInsights } = require('./utils/speedInsights');

app.get('/custom', (req, res) => {
    let html = '<html><body><h1>Custom Page</h1></body></html>';
    html = injectSpeedInsights(html);
    res.set('Content-Type', 'text/html');
    res.send(html);
});
```

## Demo Endpoint

A demo status page has been created at `/api/status` that demonstrates Speed Insights integration:

```
GET /api/status
```

This returns an HTML page with Speed Insights tracking enabled. Visit this endpoint in a browser to see the integration in action.

## Viewing Speed Insights Data

1. Deploy your application to Vercel
2. Navigate to your project in the Vercel dashboard
3. Go to **Speed Insights** in the left sidebar
4. Enable Speed Insights if not already enabled
5. Visit your HTML pages (like `/api/status`) in a browser
6. Data will appear in the dashboard within a few minutes

## API Performance Monitoring

For monitoring the performance of your REST API endpoints (which return JSON), Speed Insights is not applicable. Instead, consider:

1. **Vercel Monitoring**: Available in the Vercel dashboard for serverless functions
2. **Custom Logging**: Add performance logging to your endpoints
3. **APM Tools**: Application Performance Monitoring tools like New Relic, Datadog, etc.

## Files Created/Modified

- **`utils/speedInsights.js`**: Utility functions for Speed Insights integration
- **`routes/status.routes.js`**: Demo status page with Speed Insights
- **`index.js`**: Updated to include the status route
- **`package.json`**: Added `@vercel/speed-insights` dependency

## Additional Resources

- [Vercel Speed Insights Documentation](https://vercel.com/docs/speed-insights)
- [Speed Insights Quickstart](https://vercel.com/docs/speed-insights/quickstart)
- [Web Vitals](https://web.dev/vitals/)

## Notes

- Speed Insights only works on deployed Vercel applications (production or preview)
- Local development will not send data to Vercel
- The tracking script is loaded from `/_vercel/speed-insights/script.js` which is only available on Vercel infrastructure
- For a pure API service, most endpoints will not benefit from Speed Insights
