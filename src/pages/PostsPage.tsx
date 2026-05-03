import { useState } from "react";
import type { ComponentProps } from "react";
import type { Comment, Post } from "../data/types";
import {
  Button,
  EmptyState,
  ScreenHeader,
  SearchInput,
  Toolbar,
} from "../components/ui";
import { nextId } from "../utils/ids";

export function PostsPage({
  posts,
  setPosts,
  comments,
  setComments,
}: {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}) {
  const [search, setSearch] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | undefined>(
    posts[0]?.id,
  );

  const selectedPost =
    posts.find((post) => post.id === selectedPostId) ?? posts[0];

  const visiblePosts = posts.filter((post) => {
    const query = search.toLowerCase().trim();
    return (
      String(post.id).includes(query) ||
      post.title.toLowerCase().includes(query)
    );
  });

  const addComment: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    const body = newComment.trim();
    if (!body || !selectedPost) return;

    setComments((currentComments) => [
      ...currentComments,
      {
        id: nextId(currentComments),
        postId: selectedPost.id,
        name: "Workspace note",
        email: "bret@entrybase.local",
        body,
        ownedByCurrentUser: true,
      },
    ]);
    setNewComment("");
    setShowComments(true);
  };

  const editPost = (post: Post) => {
    const title = window.prompt("Update post title", post.title)?.trim();
    if (!title) return;
    setPosts((currentPosts) =>
      currentPosts.map((currentPost) =>
        currentPost.id === post.id ? { ...currentPost, title } : currentPost,
      ),
    );
  };

  const deletePost = (post: Post) => {
    setPosts((currentPosts) =>
      currentPosts.filter((currentPost) => currentPost.id !== post.id),
    );
    if (selectedPost?.id === post.id) {
      setSelectedPostId(
        posts.find((currentPost) => currentPost.id !== post.id)?.id,
      );
    }
  };

  const postComments = selectedPost
    ? comments.filter((comment) => comment.postId === selectedPost.id)
    : [];

  return (
    <section className="screen-stack">
      <ScreenHeader
        title="Posts"
        description="Browse updates, open a full note, and follow the conversation."
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search post id or title"
        />
      </Toolbar>
      <div className="split-layout">
        <div className="post-list">
          {visiblePosts.map((post) => (
            <article
              className={
                post.id === selectedPost?.id
                  ? "post-card selected"
                  : "post-card"
              }
              key={post.id}
            >
              <span className="id-badge">#{post.id}</span>
              <h3>{post.title}</h3>
              <div className="row-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedPostId(post.id);
                    setShowComments(false);
                  }}
                >
                  View
                </Button>
                <Button variant="secondary" onClick={() => editPost(post)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => deletePost(post)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
          {!visiblePosts.length && (
            <EmptyState message="No posts match that search." />
          )}
        </div>
        <aside className="detail-panel">
          {selectedPost ? (
            <>
              <span className="id-badge">Selected #{selectedPost.id}</span>
              <h2>{selectedPost.title}</h2>
              <p>{selectedPost.body}</p>
              <Button
                variant="secondary"
                onClick={() => setShowComments((value) => !value)}
              >
                {showComments ? "Hide comments" : "Show comments"}
              </Button>
              {showComments && (
                <div className="comments-stack">
                  <form className="inline-form" onSubmit={addComment}>
                    <input
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      placeholder="Add a comment"
                    />
                    <Button type="submit">Add Comment</Button>
                  </form>
                  {postComments.map((comment) => (
                    <article className="comment-card" key={comment.id}>
                      <strong>{comment.name}</strong>
                      <span>{comment.email}</span>
                      <p>{comment.body}</p>
                      {comment.ownedByCurrentUser && (
                        <div className="row-actions">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const body = window
                                .prompt("Update comment", comment.body)
                                ?.trim();
                              if (!body) return;
                              setComments((currentComments) =>
                                currentComments.map((currentComment) =>
                                  currentComment.id === comment.id
                                    ? { ...currentComment, body }
                                    : currentComment,
                                ),
                              );
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() =>
                              setComments((currentComments) =>
                                currentComments.filter(
                                  (currentComment) =>
                                    currentComment.id !== comment.id,
                                ),
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState message="Choose a post to view its details." />
          )}
        </aside>
      </div>
    </section>
  );
}
