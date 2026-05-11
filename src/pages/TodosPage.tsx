import { useEffect, useState } from "react";
import type { Todo } from "../data/types";
import { useCachedUserTodos } from "../hooks/useCachedUserResources";
import { useUser } from "../context/useUser";
import { buildScrollKey, buildUiStateKey } from "../hooks/persistenceKeys";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { usePersistentState } from "../hooks/usePersistentState";
import {
  Button,
  EmptyState,
  ScreenHeader,
  SearchInput,
  Toolbar,
} from "../components/ui";
import { createTodo, deleteTodo, updateTodo } from "../api/api";

type TodoSort = "id" | "title" | "completed";

type TodosUiState = {
  search: string;
  sortBy: TodoSort;
  newTitle: string;
  editingTodoId: number | null;
  draftTitle: string;
};

const DEFAULT_TODOS_UI_STATE: TodosUiState = {
  search: "",
  sortBy: "id",
  newTitle: "",
  editingTodoId: null,
  draftTitle: "",
};

export function TodosPage() {
  const { todos, setTodos, isLoading, loadError } = useCachedUserTodos();
  const { user: activeUser } = useUser();
  const [pendingTodoIds, setPendingTodoIds] = useState<number[]>([]);
  const [isCreatingTodo, setIsCreatingTodo] = useState(false);
  const [error, setError] = useState("");
  const currentUserId = activeUser?.id ?? 0;
  const uiStateKey = buildUiStateKey(currentUserId, "todos");
  const scrollKey = buildScrollKey(currentUserId, "todos");
  const [uiState, setUiState] = usePersistentState<TodosUiState>(
    uiStateKey,
    DEFAULT_TODOS_UI_STATE,
  );
  usePersistentScroll(scrollKey, Boolean(activeUser), !isLoading);

  const { search, sortBy, newTitle, editingTodoId, draftTitle } = uiState;

  const setUiField = <K extends keyof TodosUiState>(
    field: K,
    value: TodosUiState[K],
  ) => {
    setUiState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (editingTodoId == null) {
      return;
    }
    if (todos.some((todo) => todo.id === editingTodoId)) {
      return;
    }
    setUiState((currentState) => ({
      ...currentState,
      editingTodoId: null,
      draftTitle: "",
    }));
  }, [editingTodoId, setUiState, todos]);

  const query = search.toLowerCase().trim();
  const visibleTodos = [...todos]
    .filter((todo) => {
      const completedText = todo.completed
        ? "completed true done"
        : "incomplete false active";

      return (
        String(todo.id).includes(query) ||
        todo.title.toLowerCase().includes(query) ||
        completedText.includes(query)
      );
    })
    .sort((first, second) => {
      if (sortBy === "title") return first.title.localeCompare(second.title);
      if (sortBy === "completed")
        return Number(first.completed) - Number(second.completed);
      return first.id - second.id;
    });

  const addTodo: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title || isCreatingTodo) return;

    try {
      setError("");
      setIsCreatingTodo(true);
      const todo = await createTodo({
        userId: currentUserId,
        title,
        completed: false,
      });

      setTodos((currentTodos) => [todo, ...currentTodos]);
      setUiField("newTitle", "");
    } catch {
      setError("Could not create the todo. Please try again.");
    } finally {
      setIsCreatingTodo(false);
    }
  };

  const startEditingTodo = (todo: Todo) => {
    setUiState((currentState) => ({
      ...currentState,
      editingTodoId: todo.id,
      draftTitle: todo.title,
    }));
    setError("");
  };

  const cancelEditingTodo = () => {
    setUiState((currentState) => ({
      ...currentState,
      editingTodoId: null,
      draftTitle: "",
    }));
  };

  const saveTodoTitle = async (todo: Todo) => {
    const title = draftTitle.trim();
    if (!title || pendingTodoIds.includes(todo.id)) return;

    try {
      setError("");
      setPendingTodoIds((currentIds) => [...currentIds, todo.id]);
      const updatedTodo = await updateTodo(todo.id, {
        title,
        completed: todo.completed,
      });

      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === todo.id ? updatedTodo : currentTodo,
        ),
      );
      cancelEditingTodo();
    } catch {
      setError("Could not update the todo. Please try again.");
    } finally {
      setPendingTodoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== todo.id),
      );
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (pendingTodoIds.includes(todo.id)) return;

    try {
      setError("");
      setPendingTodoIds((currentIds) => [...currentIds, todo.id]);
      const updatedTodo = await updateTodo(todo.id, {
        title: todo.title,
        completed: !todo.completed,
      });

      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === todo.id ? updatedTodo : currentTodo,
        ),
      );
    } catch {
      setError("Could not update the todo status. Please try again.");
    } finally {
      setPendingTodoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== todo.id),
      );
    }
  };

  const removeTodo = async (todo: Todo) => {
    if (pendingTodoIds.includes(todo.id)) return;

    try {
      setError("");
      setPendingTodoIds((currentIds) => [...currentIds, todo.id]);
      await deleteTodo(todo.id);
      setTodos((currentTodos) =>
        currentTodos.filter((currentTodo) => currentTodo.id !== todo.id),
      );
      if (editingTodoId === todo.id) {
        cancelEditingTodo();
      }
    } catch {
      setError("Could not delete the todo. Please try again.");
    } finally {
      setPendingTodoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== todo.id),
      );
    }
  };

  if (!activeUser) {
    return null;
  }

  return (
    <section className="screen-stack">
      <ScreenHeader
        title="Todos"
        description="Search, sort, and update your active task list."
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(value) => setUiField("search", value)}
          placeholder="Search id, title, status"
        />
        <label className="select-label">
          Sort
          <select
            value={sortBy}
            onChange={(event) =>
              setUiField("sortBy", event.target.value as TodoSort)
            }
          >
            <option value="id">ID</option>
            <option value="title">Title</option>
            <option value="completed">Completion</option>
          </select>
        </label>
      </Toolbar>
      <form className="inline-form" onSubmit={addTodo}>
        <input
          value={newTitle}
          onChange={(event) => setUiField("newTitle", event.target.value)}
          placeholder="New todo title"
          disabled={isCreatingTodo}
        />
        <Button type="submit" disabled={isCreatingTodo}>
          {isCreatingTodo ? "Adding..." : "New Todo"}
        </Button>
      </form>
      {loadError && (
        <p className="error-state">
          Could not load todos. Please make sure JSON-Server is running.
        </p>
      )}
      {error && <p className="error-state">{error}</p>}
      <div className="list-grid">
        {isLoading && <EmptyState message="Loading todos..." />}
        {visibleTodos.map((todo) => {
          const isPending = pendingTodoIds.includes(todo.id);
          const isEditing = editingTodoId === todo.id;

          return (
            <article className="todo-row" key={todo.id}>
              <span className="id-badge">#{todo.id}</span>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => void toggleTodo(todo)}
                  disabled={isPending}
                />
                {isEditing ? (
                  <input
                    className="todo-edit-input"
                    value={draftTitle}
                    onChange={(event) =>
                      setUiField("draftTitle", event.target.value)
                    }
                    disabled={isPending}
                    aria-label={`Todo ${todo.id} title`}
                  />
                ) : (
                  <span>{todo.title}</span>
                )}
              </label>
              <div className="row-actions">
                {isEditing ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => void saveTodoTitle(todo)}
                      disabled={isPending || !draftTitle.trim()}
                    >
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={cancelEditingTodo}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => startEditingTodo(todo)}
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => void removeTodo(todo)}
                  disabled={isPending}
                >
                  {isPending ? "Working..." : "Delete"}
                </Button>
              </div>
            </article>
          );
        })}
        {!isLoading && !visibleTodos.length && (
          <EmptyState message="No todos match that search." />
        )}
      </div>
    </section>
  );
}
