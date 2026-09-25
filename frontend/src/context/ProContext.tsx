import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserMembership } from "../types";
import { storage } from "../utils/storage";
import { fetchUserMembership, createPaymentCheckout, verifyPayment, mockUpgradeMembership, secretUnlockMembership } from "../api";
import { queryClient } from "../query-client";
import { useAuth } from "./AuthContext";

const MEMBERSHIP_STORAGE_KEY = "hall_finder_pro_membership_v2";

interface ProContextType {
  isPro: boolean;
  membership: UserMembership | null;
  customerId: string;
  isLoading: boolean;
  upgradeModalVisible: boolean;
  featureHint: string | null;
  openUpgradeModal: (hint?: string) => void;
  closeUpgradeModal: () => void;
  requirePro: (onAllowed: () => void, featureName?: string) => void;
  subscribeToPlan: (
    plan: "weekly_100" | "quarterly_300" | "yearly_500",
    name: string,
    phone: string,
    email: string
  ) => Promise<{ success: boolean; message?: string }>;
  applySecretCode: (code: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  refreshMembership: () => Promise<void>;
  activateProDirect: (plan?: "weekly_100" | "quarterly_300" | "yearly_500") => Promise<void>;
}

const ProContext = createContext<ProContextType | null>(null);

export const ProProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState<boolean>(false);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState<boolean>(false);
  const [featureHint, setFeatureHint] = useState<string | null>(null);

  const activeCustomerId = user?.user_id || user?.email || "guest_user";

  useEffect(() => {
    async function init() {
      try {
        if (!user) {
          setIsPro(false);
          setMembership(null);
          await storage.removeItem(MEMBERSHIP_STORAGE_KEY);
          return;
        }

        const currentId = user.user_id || user.email;

        // Check if user object already carries is_pro from backend
        if (user.is_pro) {
          setIsPro(true);
          setMembership({
            customer_id: currentId,
            plan: user.plan as any,
            plan_name: user.plan_name,
            expires_at: user.expires_at,
            is_pro: true,
            status: "active"
          });
          return;
        }

        // Check local cache
        const cachedMem = await storage.getItem<UserMembership | null>(MEMBERSHIP_STORAGE_KEY, null);
        if (cachedMem && cachedMem.is_pro && (cachedMem.customer_id === currentId || cachedMem.customer_email === user.email)) {
          if (cachedMem.expires_at) {
            const exp = new Date(cachedMem.expires_at).getTime();
            if (exp > Date.now()) {
              setIsPro(true);
              setMembership(cachedMem);
            } else {
              setIsPro(false);
              setMembership(null);
            }
          } else {
            setIsPro(true);
            setMembership(cachedMem);
          }
        }

        // Fetch remote membership
        try {
          const remoteMem = await fetchUserMembership(currentId);
          if (remoteMem && remoteMem.is_pro) {
            setIsPro(true);
            setMembership(remoteMem);
            await storage.setItem(MEMBERSHIP_STORAGE_KEY, remoteMem);
          } else {
            setIsPro(false);
            setMembership(null);
          }
        } catch {
          // ignore
        }
      } catch (e) {
        console.warn("Error initializing membership:", e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [user]);

  const openUpgradeModal = useCallback((hint?: string) => {
    setFeatureHint(hint || null);
    setUpgradeModalVisible(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalVisible(false);
    setFeatureHint(null);
  }, []);

  const requirePro = useCallback(
    (onAllowed: () => void, featureName?: string) => {
      if (isPro) {
        onAllowed();
      } else {
        openUpgradeModal(featureName);
      }
    },
    [isPro, openUpgradeModal]
  );

  const refreshMembership = useCallback(async () => {
    try {
      const res = await fetchUserMembership(activeCustomerId);
      if (res && res.is_pro) {
        setIsPro(true);
        setMembership(res);
        await storage.setItem(MEMBERSHIP_STORAGE_KEY, res);
      } else {
        setIsPro(false);
        setMembership(res);
        await storage.setItem(MEMBERSHIP_STORAGE_KEY, res);
      }
    } catch (err) {
      console.warn("Failed to refresh membership:", err);
    }
  }, [activeCustomerId]);

  const subscribeToPlan = useCallback(
    async (
      plan: "weekly_100" | "quarterly_300" | "yearly_500",
      name: string,
      phone: string,
      email: string
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const checkoutRes = await createPaymentCheckout({
          plan,
          customer_id: activeCustomerId,
          customer_name: name.trim() || user?.name || "Pro Member",
          customer_email: email.trim() || user?.email || "customer@example.com",
          customer_phone: phone.trim() || "9876543210",
        });

        const verifyRes = await verifyPayment(checkoutRes.order_id);
        if (verifyRes.is_pro && verifyRes.membership) {
          setIsPro(true);
          setMembership(verifyRes.membership);
          await storage.setItem(MEMBERSHIP_STORAGE_KEY, verifyRes.membership);
          queryClient.invalidateQueries();
          return {
            success: true,
            message: `Congratulations! Your account is upgraded to HallFinder Pro (${verifyRes.membership.plan_name}).`,
          };
        } else {
          return {
            success: false,
            message: "Payment verification pending. Please check order status.",
          };
        }
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Failed to process payment via Cashfree.",
        };
      }
    },
    [activeCustomerId, user]
  );

  const activateProDirect = useCallback(
    async (plan: "weekly_100" | "quarterly_300" | "yearly_500" = "yearly_500") => {
      try {
        const res = await mockUpgradeMembership(activeCustomerId, plan, user?.name || "HallFinder Pro Member");
        if (res.membership) {
          setIsPro(true);
          setMembership(res.membership);
          await storage.setItem(MEMBERSHIP_STORAGE_KEY, res.membership);
          queryClient.invalidateQueries();
        }
      } catch (e) {
        console.warn("Direct upgrade error:", e);
      }
    },
    [activeCustomerId, user]
  );

  const applySecretCode = useCallback(
    async (code: string, name?: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await secretUnlockMembership(activeCustomerId, code, name || user?.name);
        if (res.success && res.membership) {
          setIsPro(true);
          setMembership(res.membership);
          await storage.setItem(MEMBERSHIP_STORAGE_KEY, res.membership);
          queryClient.invalidateQueries();
          return {
            success: true,
            message: res.message || "🎉 Secret Code GT011103 Applied! Full Pro Access Unlocked.",
          };
        } else {
          return {
            success: false,
            message: "Invalid secret unlock code.",
          };
        }
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Invalid secret code. Please enter valid code GT011103.",
        };
      }
    },
    [activeCustomerId, user]
  );

  return (
    <ProContext.Provider
      value={{
        isPro,
        membership,
        customerId: activeCustomerId,
        isLoading,
        upgradeModalVisible,
        featureHint,
        openUpgradeModal,
        closeUpgradeModal,
        requirePro,
        subscribeToPlan,
        applySecretCode,
        refreshMembership,
        activateProDirect,
      }}
    >
      {children}
    </ProContext.Provider>
  );
};

export function usePro() {
  const context = useContext(ProContext);
  if (!context) {
    throw new Error("usePro must be used within a ProProvider");
  }
  return context;
}
