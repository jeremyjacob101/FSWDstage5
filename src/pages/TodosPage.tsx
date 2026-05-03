import { useState } from "react";
import type { ComponentProps } from "react";
import { mockUser } from "../data/data";
import type { Todo } from "../data/types";
import {
  Button,
  EmptyState,
  ScreenHeader,
  SearchInput,
  Toolbar,
} from "../components/ui";
import { nextId } from "./utils/pages";

export function TodosPage({
  todos,
  setTodos,
}: {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "title" | "completed">("id");
  const [newTitle, setNewTitle] = useState("");

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

  const addTodo: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setTodos((currentTodos) => [
      {
        id: nextId(currentTodos),
        userId: mockUser.id,
        title,
        completed: false,
      },
      ...currentTodos,
    ]);
    setNewTitle("");
  };

  const editTodo = (todo: Todo) => {
    const title = window.prompt("Update todo title", todo.title)?.trim();
    if (!title) return;

    setTodos((currentTodos) =>
      currentTodos.map((currentTodo) =>
        currentTodo.id === todo.id ? { ...currentTodo, title } : currentTodo,
      ),
    );
  };

  return (
    <section className="screen-stack">
      <ScreenHeader
        title="Todos"
        description="Search, sort, and update your active task list."
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search id, title, status"
        />
        <label className="select-label">
          Sort
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
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
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="New todo title"
        />
        <Button type="submit">New Todo</Button>
      </form>
      <div className="list-grid">
        {visibleTodos.map((todo) => (
          <article className="todo-row" key={todo.id}>
            <span className="id-badge">#{todo.id}</span>
            <label className="check-label">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() =>
                  setTodos((currentTodos) =>
                    currentTodos.map((currentTodo) =>
                      currentTodo.id === todo.id
                        ? { ...currentTodo, completed: !currentTodo.completed }
                        : currentTodo,
                    ),
                  )
                }
              />
              <span>{todo.title}</span>
            </label>
            <div className="row-actions">
              <Button variant="secondary" onClick={() => editTodo(todo)}>
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  setTodos((currentTodos) =>
                    currentTodos.filter(
                      (currentTodo) => currentTodo.id !== todo.id,
                    ),
                  )
                }
              >
                Delete
              </Button>
            </div>
          </article>
        ))}
        {!visibleTodos.length && (
          <EmptyState message="No todos match that search." />
        )}
      </div>
    </section>
  );
}
