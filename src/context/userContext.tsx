/* eslint-disable react-refresh/only-export-components -- useUser is a hook; UserContext is not exported (HMR-friendly). */
import { createContext, useContext, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import type { User } from "../data/types";
import {
  ENTRYBASE_PENDING_REGISTRATION_KEY,
  ENTRYBASE_USER_KEY,
} from "./authStorageKeys";

export interface UserContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useLocalStorage<User | null>(
    ENTRYBASE_USER_KEY,
    null,
  );

  function login(userData: User) {
    localStorage.removeItem(ENTRYBASE_PENDING_REGISTRATION_KEY);
    setUser(userData);
    navigate("/home");
  }

  function logout() {
    setUser(null);
    navigate("/login");
  }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside a UserProvider");
  }
  return context;
}
