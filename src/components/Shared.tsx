import type { User } from "../types/general";
import { NavLink } from "react-router-dom";
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
  disabled = false,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      className={`button ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}

export function NavBar({
  user,
  onInfo,
  onLogout,
}: {
  user: User;
  onInfo: () => void;
  onLogout: () => void;
}) {
  return (
    <nav className="nav-bar" aria-label="EntryBase sections">
      <NavLink to="/home" className="nav-brand" aria-label="EntryBase home">
        <span className="brand-mark">EB</span>
      </NavLink>
      <div className="nav-links">
        <button type="button" onClick={onInfo}>
          Info
        </button>
        <NavLink
          to={`/users/${user.id}/todos`}
          className={({ isActive }) => (isActive ? "active" : undefined)}
          end
        >
          Todos
        </NavLink>
        <NavLink
          to={`/users/${user.id}/posts`}
          className={({ isActive }) => (isActive ? "active" : undefined)}
          end
        >
          Posts
        </NavLink>
        <NavLink
          to={`/users/${user.id}/albums`}
          className={({ isActive }) => (isActive ? "active" : undefined)}
          end
        >
          Albums
        </NavLink>
      </div>
      <div className="nav-user-area">
        <button type="button" onClick={onLogout}>
          Logout
        </button>
        <span className="user-pill nav-user">{user.name}</span>
      </div>
    </nav>
  );
}

export function DashboardCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <article className="dashboard-card">
      <div>
        <span className="card-icon">{title.slice(0, 1)}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <Button onClick={onClick}>Open {title}</Button>
    </article>
  );
}

export function InfoModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Active user info</p>
            <h2>{user.name}</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <dl className="info-list">
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user.phone}</dd>
          </div>
          <div>
            <dt>Website</dt>
            <dd>{user.website}</dd>
          </div>
          <div>
            <dt>Company</dt>
            <dd>{user.company.name}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>
              {user.address.street}, {user.address.suite}, {user.address.city}{" "}
              {user.address.zipcode}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
