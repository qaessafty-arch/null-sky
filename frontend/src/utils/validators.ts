// FILE: frontend/src/utils/validators.ts
export const VALID_GAME_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function validateGameCode(code: string): { isValid: boolean; cleanCode: string; error?: string } {
  if (!code || typeof code !== 'string') {
    return { isValid: false, cleanCode: '', error: 'Game code is required.' };
  }

  const clean = code.trim().toUpperCase();
  if (clean.length !== 6) {
    return { isValid: false, cleanCode: clean, error: 'Game code must be exactly 6 characters.' };
  }

  // Check for ambiguous characters specifically to give helpful feedback
  if (/[0O]/.test(clean)) {
    return { isValid: false, cleanCode: clean, error: 'Code cannot contain 0 or O (ambiguous characters).' };
  }
  if (/[1IL]/.test(clean)) {
    return { isValid: false, cleanCode: clean, error: 'Code cannot contain 1, I, or L (ambiguous characters).' };
  }

  const validRegex = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
  if (!validRegex.test(clean)) {
    return { isValid: false, cleanCode: clean, error: 'Game code contains invalid characters. Alphanumeric only.' };
  }

  return { isValid: true, cleanCode: clean };
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (username.length > 24) {
    return { isValid: false, error: 'Username cannot exceed 24 characters.' };
  }
  const usernameRegex = /^[a-zA-Z0-9_-]{3,24}$/;
  if (!usernameRegex.test(username.trim())) {
    return { isValid: false, error: 'Username may only contain letters, numbers, hyphens, and underscores.' };
  }
  return { isValid: true };
}
