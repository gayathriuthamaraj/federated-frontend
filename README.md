# Federated Frontend

A modern, Twitter-style social networking frontend built with Next.js 16, React 19, TypeScript, and Tailwind CSS. This application provides a rich user interface for federated social interactions including posts, profiles, messaging, and real-time notifications.

## 🏗️ Architecture Overview

### Technology Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Font**: Geist (Sans & Mono) from Google Fonts

### Project Structure

```
federated-frontend/
├── app/                          # Next.js App Router directory
│   ├── components/               # Reusable UI components
│   │   ├── Sidebar.tsx          # Main navigation sidebar
│   │   ├── PostCard.tsx         # Post display with interactions
│   │   ├── ProfileCard.tsx      # User profile display
│   │   ├── FollowButton.tsx     # Follow/unfollow functionality
│   │   ├── LikeButton.tsx       # Like interaction
│   │   ├── ShareButton.tsx      # Share/repost functionality
│   │   ├── ReplyCard.tsx        # Comment/reply display
│   │   ├── SearchBar.tsx        # Search interface
│   │   ├── UserCard.tsx         # User list item
│   │   ├── Followers.tsx        # Followers list
│   │   ├── Following.tsx        # Following list
│   │   └── navItem.tsx          # Navigation item component
│   │
│   ├── api/                     # API route handlers (Next.js API routes)
│   │   ├── follow/              # Follow/unfollow endpoints
│   │   ├── followers/           # Followers list endpoints
│   │   ├── following/           # Following list endpoints
│   │   ├── likes/               # Like/unlike endpoints
│   │   ├── messages/            # Messaging endpoints
│   │   ├── notifications/       # Notification endpoints
│   │   ├── posts/               # Post CRUD endpoints
│   │   ├── search/              # Search endpoints
│   │   ├── users/               # User management endpoints
│   │   └── profile.ts           # Profile endpoints
│   │
│   ├── showcase/                # Main application pages
│   │   ├── feed/                # Home feed page
│   │   ├── explore/             # Explore/trending page
│   │   ├── notifications/       # Notifications page
│   │   ├── messages/            # Direct messages page
│   │   ├── profile/             # User profile page
│   │   ├── followers/           # Followers page
│   │   ├── following/           # Following page
│   │   ├── layout.tsx           # Showcase layout wrapper
│   │   └── page.tsx             # Showcase landing page
│   │
│   ├── profile/                 # Profile management pages
│   │   ├── edit/                # Edit profile page
│   │   ├── followers/           # Profile followers view
│   │   ├── following/           # Profile following view
│   │   ├── likes/               # Liked posts view
│   │   └── posts/               # User posts view
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── post.ts              # Post-related types
│   │   ├── profile.ts           # Profile/user types
│   │   ├── message.ts           # Message types
│   │   ├── activity.ts          # Activity/notification types
│   │   └── identity.ts          # Authentication types
│   │
│   ├── context/                 # React Context providers
│   │   └── AuthContext.tsx      # Authentication context
│   │
│   ├── data/                    # Mock data (for development)
│   │   └── mockData.ts          # Sample data for testing
│   │
│   ├── icons/                   # Custom SVG icons
│   │
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── recover/                 # Password recovery page
│   ├── layout.tsx               # Root layout with sidebar
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
│
├── federated-admin/             # Admin dashboard (separate app)
├── public/                      # Static assets
├── API_INTEGRATION_GUIDE.ts     # Guide for API integration
├── COMPONENT_CHECKLIST.md       # Component development checklist
├── FRONTEND_TEMPLATES.md        # Reusable component templates
└── package.json                 # Dependencies and scripts
```

## 🎨 Design System

### Color Palette (Bat Theme)

The application uses a custom "Bat" color scheme defined in Tailwind CSS:

- **bat-black**: Primary background color
- **bat-gray**: Primary text color
- **bat-blue**: Accent color for links and interactive elements
- **bat-hover**: Hover state color

### Typography

- **Primary Font**: Geist Sans (variable font)
- **Monospace Font**: Geist Mono (for code and technical content)

## 🔄 How It Works

### 1. Application Entry Point

**File**: `app/layout.tsx`

The root layout wraps the entire application with:
- **AuthProvider**: Manages authentication state globally
- **Sidebar**: Persistent navigation across all pages
- **Main Content Area**: Dynamic content based on routing

```typescript
<AuthProvider>
  <Sidebar />
  <main>{children}</main>
</AuthProvider>
```

### 2. Authentication Flow

**Context**: `app/context/AuthContext.tsx`

- Manages user login/logout state
- Stores JWT tokens in localStorage
- Provides authentication status to all components
- Handles protected routes

**Pages**:
- `/login` - User login
- `/register` - New user registration
- `/recover` - Password recovery

### 3. Main Features

#### Feed System (`/showcase/feed`)

