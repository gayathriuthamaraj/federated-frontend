import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PostCard from "../PostCard";
import { Post } from "@/types/post";

// Mock post data
const mockPost: Post = {
  id: "1",
  author: "johndoe",
  content: "Hello world!",
  created_at: "2023-01-01T12:00:00Z",
  updated_at: "2023-01-01T12:00:00Z",
};

describe("PostCard Component", () => {
  it("renders post content correctly", () => {
    render(<PostCard post={mockPost} />);

    // Check if author name is displayed (PostCard splits by @, so johndoe becomes johndoe)
    expect(screen.getByText("johndoe")).toBeInTheDocument();

    // Check if content is displayed
    expect(screen.getByText("Hello world!")).toBeInTheDocument();
  });

  it("handles like button click", () => {
    render(<PostCard post={mockPost} />);

    const likeButton = screen.getAllByRole("button")[2]; // The 3rd button is the like button based on order in code
    // Alternatively, we can find by aria-label if we add one, but currently there isn't one.
    // Or find by the count.

    // Let's rely on the svg path or just the order for now, or adding a test id would be better but I can't edit the component yet unless necessary.
    // Actually, looking at the code:
    // Reply is first button
    // Repost is second button
    // Like is third button.

    const likeCountElement = likeButton.querySelector("span");
    const initialLikes = parseInt(likeCountElement?.textContent || "0");

    fireEvent.click(likeButton);

    expect(likeCountElement?.textContent).toBe((initialLikes + 1).toString());

    fireEvent.click(likeButton);
    expect(likeCountElement?.textContent).toBe(initialLikes.toString());
  });

  it("handles repost button click", () => {
    render(<PostCard post={mockPost} />);

    const repostButton = screen.getAllByRole("button")[1]; // 2nd button
    const repostCountElement = repostButton.querySelector("span");
    const initialReposts = parseInt(repostCountElement?.textContent || "0");

    fireEvent.click(repostButton);
    expect(repostCountElement?.textContent).toBe(
      (initialReposts + 1).toString(),
    );

    fireEvent.click(repostButton);
    expect(repostCountElement?.textContent).toBe(initialReposts.toString());
  });

  it("toggles comments section", () => {
    render(<PostCard post={mockPost} />);

    const replyButton = screen.getAllByRole("button")[0]; // 1st button

    // Comments section should not be visible initially
    const commentInput = screen.queryByPlaceholderText("Post your reply");
    expect(commentInput).not.toBeInTheDocument();

    fireEvent.click(replyButton);

    // Comments section should be visible now
    expect(screen.getByPlaceholderText("Post your reply")).toBeInTheDocument();
  });

  it("adds a comment", () => {
    render(<PostCard post={mockPost} />);

    const replyButton = screen.getAllByRole("button")[0];
    fireEvent.click(replyButton);

    const input = screen.getByPlaceholderText("Post your reply");
    const submitButton = screen.getByText("Reply", { selector: "button" }); // The "Reply" button inside the comments section

    fireEvent.change(input, { target: { value: "Nice post!" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Nice post!")).toBeInTheDocument();
    expect(input).toHaveValue(""); // input should be cleared
  });
});
