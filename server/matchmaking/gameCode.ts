// Pure game-code utilities. No IO, no Socket.IO, no side effects.
// Importable by both server and client code paths.

/** Characters that are unambiguous when read aloud or typed:
 *  removed 0/O, 1/I/L to avoid confusion. */
export const UNAMBIGUOUS_CODE_CHARS =
  'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generate a random 6-character uppercase game code from the
 *  unambiguous set. */
export function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += UNAMBIGUOUS_CODE_CHARS.charAt(
      Math.floor(Math.random() * UNAMBIGUOUS_CODE_CHARS.length),
    );
  }
  return code;
}

export interface GameCodeValidationResult {
  valid: boolean;
  cleanCode: string;
  error?: string;
}

/** Validate a game-code string.
 *
 *  Returns the uppercased clean code on success so callers can use it
 *  directly as a room identifier.
 */
export function validateGameCodeFormat(
  code: string,
): GameCodeValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, cleanCode: '', error: 'Game code is required.' };
  }

  const clean = code.trim().toUpperCase();

  if (clean.length !== 6) {
    return {
      valid: false,
      cleanCode: clean,
      error: 'Game code must be exactly 6 characters.',
    };
  }

  // Reject ambiguous characters early with a human-readable message.
  if (/[0O1IL]/.test(clean)) {
    return {
      valid: false,
      cleanCode: clean,
      error:
        'Code contains ambiguous characters (0, O, 1, I, L are excluded).',
    };
  }

  const regex = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
  if (!regex.test(clean)) {
    return {
      valid: false,
      cleanCode: clean,
      error: 'Invalid game code format: alphanumeric characters only.',
    };
  }

  return { valid: true, cleanCode: clean };
}
