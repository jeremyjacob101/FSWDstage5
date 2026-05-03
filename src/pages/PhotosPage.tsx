import { useState } from "react";
import type { ComponentProps } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Album, Photo } from "../data/types";
import { Button, EmptyState, ScreenHeader } from "../components/ui";
import { nextId } from "./utils/pages";

export function PhotosPage({
  albums,
  photos,
  setPhotos,
}: {
  albums: Album[];
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [visibleCount, setVisibleCount] = useState(8);
  const [newTitle, setNewTitle] = useState("");
  const selectedAlbumId =
    (location.state as { selectedAlbumId?: number } | null)?.selectedAlbumId ??
    albums[0]?.id;
  const album = albums.find(
    (currentAlbum) => currentAlbum.id === selectedAlbumId,
  );

  if (!album) {
    return (
      <section className="screen-stack">
        <ScreenHeader
          title="Photos"
          description="Choose an album to open its photos."
        />
        <EmptyState message="That album could not be found." />
        <Button variant="secondary" onClick={() => navigate("/albums")}>
          Back to Albums
        </Button>
      </section>
    );
  }

  const albumPhotos = photos.filter((photo) => photo.albumId === album.id);
  const visiblePhotos = albumPhotos.slice(0, visibleCount);

  const addPhoto: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setPhotos((currentPhotos) => {
      const id = nextId(currentPhotos);
      return [
        {
          id,
          albumId: album.id,
          title,
          url: `https://picsum.photos/seed/entrybase-added-${id}/640/420`,
        },
        ...currentPhotos,
      ];
    });
    setNewTitle("");
  };

  return (
    <section className="screen-stack">
      <ScreenHeader
        title={`Photos for ${album.title}`}
        description={`Album #${album.id} with progressive loading.`}
      />
      <div className="toolbar">
        <Button variant="secondary" onClick={() => navigate("/albums")}>
          Back to Albums
        </Button>
      </div>
      <form className="inline-form" onSubmit={addPhoto}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="New photo title"
        />
        <Button type="submit">Add Photo</Button>
      </form>
      <div className="photo-grid">
        {visiblePhotos.map((photo) => (
          <article className="photo-card" key={photo.id}>
            <img src={photo.url} alt={photo.title} />
            <div>
              <span className="id-badge">#{photo.id}</span>
              <h3>{photo.title}</h3>
              <div className="row-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const title = window
                      .prompt("Update photo title", photo.title)
                      ?.trim();
                    if (!title) return;
                    setPhotos((currentPhotos) =>
                      currentPhotos.map((currentPhoto) =>
                        currentPhoto.id === photo.id
                          ? { ...currentPhoto, title }
                          : currentPhoto,
                      ),
                    );
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    setPhotos((currentPhotos) =>
                      currentPhotos.filter(
                        (currentPhoto) => currentPhoto.id !== photo.id,
                      ),
                    )
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {visibleCount < albumPhotos.length && (
        <Button
          variant="secondary"
          onClick={() => setVisibleCount((count) => count + 8)}
        >
          Load more photos
        </Button>
      )}
    </section>
  );
}
