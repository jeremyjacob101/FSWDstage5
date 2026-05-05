import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/userContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
