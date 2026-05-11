import useLocalStorage from "../hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";
import type { User } from "../types/general";
import type { ReactNode } from "react";
import { UserContext } from "./user";

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
