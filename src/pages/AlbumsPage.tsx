import { Button, EmptyState, ScreenHeader, SearchInput, Toolbar } from "../components/Shared";
import { useCachedUserResources } from "../hooks/useCachedUserResources";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { usePersistentState } from "../hooks/usePersistentState";
import type { AlbumsUiState } from "../types/state";
import { useNavigate } from "react-router-dom";
import type { Album } from "../types/general";
import { useUser } from "../context/user";
import { createAlbum } from "../api/api";

export function AlbumsPage() {
  const {
    items: albums,
    setItems: setAlbums,
    isLoading,
  } = useCachedUserResources<Album>("albums");
  const { user: activeUser } = useUser();
  const navigate = useNavigate();

  const currentUserId = activeUser?.id ?? 0;
  const uiStateKey = `entrybase:ui:v1:user:${currentUserId}:page:albums`;
  const scrollKey = `entrybase:scroll:v1:user:${currentUserId}:page:albums`;
  const [uiState, setUiState] = usePersistentState<AlbumsUiState>(uiStateKey, {
    search: "",
    newTitle: "",
  });

  usePersistentScroll(scrollKey, Boolean(activeUser), !isLoading);

  if (!activeUser) {
    return null;
  }

  const visibleAlbums = albums.filter((album) => {
    const query = uiState.search.toLowerCase().trim();
    return (
      String(album.id).includes(query) ||
      album.title.toLowerCase().includes(query)
    );
  });

  const addAlbum: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = uiState.newTitle.trim();
    if (!title) return;

    const album = await createAlbum({ userId: activeUser.id, title });
    setAlbums((currentAlbums) => [album, ...currentAlbums]);
    setUiState((currentState) => ({
      ...currentState,
      newTitle: "",
    }));
  };

  return (
    <section className="screen-stack">
      <ScreenHeader
        title="Albums"
        description="Search collections and open photo grids."
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
          placeholder="Search album id or title"
        />
      </Toolbar>
      <form className="inline-form" onSubmit={addAlbum}>
        <input
          value={uiState.newTitle}
          onChange={(event) =>
            setUiState((currentState) => ({
              ...currentState,
              newTitle: event.target.value,
            }))
          }
          placeholder="New album title"
        />
        <Button type="submit">New Album</Button>
      </form>
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
