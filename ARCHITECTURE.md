# Federated Frontend - Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Next.js 16 App (React 19)                     │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Pages/     │  │  Components  │  │   Context   │ │ │
│  │  │   Routes     │  │   (UI Layer) │  │   Providers │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │ │
│  │         │                 │                  │        │ │
│  │         └─────────────────┴──────────────────┘        │ │
│  │                           │                           │ │
│  │                  ┌────────▼────────┐                  │ │
│  │                  │   API Routes    │                  │ │
│  │                  │  (Middleware)   │                  │ │
│  │                  └────────┬────────┘                  │ │
│  └───────────────────────────┼──────────────────────────┘ │
└────────────────────────────┼──────────────────────────────┘
                             │ HTTP/WebSocket
                             │
                    ┌────────▼────────┐
                    │  fedinet-go     │
                    │  Backend Server │
                    │  (Port 8082)    │
                    └─────────────────┘
```

## 📁 Project Structure

### Directory Layout

```
federated-frontend/
├── app/                          # Next.js App Router (v13+)
│   ├── components/               # Reusable UI Components
│   │   ├── __tests__/           # Unit tests for components
│   │   ├── PostCard.tsx         # Post display with interactions
│   │   ├── ProfileCard.tsx      # User profile display
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── FollowButton.tsx     # Follow/unfollow functionality
│   │   ├── LikeButton.tsx       # Like interaction
│   │   ├── ShareButton.tsx      # Share/repost
│   │   ├── SearchBar.tsx        # Search interface
│   │   ├── UserCard.tsx         # User list item
│   │   ├── Followers.tsx        # Followers list
│   │   ├── Following.tsx        # Following list
│   │   ├── ReplyCard.tsx        # Comment display
│   │   └── navItem.tsx          # Navigation item
│   │
│   ├── api/                     # API Route Handlers (Next.js)
│   │   ├── follow/              # Follow/unfollow endpoints
│   │   ├── followers/           # Get followers list
│   │   ├── following/           # Get following list
│   │   ├── likes/               # Like/unlike endpoints
│   │   ├── messages/            # Messaging endpoints
│   │   ├── notifications/       # Notification endpoints
│   │   ├── posts/               # Post CRUD operations
│   │   ├── search/              # Search endpoints
│   │   ├── users/               # User management
│   │   └── profile.ts           # Profile endpoints
│   │
│   ├── types/                   # TypeScript Type Definitions
│   │   ├── post.ts              # Post interface
│   │   ├── profile.ts           # Profile/User interface
│   │   ├── message.ts           # Message interface
│   │   ├── activity.ts          # Activity/Notification interface
│   │   └── identity.ts          # Authentication types
│   │
│   ├── context/                 # React Context Providers
│   │   └── AuthContext.tsx      # Authentication state management
│   │
│   ├── showcase/                # Demo/Showcase Pages
│   │   ├── feed/                # Timeline/feed page
│   │   ├── explore/             # Explore/trending page
│   │   ├── notifications/       # Notifications page
│   │   ├── messages/            # Direct messages page
│   │   ├── profile/             # Profile page
│   │   ├── followers/           # Followers page
│   │   ├── following/           # Following page
│   │   └── layout.tsx           # Showcase layout wrapper
│   │
│   ├── profile/                 # Profile Management Pages
│   │   ├── edit/                # Edit profile page
│   │   ├── followers/           # Profile followers view
│   │   ├── following/           # Profile following view
│   │   ├── likes/               # Liked posts view
│   │   └── posts/               # User posts view
│   │
│   ├── login/                   # Authentication Pages
│   ├── register/                # Registration page
│   ├── recover/                 # Password recovery
│   │
│   ├── data/                    # Mock Data (Development)
│   │   └── mockData.ts          # Sample test data
│   │
│   ├── icons/                   # Custom SVG Icons
│   ├── layout.tsx               # Root Layout (Persistent UI)
│   ├── page.tsx                 # Landing Page
│   └── globals.css              # Global Styles
│
├── federated-admin/             # Admin Dashboard (Separate App)
├── public/                      # Static Assets (images, fonts)
├── jest.config.js               # Jest test configuration
├── jest.setup.js                # Jest test setup
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── API_INTEGRATION_GUIDE.ts     # API integration patterns
├── COMPONENT_CHECKLIST.md       # Component dev checklist
└── FRONTEND_TEMPLATES.md        # Reusable templates
```

## 🏛️ Architectural Layers

### 1. Presentation Layer (UI Components)

**Location**: `app/components/`

**Responsibility**: Rendering UI and handling user interactions

**Key Components**:

- **PostCard**: Displays posts with like, comment, repost, share actions
- **ProfileCard**: Shows user profile with followers, following, posts
- **Sidebar**: Main navigation with Home, Explore, Notifications, Messages, Profile
- **FollowButton**: Handles follow/unfollow with optimistic updates
- **SearchBar**: Real-time search with debouncing

**Patterns Used**:

- Component composition
- Props drilling (small hierarchy)
- Controlled components for forms
- Optimistic UI updates

### 2. State Management Layer

#### Global State (React Context)

**Location**: `app/context/AuthContext.tsx`

**Provides**:

```typescript
interface AuthContextType {
  identity: LocalIdentity | null;
  isLoading: boolean;
  login: (userId: string, homeServer: string) => void;
  logout: () => void;
}
```

**Features**:

- Persistent authentication via localStorage
- Protected route guards
- Auto-redirect based on auth status
- Legacy port migration (8080 → 8082)

#### Local State

**Pattern**: Component-level `useState` and `useEffect`

**Examples**:

- PostCard: likes, comments, repost counts
- ProfileCard: follower counts, posts
- FollowButton: loading states

### 3. Data Access Layer (API Routes)

**Location**: `app/api/`

**Pattern**: Next.js Route Handlers (Server-side)

**Responsibilities**:

- Forward requests to backend (fedinet-go)
- Transform data formats
- Handle authentication headers
- Error handling and validation

**Example Flow**:

```
Client → /api/posts → fedinet-go:8082/posts → Response → Client
```

### 4. Type System Layer

**Location**: `app/types/`

**Key Interfaces**:

```typescript
// Post
interface Post {
  id: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

// Profile
interface Profile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
  followers_visibility: "public" | "followers" | "private";
  following_visibility: "public" | "followers" | "private";
}

