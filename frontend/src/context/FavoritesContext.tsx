import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Hall } from "../types";
import { storage } from "../utils/storage";

const FAVORITES_KEY = "hall_finder_favorites_v2";

interface FavoritesContextType {
  favorites: Hall[];
  isFavorite: (hallId: string) => boolean;
  toggleFavorite: (hall: Hall) => Promise<void>;
  clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Hall[]>([]);

  useEffect(() => {
    async function loadFavorites() {
      const stored = await storage.getItem<Hall[]>(FAVORITES_KEY, []);
      if (Array.isArray(stored)) {
        setFavorites(stored);
      }
    }
    loadFavorites();
  }, []);

  const isFavorite = useCallback(
    (hallId: string) => {
      return favorites.some((item) => item.id === hallId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (hall: Hall) => {
      let updated: Hall[];
      const exists = favorites.some((item) => item.id === hall.id);
      if (exists) {
        updated = favorites.filter((item) => item.id !== hall.id);
      } else {
        updated = [hall, ...favorites];
      }
      setFavorites(updated);
      await storage.setItem(FAVORITES_KEY, updated);
    },
    [favorites]
  );

  const clearFavorites = useCallback(async () => {
    setFavorites([]);
    await storage.setItem(FAVORITES_KEY, []);
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
