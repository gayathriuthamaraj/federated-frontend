import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FollowButton from "../FollowButton";

// Mock useAuth
import { useAuth } from "../../context/AuthContext";

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("FollowButton Component", () => {
  const mockOnSuccess = jest.fn();
  const mockAlert = jest.fn();

  beforeAll(() => {
    global.alert = mockAlert;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      identity: { user_id: 'me@server', home_server: 'http://localhost:8082' },
    });
  });

  it("renders correctly when logged in", () => {
    render(<FollowButton targetUser="@other" onSuccess={mockOnSuccess} />);

    expect(screen.getByText("Follow")).toBeInTheDocument();
  });

  it("returns null when not logged in", () => {
    (useAuth as jest.Mock).mockReturnValue({
      identity: null,
    });

    const { container } = render(
      <FollowButton targetUser="@other" onSuccess={mockOnSuccess} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when target user is same as current user", () => {
    render(<FollowButton targetUser="me@server" onSuccess={mockOnSuccess} />);

    // Should be empty because we can't follow ourselves
    const button = screen.queryByRole("button");
    expect(button).not.toBeInTheDocument();
  });

  it("handles follow action successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<FollowButton targetUser="@other" onSuccess={mockOnSuccess} />);

    const button = screen.getByText("Follow");
    fireEvent.click(button);

    // Should show loading state
    expect(screen.getByText("Processing...")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8082/follow",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            follower: 'me@server',
            followee: '@other',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(screen.getByText("Unfollow")).toBeInTheDocument();
    });
  });

  it("handles follow action failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "Error message",
    });

    render(<FollowButton targetUser="@other" onSuccess={mockOnSuccess} />);

    const button = screen.getByText("Follow");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Action failed: Error message");
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
