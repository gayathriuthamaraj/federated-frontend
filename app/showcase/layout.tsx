import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gotham Social - Showcase",
    description: "Frontend showcase for Gotham Social",
};

export default function ShowcaseLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Just return children - the root layout already has Sidebar
    return children;
}
