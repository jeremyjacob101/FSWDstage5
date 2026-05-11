import type { User } from "../types/general";
import { createContext } from "react";

export interface UserContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);
