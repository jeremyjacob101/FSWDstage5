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
  createPost,
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
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [draftPostTitle, setDraftPostTitle] = useState("");
  const [draftPostBody, setDraftPostBody] = useState("");
  const [pendingPostIds, setPendingPostIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | undefined>(
    posts[0]?.id,
  );

  const selectedPost =
    posts.find((post) => post.id === selectedPostId) ?? posts[0];
  const isEditingSelectedPost =
    selectedPost !== undefined && editingPostId === selectedPost.id;

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

  const addPost: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = newPostTitle.trim();
    const body = newPostBody.trim();
    if (!title || !body || isCreatingPost) return;

    try {
      setError("");
      setIsCreatingPost(true);
      const post = await createPost({
        userId: activeUser.id,
        title,
        body,
      });

      setPosts((currentPosts) => [post, ...currentPosts]);
      setSelectedPostId(post.id);
      setNewPostTitle("");
      setNewPostBody("");
      setShowComments(false);
    } catch {
      setError("Could not create the post. Please try again.");
    } finally {
      setIsCreatingPost(false);
    }
  };

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

  const startEditingPost = (post: Post) => {
    setSelectedPostId(post.id);
    setEditingPostId(post.id);
    setDraftPostTitle(post.title);
    setDraftPostBody(post.body);
    setError("");
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setDraftPostTitle("");
    setDraftPostBody("");
  };

  const savePost = async (post: Post) => {
    const title = draftPostTitle.trim();
    const body = draftPostBody.trim();
    if (!title || !body || pendingPostIds.includes(post.id)) return;

    try {
      setError("");
      setPendingPostIds((currentIds) => [...currentIds, post.id]);
      const updatedPost = await updatePost(post.id, { title, body });

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id ? updatedPost : currentPost,
        ),
      );
      cancelEditingPost();
    } catch {
      setError("Could not update the post. Please try again.");
    } finally {
      setPendingPostIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== post.id),
      );
    }
  };

  const removePost = async (post: Post) => {
    if (pendingPostIds.includes(post.id)) return;

    try {
      setError("");
      setPendingPostIds((currentIds) => [...currentIds, post.id]);
      await deletePost(post.id);
      setPosts((currentPosts) => {
        const nextPosts = currentPosts.filter(
          (currentPost) => currentPost.id !== post.id,
        );
        setSelectedPostId(nextPosts[0]?.id);
        return nextPosts;
      });
      if (editingPostId === post.id) {
        cancelEditingPost();
      }
    } catch {
      setError("Could not delete the post. Please try again.");
    } finally {
      setPendingPostIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== post.id),
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
      <form className="inline-form post-compose-form" onSubmit={addPost}>
        <input
          value={newPostTitle}
          onChange={(event) => setNewPostTitle(event.target.value)}
          placeholder="New post title"
          disabled={isCreatingPost}
        />
        <textarea
          value={newPostBody}
          onChange={(event) => setNewPostBody(event.target.value)}
          placeholder="New post body"
          disabled={isCreatingPost}
          rows={3}
        />
        <Button
          type="submit"
          disabled={
            isCreatingPost || !newPostTitle.trim() || !newPostBody.trim()
          }
        >
          {isCreatingPost ? "Adding..." : "New Post"}
        </Button>
      </form>
      {error && <p className="error-state">{error}</p>}
      <div className="split-layout">
        <div className="post-list">
          {isLoading && <EmptyState message="Loading posts..." />}
          {visiblePosts.map((post) => {
            const isPending = pendingPostIds.includes(post.id);

            return (
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
                    disabled={isPending}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => startEditingPost(post)}
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void removePost(post)}
                    disabled={isPending}
                  >
                    {isPending ? "Working..." : "Delete"}
                  </Button>
                </div>
              </article>
            );
          })}
          {!isLoading && !visiblePosts.length && (
            <EmptyState message="No posts match that search." />
          )}
        </div>
        <aside className="detail-panel">
          {selectedPost ? (
            <>
              <span className="id-badge">Selected #{selectedPost.id}</span>
              {isEditingSelectedPost ? (
                <form
                  className="post-edit-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void savePost(selectedPost);
                  }}
                >
                  <label>
                    Title
                    <input
                      value={draftPostTitle}
                      onChange={(event) =>
                        setDraftPostTitle(event.target.value)
                      }
                      disabled={pendingPostIds.includes(selectedPost.id)}
                    />
                  </label>
                  <label>
                    Body
                    <textarea
                      value={draftPostBody}
                      onChange={(event) => setDraftPostBody(event.target.value)}
                      disabled={pendingPostIds.includes(selectedPost.id)}
                      rows={7}
                    />
                  </label>
                  <div className="row-actions">
                    <Button
                      type="submit"
                      disabled={
                        pendingPostIds.includes(selectedPost.id) ||
                        !draftPostTitle.trim() ||
                        !draftPostBody.trim()
                      }
                    >
                      {pendingPostIds.includes(selectedPost.id)
                        ? "Saving..."
                        : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={cancelEditingPost}
                      disabled={pendingPostIds.includes(selectedPost.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h2>{selectedPost.title}</h2>
                  <p>{selectedPost.body}</p>
                  <div className="row-actions">
                    <Button
                      variant="secondary"
                      onClick={() => startEditingPost(selectedPost)}
                    >
                      Edit Post
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowComments((value) => !value)}
                    >
                      {showComments ? "Hide comments" : "Show comments"}
                    </Button>
                  </div>
                </>
              )}
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
