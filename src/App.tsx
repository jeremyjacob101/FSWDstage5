import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  CompleteRegistrationScreen,
  LoginScreen,
  RegisterScreen,
} from "./components/Auth";
import { InfoModal, NavBar } from "./components/ui";
import { ENTRYBASE_PENDING_REGISTRATION_KEY } from "./context/authStorageKeys";
import { UserProvider } from "./context/userContext";
import { useUser } from "./context/useUser";
import type { User } from "./data/types";
import { AlbumsPage } from "./pages/AlbumsPage";
import { HomePage } from "./pages/HomePage";
import { PhotosPage } from "./pages/PhotosPage";
import { PostsPage } from "./pages/PostsPage";
import { TodosPage } from "./pages/TodosPage";
import {
  ActiveUserRoute,
  FallbackNavigate,
  NavigateToCurrentUserAlbums,
  NavigateToCurrentUserPosts,
  NavigateToCurrentUserTodos,
  ProtectedRoute,
} from "./routes/navigationGuards";
import "./App.css";
import "./pages/css/Pages.css";

export default function App() {
  const navigate = useNavigate();
  const { login } = useUser();

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen onLogin={login} />} />
      <Route
        path="/register"
        element={
          <RegisterScreen
            onRegistered={(nextUser) => {
              localStorage.setItem(
                ENTRYBASE_PENDING_REGISTRATION_KEY,
                JSON.stringify(nextUser),
              );
              navigate("/register/details");
            }}
          />
        }
      />
      <Route
        path="/register/details"
        element={
          <CompleteRegistrationScreen
            pendingUser={
              JSON.parse(
                localStorage.getItem(ENTRYBASE_PENDING_REGISTRATION_KEY) ??
                  "null",
              ) as User | null
            }
            onLogin={login}
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

function AppShell() {
  const { user, logout } = useUser();
  const [infoOpen, setInfoOpen] = useState(false);
  const activeUser = user!;

  return (
    <div className="app-shell">
      <NavBar
        user={activeUser}
        onInfo={() => setInfoOpen(true)}
        onLogout={logout}
      />
      <main className="page-content">
        <Outlet />
      </main>
      {infoOpen && (
        <InfoModal user={activeUser} onClose={() => setInfoOpen(false)} />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
);
