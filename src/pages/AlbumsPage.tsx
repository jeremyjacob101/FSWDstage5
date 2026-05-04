import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Album, User } from "../data/types";
import {
  Button,
  EmptyState,
  ScreenHeader,
  SearchInput,
  Toolbar,
} from "../components/ui";
import { createAlbum } from "../api/api";

export function AlbumsPage({
  activeUser,
  albums,
  setAlbums,
  isLoading,
}: {
  activeUser: User;
  albums: Album[];
  setAlbums: React.Dispatch<React.SetStateAction<Album[]>>;
  isLoading: boolean;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");
  const visibleAlbums = albums.filter((album) => {
    const query = search.toLowerCase().trim();
    return (
      String(album.id).includes(query) ||
      album.title.toLowerCase().includes(query)
    );
  });

  const addAlbum: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    try {
      setError("");
      const album = await createAlbum({ userId: activeUser.id, title });
      setAlbums((currentAlbums) => [album, ...currentAlbums]);
      setNewTitle("");
    } catch {
      setError("Could not create the album. Please try again.");
    }
  };

  return (
    <section className="screen-stack">
      <ScreenHeader
        title="Albums"
        description="Search collections and open photo grids."
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search album id or title"
        />
      </Toolbar>
      <form className="inline-form" onSubmit={addAlbum}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="New album title"
        />
        <Button type="submit">New Album</Button>
      </form>
      {error && <p className="error-state">{error}</p>}
      <div className="album-grid">
        {isLoading && <EmptyState message="Loading albums..." />}
        {visibleAlbums.map((album) => (
          <article className="album-card" key={album.id}>
            <span className="id-badge">#{album.id}</span>
            <h3>{album.title}</h3>
            <Button
              onClick={() =>
                navigate(`/users/${activeUser.id}/albums/${album.id}/photos`)
              }
            >
              Open album
            </Button>
          </article>
        ))}
        {!isLoading && !visibleAlbums.length && (
          <EmptyState message="No albums match that search." />
        )}
      </div>
    </section>
  );
}
