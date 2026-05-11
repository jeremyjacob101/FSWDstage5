import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import type { User } from "../data/types";
import { ENTRYBASE_PENDING_REGISTRATION_KEY, ENTRYBASE_USER_KEY } from "./authStorageKeys";
import { UserContext } from "./userContextCore";

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
