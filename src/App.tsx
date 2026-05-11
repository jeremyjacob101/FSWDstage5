import { StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  CompleteRegistrationScreen,
  LoginScreen,
  RegisterScreen,
} from "./components/Auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import type { User } from "./data/types";
import { AlbumsPage } from "./pages/AlbumsPage";
import { HomePage } from "./pages/HomePage";
import { PhotosPage } from "./pages/PhotosPage";
import { PostsPage } from "./pages/PostsPage";
import { TodosPage } from "./pages/TodosPage";
import { ENTRYBASE_PENDING_REGISTRATION_KEY } from "./context/authStorageKeys";
import { UserProvider } from "./context/userContext";
import { useUser } from "./context/useUser";
import "./App.css";
import "./pages/css/Pages.css";

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <EntryBaseRoutes />
      </UserProvider>
    </BrowserRouter>
  );
}

function EntryBaseRoutes() {
  const navigate = useNavigate();
  const { login } = useUser();
  const savedPendingUser = localStorage.getItem(
    ENTRYBASE_PENDING_REGISTRATION_KEY,
  );
  const [pendingRegistrationUser, setPendingRegistrationUser] =
    useState<User | null>(() =>
      savedPendingUser ? (JSON.parse(savedPendingUser) as User) : null,
    );

  const handleLogin = (nextUser: User) => {
    setPendingRegistrationUser(null);
    login(nextUser);
  };

  const startDetailsStep = (nextUser: User) => {
    localStorage.setItem(
      ENTRYBASE_PENDING_REGISTRATION_KEY,
      JSON.stringify(nextUser),
    );
    setPendingRegistrationUser(nextUser);
    navigate("/register/details");
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />
      <Route
        path="/register"
        element={<RegisterScreen onRegistered={startDetailsStep} />}
      />
      <Route
        path="/register/details"
        element={
          <CompleteRegistrationScreen
            pendingUser={pendingRegistrationUser}
            onLogin={handleLogin}
          />
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="todos" element={<NavigateToCurrentUserTodos />} />
        <Route path="posts" element={<NavigateToCurrentUserPosts />} />
        <Route path="albums" element={<NavigateToCurrentUserAlbums />} />
        <Route path="photos" element={<NavigateToCurrentUserAlbums />} />
        <Route
          path="users/:userId/todos"
          element={
            <ActiveUserRoute section="todos">
              <TodosPage />
            </ActiveUserRoute>
          }
        />
        <Route
          path="users/:userId/posts"
          element={
            <ActiveUserRoute section="posts">
              <PostsPage />
            </ActiveUserRoute>
          }
        />
        <Route
          path="users/:userId/albums"
          element={
            <ActiveUserRoute section="albums">
              <AlbumsPage />
            </ActiveUserRoute>
          }
        />
        <Route
          path="users/:userId/albums/:albumId/photos"
          element={
            <ActiveUserRoute section="albums">
              <PhotosPage />
            </ActiveUserRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
      <Route path="*" element={<FallbackNavigate />} />
    </Routes>
  );
}

function FallbackNavigate() {
  const { user: maybeUser } = useUser();
  return <Navigate to={maybeUser ? "/home" : "/login"} replace />;
}

function NavigateToCurrentUserTodos() {
  const { user: maybeUser } = useUser();
  if (!maybeUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/users/${maybeUser.id}/todos`} replace />;
}

function NavigateToCurrentUserPosts() {
  const { user: maybeUser } = useUser();
  if (!maybeUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/users/${maybeUser.id}/posts`} replace />;
}

function NavigateToCurrentUserAlbums() {
  const { user: maybeUser } = useUser();
  if (!maybeUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/users/${maybeUser.id}/albums`} replace />;
}

function ActiveUserRoute({
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
