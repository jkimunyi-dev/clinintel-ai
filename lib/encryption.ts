import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-dev-only-32chars';
const IV_LENGTH = 16;

// Ensure key is 32 bytes
function getKey(): Buffer {
  return Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Helper to encrypt sensitive patient data
export function encryptPatientData(data: {
  email?: string;
  phone?: string;
  medicalRecordNumber?: string;
  notes?: string;
}) {
  return {
    email: data.email ? encrypt(data.email) : undefined,
    phone: data.phone ? encrypt(data.phone) : undefined,
    medicalRecordNumber: data.medicalRecordNumber ? encrypt(data.medicalRecordNumber) : undefined,
    notes: data.notes ? encrypt(data.notes) : undefined,
  };
}

// Helper to decrypt sensitive patient data
export function decryptPatientData(data: {
  email?: string | null;
  phone?: string | null;
  medicalRecordNumber?: string | null;
  notes?: string | null;
}) {
  try {
    return {
      email: data.email ? decrypt(data.email) : undefined,
      phone: data.phone ? decrypt(data.phone) : undefined,
      medicalRecordNumber: data.medicalRecordNumber ? decrypt(data.medicalRecordNumber) : undefined,
      notes: data.notes ? decrypt(data.notes) : undefined,
    };
  } catch (error) {
    console.error('Decryption error:', error);
    return data;
  }
}
