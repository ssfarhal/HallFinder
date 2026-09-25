import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { AuthUser } from "../types";
import { storage } from "../utils/storage";
import {
  exchangeGoogleSession,
  loginWithAppleApi,
  loginWithDemoApi,
  registerUserApi,
  loginUserApi,
  fetchCurrentUser,
  logoutApi,
  setApiAuthToken,
} from "../api";
import { queryClient } from "../query-client";

WebBrowser.maybeCompleteAuthSession();

const SESSION_TOKEN_KEY = "hall_finder_session_token_v2";
const PROCESSED_SESSION_IDS = new Set<string>();

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalVisible: boolean;
  authReasonHint: string | null;
  openAuthModal: (hint?: string) => void;
  closeAuthModal: () => void;
  requireAuth: (onSuccess: () => void, hint?: string) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: (customName?: string) => Promise<void>;
  loginWithDemo: (email: string, name?: string, role?: "customer" | "owner" | "admin") => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [authReasonHint, setAuthReasonHint] = useState<string | null>(null);

  const pendingCallbackRef = useRef<(() => void) | null>(null);

  const handleAuthSuccess = useCallback(async (token: string, authUser: AuthUser) => {
    setApiAuthToken(token);
    setUser(authUser);
    await storage.setItem(SESSION_TOKEN_KEY, token);
    setAuthModalVisible(false);
    setAuthReasonHint(null);
    queryClient.invalidateQueries();

    if (pendingCallbackRef.current) {
      const cb = pendingCallbackRef.current;
      pendingCallbackRef.current = null;
      setTimeout(() => {
        cb();
      }, 300);
    }
  }, []);

  const processSessionId = useCallback(
    async (sessionId: string) => {
      if (!sessionId || PROCESSED_SESSION_IDS.has(sessionId)) return;
      PROCESSED_SESSION_IDS.add(sessionId);

      try {
        setIsLoading(true);
        const res = await exchangeGoogleSession(sessionId);
        if (res && res.session_token && res.user) {
          await handleAuthSuccess(res.session_token, res.user);

          if (Platform.OS === "web" && typeof window !== "undefined") {
            const cleanUrl = window.location.href
              .replace(/[?#&]session_id=[^&#]+/, "")
              .replace(/[?&]$/, "");
            window.history.replaceState(window.history.state, "", cleanUrl);
          }
        }
      } catch (err) {
        console.warn("Failed to exchange Google OAuth session_id:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  useEffect(() => {
    async function checkAuthSession() {
      try {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const match = (window.location.search + window.location.hash).match(
            /[?#&]session_id=([^&#]+)/
          );
          if (match && match[1]) {
            await processSessionId(match[1]);
            return;
          }
        }

        if (Platform.OS !== "web") {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            const match = initialUrl.match(/[?#&]session_id=([^&#]+)/);
            if (match && match[1]) {
              await processSessionId(match[1]);
              return;
            }
          }
        }

        const savedToken = await storage.getItem<string | null>(SESSION_TOKEN_KEY, null);
        if (savedToken) {
          setApiAuthToken(savedToken);
          try {
            const me = await fetchCurrentUser(savedToken);
            if (me) {
              setUser(me);
            } else {
              setApiAuthToken(null);
              await storage.removeItem(SESSION_TOKEN_KEY);
            }
          } catch {
            setApiAuthToken(null);
            await storage.removeItem(SESSION_TOKEN_KEY);
          }
        }
      } catch (e) {
        console.warn("Error checking auth session:", e);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthSession();

    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url) {
        const match = event.url.match(/[?#&]session_id=([^&#]+)/);
        if (match && match[1]) {
          processSessionId(match[1]);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [processSessionId]);

  const openAuthModal = useCallback((hint?: string) => {
    setAuthReasonHint(hint || null);
    setAuthModalVisible(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalVisible(false);
    setAuthReasonHint(null);
    pendingCallbackRef.current = null;
  }, []);

  const requireAuth = useCallback(
    (onSuccess: () => void, hint?: string) => {
      if (user) {
        onSuccess();
      } else {
        pendingCallbackRef.current = onSuccess;
        openAuthModal(hint);
      }
    },
    [user, openAuthModal]
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      let redirectUrl = "";
      if (Platform.OS === "web") {
        redirectUrl = window.location.origin + "/";
      } else {
        redirectUrl = Linking.createURL("");
      }

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
        redirectUrl
      )}`;

      if (Platform.OS === "web") {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        if (result.type === "success" && result.url) {
          const match = result.url.match(/[?#&]session_id=([^&#]+)/);
          if (match && match[1]) {
            await processSessionId(match[1]);
          }
        }
      }
    } catch (err) {
      console.warn("Google login error:", err);
    }
  }, [processSessionId]);

  const loginWithApple = useCallback(
    async (customName?: string) => {
      try {
        const fakeAppleId = `apple_${Math.random().toString(36).substring(2, 12)}`;
        const res = await loginWithAppleApi(
          fakeAppleId,
          customName || "Apple Customer",
          `${fakeAppleId.substring(0, 8)}@privaterelay.appleid.com`
        );
        if (res && res.session_token && res.user) {
          await handleAuthSuccess(res.session_token, res.user);
        }
      } catch (err) {
        console.warn("Apple login error:", err);
      }
    },
    [handleAuthSuccess]
  );

  const loginWithDemo = useCallback(
    async (email: string, name?: string, role: "customer" | "owner" | "admin" = "customer") => {
      const res = await loginWithDemoApi(email, name, role);
      if (res && res.session_token && res.user) {
        await handleAuthSuccess(res.session_token, res.user);
      }
    },
    [handleAuthSuccess]
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const res = await loginUserApi(email, password);
      if (res && res.session_token && res.user) {
        await handleAuthSuccess(res.session_token, res.user);
      }
    },
    [handleAuthSuccess]
  );

  const registerWithPassword = useCallback(
    async (email: string, password: string, name: string, role: string = "customer") => {
      const res = await registerUserApi(email, password, name, role);
      if (res && res.session_token && res.user) {
        await handleAuthSuccess(res.session_token, res.user);
      }
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(async () => {
    try {
      const token = await storage.getItem<string | null>(SESSION_TOKEN_KEY, null);
      if (token) {
        await logoutApi(token);
      }
    } catch {
      // ignore
    } finally {
      setApiAuthToken(null);
      setUser(null);
      await storage.removeItem(SESSION_TOKEN_KEY);
      await storage.removeItem("hall_finder_pro_membership_v2");
      queryClient.invalidateQueries();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authModalVisible,
        authReasonHint,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        loginWithGoogle,
        loginWithApple,
        loginWithDemo,
        loginWithPassword,
        registerWithPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
