const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'puroluxo_aes256_encryption_master_key_secret_2026';
const SALT = 'puroluxo_salt_security_2026';

// Derivacao de chave simetrica de 32 bytes (256 bits)
const masterKey = crypto.scryptSync(ENCRYPTION_SECRET, SALT, 32);

/**
 * Criptografa uma string usando AES-256-GCM.
 * Retorna no formato iv:authTag:ciphertext em hexadecimal.
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  let encrypted = cipher.update(text.trim().toLowerCase(), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descriptografa uma string criptografada com AES-256-GCM.
 */
function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') {
    return cipherText;
  }

  // Se nao estiver no formato iv:authTag:ciphertext, retorna como esta
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    return cipherText;
  }

  const [ivHex, authTagHex, encryptedData] = parts;

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[ERRO CRIPTOGRAFIA] Falha ao descriptografar dado:', error.message);
    return '[Dado Protegido / Erro de Descriptografia]';
  }
}

/**
 * Gera um Blind Index (hash HMAC SHA-256) para buscas deterministricas seguras.
 */
function hashBlindIndex(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return crypto
    .createHmac('sha256', masterKey)
    .update(text.trim().toLowerCase())
    .digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  hashBlindIndex,
};
