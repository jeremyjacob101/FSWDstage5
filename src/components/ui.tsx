import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="screen-header">
      <div>
        <p className="eyebrow">EntryBase</p>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-input">
      Search
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Button({
  children,
  type = "button",
  variant = "primary",
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
}) {
  return (
    <button type={type} className={`button ${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}
