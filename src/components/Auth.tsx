import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router-dom";
import { mockUser } from "../data/data";
import type { User } from "../data/types";
import { authenticateUser } from "../services/api";
import "./Auth.css";

type AuthProps = {
  onLogin: (user: User) => void;
};

export function LoginScreen({ onLogin }: AuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    setError("");

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await authenticateUser({
        username: cleanUsername,
        password,
      });

      if (user) {
        onLogin(user);
        return;
      }

      setError("We could not sign you in with those credentials.");
    } catch {
      setError("Could not reach the local server. Please start JSON-Server and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="EntryBase"
      subtitle="Organize your work, notes, collections, and media in one calm workspace."
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in</h1>
          <p className="muted">Use your EntryBase account credentials.</p>
        </div>
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <AuthError message={error} />}
        <button type="submit" className="button primary" disabled={isSubmitting}>
          {isSubmitting ? "Checking..." : "Login"}
        </button>
        <Link to="/register" className="text-button">
          Create an account
        </Link>
      </form>
    </AuthLayout>
  );
}

export function RegisterScreen({ onLogin }: AuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();

    if (!username.trim() || !password || !verifyPassword) {
      setError("Please fill in every field.");
      return;
    }

    if (password !== verifyPassword) {
      setError("Passwords need to match.");
      return;
    }

    onLogin({
      ...mockUser,
      id: 99,
      name: username,
      username,
      email: `${username.toLowerCase()}@entrybase.local`,
      website: password,
    });
  };

  return (
    <AuthLayout
      title="EntryBase"
      subtitle="Create your workspace and start keeping daily work in order."
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">First visit</p>
          <h1>Register</h1>
          <p className="muted">Set up your EntryBase sign-in details.</p>
        </div>
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Password verify
          <input
            type="password"
            value={verifyPassword}
            onChange={(event) => setVerifyPassword(event.target.value)}
          />
        </label>
        {error && <AuthError message={error} />}
        <button type="submit" className="button primary">
          Create Account
        </button>
        <Link to="/login" className="text-button">
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <span className="brand-mark">EB</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </section>
      {children}
    </main>
  );
}

function AuthError({ message }: { message: string }) {
  return <p className="error-state">{message}</p>;
}
