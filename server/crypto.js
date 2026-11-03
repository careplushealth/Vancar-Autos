const crypto = require('crypto');

// 32-byte key derived from environment or fallback secure seed
const ENCRYPTION_SECRET = process.env.FINANCE_ENCRYPTION_KEY || 'vancar-autos-finance-secure-key-2026-prod';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive string (e.g. sort code, bank account number)
 */
function encrypt(text) {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        let encrypted = cipher.update(String(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (err) {
        console.error('Encryption error:', err);
        return '';
    }
}

/**
 * Decrypt sensitive string
 */
function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return '';
    try {
        const [ivHex, encryptedData] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption error:', err);
        return '***DECRYPT_ERROR***';
    }
}

/**
 * Mask sensitive data for safe preview (e.g. Sort Code: **-**-34, Account: ****5678)
 */
function maskSortCode(sortCode) {
    const cleaned = String(sortCode || '').replace(/\D/g, '');
    if (cleaned.length < 6) return '**-**-**';
    return `**-**-${cleaned.slice(-2)}`;
}

function maskAccountNumber(accountNumber) {
    const cleaned = String(accountNumber || '').replace(/\D/g, '');
    if (cleaned.length < 8) return '********';
    return `****${cleaned.slice(-4)}`;
}

module.exports = {
    encrypt,
    decrypt,
    maskSortCode,
    maskAccountNumber
};
