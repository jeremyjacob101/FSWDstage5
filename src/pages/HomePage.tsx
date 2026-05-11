import { DashboardCard } from "../components/Shared";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/user";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <section className="screen-stack">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Logged in as @{user.username}</p>
          <h2>Welcome, {user.name}</h2>
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
          onClick={() => navigate(`/users/${user.id}/todos`)}
        />
        <DashboardCard
          title="Posts"
          description="Draft updates, review details, and keep discussion attached to the work."
          onClick={() => navigate(`/users/${user.id}/posts`)}
        />
        <DashboardCard
          title="Albums"
          description="Collect visual references and open focused galleries when you need them."
          onClick={() => navigate(`/users/${user.id}/albums`)}
        />
      </div>
    </section>
  );
}
