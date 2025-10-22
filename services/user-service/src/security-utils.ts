import { createHash, timingSafeEqual } from 'node:crypto';

export function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    
    if (bufA.length !== bufB.length) {
      return false;
    }
    
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'admin', 'welcome', 'login'
];

const COMMON_PATTERNS = [
  /^(.)\1+$/,
  /^(12|23|34|45|56|67|78|89|90)+/,
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i,
  /^(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)+/i,
];

export function isPasswordCompromised(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  
  if (COMMON_PASSWORDS.includes(lowerPassword)) {
    return true;
  }
  
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(lowerPassword)) {
      return true;
    }
  }
  
  return false;
}

export function calculatePasswordEntropy(password: string): number {
  let characterSet = 0;
  
  if (/[a-z]/.test(password)) characterSet += 26;
  if (/[A-Z]/.test(password)) characterSet += 26;
  if (/[0-9]/.test(password)) characterSet += 10;
  if (/[^a-zA-Z0-9]/.test(password)) characterSet += 32;
  
  return Math.log2(Math.pow(characterSet, password.length));
}

export function isPasswordSecure(password: string): { secure: boolean; reason?: string; entropy: number } {
  const entropy = calculatePasswordEntropy(password);
  
  if (password.length < 12) {
    return { secure: false, reason: 'Password too short', entropy };
  }
  
  if (isPasswordCompromised(password)) {
    return { secure: false, reason: 'Password is commonly used or follows predictable pattern', entropy };
  }
  
  if (entropy < 50) {
    return { secure: false, reason: 'Password entropy too low', entropy };
  }
  
  return { secure: true, entropy };
}

export function hashPasswordSHA256(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function getPasswordStrengthScore(password: string): number {
  let score = 0;
  
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;
  
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= password.length * 0.7) score += 1;
  
  if (!isPasswordCompromised(password)) score += 2;
  
  return Math.min(score, 10);
}
