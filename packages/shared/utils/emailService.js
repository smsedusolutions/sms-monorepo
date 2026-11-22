const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Resolves SMTP / Mail server configuration strictly from environment variables.
 */
const getSmtpConfig = () => {
    const host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const security = (process.env.SMTP_SECURITY || 'SSL').toUpperCase();
    const isSecure = security === 'SSL' || port === 465;
    const user = process.env.SMTP_USERNAME || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
    const senderName = process.env.SMTP_SENDER_NAME || 'SMS EDU SOLUTIONS';

    return { host, port, isSecure, user, pass, senderName };
};

let cachedTransporter = null;
let cachedConfigKey = null;

/**
 * Returns a configured nodemailer transporter.
 * Dynamically updates if environment variables change.
 */
const getTransporter = () => {
    const { host, port, isSecure, user, pass } = getSmtpConfig();
    const key = `${host}:${port}:${isSecure}:${user}:${pass}`;

    if (!cachedTransporter || cachedConfigKey !== key) {
        cachedConfigKey = key;
        if (host && host.toLowerCase() !== 'gmail') {
            cachedTransporter = nodemailer.createTransport({
                host,
                port,
                secure: isSecure, // true for port 465 (SSL)
                auth: {
                    user,
                    pass,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
        } else {
            cachedTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user,
                    pass,
                },
            });
        }
    }

    return cachedTransporter;
};

// Backwards-compatible proxy for legacy callers of `transporter`
const transporter = new Proxy({}, {
    get(target, prop) {
        const trans = getTransporter();
        const value = trans[prop];
        return typeof value === 'function' ? value.bind(trans) : value;
    }
});

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content (optional)
 * @param {string} [options.cc] - CC email addresses (optional)
 * @param {string} [options.bcc] - BCC email addresses (optional)
 * @param {Array} [options.attachments] - Email attachments (optional)
 * @param {string} [options.from] - Sender display name
 * @returns {Promise<Object>} - Email send result
 */
const sendEmail = async ({ to, subject, html, text, cc, bcc, attachments, from }) => {
    // Validate recipient email
    if (!to || typeof to !== 'string' || !to.includes('@')) {
        console.error('Invalid or missing recipient email:', to);
        throw new Error('Invalid recipient email address');
    }

    try {
        const { user, senderName } = getSmtpConfig();
        const fromEmail = user || 'support@smsedusolutions.in';
        const displayName = from || senderName;
        const fromHeader = `"${displayName}" <${fromEmail}>`;

        const mailOptions = {
            from: fromHeader,
            to,
            subject,
            html,
            text: text || undefined,
            cc: cc || undefined,
            bcc: bcc || undefined,
            attachments: attachments || undefined,
        };

        const currentTransporter = getTransporter();
        const info = await currentTransporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Verify email transporter connection
 * @returns {Promise<boolean>} - Connection status
 */
const verifyConnection = async () => {
    try {
        const currentTransporter = getTransporter();
        await currentTransporter.verify();
        console.log('Email server connection verified');
        return true;
    } catch (error) {
        console.error('Email server connection failed:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    verifyConnection,
    transporter,
    getSmtpConfig,
};
