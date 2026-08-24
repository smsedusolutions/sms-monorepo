const { sendEmail } = require('@sms/shared/utils');
const sanitizeHtml = require('sanitize-html');

/**
 * Test email sending functionality
 * POST /api/test/send-email
 */
const sendTestEmail = async (req, res) => {
    try {
        const { to, subject, message } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email (to) is required'
            });
        }

        // SECURITY (XSS): Sanitize user-supplied message to plain text only
        // to prevent HTML/script injection into the outgoing email body.
        const safeMessage = message
            ? sanitizeHtml(String(message), { allowedTags: [], allowedAttributes: {} })
            : 'This is a test email from your School Management System. If you\'re seeing this, your email configuration is working correctly! 🚀';

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Test Email</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #333; margin-top: 0;">Hello from SMS!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        ${safeMessage}
                    </p>
                    
                    <div style="background-color: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
                        <p style="margin: 0; color: #666;">
                            <strong>Email sent at:</strong> ${new Date().toLocaleString('en-IN', {
            dateStyle: 'full',
            timeStyle: 'long',
            timeZone: 'Asia/Kolkata'
        })}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <div style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            ✅ Email System Active
                        </div>
                    </div>
                </div>
                
                <div style="padding: 20px; text-align: center; background-color: #f0f0f0; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #999; font-size: 14px;">
                        Sent from School Management System
                    </p>
                </div>
            </div>
        `;

        const result = await sendEmail({
            to: to,
            subject: subject || '✨ Test Email - SMS System',
            html: htmlContent
        });

        res.status(200).json({
            success: true,
            message: `Test email sent successfully to ${to}`,
            result: result
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message,
            details: error.stack
        });
    }
};

/**
 * Verify email configuration
 * GET /api/test/verify-email-config
 */
const verifyEmailConfig = async (req, res) => {
    try {
        const { verifyConnection } = require('@sms/shared/utils');

        const isConnected = await verifyConnection();

        res.status(200).json({
            success: true,
            message: isConnected ? 'Email configuration is valid' : 'Email configuration failed',
            connected: isConnected,
            config: {
                emailUser: process.env.EMAIL_USER ? '✓ Configured' : '✗ Missing',
                emailPass: process.env.EMAIL_PASS ? '✓ Configured' : '✗ Missing',
                projectName: process.env.PROJECT_NAME || 'School Management System'
            }
        });
    } catch (error) {
        console.error('Email config verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email configuration verification failed',
            error: error.message
        });
    }
};

module.exports = {
    sendTestEmail,
    verifyEmailConfig
};
