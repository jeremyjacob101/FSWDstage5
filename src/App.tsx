import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { LoginScreen, RegisterScreen } from "./Auth";
import { AppShell } from "./components/AppShell";
import {
  mockAlbums,
  mockComments,
  mockPhotos,
  mockPosts,
  mockTodos,
} from "./data/data";
import type { Album, Comment, Photo, Post, Todo, User } from "./data/types";
import { AlbumsPage } from "./pages/AlbumsPage";
import { HomePage } from "./pages/HomePage";
import { PhotosPage } from "./pages/PhotosPage";
import { PostsPage } from "./pages/PostsPage";
import { TodosPage } from "./pages/TodosPage";
import "./App.css";

const STORAGE_KEY = "entryBaseUser";

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
  const [todos, setTodos] = useState<Todo[]>(mockTodos);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [albums, setAlbums] = useState<Album[]>(mockAlbums);
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos);

  const login = (user: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setActiveUser(user);
    navigate("/");
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveUser(null);
    navigate("/login");
  };

  if (!activeUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={login} />} />
        <Route path="/register" element={<RegisterScreen onLogin={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<AppShell activeUser={activeUser} onLogout={logout} />}
      >
        <Route index element={<HomePage activeUser={activeUser} />} />
        <Route
          path="todos"
          element={<TodosPage todos={todos} setTodos={setTodos} />}
        />
        <Route
          path="posts"
          element={
            <PostsPage
              posts={posts}
              setPosts={setPosts}
              comments={comments}
              setComments={setComments}
            />
          }
        />
        <Route
          path="albums"
          element={<AlbumsPage albums={albums} setAlbums={setAlbums} />}
        />
        <Route
          path="photos"
          element={
            <PhotosPage albums={albums} photos={photos} setPhotos={setPhotos} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
