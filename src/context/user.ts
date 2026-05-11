import type { User } from "../types/general";
import { createContext, useContext } from "react";

export interface UserContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside a UserProvider");
  }
  return context;
}
