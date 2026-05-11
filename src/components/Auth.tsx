import { authenticateUser, completeUserDetails, createRegisteredUser, findUserByUsername } from "../api/api";
import type { User } from "../types/general";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useState } from "react";

export function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
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

      setError("Incorrect username or password.");
    } catch {
      setError("Login failed. Please try again.");
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
        <button
          type="submit"
          className="button primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Checking..." : "Login"}
        </button>
        <Link to="/register" className="text-button">
          Create an account
        </Link>
      </form>
    </AuthLayout>
  );
}

export function RegisterScreen({
  onRegistered,
}: {
  onRegistered: (user: User) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    setError("");
    const cleanUsername = username.trim();

    if (!cleanUsername || !password || !verifyPassword) {
      setError("Please fill in every field.");
      return;
    }

    if (password !== verifyPassword) {
      setError("Passwords need to match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const existingUser = await findUserByUsername(cleanUsername);

      if (existingUser) {
        setError("That username already exists. Please choose another one.");
        return;
      }

      const createdUser = await createRegisteredUser({
        username: cleanUsername,
        password,
      });

      onRegistered(createdUser);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        <button
          type="submit"
          className="button primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>
        <Link to="/login" className="text-button">
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}

export function CompleteRegistrationScreen({
  pendingUser,
  onLogin,
}: {
  pendingUser: User | null;
  onLogin: (user: User) => void;
}) {
  const [name, setName] = useState(pendingUser?.name ?? "");
  const [email, setEmail] = useState(pendingUser?.email ?? "");
  const [phone, setPhone] = useState(pendingUser?.phone ?? "");
  const [street, setStreet] = useState(pendingUser?.address.street ?? "");
  const [suite, setSuite] = useState(pendingUser?.address.suite ?? "");
  const [city, setCity] = useState(pendingUser?.address.city ?? "");
  const [zipcode, setZipcode] = useState(pendingUser?.address.zipcode ?? "");
  const [companyName, setCompanyName] = useState(
    pendingUser?.company.name ?? "",
  );
  const [catchPhrase, setCatchPhrase] = useState(
    pendingUser?.company.catchPhrase ?? "",
  );
  const [business, setBusiness] = useState(pendingUser?.company.bs ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    setError("");

    if (!pendingUser) {
      setError("Please start registration again.");
      return;
    }

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !street.trim() ||
      !suite.trim() ||
      !city.trim() ||
      !zipcode.trim() ||
      !companyName.trim()
    ) {
      setError("Please fill in all required details.");
      return;
    }

    try {
      setIsSubmitting(true);
      const completedUser = await completeUserDetails(pendingUser.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: {
          street: street.trim(),
          suite: suite.trim(),
          city: city.trim(),
          zipcode: zipcode.trim(),
        },
        company: {
          name: companyName.trim(),
          catchPhrase: catchPhrase.trim(),
          bs: business.trim(),
        },
      });

      onLogin(completedUser);
    } catch {
      setError("Could not save your details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="EntryBase"
      subtitle="Finish your profile so the workspace can show your details."
    >
      <form className="auth-card details-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Almost there</p>
          <h1>Complete details</h1>
          <p className="muted">Add the required profile information.</p>
        </div>
        {!pendingUser && (
          <AuthError message="Please start registration again." />
        )}
        <label>
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Street
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
            />
          </label>
          <label>
            Suite
            <input
              value={suite}
              onChange={(event) => setSuite(event.target.value)}
            />
          </label>
          <label>
            City
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </label>
          <label>
            Zipcode
            <input
              value={zipcode}
              onChange={(event) => setZipcode(event.target.value)}
            />
          </label>
        </div>
        <label>
          Company name
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
        </label>
        <label>
          Company catchphrase
          <input
            value={catchPhrase}
            onChange={(event) => setCatchPhrase(event.target.value)}
          />
        </label>
        <label>
          Company business
          <input
            value={business}
            onChange={(event) => setBusiness(event.target.value)}
          />
        </label>
        {error && <AuthError message={error} />}
        <button
          type="submit"
          className="button primary"
          disabled={isSubmitting || !pendingUser}
        >
          {isSubmitting ? "Saving..." : "Finish Registration"}
        </button>
        <Link to="/register" className="text-button">
          Back to register
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
