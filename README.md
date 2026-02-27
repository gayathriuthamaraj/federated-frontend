# Federated Frontend

Main user-facing application for the Federated Social Networking platform. Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.x (App Router) |
| UI | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Font | JetBrains Mono (variable) |
| State | React Context + component state |
| Cache | localStorage SWR (5 min fresh / 30 min stale) |

## Project Structure

```
federated-frontend/
  app/
    components/         # Shared UI components
      PostCard.tsx       # Post with like, reply, repost
      ProfileCard.tsx    # User profile summary
      FollowButton.tsx   # Follow/unfollow with optimistic state
      LikeButton.tsx     # Like toggle
      SearchBar.tsx      # Live user/post search
      Sidebar.tsx        # Navigation sidebar
      ReplyCard.tsx      # Threaded reply display
      Followers.tsx      # Followers list
      Following.tsx      # Following list
    api/                 # Next.js API route handlers (proxy to backend)
    context/
      AuthContext.tsx    # Global auth state
      CacheContext.tsx   # Profile/identity cache (localStorage SWR)
    types/               # TypeScript interfaces (post, profile, identity, etc.)
    utils/               # Shared utilities
    feed/                # Home feed page
    explore/             # Discover and trending
    profile/             # View any user profile
    compose/             # New post composer
    messages/            # Direct messaging
    notifications/       # Activity notifications
    followers/           # Followers view
    following/           # Following view
    search/              # Search results
    login/               # Login page
    register/            # Registration page
    recover/             # Account recovery
    globals.css          # Global styles and theme variables
    layout.tsx           # Root layout
    page.tsx             # Landing page
  federated-admin/       # Admin dashboard (separate Next.js app, port 3001)
  public/                # Static assets
  package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- The `fedinet-go` backend running (see `fedinet-go/README.md`)

### Install and run

```bash
cd federated-frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

This points to the identity service. With Docker federation running, Server A is on `8080` and Server B on `9080`.

## Features

### Authentication

- JWT-based login and registration; tokens stored in localStorage
- `AuthContext` provides identity (`user_id`, `home_server`, `token`) to all pages
- `CacheContext` caches profile data to reduce redundant fetches

### Feed

- Posts from followed users in reverse-chronological order
- Inline like, repost, and reply interactions with optimistic updates

### Profile

- Works for local users (same server) and cross-server users
- Local lookup: `GET /user/search?user_id=`
- Cross-server lookup: `GET /search?q=alice@server_b` (federated search)
- Cross-server posts: `GET /api/posts/federated?user_id=`
- Profile cache: `localStorage` key `fsc:profile:{userId}`, SWR pattern

### Social Graph

- Follow / unfollow with real-time counter updates
- `FollowButton` handles cross-server federation transparently
- Followers and following listed with pagination

### Messaging

- Direct message conversations
- Conversation list with unread count badge

### Notifications

- Activity feed: likes, follows, replies, mentions
- Unread badge in sidebar
- Mark-as-read on open

### Search

- Federated user search across servers
- Debounced input with result preview
- Navigates to full profile on select

## API Integration

All backend calls go through the identity service (`NEXT_PUBLIC_API_URL`). The frontend never talks directly to the federation service.

Key endpoint groups:

```
POST  /login                   Authenticate user
POST  /register                Register user
GET   /user/me                 Get own profile
GET   /user/search             Local user lookup
GET   /search                  Federated user search
GET   /feed                    Home feed
POST  /post/create             Create post
GET   /posts/user              User post list
GET   /api/posts/federated     Federated user posts (cross-server)
POST  /follow                  Follow user
POST  /unfollow                Unfollow user
GET   /followers               Follower list
GET   /following               Following list
GET   /notifications           Notification list
POST  /message                 Send message
GET   /conversations           Conversation list
```

Full patterns and request/response shapes are documented in `API_INTEGRATION_GUIDE.ts`.

## Admin Dashboard

Located at `federated-admin/` â€” a separate Next.js application that runs on port 3001.

```bash
cd federated-admin
npm install
npm run dev
```

The admin panel connects to the same identity service backend (`http://localhost:8080` by default) and requires admin credentials. See `fedinet-go/README.md` for default credentials.

## Scripts

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Production build
npm start         # Run production build
npm run lint      # ESLint
```

## Additional Documentation

- `API_INTEGRATION_GUIDE.ts` â€” request/response patterns for all endpoints
- `COMPONENT_CHECKLIST.md` â€” checklist for adding new components
- `FRONTEND_TEMPLATES.md` â€” reusable component templates
- `ARCHITECTURE.md` â€” deeper architectural notes