// Auth Identity
interface LocalIdentity {
  user_id: string;
  home_server: string;
}
```

## 🔄 Data Flow Patterns

### Standard Data Flow

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  UI Component   │ (e.g., FollowButton)
└──────┬──────────┘
       │
       ├─────────────────────┐
       │ Optimistic Update   │ (Update UI immediately)
       └─────────────────────┘
       │
       ▼
┌──────────────────┐
│  API Call (fetch)│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Next.js API Route│ (app/api/*)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Backend Server   │ (fedinet-go)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Response       │
└──────┬───────────┘
       │
       ├─────────────────────┐
       │ On Success          │ (Callback: onSuccess())
       │ On Error            │ (Alert user)
       └─────────────────────┘
       │
       ▼
┌──────────────────┐
│  Update State    │
└──────────────────┘
```

### Authentication Flow

```
1. User enters credentials
   ↓
2. POST /api/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Returns { user_id, home_server, token }
   ↓
5. Store in localStorage
   ↓
6. AuthContext.login() updates state
   ↓
7. Redirect to /profile
   ↓
8. All subsequent API calls include token
```

## 🎨 Design System

### Color Palette (Bat Theme)

```css
/* Tailwind CSS Custom Colors */
bat-black: #15202B     /* Primary background */
bat-dark: #192734      /* Secondary background */
bat-gray: #8B98A5      /* Primary text */
bat-yellow: #FFD700    /* Accent color */
bat-blue: #1DA1F2      /* Links, buttons */
bat-hover: #1A8CD8     /* Hover state */
```

### Typography

- **Primary**: Geist Sans (Variable font)
- **Monospace**: Geist Mono (Code blocks, technical content)

### Component Styling

**Pattern**: Tailwind CSS utility classes

**Example**:

```tsx
<button
  className="px-6 py-2 rounded-full bg-bat-yellow text-bat-black 
                   hover:bg-[#E0B000] transition-colors duration-200"
>
  Follow
</button>
```

## 🧪 Testing Architecture

### Testing Stack

- **Framework**: Jest 29
- **Testing Library**: React Testing Library 16
- **Environment**: jsdom (browser simulation)

### Test Structure

**Location**: `app/components/__tests__/`

**Pattern**: Component-level unit tests

**Coverage**:

