
# Database Server

## Start the server

```
npm run database-server
```

Starts a local REST API server on port 3001. json-server watches `db.json` for changes and reloads automatically.

Triggers the following script in `package.json`:

`"database-server": "json-server ./database-server/db.json --port 3001 --routes ./database-server/routes.json"`

## Custom Routes

Defined in `routes.json`:

| Route | Maps to | Method | Description |
|-------|---------|--------|-------------|
| `/login` | `/users` | `POST` | Fetch user by username for client-side auth |
| `/register` | `/users` | `POST` | Create a new user |

