import { createContext } from "react";
import type { User } from "../data/types";

export interface UserContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);
