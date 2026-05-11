import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useUser } from "../context/useUser";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function FallbackNavigate() {
  const { user: maybeUser } = useUser();
  return <Navigate to={maybeUser ? "/home" : "/login"} replace />;
}

export function NavigateToCurrentUserTodos() {
  const { user: maybeUser } = useUser();
  if (!maybeUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/users/${maybeUser.id}/todos`} replace />;
}

export function NavigateToCurrentUserPosts() {
  const { user: maybeUser } = useUser();
  if (!maybeUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/users/${maybeUser.id}/posts`} replace />;
}

export function NavigateToCurrentUserAlbums() {
  const { user: maybeUser } = useUser();
  if (!maybeUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/users/${maybeUser.id}/albums`} replace />;
}

export function ActiveUserRoute({
  section,
  children,
}: {
  section: "todos" | "posts" | "albums";
  children: ReactNode;
}) {
  const { user: maybeUser } = useUser();
  const { userId } = useParams();

  if (!maybeUser) {
    return <Navigate to="/login" replace />;
  }

  if (Number(userId) !== maybeUser.id) {
    return <Navigate to={`/users/${maybeUser.id}/${section}`} replace />;
  }

  return children;
}
