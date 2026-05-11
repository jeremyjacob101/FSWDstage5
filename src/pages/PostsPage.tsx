import { useEffect, useMemo, useState } from "react";
import type { Comment, Post } from "../data/types";
import { useCachedUserResources } from "../hooks/useCachedUserResources";
import { useUser } from "../context/useUser";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { usePersistentState } from "../hooks/usePersistentState";
import { Button, EmptyState, ScreenHeader, SearchInput, Toolbar } from "../components/ui";
import { createComment, createPost, deleteComment, deletePost, getCommentsForPost, updateComment, updatePost } from "../api/api";

type PostScope = "all" | "user";

type PostsUiState = {
  search: string;
  postScope: PostScope;
  showComments: boolean;
  selectedPostId: number | null;
  newPostTitle: string;
  newPostBody: string;
  newComment: string;
  editingCommentId: number | null;
  draftCommentBody: string;
  editingPostId: number | null;
  draftPostTitle: string;
  draftPostBody: string;
};

const DEFAULT_POSTS_UI_STATE: PostsUiState = {
  search: "",
  postScope: "all",
  showComments: false,
  selectedPostId: null,
  newPostTitle: "",
  newPostBody: "",
  newComment: "",
  editingCommentId: null,
  draftCommentBody: "",
  editingPostId: null,
  draftPostTitle: "",
  draftPostBody: "",
};

