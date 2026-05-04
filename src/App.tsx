import { StrictMode, useEffect, useState } from "react";
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
import { AppShell } from "./components/AppShell";
import type { Album, Post, Todo, User } from "./data/types";
import { getAlbumsForUser, getPostsForUser, getTodosForUser } from "./api/api";
import { AlbumsPage } from "./pages/AlbumsPage";
import { HomePage } from "./pages/HomePage";
import { PhotosPage } from "./pages/PhotosPage";
import { PostsPage } from "./pages/PostsPage";
import { TodosPage } from "./pages/TodosPage";
import "./App.css";
import "./pages/css/Pages.css";

const STORAGE_KEY = "entryBaseUser";
const PENDING_REGISTRATION_KEY = "entryBasePendingRegistration";

export default function App() {
  return (
    <BrowserRouter>
      <EntryBaseRoutes />
    </BrowserRouter>
  );
}

function EntryBaseRoutes() {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem(STORAGE_KEY);
  const [activeUser, setActiveUser] = useState<User | null>(() =>
    savedUser ? (JSON.parse(savedUser) as User) : null,
  );
  const savedPendingUser = localStorage.getItem(PENDING_REGISTRATION_KEY);
  const [pendingRegistrationUser, setPendingRegistrationUser] =
    useState<User | null>(() =>
      savedPendingUser ? (JSON.parse(savedPendingUser) as User) : null,
    );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [resourceError, setResourceError] = useState("");

  useEffect(() => {
    if (!activeUser) {
      return;
    }

    let isCurrent = true;
    const currentUserId = activeUser.id;

    async function loadResources() {
      setIsLoadingResources(true);
      setResourceError("");

      try {
        const [nextTodos, nextPosts, nextAlbums] = await Promise.all([
          getTodosForUser(currentUserId),
          getPostsForUser(currentUserId),
          getAlbumsForUser(currentUserId),
        ]);

        if (!isCurrent) return;
        setTodos(nextTodos);
        setPosts(nextPosts);
        setAlbums(nextAlbums);
      } catch {
        if (!isCurrent) return;
        setResourceError(
          "Could not load your workspace data. Please make sure JSON-Server is running.",
        );
      } finally {
        if (isCurrent) {
          setIsLoadingResources(false);
        }
      }
    }

    void loadResources();

    return () => {
      isCurrent = false;
    };
  }, [activeUser]);

  const login = (user: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(PENDING_REGISTRATION_KEY);
    setPendingRegistrationUser(null);
    setActiveUser(user);
    navigate("/home");
  };

  const startDetailsStep = (user: User) => {
    localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(user));
    setPendingRegistrationUser(user);
    navigate("/register/details");
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveUser(null);
    setTodos([]);
    setPosts([]);
    setAlbums([]);
    navigate("/login");
  };

  if (!activeUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={login} />} />
        <Route
          path="/register"
          element={<RegisterScreen onRegistered={startDetailsStep} />}
        />
        <Route
          path="/register/details"
          element={
            <CompleteRegistrationScreen
              pendingUser={pendingRegistrationUser}
              onLogin={login}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppShell
            activeUser={activeUser}
            onLogout={logout}
            notice={resourceError}
          />
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage activeUser={activeUser} />} />
        <Route
          path="todos"
          element={<Navigate to={`/users/${activeUser.id}/todos`} replace />}
        />
        <Route
          path="posts"
          element={<Navigate to={`/users/${activeUser.id}/posts`} replace />}
        />
        <Route
          path="albums"
          element={<Navigate to={`/users/${activeUser.id}/albums`} replace />}
        />
        <Route
          path="photos"
          element={<Navigate to={`/users/${activeUser.id}/albums`} replace />}
        />
        <Route
          path="users/:userId/todos"
          element={
            <ActiveUserRoute activeUser={activeUser} section="todos">
              <TodosPage
                activeUser={activeUser}
                todos={todos}
                setTodos={setTodos}
                isLoading={isLoadingResources}
              />
            </ActiveUserRoute>
          }
        />
        <Route
          path="users/:userId/posts"
          element={
            <ActiveUserRoute activeUser={activeUser} section="posts">
              <PostsPage
                activeUser={activeUser}
                posts={posts}
                setPosts={setPosts}
                isLoading={isLoadingResources}
              />
            </ActiveUserRoute>
          }
        />
        <Route
          path="users/:userId/albums"
          element={
            <ActiveUserRoute activeUser={activeUser} section="albums">
              <AlbumsPage
                activeUser={activeUser}
                albums={albums}
                setAlbums={setAlbums}
                isLoading={isLoadingResources}
              />
            </ActiveUserRoute>
          }
        />
        <Route
          path="users/:userId/albums/:albumId/photos"
          element={
            <ActiveUserRoute activeUser={activeUser} section="albums">
              <PhotosPage activeUser={activeUser} albums={albums} />
            </ActiveUserRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

function ActiveUserRoute({
  activeUser,
  section,
  children,
}: {
  activeUser: User;
  section: "todos" | "posts" | "albums";
  children: ReactNode;
}) {
  const { userId } = useParams();

  if (Number(userId) !== activeUser.id) {
    return <Navigate to={`/users/${activeUser.id}/${section}`} replace />;
  }

  return children;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
