import { Button, EmptyState, ScreenHeader, SearchInput, Toolbar } from "../components/Shared";
import { useCachedUserResources } from "../hooks/useCachedUserResources";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { usePersistentState } from "../hooks/usePersistentState";
import { createTodo, deleteTodo, updateTodo } from "../api/api";
import type { TodosUiState } from "../types/state";
import type { TodoSort } from "../types/page";
import type { Todo } from "../types/general";
import { useUser } from "../context/user";
import { useEffect, useState } from "react";

export function TodosPage() {
  const {
    items: todos,
    setItems: setTodos,
    isLoading,
  } = useCachedUserResources<Todo>("todos");

  const { user: activeUser } = useUser();
  const [pendingTodoIds, setPendingTodoIds] = useState<number[]>([]);
  const [isCreatingTodo, setIsCreatingTodo] = useState(false);

  const currentUserId = activeUser?.id ?? 0;
  const uiStateKey = `entrybase:ui:v1:user:${currentUserId}:page:todos`;
  const scrollKey = `entrybase:scroll:v1:user:${currentUserId}:page:todos`;
  const [uiState, setUiState] = usePersistentState<TodosUiState>(uiStateKey, {
    search: "",
    sortBy: "id",
    newTitle: "",
    editingTodoId: null,
    draftTitle: "",
  });

  usePersistentScroll(scrollKey, Boolean(activeUser), !isLoading);

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
    if (uiState.editingTodoId == null) {
      return;
    }
    if (todos.some((todo) => todo.id === uiState.editingTodoId)) {
      return;
    }
    setUiState((currentState) => ({
      ...currentState,
      editingTodoId: null,
      draftTitle: "",
    }));
  }, [uiState.editingTodoId, setUiState, todos]);

  const query = uiState.search.toLowerCase().trim();
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
      if (uiState.sortBy === "title")
        return first.title.localeCompare(second.title);
      if (uiState.sortBy === "completed")
        return Number(first.completed) - Number(second.completed);
      return first.id - second.id;
    });

  const addTodo: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = uiState.newTitle.trim();
    if (!title || isCreatingTodo) return;

    try {
      setIsCreatingTodo(true);
      const todo = await createTodo({
        userId: currentUserId,
        title,
        completed: false,
      });

      setTodos((currentTodos) => [todo, ...currentTodos]);
      setUiField("newTitle", "");
    } catch {
      return;
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
  };

  const cancelEditingTodo = () => {
    setUiState((currentState) => ({
      ...currentState,
      editingTodoId: null,
      draftTitle: "",
    }));
  };

  const saveTodoTitle = async (todo: Todo) => {
    const title = uiState.draftTitle.trim();
    if (!title || pendingTodoIds.includes(todo.id)) return;

    try {
      setPendingTodoIds((currentIds) => [...currentIds, todo.id]);
      const updatedTodo = await updateTodo(todo.id, {
        title,
        completed: todo.completed,
      });

      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === todo.id ? updatedTodo : currentTodo));
      cancelEditingTodo();
    } catch {
      return;
    } finally {
      setPendingTodoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== todo.id));
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (pendingTodoIds.includes(todo.id)) return;

    try {
      setPendingTodoIds((currentIds) => [...currentIds, todo.id]);
      const updatedTodo = await updateTodo(todo.id, {
        title: todo.title,
        completed: !todo.completed,
      });

      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === todo.id ? updatedTodo : currentTodo));
    } catch {
      return;
    } finally {
      setPendingTodoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== todo.id));
    }
  };

  const removeTodo = async (todo: Todo) => {
    if (pendingTodoIds.includes(todo.id)) return;

    try {
      setPendingTodoIds((currentIds) => [...currentIds, todo.id]);
      await deleteTodo(todo.id);
      setTodos((currentTodos) =>
        currentTodos.filter((currentTodo) => currentTodo.id !== todo.id));
      if (uiState.editingTodoId === todo.id) {
        cancelEditingTodo();
      }
    } catch {
      return;
    } finally {
      setPendingTodoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== todo.id));
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
          value={uiState.search}
          onChange={(value) => setUiField("search", value)}
          placeholder="Search id, title, status"
        />
        <label className="select-label">
          Sort
          <select
            value={uiState.sortBy}
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
          value={uiState.newTitle}
          onChange={(event) => setUiField("newTitle", event.target.value)}
          placeholder="New todo title"
          disabled={isCreatingTodo}
        />
        <Button type="submit" disabled={isCreatingTodo}>
          {isCreatingTodo ? "Adding..." : "New Todo"}
        </Button>
      </form>
      <div className="list-grid">
        {isLoading && <EmptyState message="Loading todos..." />}
        {visibleTodos.map((todo) => {
          const isPending = pendingTodoIds.includes(todo.id);
          const isEditing = uiState.editingTodoId === todo.id;

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
                    value={uiState.draftTitle}
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
                      disabled={isPending || !uiState.draftTitle.trim()}
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
