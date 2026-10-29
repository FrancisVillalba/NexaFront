import { useCallback, useEffect, useState } from 'react';
import { logout, restoreSession } from '../../services/authService.js';
import { clearSession, getSession, SESSION_ENDED_EVENT, SESSION_KEY } from '../../services/authSession.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let controller;
    let mounted = true;
    async function restore() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setLoading(true);
      try {
        const restored = await restoreSession(request.signal);
        if (mounted && !request.signal.aborted) setUser(restored);
      } catch (error) {
        if (mounted && !request.signal.aborted) {
          setUser(null);
          setAuthError(error.message);
        }
      } finally {
        if (mounted && !request.signal.aborted) setLoading(false);
      }
    }
    function ended(event) {
      controller?.abort();
      setUser(null);
      setLoading(false);
      setAuthError(event.detail?.reason === 'logout' ? '' : 'Tu sesión venció o dejó de ser válida. Volvé a ingresar.');
    }
    function changed(event) {
      if (event.key === SESSION_KEY || event.key === null) restore();
    }
    window.addEventListener(SESSION_ENDED_EVENT, ended);
    window.addEventListener('storage', changed);
    restore();
    return () => {
      mounted = false;
      controller?.abort();
      window.removeEventListener(SESSION_ENDED_EVENT, ended);
      window.removeEventListener('storage', changed);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const session = getSession();
    if (!session) { clearSession('expired'); return; }
    const timer = window.setTimeout(() => clearSession('expired'), Math.max(0, Date.parse(session.expiraEn) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [user]);

  const completeLogin = useCallback(next => {
    setAuthError('');
    setUser(next);
    setLoading(false);
  }, []);

  return { user, loading, authError, completeLogin, logout };
}