export function PostsPage() {
  const {
    items: posts,
    setItems: setPosts,
    isLoading,
  } = useCachedUserResources<Post>("posts", false);
  const { user: activeUser } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [pendingPostIds, setPendingPostIds] = useState<number[]>([]);
  const [pendingCommentIds, setPendingCommentIds] = useState<number[]>([]);
  const currentUserId = activeUser?.id ?? 0;
  const uiStateKey = `entrybase:ui:v1:user:${currentUserId}:page:posts`;
  const scrollKey = `entrybase:scroll:v1:user:${currentUserId}:page:posts`;
  const [uiState, setUiState] = usePersistentState<PostsUiState>(
    uiStateKey,
    DEFAULT_POSTS_UI_STATE,
  );

  const {
    search,
    postScope,
    showComments,
    selectedPostId,
    newPostTitle,
    newPostBody,
    newComment,
    editingCommentId,
    draftCommentBody,
    editingPostId,
    draftPostTitle,
    draftPostBody,
  } = uiState;
  usePersistentScroll(
    scrollKey,
    Boolean(activeUser),
    !isLoading && (!showComments || !isLoadingComments),
  );

  const query = search.toLowerCase().trim();
  const visiblePosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesScope =
          postScope === "all" || post.userId === currentUserId;
        const matchesSearch =
          String(post.id).includes(query) ||
          post.title.toLowerCase().includes(query);
        return matchesScope && matchesSearch;
      }),
    [currentUserId, postScope, posts, query],
  );

  const selectedPost =
    visiblePosts.find((post) => post.id === selectedPostId) ?? visiblePosts[0];
  const isEditingSelectedPost =
    selectedPost !== undefined && editingPostId === selectedPost.id;
  const postComments = useMemo(
    () =>
      selectedPost
        ? comments.filter((comment) => comment.postId === selectedPost.id)
        : [],
    [comments, selectedPost],
  );

  useEffect(() => {
    if (!selectedPost) {
      return;
    }

    let isCurrent = true;

    async function loadComments() {
      setIsLoadingComments(true);

      try {
        const nextComments = await getCommentsForPost(selectedPost.id);
        if (isCurrent) {
          setComments(nextComments);
        }
      } catch {
        return;
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

  useEffect(() => {
    setUiState((currentState) => {
      if (!visiblePosts.length) {
        if (
          currentState.selectedPostId == null &&
          currentState.editingPostId == null
        ) {
          return currentState;
        }
        return {
          ...currentState,
          selectedPostId: null,
          editingPostId: null,
          draftPostTitle: "",
          draftPostBody: "",
          showComments: false,
        };
      }

      const selectedStillExists =
        currentState.selectedPostId != null &&
        visiblePosts.some((post) => post.id === currentState.selectedPostId);
      const editingStillExists =
        currentState.editingPostId != null &&
        visiblePosts.some((post) => post.id === currentState.editingPostId);

      const nextSelectedPostId = selectedStillExists
        ? currentState.selectedPostId
        : (visiblePosts[0]?.id ?? null);
      const nextEditingPostId = editingStillExists
        ? currentState.editingPostId
        : null;
      const nextDraftPostTitle = editingStillExists
        ? currentState.draftPostTitle
        : "";
      const nextDraftPostBody = editingStillExists
        ? currentState.draftPostBody
        : "";
      const nextShowComments =
        nextSelectedPostId == null ? false : currentState.showComments;

      if (
        nextSelectedPostId === currentState.selectedPostId &&
        nextEditingPostId === currentState.editingPostId &&
        nextDraftPostTitle === currentState.draftPostTitle &&
        nextDraftPostBody === currentState.draftPostBody &&
        nextShowComments === currentState.showComments
      ) {
        return currentState;
      }

      return {
        ...currentState,
        selectedPostId: nextSelectedPostId,
        editingPostId: nextEditingPostId,
        draftPostTitle: nextDraftPostTitle,
        draftPostBody: nextDraftPostBody,
        showComments: nextShowComments,
      };
    });
  }, [setUiState, visiblePosts]);

  useEffect(() => {
    setUiState((currentState) => {
      if (currentState.editingCommentId == null) {
        return currentState;
      }
      if (
        postComments.some(
          (comment) => comment.id === currentState.editingCommentId,
        )
      ) {
        return currentState;
      }
      return {
        ...currentState,
        editingCommentId: null,
        draftCommentBody: "",
      };
    });
  }, [postComments, setUiState]);

  const isOwnPost = (post: Post) => post.userId === currentUserId;

  const isOwnComment = (comment: Comment) => comment.userId === currentUserId;

  const addPost: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const title = newPostTitle.trim();
    const body = newPostBody.trim();
    if (!title || !body || isCreatingPost) return;

    try {
      setIsCreatingPost(true);
      const post = await createPost({
        userId: currentUserId,
        title,
        body,
      });

      setPosts((currentPosts) => [post, ...currentPosts]);
      setUiState((currentState) => ({
        ...currentState,
        selectedPostId: post.id,
        newPostTitle: "",
        newPostBody: "",
        showComments: false,
      }));
    } catch {
      return;
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
      const comment = await createComment({
        postId: selectedPost.id,
        userId: currentUserId,
        name: activeUser?.name ?? "",
        email: activeUser?.email ?? "",
        body,
      });

      setComments((currentComments) => [...currentComments, comment]);
      setUiState((currentState) => ({
        ...currentState,
        newComment: "",
        showComments: true,
      }));
    } catch {
      return;
    }
  };

  const startEditingPost = (post: Post) => {
    if (!isOwnPost(post)) return;

    setUiState((currentState) => ({
      ...currentState,
      selectedPostId: post.id,
      editingPostId: post.id,
      draftPostTitle: post.title,
      draftPostBody: post.body,
    }));
  };

  const cancelEditingPost = () => {
    setUiState((currentState) => ({
      ...currentState,
      editingPostId: null,
      draftPostTitle: "",
      draftPostBody: "",
    }));
  };

  const startEditingComment = (comment: Comment) => {
    if (!isOwnComment(comment)) return;

    setUiState((currentState) => ({
      ...currentState,
      editingCommentId: comment.id,
      draftCommentBody: comment.body,
    }));
  };

  const cancelEditingComment = () => {
    setUiState((currentState) => ({
      ...currentState,
      editingCommentId: null,
      draftCommentBody: "",
    }));
  };

  const saveComment = async (comment: Comment) => {
    const body = draftCommentBody.trim();
    if (
      !body ||
      !isOwnComment(comment) ||
      pendingCommentIds.includes(comment.id)
    ) {
      return;
    }

    try {
      setPendingCommentIds((currentIds) => [...currentIds, comment.id]);
      const updatedComment = await updateComment(comment.id, { body });

      setComments((currentComments) =>
        currentComments.map((currentComment) =>
          currentComment.id === comment.id ? updatedComment : currentComment));
      cancelEditingComment();
    } catch {
      return;
    } finally {
      setPendingCommentIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== comment.id));
    }
  };

  const removeComment = async (comment: Comment) => {
    if (!isOwnComment(comment) || pendingCommentIds.includes(comment.id)) {
      return;
    }

    try {
      setPendingCommentIds((currentIds) => [...currentIds, comment.id]);
      await deleteComment(comment.id);
      setComments((currentComments) =>
        currentComments.filter(
          (currentComment) => currentComment.id !== comment.id,
        ));
      if (editingCommentId === comment.id) {
        cancelEditingComment();
      }
    } catch {
      return;
    } finally {
      setPendingCommentIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== comment.id));
    }
  };

  const savePost = async (post: Post) => {
    const title = draftPostTitle.trim();
    const body = draftPostBody.trim();
    if (
      !title ||
      !body ||
      !isOwnPost(post) ||
      pendingPostIds.includes(post.id)
    ) {
      return;
    }

    try {
      setPendingPostIds((currentIds) => [...currentIds, post.id]);
      const updatedPost = await updatePost(post.id, { title, body });

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id ? updatedPost : currentPost));
      cancelEditingPost();
    } catch {
      return;
    } finally {
      setPendingPostIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== post.id));
    }
  };

  const removePost = async (post: Post) => {
    if (!isOwnPost(post) || pendingPostIds.includes(post.id)) return;

    try {
      setPendingPostIds((currentIds) => [...currentIds, post.id]);
      await deletePost(post.id);
      setPosts((currentPosts) => {
        const nextPosts = currentPosts.filter(
          (currentPost) => currentPost.id !== post.id,
        );
        setUiState((currentState) => ({
          ...currentState,
          selectedPostId: nextPosts[0]?.id ?? null,
          showComments: false,
        }));
        return nextPosts;
      });
      if (editingPostId === post.id) {
        cancelEditingPost();
      }
    } catch {
      return;
    } finally {
      setPendingPostIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== post.id));
    }
  };

  if (!activeUser) {
    return null;
  }

  return (
    <section className="screen-stack">
      <ScreenHeader
        title="Posts"
        description="Browse updates, open a full note, and follow the conversation."
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(value) =>
            setUiState((currentState) => ({
              ...currentState,
              search: value,
            }))
          }
          placeholder="Search post id or title"
        />
        <div className="row-actions">
          <Button
            variant={postScope === "all" ? "primary" : "secondary"}
            onClick={() =>
              setUiState((currentState) => ({
                ...currentState,
                postScope: "all",
              }))
            }
          >
            All Posts
          </Button>
          <Button
            variant={postScope === "user" ? "primary" : "secondary"}
            onClick={() =>
              setUiState((currentState) => ({
                ...currentState,
                postScope: "user",
              }))
            }
          >
            User Posts
          </Button>
        </div>
      </Toolbar>
      <form className="inline-form post-compose-form" onSubmit={addPost}>
        <input
          value={newPostTitle}
          onChange={(event) =>
            setUiState((currentState) => ({
              ...currentState,
              newPostTitle: event.target.value,
            }))
          }
          placeholder="New post title"
          disabled={isCreatingPost}
        />
        <textarea
          value={newPostBody}
          onChange={(event) =>
            setUiState((currentState) => ({
              ...currentState,
              newPostBody: event.target.value,
            }))
          }
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
      <div className="split-layout">
        <div className="post-list">
          {isLoading && <EmptyState message="Loading posts..." />}
          {visiblePosts.map((post) => {
            const isPending = pendingPostIds.includes(post.id);
            const isOwn = isOwnPost(post);

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
                      setUiState((currentState) => ({
                        ...currentState,
                        selectedPostId: post.id,
                        showComments: false,
                      }));
                    }}
                    disabled={isPending}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => startEditingPost(post)}
                    disabled={isPending || !isOwn}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void removePost(post)}
                    disabled={isPending || !isOwn}
                  >
                    {isPending ? "Working..." : "Delete"}
                  </Button>
                </div>
              </article>
            );
          })}
          {!isLoading && !visiblePosts.length && (
            <EmptyState message="No posts match this filter." />
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
                        setUiState((currentState) => ({
                          ...currentState,
                          draftPostTitle: event.target.value,
                        }))
                      }
                      disabled={pendingPostIds.includes(selectedPost.id)}
                    />
                  </label>
                  <label>
                    Body
                    <textarea
                      value={draftPostBody}
                      onChange={(event) =>
                        setUiState((currentState) => ({
                          ...currentState,
                          draftPostBody: event.target.value,
                        }))
                      }
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
                      disabled={!isOwnPost(selectedPost)}
                    >
                      Edit Post
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setUiState((currentState) => ({
                          ...currentState,
                          showComments: !currentState.showComments,
                        }))
                      }
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
                      onChange={(event) =>
                        setUiState((currentState) => ({
                          ...currentState,
                          newComment: event.target.value,
                        }))
                      }
                      placeholder="Add a comment"
                    />
                    <Button type="submit">Add Comment</Button>
                  </form>
                  {isLoadingComments && (
                    <EmptyState message="Loading comments..." />
                  )}
                  {postComments.map((comment) => {
                    const isEditingComment = editingCommentId === comment.id;
                    const isPending = pendingCommentIds.includes(comment.id);

                    return (
                      <article className="comment-card" key={comment.id}>
                        <strong>{comment.name}</strong>
                        <span>{comment.email}</span>
                        {isEditingComment ? (
                          <textarea
                            className="comment-edit-input"
                            value={draftCommentBody}
                            onChange={(event) =>
                              setUiState((currentState) => ({
                                ...currentState,
                                draftCommentBody: event.target.value,
                              }))
                            }
                            disabled={isPending}
                            rows={4}
                            aria-label={`Comment ${comment.id} body`}
                          />
                        ) : (
                          <p>{comment.body}</p>
                        )}
                        {isOwnComment(comment) && (
                          <div className="row-actions">
                            {isEditingComment ? (
                              <>
                                <Button
                                  variant="secondary"
                                  onClick={() => void saveComment(comment)}
                                  disabled={
                                    isPending || !draftCommentBody.trim()
                                  }
                                >
                                  {isPending ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={cancelEditingComment}
                                  disabled={isPending}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="secondary"
                                onClick={() => startEditingComment(comment)}
                                disabled={isPending}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              onClick={() => void removeComment(comment)}
                              disabled={isPending}
                            >
                              {isPending ? "Working..." : "Delete"}
                            </Button>
                          </div>
                        )}
                      </article>
                    );
                  })}
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
