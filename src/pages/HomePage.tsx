import { useNavigate } from "react-router-dom";
import type { User } from "../data/types";
import { Button } from "../components/ui";

export function HomePage({ activeUser }: { activeUser: User }) {
  const navigate = useNavigate();

  return (
    <section className="screen-stack">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Logged in as @{activeUser.username}</p>
          <h2>Welcome, {activeUser.name}</h2>
          <p>
            Keep tasks, writing, albums, and reference photos close at hand
            without losing the thread of your day.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Todos"
          description="Track active work, sort priorities, and mark progress as it happens."
          onClick={() => navigate(`/users/${activeUser.id}/todos`)}
        />
        <DashboardCard
          title="Posts"
          description="Draft updates, review details, and keep discussion attached to the work."
          onClick={() => navigate(`/users/${activeUser.id}/posts`)}
        />
        <DashboardCard
          title="Albums"
          description="Collect visual references and open focused galleries when you need them."
          onClick={() => navigate(`/users/${activeUser.id}/albums`)}
        />
      </div>
    </section>
  );
}

function DashboardCard({
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
