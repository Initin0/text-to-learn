import { createContext, useCallback, useMemo } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
export const AUTH0_ENABLED = Boolean(domain && clientId);

// Maps the Auth0 SDK onto the small interface the app uses.
function Auth0Bridge({ children }) {
  const { isLoading, isAuthenticated, user, error, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  const login = useCallback(
    (returnTo = window.location.pathname, signup = false) =>
      loginWithRedirect({ appState: { returnTo }, authorizationParams: signup ? { screen_hint: 'signup' } : undefined }),
    [loginWithRedirect]
  );

  const value = useMemo(
    () => ({
      mode: 'auth0',
      isLoading,
      isAuthenticated,
      error,
      user,
      login,
      logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
      getToken: () => getAccessTokenSilently(),
    }),
    [isLoading, isAuthenticated, error, user, login, logout, getAccessTokenSilently]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Used when VITE_AUTH0_* is not set: pairs with AUTH_DISABLED=true on the server for local work.
const devValue = {
  mode: 'dev',
  isLoading: false,
  isAuthenticated: true,
  error: null,
  user: { name: 'Local developer', email: 'dev@localhost' },
  login: () => {},
  logout: () => {},
  getToken: async () => null,
};

export function AppAuthProvider({ children }) {
  const navigate = useNavigate();
  if (!AUTH0_ENABLED) return <AuthContext.Provider value={devValue}>{children}</AuthContext.Provider>;
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience, scope: 'openid profile email offline_access' }}
      // refresh tokens + localStorage keep the session alive across reloads (silent refresh)
      useRefreshTokens
      useRefreshTokensFallback
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => navigate(appState?.returnTo || '/', { replace: true })}
    >
      <Auth0Bridge>{children}</Auth0Bridge>
    </Auth0Provider>
  );
}
