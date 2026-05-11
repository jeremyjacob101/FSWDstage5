import { PHOTOS_PER_BATCH, PHOTO_CHOICES, PHOTOS_MAX_PICSUM_SEED, PHOTOS_MAX_RESTORED_PAGES } from "../types/page";
import { Button, EmptyState, ScreenHeader, SearchInput, Toolbar } from "../components/Shared";
import { createPhoto, deletePhoto, getPhotosForAlbum, updatePhoto } from "../api/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCachedUserResources } from "../hooks/useCachedUserResources";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { usePersistentState } from "../hooks/usePersistentState";
import { useNavigate, useParams } from "react-router-dom";
import type { Album, Photo } from "../types/general";
import type { PhotosUiState } from "../types/state";
import type { PhotoChoice } from "../types/page";
import { useUser } from "../context/useUser";

function createPhotoChoices(count = PHOTO_CHOICES): PhotoChoice[] {
  const usedSeeds = new Set<number>();
  const choices: PhotoChoice[] = [];

  while (choices.length < count) {
    const seed = Math.floor(Math.random() * PHOTOS_MAX_PICSUM_SEED) + 1;
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
  const [isReadyForScrollRestore, setIsReadyForScrollRestore] = useState(false);
  const [editPhotoChoices, setEditPhotoChoices] = useState<PhotoChoice[]>([]);
  const [addPhotoChoices, setAddPhotoChoices] = useState(createPhotoChoices);
  const [pendingPhotoIds, setPendingPhotoIds] = useState<number[]>([]);
  const { items: albums } = useCachedUserResources<Album>("albums");
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadedAlbumIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { user: activeUser } = useUser();
  const [page, setPage] = useState(1);
  const { albumId } = useParams();
  const navigate = useNavigate();
  const parsedAlbumId = Number(albumId);
  const selectedAlbumId =
    Number.isInteger(parsedAlbumId) && parsedAlbumId > 0
      ? parsedAlbumId
      : albums[0]?.id;
  const album = albums.find(
    (currentAlbum) => currentAlbum.id === selectedAlbumId,
  );

  const currentUserId = activeUser?.id ?? 0;
  const albumPageKey = `photos:album:${selectedAlbumId ?? "none"}`;
  const uiStateKey = `entrybase:ui:v1:user:${currentUserId}:page:${albumPageKey}`;
  const scrollKey = `entrybase:scroll:v1:user:${currentUserId}:page:${albumPageKey}`;
  const [uiState, setUiState] = usePersistentState<PhotosUiState>(uiStateKey, {
    search: "",
    newTitle: "",
    selectedAddPhotoUrl: "",
    editingPhotoId: null,
    draftTitle: "",
    draftPhotoUrl: "",
    loadedPages: 1,
  });

  usePersistentScroll(
    scrollKey,
    Boolean(activeUser),
    isReadyForScrollRestore && !isLoading,
  );

  const visiblePhotos = photos.filter((photo) => {
    const query = uiState.search.toLowerCase().trim();
    return (
      String(photo.id).includes(query) ||
      photo.title.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (uiState.selectedAddPhotoUrl || !addPhotoChoices.length) {
      return;
    }
    setUiState((currentState) => ({
      ...currentState,
      selectedAddPhotoUrl: addPhotoChoices[0]?.url ?? "",
    }));
  }, [addPhotoChoices, uiState.selectedAddPhotoUrl, setUiState]);

  useEffect(() => {
    if (!album) {
      loadedAlbumIdRef.current = null;
      return;
    }

    if (loadedAlbumIdRef.current === album.id) {
      return;
    }
    loadedAlbumIdRef.current = album.id;

    let isCurrent = true;
    const targetAlbumId = album.id;
    const pagesToLoad = Math.min(
      Math.max(1, uiState.loadedPages),
      PHOTOS_MAX_RESTORED_PAGES,
    );

    async function loadInitialPhotos() {
      setIsReadyForScrollRestore(false);
      setIsLoading(true);

      try {
        const pageRequests = Array.from({ length: pagesToLoad }, (_, index) =>
          getPhotosForAlbum(targetAlbumId, index + 1, PHOTOS_PER_BATCH));
        const photoPages = await Promise.all(pageRequests);
        const mergedPhotos = photoPages.flat();
        const lastPage = photoPages[photoPages.length - 1] ?? [];

        if (isCurrent) {
          setPhotos(mergedPhotos);
          setPage(pagesToLoad);
          setHasMorePhotos(lastPage.length === PHOTOS_PER_BATCH);
        }
      } catch {
        return;
      } finally {
        if (isCurrent) {
          setIsLoading(false);
          setIsReadyForScrollRestore(true);
        }
      }
    }

    void loadInitialPhotos();

    return () => {
      isCurrent = false;
    };
  }, [album, uiState.loadedPages]);

  useEffect(() => {
    setUiState((currentState) => {
      if (currentState.editingPhotoId == null) {
        return currentState;
      }
      if (photos.some((photo) => photo.id === currentState.editingPhotoId)) {
        return currentState;
      }
      return {
        ...currentState,
        editingPhotoId: null,
        draftTitle: "",
        draftPhotoUrl: "",
      };
    });
  }, [photos, setUiState]);

  const hydratedEditPhotoChoices = useMemo(() => {
    if (uiState.editingPhotoId == null || editPhotoChoices.length > 0) {
      return [] as PhotoChoice[];
    }
    const editingPhoto = photos.find(
      (photo) => photo.id === uiState.editingPhotoId,
    );
    const preservedUrl = uiState.draftPhotoUrl || editingPhoto?.url || "";
    const fallbackChoices = createPhotoChoices(PHOTO_CHOICES - 1);
    return preservedUrl
      ? [
          { seed: uiState.editingPhotoId, url: preservedUrl },
          ...fallbackChoices,
        ]
      : fallbackChoices;
  }, [
    uiState.draftPhotoUrl,
    editPhotoChoices.length,
    uiState.editingPhotoId,
    photos,
  ]);

  const loadMorePhotos = useCallback(async () => {
    if (!album || isLoading || !hasMorePhotos) {
      return;
    }

    const nextPage = page + 1;
    setIsLoading(true);

    try {
      const nextPhotos = await getPhotosForAlbum(
        album.id,
        nextPage,
        PHOTOS_PER_BATCH,
      );

      setPhotos((currentPhotos) => [...currentPhotos, ...nextPhotos]);
      setPage(nextPage);
      setHasMorePhotos(nextPhotos.length === PHOTOS_PER_BATCH);
      setUiState((currentState) => ({
        ...currentState,
        loadedPages: Math.min(nextPage, PHOTOS_MAX_RESTORED_PAGES),
      }));
    } catch {
      return;
    } finally {
      setIsLoading(false);
    }
  }, [album, hasMorePhotos, isLoading, page, setUiState]);

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
          onClick={() => navigate(`/users/${currentUserId}/albums`)}
        >
          Back to Albums
        </Button>
      </section>
    );
  }

  const addPhoto: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = uiState.newTitle.trim();
    if (!title || !uiState.selectedAddPhotoUrl) return;

    try {
      const photo = await createPhoto({
        albumId: album.id,
        title,
        url: uiState.selectedAddPhotoUrl,
      });

      setPhotos((currentPhotos) => [photo, ...currentPhotos]);
      setUiState((currentState) => ({
        ...currentState,
        newTitle: "",
      }));
      const nextChoices = createPhotoChoices();
      setAddPhotoChoices(nextChoices);
      setUiState((currentState) => ({
        ...currentState,
        selectedAddPhotoUrl: nextChoices[0]?.url ?? "",
      }));
    } catch {
      return;
    }
  };

  const refreshAddPhotoChoices = () => {
    const nextChoices = createPhotoChoices();
    setAddPhotoChoices(nextChoices);
    setUiState((currentState) => ({
      ...currentState,
      selectedAddPhotoUrl: nextChoices[0]?.url ?? "",
    }));
  };

  const startEditingPhoto = (photo: Photo) => {
    const nextChoices = [
      { seed: photo.id, url: photo.url },
      ...createPhotoChoices(PHOTO_CHOICES - 1),
    ];
    setEditPhotoChoices(nextChoices);
    setUiState((currentState) => ({
      ...currentState,
      editingPhotoId: photo.id,
      draftTitle: photo.title,
      draftPhotoUrl: photo.url,
    }));
  };

  const cancelEditingPhoto = () => {
    setEditPhotoChoices([]);
    setUiState((currentState) => ({
      ...currentState,
      editingPhotoId: null,
      draftTitle: "",
      draftPhotoUrl: "",
    }));
  };

  const refreshEditPhotoChoices = () => {
    const nextChoices = createPhotoChoices();
    setEditPhotoChoices(nextChoices);
    setUiState((currentState) => ({
      ...currentState,
      draftPhotoUrl: nextChoices[0]?.url ?? "",
    }));
  };

  const savePhotoTitle = async (photo: Photo) => {
    const title = uiState.draftTitle.trim();
    if (!title || !uiState.draftPhotoUrl || pendingPhotoIds.includes(photo.id))
      return;

    try {
      setPendingPhotoIds((currentIds) => [...currentIds, photo.id]);
      const updatedPhoto = await updatePhoto(photo.id, {
        title,
        url: uiState.draftPhotoUrl,
      });

      setPhotos((currentPhotos) =>
        currentPhotos.map((currentPhoto) =>
          currentPhoto.id === photo.id ? updatedPhoto : currentPhoto));
      cancelEditingPhoto();
    } catch {
      return;
    } finally {
      setPendingPhotoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== photo.id));
    }
  };

  const removePhoto = async (photo: Photo) => {
    if (pendingPhotoIds.includes(photo.id)) return;

    try {
      setPendingPhotoIds((currentIds) => [...currentIds, photo.id]);
      await deletePhoto(photo.id);
      setPhotos((currentPhotos) =>
        currentPhotos.filter((currentPhoto) => currentPhoto.id !== photo.id));
      if (uiState.editingPhotoId === photo.id) {
        cancelEditingPhoto();
      }
    } catch {
      return;
    } finally {
      setPendingPhotoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== photo.id));
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
          value={uiState.search}
          onChange={(value) =>
            setUiState((currentState) => ({
              ...currentState,
              search: value,
            }))
          }
          placeholder="Search photo id or title"
        />
        <Button
          variant="secondary"
          onClick={() => navigate(`/users/${currentUserId}/albums`)}
        >
          Back to Albums
        </Button>
      </Toolbar>
      <form className="inline-form" onSubmit={addPhoto}>
        <input
          value={uiState.newTitle}
          onChange={(event) =>
            setUiState((currentState) => ({
              ...currentState,
              newTitle: event.target.value,
            }))
          }
          placeholder="New photo title"
        />
        <Button
          type="submit"
          disabled={!uiState.newTitle.trim() || !uiState.selectedAddPhotoUrl}
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
                choice.url === uiState.selectedAddPhotoUrl
                  ? "photo-choice selected"
                  : "photo-choice"
              }
              key={choice.seed}
              type="button"
              onClick={() =>
                setUiState((currentState) => ({
                  ...currentState,
                  selectedAddPhotoUrl: choice.url,
                }))
              }
              aria-label={`Choose photo seed ${choice.seed}`}
            >
              <img src={choice.url} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </section>
      <div className="photo-grid">
        {isLoading && !photos.length && (
          <EmptyState message="Loading photos..." />
        )}
        {visiblePhotos.map((photo) => {
          const isPending = pendingPhotoIds.includes(photo.id);
          const isEditing = uiState.editingPhotoId === photo.id;

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
                      value={uiState.draftTitle}
                      onChange={(event) =>
                        setUiState((currentState) => ({
                          ...currentState,
                          draftTitle: event.target.value,
                        }))
                      }
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
                      {(editPhotoChoices.length
                        ? editPhotoChoices
                        : hydratedEditPhotoChoices
                      ).map((choice) => (
                        <button
                          className={
                            choice.url === uiState.draftPhotoUrl
                              ? "photo-choice selected"
                              : "photo-choice"
                          }
                          key={`${photo.id}-${choice.seed}-${choice.url}`}
                          type="button"
                          onClick={() =>
                            setUiState((currentState) => ({
                              ...currentState,
                              draftPhotoUrl: choice.url,
                            }))
                          }
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
                          isPending ||
                          !uiState.draftTitle.trim() ||
                          !uiState.draftPhotoUrl
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
