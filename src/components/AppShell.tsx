import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { User } from "../data/types";
import { Button } from "./ui";

export function AppShell({
  activeUser,
  onLogout,
}: {
  activeUser: User;
  onLogout: () => void;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="app-shell">
      <Header
        user={activeUser}
        onInfo={() => setInfoOpen(true)}
        onLogout={onLogout}
      />
      <NavBar onLogout={onLogout} />
      <main className="page-content">
        <Outlet />
      </main>
      {infoOpen && (
        <InfoModal user={activeUser} onClose={() => setInfoOpen(false)} />
      )}
    </div>
  );
}

function Header({
  user,
  onInfo,
  onLogout,
}: {
  user: User;
  onInfo: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="app-header">
      <div className="header-title">
        <span className="brand-mark">EB</span>
        <div>
          <p className="eyebrow">Personal workspace</p>
          <h1>EntryBase</h1>
        </div>
      </div>
      <div className="header-actions">
        <span className="user-pill">{user.name}</span>
        <Button variant="secondary" onClick={onInfo}>
          Info
        </Button>
        <Button variant="ghost" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

function NavBar({ onLogout }: { onLogout: () => void }) {
  const navItems = [
    { label: "Home", to: "/home" },
    { label: "Todos", to: "/todos" },
    { label: "Posts", to: "/posts" },
    { label: "Albums", to: "/albums" },
  ];

  return (
    <nav className="nav-bar" aria-label="EntryBase sections">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? "active" : undefined)}
          end
        >
          {item.label}
        </NavLink>
      ))}
      <button type="button" onClick={onLogout}>
        Logout
      </button>
    </nav>
  );
}

function InfoModal({ user, onClose }: { user: User; onClose: () => void }) {
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
