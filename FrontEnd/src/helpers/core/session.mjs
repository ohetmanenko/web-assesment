// Keep session coordination independent of React so concurrent requests are testable.
export const createAuthSession = (api, { onSignedIn, onSignedOut }) => {
  let active = true;
  let version = 0;
  let refreshRequest = null;
  let signingOut = false;
  const isCurrent = requestVersion => active && requestVersion === version;

  const requestInterceptor = api.interceptors.request.use(request => {
    request.sessionVersion = version;
    return request;
  });
  const responseInterceptor = api.interceptors.response.use(
    response => response,
    async error => {
      const request = error.config;
      const skipRefresh = ['/auth/login', '/auth/rt', '/auth/logout'].includes(request?.url);
      if (
        error.response?.status !== 401 ||
        !request ||
        request.retried ||
        skipRefresh ||
        signingOut ||
        !isCurrent(request.sessionVersion)
      )
        throw error;
      request.retried = true;
      const requestVersion = version;
      try {
        if (!refreshRequest) {
          refreshRequest = api
            .post('/auth/rt')
            .then(({ data }) => {
              if (isCurrent(requestVersion) && !signingOut) onSignedIn(data);
            })
            .finally(() => {
              refreshRequest = null;
            });
        }
        await refreshRequest;
      } catch (refreshError) {
        if (isCurrent(requestVersion) && refreshError.response?.status === 401) onSignedOut();
        throw refreshError;
      }
      if (!isCurrent(requestVersion) || signingOut) throw error;
      // Business errors after a successful refresh must not invalidate the session.
      return api(request);
    }
  );

  return {
    async check() {
      const requestVersion = version;
      try {
        const { data } = await api.get('/auth/check');
        if (isCurrent(requestVersion)) onSignedIn(data);
      } catch {
        if (isCurrent(requestVersion)) onSignedOut();
      }
    },
    async signIn(email, password) {
      const requestVersion = ++version;
      const { data } = await api.post('/auth/login', { email, password });
      if (isCurrent(requestVersion)) onSignedIn(data);
    },
    async signOut() {
      if (signingOut) return;
      signingOut = true;
      const requestVersion = ++version;
      try {
        // A pending refresh must finish before logout clears the cookies it sets.
        await refreshRequest?.catch(() => {});
        await api.post('/auth/logout');
        if (isCurrent(requestVersion)) onSignedOut();
      } finally {
        signingOut = false;
      }
    },
    dispose() {
      active = false;
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    }
  };
};
