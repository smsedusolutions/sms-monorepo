/**
 * Pre-styled email templates with complete CSS styling
 * Provides 5 professional email designs that wrap user content
 */

/**
 * Modern Template - Purple gradient header, rounded cards
 */
const modernTemplate = (content, options = {}) => {
    const { bannerImage, schoolName = 'School', schoolAddress = '', schoolEmail = '', schoolPhone = '' } = options;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email from ${schoolName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
            background-color: #f5f7fa;
            padding: 20px;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .email-header img {
            max-width: 200px;
            max-height: 80px;
            margin-bottom: 15px;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .email-content {
            padding: 40px 30px;
            color: #2d3748;
        }
        .email-content h1 {
            color: #0284C7;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 20px 0;
            line-height: 1.3;
        }
        .email-content h2 {
            color: #4a5568;
            font-size: 22px;
            font-weight: 600;
            margin: 25px 0 15px 0;
            line-height: 1.3;
        }
        .email-content h3 {
            color: #718096;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0 12px 0;
        }
        .email-content p {
            color: #4a5568;
            font-size: 16px;
            margin: 0 0 15px 0;
            line-height: 1.7;
        }
        .email-content a {
            color: #0284C7;
            text-decoration: none;
            font-weight: 500;
        }
        .email-content a:hover {
            text-decoration: underline;
        }
        .email-content ul, .email-content ol {
            margin: 15px 0;
            padding-left: 25px;
            color: #4a5568;
        }
        .email-content li {
            margin-bottom: 8px;
            line-height: 1.6;
        }
        .email-content strong {
            color: #2d3748;
            font-weight: 600;
        }
        .email-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .email-content table th {
            background-color: #f7fafc;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #2d3748;
            border-bottom: 2px solid #e2e8f0;
        }
        .email-content table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #4a5568;
        }
        .email-footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .email-footer p {
            color: #718096;
            font-size: 14px;
            margin: 5px 0;
        }
        .email-footer strong {
            color: #2d3748;
            font-weight: 600;
        }
        @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .email-header { padding: 30px 20px; }
            .email-content { padding: 30px 20px; }
            .email-content h1 { font-size: 24px; }
            .email-content h2 { font-size: 20px; }
            .email-footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            ${bannerImage ? `<img src="${bannerImage}" alt="${schoolName} Logo" />` : `<h1>${schoolName}</h1>`}
        </div>
        <div class="email-content">
            ${content}
        </div>
        <div class="email-footer">
            <p><strong>${schoolName}</strong></p>
            ${schoolAddress ? `<p>${schoolAddress}</p>` : ''}
            ${schoolPhone ? `<p>📞 ${schoolPhone}</p>` : ''}
            ${schoolEmail ? `<p>📧 ${schoolEmail}</p>` : ''}
            <p style="margin-top: 15px; color: #a0aec0; font-size: 12px;">
                This email was sent from ${schoolName}. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Classic Template - Navy & gold, traditional design
 */
const classicTemplate = (content, options = {}) => {
    const { bannerImage, schoolName = 'School', schoolAddress = '', schoolEmail = '', schoolPhone = '' } = options;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email from ${schoolName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background-color: #f9f9f9;
            padding: 20px;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 2px solid #1a365d;
        }
        .email-header {
            background-color: #1a365d;
            border-bottom: 3px solid #d69e2e;
            padding: 30px;
            text-align: center;
        }
        .email-header img {
            max-width: 200px;
            max-height custom: 80px;
        }
        .email-header h1 {
            color: #d69e2e;
            font-size: 26px;
            font-weight: 700;
            margin: 10px 0 0 0;
            font-family: 'Georgia', serif;
        }
        .email-content {
            padding: 35px;
            color: #2d3748;
        }
        .email-content h1 {
            color: #1a365d;
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 20px 0;
            border-bottom: 2px solid #d69e2e;
            padding-bottom: 10px;
        }
        .email-content h2 {
            color: #2c5282;
            font-size: 20px;
            font-weight: 600;
            margin: 25px 0 12px 0;
        }
        .email-content h3 {
            color: #4a5568;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0 10px 0;
        }
        .email-content p {
            color: #2d3748;
            font-size: 16px;
            margin: 0 0 15px 0;
            line-height: 1.8;
        }
        .email-content a {
            color: #2c5282;
            text-decoration: none;
            border-bottom: 1px solid #d69e2e;
        }
        .email-content ul, .email-content ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        .email-content li {
            margin-bottom: 10px;
            color: #2d3748;
        }
        .email-content strong {
            color: #1a365d;
            font-weight: 700;
        }
        .email-footer {
            background-color: #1a365d;
            border-top: 3px solid #d69e2e;
            padding: 25px;
            text-align: center;
        }
        .email-footer p {
            color: #e2e8f0;
            font-size: 14px;
            margin: 5px 0;
        }
        .email-footer strong {
            color: #d69e2e;
        }
        @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .email-content { padding: 25px 20px; }
            .email-footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            ${bannerImage ? `<img src="${bannerImage}" alt="${schoolName}" />` : ''}
            <h1>${schoolName}</h1>
        </div>
        <div class="email-content">
            ${content}
        </div>
        <div class="email-footer">
            <p><strong>${schoolName}</strong></p>
            ${schoolAddress ? `<p>${schoolAddress}</p>` : ''}
            ${schoolPhone || schoolEmail ? `<p>${schoolPhone ? '☎ ' + schoolPhone : ''} ${schoolEmail ? '✉ ' + schoolEmail : ''}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
};

/**
 * Professional Template - Clean minimal, business-like
 */
const professionalTemplate = (content, options = {}) => {
    const { bannerImage, schoolName = 'School', schoolAddress = '', schoolEmail = '', schoolPhone = '' } = options;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email from ${schoolName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            padding: 0;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            padding: 30px 40px;
            border-bottom: 3px solid #3182ce;
        }
        .email-header img {
            max-width: 180px;
            max-height: 60px;
        }
        .email-header h1 {
            color: #1a202c;
            font-size: 20px;
            font-weight: 600;
            margin-top: 10px;
        }
        .email-content {
            padding: 40px;
            color: #2d3748;
        }
        .email-content h1 {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 20px 0;
            line-height: 1.3;
        }
        .email-content h2 {
            color: #2d3748;
            font-size: 20px;
            font-weight: 600;
            margin: 25px 0 15px 0;
        }
        .email-content h3 {
            color: #4a5568;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0 12px 0;
        }
        .email-content p {
            color: #4a5568;
            font-size: 15px;
            margin: 0 0 15px 0;
            line-height: 1.7;
        }
        .email-content a {
            color: #3182ce;
            text-decoration: none;
        }
        .email-content ul, .email-content ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        .email-content li {
            margin-bottom: 8px;
            color: #4a5568;
        }
        .email-content strong {
            color: #1a202c;
            font-weight: 600;
        }
        .email-footer {
            padding: 30px 40px;
            background-color: #f7fafc;
            border-top: 1px solid #e2e8f0;
        }
        .email-footer p {
            color: #718096;
            font-size: 13px;
            margin: 4px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-header, .email-content, .email-footer { padding: 25px 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            ${bannerImage ? `<img src="${bannerImage}" alt="${schoolName}" />` : `<h1>${schoolName}</h1>`}
        </div>
        <div class="email-content">
            ${content}
        </div>
        <div class="email-footer">
            <p><strong style="color: #2d3748;">${schoolName}</strong></p>
            ${schoolAddress ? `<p>${schoolAddress}</p>` : ''}
            ${schoolPhone ? `<p>Phone: ${schoolPhone}</p>` : ''}
            ${schoolEmail ? `<p>Email: ${schoolEmail}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
};

/**
 * Vibrant Template - Colorful gradients, playful
 */
const vibrantTemplate = (content, options = {}) => {
    const { bannerImage, schoolName = 'School', schoolAddress = '', schoolEmail = '', schoolPhone = '' } = options;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email from ${schoolName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            padding: 20px;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .email-header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .email-header img {
            max-width: 200px;
            max-height: 80px;
            border-radius: 10px;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 15px 0 0 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .email-content {
            padding: 40px 35px;
        }
        .email-content h1 {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 28px;
            font-weight: 800;
            margin: 0 0 20px 0;
        }
        .email-content h2 {
            color: #f5576c;
            font-size: 22px;
            font-weight: 700;
            margin: 25px 0 15px 0;
        }
        .email-content h3 {
            color: #667eea;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0 12px 0;
        }
        .email-content p {
            color: #4a5568;
            font-size: 16px;
            margin: 0 0 15px 0;
            line-height: 1.7;
        }
        .email-content a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            border-bottom: 2px solid #f093fb;
        }
        .email-content ul, .email-content ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        .email-content li {
            margin-bottom: 10px;
            color: #4a5568;
        }
        .email-content strong {
            color: #2d3748;
            font-weight: 700;
        }
        .email-footer {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
        }
        .email-footer p {
            color: #ffffff;
            font-size: 14px;
            margin: 5px 0;
        }
        .email-footer strong {
            font-weight: 700;
            font-size: 16px;
        }
        @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .email-content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            ${bannerImage ? `<img src="${bannerImage}" alt="${schoolName}" />` : ''}
            <h1>${schoolName}</h1>
        </div>
        <div class="email-content">
            ${content}
        </div>
        <div class="email-footer">
            <p><strong>${schoolName}</strong></p>
            ${schoolAddress ? `<p>${schoolAddress}</p>` : ''}
            ${schoolPhone || schoolEmail ? `<p>${schoolPhone ? schoolPhone + ' • ' : ''}${schoolEmail || ''}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
};

/**
 * Minimal Template - Black & white, maximum readability
 */
const minimalTemplate = (content, options = {}) => {
    const { bannerImage, schoolName = 'School', schoolAddress = '', schoolEmail = '', schoolPhone = '' } = options;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email from ${schoolName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #ffffff;
            padding: 0;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #000000;
        }
        .email-header img {
            max-width: 150px;
            max-height: 60px;
            margin-bottom: 10px;
        }
        .email-header h1 {
            color: #000000;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .email-content h1 {
            color: #000000;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 20px 0;
            line-height: 1.2;
        }
        .email-content h2 {
            color: #000000;
            font-size: 22px;
            font-weight: 700;
            margin: 30px 0 15px 0;
        }
        .email-content h3 {
            color: #333333;
            font-size: 18px;
            font-weight: 600;
            margin: 25px 0 12px 0;
        }
        .email-content p {
            color: #333333;
            font-size: 16px;
            margin: 0 0 15px 0;
            line-height: 1.8;
        }
        .email-content a {
            color: #000000;
            text-decoration: none;
            border-bottom: 2px solid #000000;
        }
        .email-content ul, .email-content ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        .email-content li {
            margin-bottom: 10px;
            color: #333333;
        }
        .email-content strong {
            color: #000000;
            font-weight: 700;
        }
        .email-footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #cccccc;
        }
        .email-footer p {
            color: #666666;
            font-size: 13px;
            margin: 4px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container { padding: 30px 15px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            ${bannerImage ? `<img src="${bannerImage}" alt="${schoolName}" />` : ''}
            <h1>${schoolName}</h1>
        </div>
        <div class="email-content">
            ${content}
        </div>
        <div class="email-footer">
            <p><strong style="color: #000000;">${schoolName}</strong></p>
            ${schoolAddress ? `<p>${schoolAddress}</p>` : ''}
            ${schoolPhone ? `<p>${schoolPhone}</p>` : ''}
            ${schoolEmail ? `<p>${schoolEmail}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
};

/**
 * Get styled email template based on style choice
 * @param {string} style - Template style ('modern', 'classic', 'professional', 'vibrant', 'minimal')
 * @param {string} content - User's HTML content to wrap
 * @param {Object} options - Additional options (bannerImage, schoolName, etc.)
 * @returns {string} - Complete styled HTML email
 */
const getStyleTemplate = (style, content, options = {}) => {
    const templates = {
        modern: modernTemplate,
        classic: classicTemplate,
        professional: professionalTemplate,
        vibrant: vibrantTemplate,
        minimal: minimalTemplate,
    };

    const templateFunction = templates[style] || templates.modern;
    return templateFunction(content, options);
};

module.exports = {
    getStyleTemplate,
    modernTemplate,
    classicTemplate,
    professionalTemplate,
    vibrantTemplate,
    minimalTemplate,
};
