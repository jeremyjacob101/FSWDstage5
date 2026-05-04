
# API Endpoints 

Based off the following [repo](https://github.com/typicode/json-server/tree/v0.17.4#full-text-search) 

## Login

- `GET /login?username={username}`
- Body: none
- Response: `[{ ID, name, username, website, email }]`
- Errors: empty array if username not found

> Note: Password checking is handled client-side. Fetch the user by username, then compare the `website` field to the entered password.

## Register

- `POST /register`
- Body: `{ username, password }`
- Response: newly created user object
- Errors: 409 if username is already taken

> Note: password verify is client-side only—don't send it to the server.

## Complete Registration

- `PATCH /users/{id}`
- Body: `{ name, email, phone, address, company }`
- Response: updated user object

## Todos

Get todos for the current user:
- `GET /todos?userId={currentUserId}`
- Body: none
- Response: `[{ id, userId, title, completed }]`

Sort todos by ID, title, or completion status:
- Body: none
- Response: `[{ id, userId, title, completed }]`
```
GET /todos?_sort=id&_order=asc
GET /todos?_sort=title&_order=asc
GET /todos?_sort=completed&_order=asc
```

Search todos:
- Body: none
- Response: `[{ id, userId, title, completed }]`
```
GET /todos?userId={userId}&q={searchQuery}
GET /todos?userId={userId}&id_like={searchQuery}
GET /todos?userId={userId}&title_like={searchQuery}
GET /todos?userId={userId}&completed_like={searchQuery}
```

Add a todo:
- `POST /todos`
- Body: `{ userId, title, completed }`
- Response: `{ id, userId, title, completed }`

Delete a todo:
- `DELETE /todos/{id}`
- Body: none
- Response: 204 No Content

Update todo content:
- `PATCH /todos/{id}`
- Body: `{ title }`
- Response: `{ id, userId, title, completed }`

Update todo status:
- `PATCH /todos/{id}`
- Body: `{ completed }`
- Response: `{ id, userId, title, completed }`

## Posts

Get posts for the current user:
- `GET /posts?userId={userId}`
- Body: none
- Response: `[{ id, userId, title, body }]`

Search posts:
- Body: none
- Response: `[{ id, userId, title, body }]`
```
GET /posts?userId={userId}&q={searchQuery}
GET /posts?userId={userId}&id_like={searchQuery}
GET /posts?userId={userId}&title_like={searchQuery}
```

Add a post:
- `POST /posts`
- Body: `{ userId, title, body }`
- Response: `{ id, userId, title, body }`

Update post content:
- `PATCH /posts/{id}`
- Body: `{ title, body }`
- Response: `{ id, userId, title, body }`

Delete a post:
- `DELETE /posts/{id}`
- Body: none
- Response: 204 No Content

## Comments

Get comments for a post:
- `GET /comments?postId={postId}`
- Body: none
- Response: `[{ id, postId, name, email, body }]`

Add a comment:
- `POST /comments`
- Body: `{ postId, name, email, body }`
- Response: `{ id, postId, name, email, body }`

Update a comment:
- `PATCH /comments/{id}`
- Body: `{ body }`
- Response: `{ id, postId, name, email, body }`

Delete a comment:
- `DELETE /comments/{id}`
- Body: none
- Response: 204 No Content

> Note: Ownership is handled client-side. When a comment is added, the client sets `ownedByCurrentUser: true` locally. Edit and delete controls are only shown when that flag is true.

## Albums

Get albums for the current user:
- `GET /albums?userId={userId}`
- Body: none
- Response: `[{ id, userId, title }]`

Search albums:
- Body: none
- Response: `[{ id, userId, title }]`
```
GET /albums?userId={userId}&q={searchQuery}
GET /albums?userId={userId}&id_like={searchQuery}
GET /albums?userId={userId}&title_like={searchQuery}
```

Add an album:
- `POST /albums`
- Body: `{ userId, title }`
- Response: `{ id, userId, title }`

## Photos

Get a page of photos for an album:
- `GET /photos?albumId={albumId}&_page={page}&_limit={limit}`
- Body: none
- Response: `[{ id, albumId, title, url }]`

> Note: Use `_page=1&_limit=8` for the first batch, increment `_page` on each "load more" click. The response `Link` header includes `first`, `prev`, `next`, and `last` page URLs.

Add a photo:
- `POST /photos`
- Body: `{ albumId, title, url }`
- Response: `{ id, albumId, title, url }`

Update photo title:
- `PATCH /photos/{id}`
- Body: `{ title }`
- Response: `{ id, albumId, title, url }`

Delete a photo:
- `DELETE /photos/{id}`
- Body: none
- Response: 204 No Content



