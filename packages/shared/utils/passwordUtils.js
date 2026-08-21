/**
 * passwordUtils — DPDP Act security remediation (GAP-001)
 *
 * Provides bcrypt-based password hashing and verification.
 * All services MUST use these helpers instead of direct string comparison.
 *
 * MIGRATION NOTE:
 *   Existing users in the database have PLAINTEXT passwords.
 *   verifyPassword() handles both cases transparently during migration:
 *     - If the stored hash starts with "$2" it is a bcrypt hash → use bcrypt.compare()
 *     - Otherwise it is a legacy plaintext password → compare directly,
 *       then opportunistically re-hash and save the new hash.
 *
 *   This means existing users can keep logging in after deployment.
 *   After 1 full login cycle their password is silently upgraded to bcrypt.
 *   Once all users have logged in, the plaintext fallback can be removed.
 *
 * SALT ROUNDS:
 *   12 rounds ≈ ~250ms on a modern server — safe against brute force
 *   while remaining acceptable for interactive logins.
 */

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;
const BCRYPT_PREFIX = '$2';

/**
 * Hash a plaintext password.
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash
 */
const hashPassword = async (plainPassword) => {
    if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('hashPassword: plainPassword must be a non-empty string');
    }
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Verify a password against a stored hash (or legacy plaintext).
 *
 * Returns:
 *   { valid: boolean, needsRehash: boolean }
 *
 * needsRehash is true when the stored value is a legacy plaintext password
 * that has just been verified. The caller should then call hashPassword() and
 * persist the new hash so the user's password is silently upgraded.
 *
 * @param {string} plainPassword   - Password from login request
 * @param {string} storedValue     - Value stored in DB (hash or legacy plaintext)
 * @returns {Promise<{ valid: boolean, needsRehash: boolean }>}
 */
const verifyPassword = async (plainPassword, storedValue) => {
    if (!plainPassword || !storedValue) {
        return { valid: false, needsRehash: false };
    }

    // Detect bcrypt hash by its standard prefix
    const isBcryptHash = storedValue.startsWith(BCRYPT_PREFIX);

    if (isBcryptHash) {
        const valid = await bcrypt.compare(plainPassword, storedValue);
        return { valid, needsRehash: false };
    }

    // Legacy plaintext comparison (migration path)
    const valid = plainPassword === storedValue;
    return { valid, needsRehash: valid }; // signal to caller to upgrade hash
};

/**
 * Check whether a stored value is already a bcrypt hash.
 * Useful for guards in seed scripts / admin tools.
 * @param {string} value
 * @returns {boolean}
 */
const isBcryptHash = (value) => {
    return typeof value === 'string' && value.startsWith(BCRYPT_PREFIX);
};

module.exports = {
    hashPassword,
    verifyPassword,
    isBcryptHash,
    SALT_ROUNDS,
};
