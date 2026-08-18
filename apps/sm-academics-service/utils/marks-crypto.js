const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_SECRET = process.env.MARKS_ENCRYPTION_KEY || 'sms-secure-marks-encryption-key-2026';

// Derive 32-byte key using sha256
const getKey = (secret = DEFAULT_SECRET) => {
    return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypts numerical marks object { theory, practical, total }
 * @param {Object} data 
 * @param {string} [customSecret] 
 * @returns {{ encryptedData: string, iv: string, authTag: string } | null}
 */
const encryptMarks = (data, customSecret) => {
    try {
        const key = getKey(customSecret);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const plaintext = JSON.stringify(data);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        return {
            encryptedData: encrypted,
            iv: iv.toString('hex'),
            authTag
        };
    } catch (err) {
        console.error('Error encrypting marks payload:', err);
        return null;
    }
};

/**
 * Decrypts numerical marks
 * @param {string} encryptedData 
 * @param {string} ivHex 
 * @param {string} authTagHex 
 * @param {string} [customSecret] 
 * @returns {Object | null}
 */
const decryptMarks = (encryptedData, ivHex, authTagHex, customSecret) => {
    try {
        if (!encryptedData || !ivHex || !authTagHex) return null;

        const key = getKey(customSecret);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (err) {
        console.error('Error decrypting marks payload:', err);
        return null;
    }
};

module.exports = {
    encryptMarks,
    decryptMarks
};
