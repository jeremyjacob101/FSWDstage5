import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Album, Photo, User } from "../data/types";
import { Button, EmptyState, ScreenHeader } from "../components/ui";
import {
  createPhoto,
  deletePhoto,
  getPhotosForAlbum,
  updatePhoto,
} from "../api/api";

const PHOTOS_PER_BATCH = 12;

export function PhotosPage({
  activeUser,
  albums,
}: {
  activeUser: User;
  albums: Album[];
}) {
  const navigate = useNavigate();
  const { albumId } = useParams();
  const [newTitle, setNewTitle] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const selectedAlbumId = albumId ? Number(albumId) : albums[0]?.id;
  const album = albums.find(
    (currentAlbum) => currentAlbum.id === selectedAlbumId,
  );

  useEffect(() => {
    if (!album) {
      return;
    }

    let isCurrent = true;
    const albumId = album.id;

    async function loadPhotos() {
      setIsLoading(true);
      setError("");

      try {
        const nextPhotos = await getPhotosForAlbum(
          albumId,
          1,
          PHOTOS_PER_BATCH,
        );

        if (isCurrent) {
          setPhotos(nextPhotos);
          setPage(1);
          setHasMorePhotos(nextPhotos.length === PHOTOS_PER_BATCH);
        }
      } catch {
        if (isCurrent) {
          setError("Could not load photos for this album.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadPhotos();

    return () => {
      isCurrent = false;
    };
  }, [album]);

  const loadMorePhotos = useCallback(async () => {
    if (!album || isLoading || !hasMorePhotos) {
      return;
    }

    const nextPage = page + 1;
    setIsLoading(true);
    setError("");

    try {
      const nextPhotos = await getPhotosForAlbum(
        album.id,
        nextPage,
        PHOTOS_PER_BATCH,
      );

      setPhotos((currentPhotos) => [...currentPhotos, ...nextPhotos]);
      setPage(nextPage);
      setHasMorePhotos(nextPhotos.length === PHOTOS_PER_BATCH);
    } catch {
      setError("Could not load more photos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [album, hasMorePhotos, isLoading, page]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !hasMorePhotos) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMorePhotos();
        }
      },
      { rootMargin: "320px" },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [hasMorePhotos, loadMorePhotos]);

  if (!album) {
    return (
      <section className="screen-stack">
        <ScreenHeader
          title="Photos"
          description="Choose an album to open its photos."
        />
        <EmptyState message="That album could not be found." />
        <Button
          variant="secondary"
          onClick={() => navigate(`/users/${activeUser.id}/albums`)}
        >
          Back to Albums
        </Button>
      </section>
    );
  }

  const addPhoto: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    try {
      setError("");
      const photo = await createPhoto({
        albumId: album.id,
        title,
        url: `https://picsum.photos/seed/entrybase-added-${Date.now()}/640/420`,
      });

      setPhotos((currentPhotos) => [photo, ...currentPhotos]);
      setNewTitle("");
    } catch {
      setError("Could not add the photo. Please try again.");
    }
  };

  return (
    <section className="screen-stack">
      <ScreenHeader
        title={`Photos for ${album.title}`}
        description={`Album #${album.id} with progressive loading.`}
      />
      <div className="toolbar">
        <Button
          variant="secondary"
          onClick={() => navigate(`/users/${activeUser.id}/albums`)}
        >
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
      {error && <p className="error-state">{error}</p>}
      <div className="photo-grid">
        {isLoading && !photos.length && (
          <EmptyState message="Loading photos..." />
        )}
        {photos.map((photo) => (
          <article className="photo-card" key={photo.id}>
            <img
              src={photo.url}
              alt={photo.title}
              loading="lazy"
              decoding="async"
            />
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
                    void updatePhoto(photo.id, { title })
                      .then((updatedPhoto) => {
                        setPhotos((currentPhotos) =>
                          currentPhotos.map((currentPhoto) =>
                            currentPhoto.id === photo.id
                              ? updatedPhoto
                              : currentPhoto,
                          ),
                        );
                      })
                      .catch(() => {
                        setError(
                          "Could not update the photo. Please try again.",
                        );
                      });
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    void deletePhoto(photo.id)
                      .then(() => {
                        setPhotos((currentPhotos) =>
                          currentPhotos.filter(
                            (currentPhoto) => currentPhoto.id !== photo.id,
                          ),
                        );
                      })
                      .catch(() => {
                        setError(
                          "Could not delete the photo. Please try again.",
                        );
                      });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {isLoading && photos.length > 0 && (
        <EmptyState message="Loading more photos..." />
      )}
      {hasMorePhotos && <div ref={loadMoreRef} className="scroll-sentinel" />}
    </section>
  );
}
