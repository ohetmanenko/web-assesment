import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Api from './Api';
import { createAuthSession } from './session.mjs';

export const AuthStatus = { Loading: 0, SignedIn: 1, SignedOut: -1 };
const AuthContext = createContext(null);
export default AuthContext;
export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(AuthStatus.Loading);
  const [logged, setLogged] = useState(null);
  const session = useRef(null);

  const signIn = useCallback((email, password) => session.current.signIn(email, password), []);
  const signOut = useCallback(() => session.current.signOut(), []);

  useEffect(() => {
    const current = createAuthSession(Api, {
      onSignedIn: user => {
        setLogged(user);
        setAuthStatus(AuthStatus.SignedIn);
      },
      onSignedOut: () => {
        setLogged(null);
        setAuthStatus(AuthStatus.SignedOut);
      }
    });
    session.current = current;
    current.check();
    return () => current.dispose();
  }, []);

  const value = useMemo(() => ({ authStatus, logged, signIn, signOut }), [authStatus, logged, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