- Displays posts from followed users
- Infinite scroll for loading more posts
- Real-time updates for likes, comments, and reposts
- Post composition interface

#### Profile Management (`/profile`)

- View and edit user profiles
- Display user's posts, likes, followers, and following
- Profile customization (bio, avatar, banner)

#### Social Interactions

**PostCard Component**:
- Like/unlike posts with animated heart
- Comment on posts with threaded replies
- Repost functionality
- Share options

**FollowButton Component**:
- Follow/unfollow users
- Real-time follower count updates
- Loading states and error handling

#### Messaging (`/showcase/messages`)

- Direct message conversations
- Real-time message delivery
- Conversation list with unread indicators

#### Notifications (`/showcase/notifications`)

- Activity feed (likes, comments, follows, mentions)
- Unread notification badges
- Mark as read functionality

#### Explore (`/showcase/explore`)

- Trending posts and topics
- User discovery
- Search functionality

#### Search (`SearchBar` component)

- Search for users and posts
- Real-time search results
- Type filtering (users/posts)

### 4. API Integration

**Pattern**: Client-side API calls with fetch

The application uses a service layer pattern for API calls:

```typescript
// Example API call structure
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**API Routes** (`app/api/`):
- Handle client requests
- Forward to backend server (fedinet-go)
- Transform data between frontend and backend formats
- Handle authentication and authorization

**Reference**: See `API_INTEGRATION_GUIDE.ts` for detailed integration patterns

### 5. State Management

The application uses a combination of:

- **React Context**: Global state (authentication)
- **Component State**: Local UI state (loading, errors)
- **URL State**: Navigation and routing

### 6. Routing

**Next.js App Router** provides:
- File-based routing
- Nested layouts
- Dynamic routes for user profiles and posts
- Server and client components

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Linting

```bash
# Run ESLint
npm run lint
```

## 🔌 Backend Integration

This frontend connects to the **fedinet-go** backend server.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### API Endpoints

The frontend expects the following backend endpoints:

- **Authentication**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Posts**: `/api/posts`, `/api/posts/:id`, `/api/feed`
- **Users**: `/api/users/:id`, `/api/users/:id/follow`
- **Social**: `/api/posts/:id/like`, `/api/posts/:id/comment`, `/api/posts/:id/repost`
- **Messaging**: `/api/messages`, `/api/messages/:conversationId`
- **Notifications**: `/api/notifications`
- **Search**: `/api/search`

## 📦 Key Components

### Sidebar

Persistent navigation with links to:
- Home (Feed)
- Explore
- Notifications
- Messages
- Profile
- Settings

### PostCard

Displays individual posts with:
- Author information
- Post content (text and images)
- Interaction buttons (like, comment, repost, share)
- Timestamp
- Engagement metrics

### ProfileCard

Shows user profile information:
- Avatar and banner
- Username and bio
- Follower/following counts
- Follow button
- Recent posts

### SearchBar

Real-time search interface:
- Debounced input
- Type filtering (users/posts)
- Result preview
- Navigation to full results

## 🎯 Development Guidelines

### Component Structure

1. **Client Components**: Use `'use client'` directive for interactive components
2. **Server Components**: Default for static content and data fetching
3. **Type Safety**: All components use TypeScript interfaces
4. **Error Handling**: Implement loading and error states

### Styling Conventions

- Use Tailwind CSS utility classes
- Follow the Bat theme color palette
- Implement responsive design (mobile-first)
- Add hover and focus states for accessibility

### Code Organization

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript types from `app/types/`
- Follow Next.js best practices

## 📚 Additional Resources

- **API Integration Guide**: `API_INTEGRATION_GUIDE.ts` - Detailed patterns for connecting to backend
- **Component Checklist**: `COMPONENT_CHECKLIST.md` - Development checklist for new components
- **Frontend Templates**: `FRONTEND_TEMPLATES.md` - Reusable component templates

## 🔐 Authentication

The application uses JWT-based authentication:

1. User logs in with credentials
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in Authorization header for API requests
5. AuthContext manages authentication state

## 🎨 Showcase Mode

The `/showcase` route provides a demo/preview mode with:
- Pre-populated mock data
- All features visible
- Interactive demonstrations
- No backend required

Perfect for:
- UI/UX testing
- Design reviews
- Feature demonstrations
- Frontend development without backend

## 📱 Responsive Design

The application is fully responsive:
- **Mobile**: Optimized for small screens
- **Tablet**: Adaptive layout
- **Desktop**: Full-featured experience

## 🛠️ Admin Dashboard

The `federated-admin/` directory contains a separate admin interface for:
- User management
- Content moderation
- System monitoring
- Analytics

## 🤝 Contributing

When adding new features:

1. Create components in `app/components/`
2. Add type definitions in `app/types/`
3. Implement API routes in `app/api/`
4. Create pages in appropriate directories
5. Update this README with new features

## 📄 License

This project is part of the Federated Social Networking platform.
