import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import type { User } from "../data/types";
import { UserContext } from "./userContextCore";

export function UserProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useLocalStorage<User | null>("entryBaseUser", null);

  function login(userData: User) {
    localStorage.removeItem("entryBasePendingRegistration");
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
