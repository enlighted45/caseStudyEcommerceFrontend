import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Keycloak from "keycloak-js";
import { decodeClaims } from "../api/contracts";
import { requestApi } from "../api/client";
const Context = createContext(null);
// Service addresses come ONLY from .env. No connection screen or stored URL override.
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081",
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "E-Commerce",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "ecommerce-api",
};
const createKeycloak = (options) => new Keycloak(options);
export function AuthProvider({ children, keycloakFactory = createKeycloak }) {
  // The optional factory is for automated tests. The app always uses real Keycloak.
  const [token, setToken] = useState("");
  const [claims, setClaims] = useState(null);
  const [identity, setIdentity] = useState({ userId: "", tenantName: "" });
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [identityError, setIdentityError] = useState(null);
  const [identityBusy, setIdentityBusy] = useState(false);
  const client = useRef(null);
  const initialization = useRef(null);
  const identityGeneration = useRef(0);
  // OAuth callbacks must not contain a fragment; HashRouter supplies the default route.
  const returnUrl = import.meta.env.VITE_KEYCLOAK_REDIRECT_URI || `${window.location.origin}/`;
  const clearSession = useCallback(() => {
    identityGeneration.current += 1;
    setToken("");
    setClaims(null);
    setIdentity({ userId: "", tenantName: "" });
    setIdentityError(null);
    setIdentityBusy(false);
  }, []);
  const acceptClientToken = useCallback(() => {
    if (!client.current?.token) return;
    setToken(client.current.token);
    setClaims(decodeClaims(client.current.token));
  }, []);
  const initializeKeycloak = useCallback(() => {
    // Reuse one initialization promise: Keycloak instances cannot be initialized twice.
    if (!initialization.current) {
      setReady(false);
      setAuthError(null);
      const instance = keycloakFactory({
        url: config.keycloakUrl,
        realm: config.realm,
        clientId: config.clientId,
      });
      client.current = instance;
      instance.onAuthSuccess = acceptClientToken;
      instance.onAuthRefreshSuccess = acceptClientToken;
      instance.onAuthLogout = clearSession;
      instance.onAuthRefreshError = clearSession;
      initialization.current = instance
        .init({
          onLoad: "check-sso",
          checkLoginIframe: false,
          pkceMethod: "S256",
          responseMode: "query",
          redirectUri: returnUrl,
        })
        .then((authenticated) => {
          if (authenticated) acceptClientToken();
          return instance;
        })
        .catch((error) => {
          client.current = null;
          initialization.current = null;
          const message = new Error(
            "Login service is unavailable. Start Keycloak and check the URL, realm, public client, and redirect settings in README.md.",
          );
          setAuthError(message);
          throw message;
        })
        .finally(() => setReady(true));
    }
    return initialization.current;
  }, [keycloakFactory, acceptClientToken, clearSession, returnUrl]);
  // Check the existing login automatically when the frontend starts or reloads.
  useEffect(() => {
    initializeKeycloak().catch(() => {});
  }, [initializeKeycloak]);
  const getToken = useCallback(async () => {
    if (!client.current?.authenticated) return "";
    try {
      await client.current.updateToken(30);
      return client.current.token;
    } catch {
      clearSession();
      throw new Error("Your login expired. Please log in again.");
    }
  }, [clearSession]);
  const api = useCallback(
    (path, options) => requestApi(config, getToken, path, options),
    [getToken],
  );
  async function login() {
    try {
      const instance = await initializeKeycloak();
      await instance.login({ redirectUri: returnUrl });
    } catch (error) {
      setAuthError(error);
    }
  }
  async function logout() {
    const instance = client.current;
    clearSession();
    try {
      if (instance?.authenticated)
        await instance.logout({ redirectUri: returnUrl });
    } catch {
      setAuthError(
        new Error(
          "Could not finish Keycloak logout. Close the session in Keycloak before switching accounts.",
        ),
      );
    }
  }
  const roles = Array.isArray(claims?.realm_access?.roles)
    ? claims.realm_access.roles
    : [];
  const hasRole = (role) => roles.includes(role);
  useEffect(() => {
    const generation = ++identityGeneration.current;
    setIdentity({ userId: "", tenantName: "" });
    setIdentityError(null);
    if (
      !claims?.preferred_username ||
      !(roles.includes("USER") || roles.includes("TENANT"))
    ) {
      setIdentityBusy(false);
      return;
    }
    // Resolve database identity from the authenticated backend on every login.
    {
      const isTenant = roles.includes("TENANT");
      setIdentityBusy(true);
      api(isTenant ? "/tenantUser/me" : "/users/me")
        .then((response) => {
          const id = isTenant ? response?.id : response;
          if (!Number.isSafeInteger(id) || id < 1) {
            throw new Error("The account service returned an invalid user ID.");
          }
          const tenantName = isTenant ? response?.tenantName : "";
          if (isTenant && (typeof tenantName !== "string" || !tenantName.trim())) {
            throw new Error("The account service returned an invalid tenant name.");
          }
          if (generation === identityGeneration.current) {
            setIdentity({ userId: String(id), tenantName });
          }
        })
        .catch((error) => {
          if (generation === identityGeneration.current) setIdentityError(error);
        })
        .finally(() => {
          if (generation === identityGeneration.current) setIdentityBusy(false);
        });
      return;
    }
    // Token refresh must not reset the account or cart; identity changes only on login.
  }, [
    claims?.preferred_username,
    claims?.sub,
    roles.includes("USER"),
    roles.includes("TENANT"),
    api,
  ]);
  return (
    <Context.Provider
      value={{
        config,
        token,
        claims,
        identity,
        ready,
        authError,
        identityError,
        identityBusy,
        login,
        logout,
        api,
        hasRole,
        roles,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);

