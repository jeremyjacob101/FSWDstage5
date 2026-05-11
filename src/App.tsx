import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { CompleteRegistrationScreen, LoginScreen, RegisterScreen } from "./components/Auth";
import { UserProvider } from "./context/userContext";
import type { UserRouteProps } from "./types/route";
import { InfoModal, NavBar } from "./components/Shared";
import { AlbumsPage } from "./pages/AlbumsPage";
import { PhotosPage } from "./pages/PhotosPage";
import { createRoot } from "react-dom/client";
import { PostsPage } from "./pages/PostsPage";
import { TodosPage } from "./pages/TodosPage";
import { StrictMode, useState } from "react";
import { useUser } from "./context/useUser";
import type { User } from "./types/general";
import { HomePage } from "./pages/HomePage";
import "./App.css";

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
                "entryBasePendingRegistration",
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
                localStorage.getItem("entryBasePendingRegistration") ?? "null",
              ) as User | null
            }
            onLogin={login}
          />
        }
      />

      <Route
        path="/"
        element={
          <UserRoute action="protect">
            <AppShell />
          </UserRoute>
        }
      >
        <Route index element={<UserRoute action="redirect" />} />

        <Route path="home" element={<HomePage />} />

        <Route
          path="todos"
          element={<UserRoute action="redirect" section="todos" />}
        />

        <Route
          path="posts"
          element={<UserRoute action="redirect" section="posts" />}
        />

        <Route
          path="albums"
          element={<UserRoute action="redirect" section="albums" />}
        />

        <Route
          path="photos"
          element={<UserRoute action="redirect" section="albums" />}
        />

        <Route
          path="users/:userId/todos"
          element={
            <UserRoute action="active-user" section="todos">
              <TodosPage />
            </UserRoute>
          }
        />

        <Route
          path="users/:userId/posts"
          element={
            <UserRoute action="active-user" section="posts">
              <PostsPage />
            </UserRoute>
          }
        />

        <Route
          path="users/:userId/albums"
          element={
            <UserRoute action="active-user" section="albums">
              <AlbumsPage />
            </UserRoute>
          }
        />

        <Route
          path="users/:userId/albums/:albumId/photos"
          element={
            <UserRoute action="active-user" section="albums">
              <PhotosPage />
            </UserRoute>
          }
        />

        <Route path="*" element={<UserRoute action="redirect" />} />
      </Route>

      <Route path="*" element={<UserRoute action="redirect" />} />
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

function UserRoute(props: UserRouteProps) {
  const { user } = useUser();
  const { userId } = useParams();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (props.action === "redirect") {
    const path = props.section ? `/users/${user.id}/${props.section}` : "/home";
    return <Navigate to={path} replace />;
  }

  if (props.action === "active-user" && Number(userId) !== user.id) {
    return <Navigate to={`/users/${user.id}/${props.section}`} replace />;
  }

  return props.children;
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
