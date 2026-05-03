import { useState } from "react";
import type { ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { mockUser } from "../data/data";
import type { Album } from "../data/types";
import {
  Button,
  EmptyState,
  ScreenHeader,
  SearchInput,
  Toolbar,
} from "../components/ui";
import { nextId } from "./utils/pages";

export function AlbumsPage({
  albums,
  setAlbums,
}: {
  albums: Album[];
  setAlbums: React.Dispatch<React.SetStateAction<Album[]>>;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const visibleAlbums = albums.filter((album) => {
    const query = search.toLowerCase().trim();
    return (
      String(album.id).includes(query) ||
      album.title.toLowerCase().includes(query)
    );
  });

  const addAlbum: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setAlbums((currentAlbums) => [
      { id: nextId(currentAlbums), userId: mockUser.id, title },
      ...currentAlbums,
    ]);
    setNewTitle("");
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
      <div className="album-grid">
        {visibleAlbums.map((album) => (
          <article className="album-card" key={album.id}>
            <span className="id-badge">#{album.id}</span>
            <h3>{album.title}</h3>
            <Button
              onClick={() =>
                navigate("/photos", { state: { selectedAlbumId: album.id } })
              }
            >
              Open album
            </Button>
          </article>
        ))}
        {!visibleAlbums.length && (
          <EmptyState message="No albums match that search." />
        )}
      </div>
    </section>
  );
}
