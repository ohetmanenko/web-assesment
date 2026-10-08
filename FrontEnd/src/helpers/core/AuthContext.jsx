import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Api from './Api';

export const AuthStatus = { Loading: 0, SignedIn: 1, SignedOut: -1 };
const AuthContext = createContext(null);
export default AuthContext;
export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(AuthStatus.Loading);
  const [logged, setLogged] = useState(null);
  const refreshRequest = useRef(null);

  const signIn = useCallback(async (email, password) => {
    const { data } = await Api.post('/auth/login', { email, password });
    setLogged(data);
    setAuthStatus(AuthStatus.SignedIn);
  }, []);
  const signOut = useCallback(async () => {
    await Api.get('/auth/logout');
    setLogged(null);
    setAuthStatus(AuthStatus.SignedOut);
  }, []);

  useEffect(() => {
    let active = true;
    const interceptor = Api.interceptors.response.use(
      response => response,
      async error => {
        const request = error.config;
        const skipRefresh = ['/auth/login', '/auth/rt', '/auth/logout'].includes(request?.url);
        if (error.response?.status !== 401 || !request || request.retried || skipRefresh) throw error;
        request.retried = true;
        try {
          if (!refreshRequest.current) {
            refreshRequest.current = Api.get('/auth/rt')
              .then(({ data }) => {
                if (active) {
                  setLogged(data);
                  setAuthStatus(AuthStatus.SignedIn);
                }
              })
              .finally(() => {
                refreshRequest.current = null;
              });
          }
          await refreshRequest.current;
          return await Api(request);
        } catch {
          if (active) {
            setLogged(null);
            setAuthStatus(AuthStatus.SignedOut);
          }
          throw error;
        }
      }
    );
    Api.get('/auth/check')
      .then(({ data }) => {
        if (active) {
          setLogged(data);
          setAuthStatus(AuthStatus.SignedIn);
        }
      })
      .catch(() => {
        if (active) {
          setLogged(null);
          setAuthStatus(AuthStatus.SignedOut);
        }
      });
    return () => {
      active = false;
      Api.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = useMemo(() => ({ authStatus, logged, signIn, signOut }), [authStatus, logged, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
