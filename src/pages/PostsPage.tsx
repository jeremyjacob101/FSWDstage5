import { useEffect, useState } from "react";
import type { Comment, Post, User } from "../data/types";
import {
  Button,
  EmptyState,
  ScreenHeader,
  SearchInput,
  Toolbar,
} from "../components/ui";
import {
  createComment,
  deleteComment,
  deletePost,
  getCommentsForPost,
  updateComment,
  updatePost,
} from "../api/api";

export function PostsPage({
  activeUser,
  posts,
  setPosts,
  isLoading,
}: {
  activeUser: User;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | undefined>(
    posts[0]?.id,
  );

  const selectedPost =
    posts.find((post) => post.id === selectedPostId) ?? posts[0];

  useEffect(() => {
    if (!selectedPost) {
      return;
    }

    let isCurrent = true;

    async function loadComments() {
      setIsLoadingComments(true);
      setError("");

      try {
        const nextComments = await getCommentsForPost(selectedPost.id);

        if (isCurrent) {
          setComments(nextComments);
        }
      } catch {
        if (isCurrent) {
          setError("Could not load comments for this post.");
        }
      } finally {
        if (isCurrent) {
          setIsLoadingComments(false);
        }
      }
    }

    void loadComments();

    return () => {
      isCurrent = false;
    };
  }, [selectedPost]);

  const visiblePosts = posts.filter((post) => {
    const query = search.toLowerCase().trim();
    return (
      String(post.id).includes(query) ||
      post.title.toLowerCase().includes(query)
    );
  });

  const addComment: React.SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    const body = newComment.trim();
    if (!body || !selectedPost) return;

    try {
      setError("");
      const comment = await createComment({
        postId: selectedPost.id,
        name: activeUser.name,
        email: activeUser.email,
        body,
        ownedByCurrentUser: true,
      });

      setComments((currentComments) => [...currentComments, comment]);
      setNewComment("");
      setShowComments(true);
    } catch {
      setError("Could not add the comment. Please try again.");
    }
  };

  const editPost = async (post: Post) => {
    const title = window.prompt("Update post title", post.title)?.trim();
    if (!title) return;

    try {
      setError("");
      const updatedPost = await updatePost(post.id, { title });

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id ? updatedPost : currentPost,
        ),
      );
    } catch {
      setError("Could not update the post. Please try again.");
    }
  };

  const removePost = async (post: Post) => {
    try {
      setError("");
      await deletePost(post.id);
      setPosts((currentPosts) => {
        const nextPosts = currentPosts.filter(
          (currentPost) => currentPost.id !== post.id,
        );
        setSelectedPostId(nextPosts[0]?.id);
        return nextPosts;
      });
    } catch {
      setError("Could not delete the post. Please try again.");
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
      {error && <p className="error-state">{error}</p>}
      <div className="split-layout">
        <div className="post-list">
          {isLoading && <EmptyState message="Loading posts..." />}
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
                <Button variant="danger" onClick={() => void removePost(post)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
          {!isLoading && !visiblePosts.length && (
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
                  {isLoadingComments && (
                    <EmptyState message="Loading comments..." />
                  )}
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
                              void updateComment(comment.id, { body })
                                .then((updatedComment) => {
                                  setComments((currentComments) =>
                                    currentComments.map((currentComment) =>
                                      currentComment.id === comment.id
                                        ? updatedComment
                                        : currentComment,
                                    ),
                                  );
                                })
                                .catch(() => {
                                  setError(
                                    "Could not update the comment. Please try again.",
                                  );
                                });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => {
                              void deleteComment(comment.id)
                                .then(() => {
                                  setComments((currentComments) =>
                                    currentComments.filter(
                                      (currentComment) =>
                                        currentComment.id !== comment.id,
                                    ),
                                  );
                                })
                                .catch(() => {
                                  setError(
                                    "Could not delete the comment. Please try again.",
                                  );
                                });
                            }}
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
