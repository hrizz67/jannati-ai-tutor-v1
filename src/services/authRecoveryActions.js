import { formatAccountError } from './accountErrorMessages.js';

export const AUTH_PASSWORD_MIN_LENGTH = 6;
export const SAFE_PASSWORD_RESET_SENT = 'Jika akaun dengan e-mel itu tersedia, pautan tetapan semula telah dihantar.';
export const SAFE_CONFIRMATION_RESENT = 'Jika e-mel itu memerlukan pengesahan, e-mel pengesahan baharu telah dihantar.';
export const PASSWORD_UPDATED_MESSAGE = 'Kata laluan berjaya dikemas kini. Sila log masuk semula.';
export const RECOVERY_SIGN_OUT_FAILED_MESSAGE = 'Kata laluan telah dikemas kini, tetapi sesi pemulihan belum dapat ditamatkan. Cuba lagi.';

export function isValidAccountEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function validateNewPassword(password = '', confirmation = '') {
  if (!password) return { valid: false, message: 'Masukkan kata laluan baharu.' };
  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Kata laluan mesti sekurang-kurangnya ${AUTH_PASSWORD_MIN_LENGTH} aksara.` };
  }
  if (password !== confirmation) return { valid: false, message: 'Kata laluan tidak sepadan.' };
  return { valid: true, message: '' };
}

function safeFailure(error) {
  return { ok: false, message: formatAccountError(error) };
}

export async function requestPasswordReset({ auth, email, redirectTo } = {}) {
  const normalizedEmail = String(email || '').trim();
  if (!isValidAccountEmail(normalizedEmail)) return { ok: false, message: 'Masukkan alamat e-mel yang sah.' };
  if (!auth?.resetPasswordForEmail) return { ok: false, message: 'Sambungan akaun belum tersedia. Cuba lagi sebentar.' };
  try {
    const result = await auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (result?.error) return safeFailure(result.error);
    return { ok: true, message: SAFE_PASSWORD_RESET_SENT };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function resendSignupConfirmation({ auth, email, emailRedirectTo } = {}) {
  const normalizedEmail = String(email || '').trim();
  if (!isValidAccountEmail(normalizedEmail)) return { ok: false, message: 'Masukkan alamat e-mel yang sah.' };
  if (!auth?.resend) return { ok: false, message: 'Sambungan akaun belum tersedia. Cuba lagi sebentar.' };
  try {
    const result = await auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo }
    });
    if (result?.error) return safeFailure(result.error);
    return { ok: true, message: SAFE_CONFIRMATION_RESENT };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateRecoveryPassword({ auth, password, confirmation } = {}) {
  const validation = validateNewPassword(password, confirmation);
  if (!validation.valid) return { ok: false, message: validation.message };
  if (!auth?.updateUser) return { ok: false, message: 'Sambungan akaun belum tersedia. Cuba lagi sebentar.' };
  try {
    const result = await auth.updateUser({ password });
    if (result?.error) return safeFailure(result.error);
    return { ok: true, message: PASSWORD_UPDATED_MESSAGE };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function endRecoverySession({ auth } = {}) {
  if (!auth?.signOut) {
    return { ok: false, finalized: false, passwordUpdated: true, message: RECOVERY_SIGN_OUT_FAILED_MESSAGE };
  }
  try {
    const result = await auth.signOut({ scope: 'local' });
    if (result?.error) {
      return { ok: false, finalized: false, passwordUpdated: true, message: RECOVERY_SIGN_OUT_FAILED_MESSAGE };
    }
    return { ok: true, finalized: true, passwordUpdated: true, message: PASSWORD_UPDATED_MESSAGE };
  } catch {
    return { ok: false, finalized: false, passwordUpdated: true, message: RECOVERY_SIGN_OUT_FAILED_MESSAGE };
  }
}

export async function updateRecoveryPasswordAndFinalize({ auth, password, confirmation } = {}) {
  const updateResult = await updateRecoveryPassword({ auth, password, confirmation });
  if (!updateResult.ok) {
    return { ...updateResult, finalized: false, passwordUpdated: false };
  }
  return endRecoverySession({ auth });
}