- PostCard: Rendering, interactions (like, repost, comment)
- ProfileCard: Display, conditional rendering, states
- FollowButton: Auth states, API calls, success/failure

**Example Test**:

```typescript
describe("PostCard Component", () => {
  it("renders post content correctly", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Hello world!")).toBeInTheDocument();
  });

  it("handles like button click", () => {
    render(<PostCard post={mockPost} />);
    const likeButton = screen.getAllByRole("button")[2];
    fireEvent.click(likeButton);
    // Assert count incremented
  });
});
```

### Mocking Strategy

- **API calls**: Mock `global.fetch`
- **Context**: Mock `useAuth` hook
- **Child components**: Mock heavy dependencies (e.g., PostCard in ProfileCard)

## 🚀 Deployment Architecture

### Build Process

```bash
npm run build  # Creates optimized production bundle
```

**Output**: `.next/` directory with:

- Static pages
- Server-side rendered pages
- API routes
- Client-side JavaScript bundles

### Hosting Options

1. **Vercel** (Recommended - Next.js native)
2. **Netlify** (Static + serverless functions)
3. **Self-hosted** (Node.js server)

### Environment Variables

**Required**:

```env
NEXT_PUBLIC_API_URL=http://localhost:8082
NEXT_PUBLIC_WS_URL=ws://localhost:8082/ws
```

## 🔐 Security Considerations

### Authentication

- **Method**: JWT tokens
- **Storage**: localStorage (client-side)
- **Transmission**: Authorization header

### API Security

- Token validation on backend
- CORS configuration
- Rate limiting (backend)
- Input validation

## 📊 Performance Optimizations

### Next.js Features

1. **Server Components**: Default for static content
2. **Client Components**: Only when needed (`'use client'`)
3. **Image Optimization**: Next.js `<Image>` component
4. **Code Splitting**: Automatic route-based splitting
5. **Font Optimization**: Geist with `next/font`

### React Patterns

- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: `useMemo`, `useCallback` where needed
- **Debouncing**: Search input (reduces API calls)
- **Optimistic Updates**: Immediate UI feedback

## 🔌 Backend Integration

### API Contract

**Base URL**: `http://localhost:8082`

**Authentication**:

```typescript
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}
```

**Key Endpoints**:

- `POST /api/auth/login` - User authentication
- `GET /api/feed` - Get user feed
- `POST /api/posts` - Create post
- `POST /api/follow` - Follow user
- `POST /api/posts/:id/like` - Like post
- `GET /api/notifications` - Get notifications

## 🛠️ Development Workflow

### Local Development

```bash
npm run dev  # Start dev server (localhost:3000)
npm test     # Run unit tests
npm run lint # Check code quality
```

### Component Development

1. Create component in `app/components/`
2. Define TypeScript types
3. Implement UI with Tailwind CSS
4. Add unit tests in `__tests__/`
5. Document API integration needs

## 📚 Key Design Decisions

### Why Next.js?

- **SSR/SSG**: SEO and performance benefits
- **File-based routing**: Intuitive project structure
- **API routes**: Backend-for-frontend pattern
- **React 19**: Latest features (concurrent rendering)

### Why Tailwind CSS?

- **Utility-first**: Fast development
- **Customization**: Bat theme color palette
- **Responsive**: Mobile-first design
- **Performance**: Purges unused CSS

### Why React Context?

- **Simplicity**: Auth state is simple enough
- **Avoids prop drilling**: Global auth access
- **No external dependencies**: Reduce bundle size

### Why Component-level tests?

- **Fast feedback**: Quick to run
- **Isolated**: Test one thing at a time
- **Maintainable**: Clear what's being tested

## 🎯 Future Enhancements

### Planned Features

1. **WebSocket integration**: Real-time updates
2. **Progressive Web App**: Offline support
3. **Image uploads**: CDN integration
4. **Infinite scroll**: Virtual scrolling
5. **Dark/Light mode toggle**: Theme switching
6. **Internationalization**: Multi-language support

### Technical Improvements

1. **Redux/Zustand**: If state complexity grows
2. **React Query**: Advanced data fetching
3. **E2E tests**: Playwright/Cypress
4. **Storybook**: Component documentation
5. **Performance monitoring**: Web vitals tracking

---

**Version**: 1.0  
**Last Updated**: February 11, 2026  
**Maintained by**: Federated Social Networking Team
