import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Photo } from "../data/types";
import { useCachedUserAlbums } from "../hooks/useCachedUserResources";
import { useUser } from "../context/userContext";
import {
  Button,
  EmptyState,
  ScreenHeader,
  SearchInput,
  Toolbar,
} from "../components/ui";
import {
  createPhoto,
  deletePhoto,
  getPhotosForAlbum,
  updatePhoto,
} from "../api/api";

const PHOTOS_PER_BATCH = 12;
const PHOTO_CHOICES = 20;
const MAX_PICSUM_SEED = 1_000_000;

type PhotoChoice = {
  seed: number;
  url: string;
};

function createPhotoChoices(count = PHOTO_CHOICES): PhotoChoice[] {
  const usedSeeds = new Set<number>();
  const choices: PhotoChoice[] = [];

  while (choices.length < count) {
    const seed = Math.floor(Math.random() * MAX_PICSUM_SEED) + 1;
    if (usedSeeds.has(seed)) continue;

    usedSeeds.add(seed);
    choices.push({
      seed,
      url: `https://picsum.photos/seed/entrybase-${seed}/640/420`,
    });
  }

  return choices;
}

export function PhotosPage() {
  const { albums, loadError } = useCachedUserAlbums();
  const { user: activeUser } = useUser();
  const navigate = useNavigate();
  const { albumId } = useParams();
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [addPhotoChoices, setAddPhotoChoices] = useState(createPhotoChoices);
  const [selectedAddPhotoUrl, setSelectedAddPhotoUrl] = useState(
    addPhotoChoices[0]?.url ?? "",
  );
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPhotoUrl, setDraftPhotoUrl] = useState("");
  const [editPhotoChoices, setEditPhotoChoices] = useState<PhotoChoice[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPhotoIds, setPendingPhotoIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const selectedAlbumId = albumId ? Number(albumId) : albums[0]?.id;
  const album = albums.find(
    (currentAlbum) => currentAlbum.id === selectedAlbumId,
  );
  const visiblePhotos = photos.filter((photo) => {
    const query = search.toLowerCase().trim();
    return (
      String(photo.id).includes(query) ||
      photo.title.toLowerCase().includes(query)
    );
  });

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

  if (!activeUser) {
    return null;
  }

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
    if (!title || !selectedAddPhotoUrl) return;

    try {
      setError("");
      const photo = await createPhoto({
        albumId: album.id,
        title,
        url: selectedAddPhotoUrl,
      });

      setPhotos((currentPhotos) => [photo, ...currentPhotos]);
      setNewTitle("");
      const nextChoices = createPhotoChoices();
      setAddPhotoChoices(nextChoices);
      setSelectedAddPhotoUrl(nextChoices[0]?.url ?? "");
    } catch {
      setError("Could not add the photo. Please try again.");
    }
  };

  const refreshAddPhotoChoices = () => {
    const nextChoices = createPhotoChoices();
    setAddPhotoChoices(nextChoices);
    setSelectedAddPhotoUrl(nextChoices[0]?.url ?? "");
  };

  const startEditingPhoto = (photo: Photo) => {
    const nextChoices = [
      { seed: photo.id, url: photo.url },
      ...createPhotoChoices(PHOTO_CHOICES - 1),
    ];
    setEditingPhotoId(photo.id);
    setDraftTitle(photo.title);
    setDraftPhotoUrl(photo.url);
    setEditPhotoChoices(nextChoices);
    setError("");
  };

  const cancelEditingPhoto = () => {
    setEditingPhotoId(null);
    setDraftTitle("");
    setDraftPhotoUrl("");
    setEditPhotoChoices([]);
  };

  const refreshEditPhotoChoices = () => {
    const nextChoices = createPhotoChoices();
    setEditPhotoChoices(nextChoices);
    setDraftPhotoUrl(nextChoices[0]?.url ?? "");
  };

  const savePhotoTitle = async (photo: Photo) => {
    const title = draftTitle.trim();
    if (!title || !draftPhotoUrl || pendingPhotoIds.includes(photo.id)) return;

    try {
      setError("");
      setPendingPhotoIds((currentIds) => [...currentIds, photo.id]);
      const updatedPhoto = await updatePhoto(photo.id, {
        title,
        url: draftPhotoUrl,
      });

      setPhotos((currentPhotos) =>
        currentPhotos.map((currentPhoto) =>
          currentPhoto.id === photo.id ? updatedPhoto : currentPhoto,
        ),
      );
      cancelEditingPhoto();
    } catch {
      setError("Could not update the photo. Please try again.");
    } finally {
      setPendingPhotoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== photo.id),
      );
    }
  };

  const removePhoto = async (photo: Photo) => {
    if (pendingPhotoIds.includes(photo.id)) return;

    try {
      setError("");
      setPendingPhotoIds((currentIds) => [...currentIds, photo.id]);
      await deletePhoto(photo.id);
      setPhotos((currentPhotos) =>
        currentPhotos.filter((currentPhoto) => currentPhoto.id !== photo.id),
      );
      if (editingPhotoId === photo.id) {
        cancelEditingPhoto();
      }
    } catch {
      setError("Could not delete the photo. Please try again.");
    } finally {
      setPendingPhotoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== photo.id),
      );
    }
  };

  return (
    <section className="screen-stack">
      <ScreenHeader
        title={`Photos for ${album.title}`}
        description={`Album #${album.id}`}
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search photo id or title"
        />
        <Button
          variant="secondary"
          onClick={() => navigate(`/users/${activeUser.id}/albums`)}
        >
          Back to Albums
        </Button>
      </Toolbar>
      <form className="inline-form" onSubmit={addPhoto}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="New photo title"
        />
        <Button
          type="submit"
          disabled={!newTitle.trim() || !selectedAddPhotoUrl}
        >
          Add Photo
        </Button>
      </form>
      <section className="photo-picker-panel">
        <div className="photo-picker-header">
          <h3>Choose a photo</h3>
          <Button variant="secondary" onClick={refreshAddPhotoChoices}>
            Randomize
          </Button>
        </div>
        <div className="photo-choice-grid">
          {addPhotoChoices.map((choice) => (
            <button
              className={
                choice.url === selectedAddPhotoUrl
                  ? "photo-choice selected"
                  : "photo-choice"
              }
              key={choice.seed}
              type="button"
              onClick={() => setSelectedAddPhotoUrl(choice.url)}
              aria-label={`Choose photo seed ${choice.seed}`}
            >
              <img src={choice.url} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </section>
      {loadError && (
        <p className="error-state">
          Could not load albums list. Please make sure JSON-Server is running.
        </p>
      )}
      {error && <p className="error-state">{error}</p>}
      <div className="photo-grid">
        {isLoading && !photos.length && (
          <EmptyState message="Loading photos..." />
        )}
        {visiblePhotos.map((photo) => {
          const isPending = pendingPhotoIds.includes(photo.id);
          const isEditing = editingPhotoId === photo.id;

          return (
            <article className="photo-card" key={photo.id}>
              <img
                src={photo.url}
                alt={photo.title}
                loading="lazy"
                decoding="async"
              />
              <div>
                <span className="id-badge">#{photo.id}</span>
                {isEditing ? (
                  <div className="photo-edit-stack">
                    <input
                      className="photo-edit-input"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      disabled={isPending}
                      aria-label={`Photo ${photo.id} title`}
                    />
                    <div className="photo-picker-header compact">
                      <h4>Choose image</h4>
                      <Button
                        variant="secondary"
                        onClick={refreshEditPhotoChoices}
                        disabled={isPending}
                      >
                        Randomize
                      </Button>
                    </div>
                    <div className="photo-choice-grid compact">
                      {editPhotoChoices.map((choice) => (
                        <button
                          className={
                            choice.url === draftPhotoUrl
                              ? "photo-choice selected"
                              : "photo-choice"
                          }
                          key={`${photo.id}-${choice.seed}-${choice.url}`}
                          type="button"
                          onClick={() => setDraftPhotoUrl(choice.url)}
                          disabled={isPending}
                          aria-label={`Choose photo seed ${choice.seed}`}
                        >
                          <img
                            src={choice.url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <h3>{photo.title}</h3>
                )}
                <div className="row-actions">
                  {isEditing ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => void savePhotoTitle(photo)}
                        disabled={
                          isPending || !draftTitle.trim() || !draftPhotoUrl
                        }
                      >
                        {isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={cancelEditingPhoto}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => startEditingPhoto(photo)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => void removePhoto(photo)}
                    disabled={isPending}
                  >
                    {isPending ? "Working..." : "Delete"}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
        {!isLoading && !visiblePhotos.length && (
          <EmptyState message="No photos match that search." />
        )}
      </div>
      {isLoading && photos.length > 0 && (
        <EmptyState message="Loading more photos..." />
      )}
      {hasMorePhotos && <div ref={loadMoreRef} className="scroll-sentinel" />}
    </section>
  );
}
