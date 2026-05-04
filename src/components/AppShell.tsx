import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { User } from "../data/types";
import { Button } from "./ui";

export function AppShell({
  activeUser,
  onLogout,
  notice,
}: {
  activeUser: User;
  onLogout: () => void;
  notice?: string;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="app-shell">
      <NavBar
        activeUser={activeUser}
        onInfo={() => setInfoOpen(true)}
        onLogout={onLogout}
      />
      <main className="page-content">
        {notice && <p className="error-state page-notice">{notice}</p>}
        <Outlet />
      </main>
      {infoOpen && (
        <InfoModal user={activeUser} onClose={() => setInfoOpen(false)} />
      )}
    </div>
  );
}

function NavBar({
  activeUser,
  onInfo,
  onLogout,
}: {
  activeUser: User;
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
          to={`/users/${activeUser.id}/todos`}
          className={({ isActive }) => (isActive ? "active" : undefined)}
          end
        >
          Todos
        </NavLink>
        <NavLink
          to={`/users/${activeUser.id}/posts`}
          className={({ isActive }) => (isActive ? "active" : undefined)}
          end
        >
          Posts
        </NavLink>
        <NavLink
          to={`/users/${activeUser.id}/albums`}
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
        <span className="user-pill nav-user">{activeUser.name}</span>
      </div>
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
