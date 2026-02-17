jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
}))

import { render, screen } from "@testing-library/react"
import ProfileCard from "../ProfileCard"
import { AuthProvider } from "../../context/AuthContext"

describe("ProfileCard Component", () => {
  const mockProfile = {
    display_name: "Mithresh",
    user_id: "mithresh@localhost",
    banner_url: "",
    avatar_url: "",
    bio: "Test bio"
  }

  test("renders profile information correctly", () => {
    render(
      <AuthProvider>
        <ProfileCard profile={mockProfile} />
      </AuthProvider>
    )

    expect(screen.getByText("Mithresh")).toBeInTheDocument()
    expect(screen.getByText("mithresh@localhost")).toBeInTheDocument()
  })
})
