import { useNavigate } from "react-router-dom";
import { useCachedUserResources } from "../hooks/useCachedUserResources";
import type { Album } from "../data/types";
import { useUser } from "../context/useUser";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { usePersistentState } from "../hooks/usePersistentState";
import { Button, EmptyState, ScreenHeader, SearchInput, Toolbar } from "../components/ui";
import { createAlbum } from "../api/api";

type AlbumsUiState = {
  search: string;
  newTitle: string;
};

const DEFAULT_ALBUMS_UI_STATE: AlbumsUiState = {
  search: "",
  newTitle: "",
};

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
  const [uiState, setUiState] = usePersistentState<AlbumsUiState>(
    uiStateKey,
    DEFAULT_ALBUMS_UI_STATE,
  );
  usePersistentScroll(scrollKey, Boolean(activeUser), !isLoading);

  if (!activeUser) {
    return null;
  }

  const { search, newTitle } = uiState;

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
          value={search}
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
          value={newTitle}
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
