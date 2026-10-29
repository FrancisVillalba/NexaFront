export const SESSION_KEY = 'nexa.auth.v1';
export const SESSION_ENDED_EVENT = 'nexa:session-ended';

function stores() {
  return ['sessionStorage', 'localStorage'].map(name => {
    try { return window[name]; } catch { return null; }
  });
}

export function clearSession(reason = 'logout') {
  for (const storage of stores()) {
    try { storage?.removeItem(SESSION_KEY); } catch { /* El navegador puede bloquear el almacenamiento. */ }
  }
  window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: { reason } }));
}

export function getSession() {
  for (const storage of stores()) {
    if (!storage) continue;
    let raw;
    try { raw = storage.getItem(SESSION_KEY); } catch { continue; }
    if (!raw) continue;
    try {
      const session = JSON.parse(raw);
      if (typeof session.token !== 'string' || !session.token || !Number.isFinite(Date.parse(session.expiraEn))) {
        storage.removeItem(SESSION_KEY);
        continue;
      }
      if (Date.parse(session.expiraEn) <= Date.now()) {
        clearSession('expired');
        return null;
      }
      return session;
    } catch {
      try { storage.removeItem(SESSION_KEY); } catch { /* No guardar una sesión inválida. */ }
    }
  }
  return null;
}

export function saveSession(response, remember = false) {
  if (typeof response?.token !== 'string' || !response.token || response.tipoToken !== 'Bearer'
      || !Number.isFinite(Date.parse(response.expiraEn)) || Date.parse(response.expiraEn) <= Date.now()) {
    throw new Error('El backend devolvió una sesión inválida.');
  }
  const [temporary, persistent] = stores();
  try {
    temporary?.removeItem(SESSION_KEY);
    persistent?.removeItem(SESSION_KEY);
    // No guardar contraseña ni documento. Los datos personales se consultan al restaurar.
    (remember ? persistent : temporary).setItem(SESSION_KEY, JSON.stringify({
      token: response.token,
      expiraEn: response.expiraEn,
    }));
  } catch {
    clearSession();
    throw new Error('El navegador no permitió guardar la sesión. Habilitá el almacenamiento para NEXA.');
  }
}
