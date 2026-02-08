# Frontend Templates - Ready for Backend Integration

This directory contains production-ready frontend templates for the Gotham Social federated social networking application. All components are designed to be easily integrated with backend APIs.

## 📁 Directory Structure

```
app/
├── components/          # Reusable UI components
├── showcase/           # Demo pages with mock data
├── types/              # TypeScript type definitions
├── data/               # Mock data for development
├── context/            # React context providers
└── api/                # API route handlers (Next.js)
```

## 🎨 Core Components

### User Interface Components

1. **PostCard** (`components/PostCard.tsx`)
   - Interactive post display with like, comment, repost, share
   - Threaded comment section
   - Image support
   - Real-time interaction updates
   - Backend integration points: `/api/posts/:id/like`, `/api/posts/:id/comment`

2. **ProfileCard** (`components/ProfileCard.tsx`)
   - Complete user profile display
   - Banner and avatar
   - Bio, location, portfolio link
   - Follower/following stats
   - Post feed integration
   - Backend integration: `/api/users/:id/profile`, `/api/users/:id/posts`

3. **UserCard** (`components/UserCard.tsx`)
   - Compact user display for lists
   - Follow/unfollow functionality
   - Used in followers, following, search results
   - Backend integration: `/api/users/:id/follow`

4. **FollowButton** (`components/FollowButton.tsx`)
   - Reusable follow/unfollow button
   - State management
   - Backend integration: `/api/users/:id/follow`, `/api/users/:id/unfollow`

5. **LikeButton** (`components/LikeButton.tsx`)
   - Animated like button
   - Heart animation
   - Backend integration: `/api/posts/:id/like`

6. **Sidebar** (`components/Sidebar.tsx`)
   - Main navigation
   - User profile display
   - Active route highlighting
   - Responsive design

## 📄 Page Templates

### Showcase Pages (Ready for Production)

All pages in `app/showcase/*` are production-ready templates:

1. **Feed** (`/showcase/feed`)
   - Main timeline
   - Post composition
   - Infinite scroll ready
   - Backend: `GET /api/feed`, `POST /api/posts`

2. **Profile** (`/showcase/profile`)
   - User profile view
   - Post history
   - Edit profile option
   - Backend: `GET /api/users/:id`, `PUT /api/users/:id`

3. **Followers** (`/showcase/followers`)
   - Followers list
   - Remove follower with confirmation
   - Search functionality
   - Backend: `GET /api/users/:id/followers`, `DELETE /api/users/:id/followers/:followerId`

4. **Following** (`/showcase/following`)
   - Following list
   - Unfollow with confirmation
   - Suggested users
   - Backend: `GET /api/users/:id/following`, `DELETE /api/users/:id/following/:userId`

5. **Notifications** (`/showcase/notifications`)
   - Like, follow, comment notifications
   - Read/unread states
   - Backend: `GET /api/notifications`, `PUT /api/notifications/:id/read`

6. **Explore** (`/showcase/explore`)
   - Trending posts
   - User discovery
   - Search functionality
   - Backend: `GET /api/explore/trending`, `GET /api/search?q=`

7. **Messages** (`/showcase/messages`)
   - DM interface
   - Chat list
   - Message composition
   - Backend: `GET /api/messages`, `POST /api/messages`, `GET /api/messages/:conversationId`

## 🔧 Backend Integration Guide

### 1. Replace Mock Data with API Calls

**Example: Feed Page**
```typescript
// Current (mock data):
import { mockPosts } from '../../data/mockData';

// Replace with:
const { data: posts } = await fetch('/api/feed').then(r => r.json());
```

### 2. API Endpoints Needed

#### Posts
- `GET /api/feed` - Get user's feed
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment
- `POST /api/posts/:id/repost` - Repost

#### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `GET /api/users/:id/posts` - Get user's posts
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user

#### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

#### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message

#### Search/Explore
- `GET /api/search?q=&type=` - Search users/posts
- `GET /api/explore/trending` - Trending content

### 3. Authentication Integration

The `AuthContext` (`app/context/AuthContext.tsx`) is ready for backend integration:

```typescript
// Update these functions in AuthContext.tsx:
- loadIdentity() -> Call GET /api/auth/me
- login() -> Call POST /api/auth/login
- logout() -> Call POST /api/auth/logout
```

## 🎨 Design System

### Colors (Tailwind Classes)
- `bat-black` - #0a0a0a (Background)
- `bat-dark` - #1a1a1a (Cards)
- `bat-gray` - #e5e5e5 (Text)
- `bat-yellow` - #f5c518 (Accent)
- `bat-blue` - #1d9bf0 (Links)

### Typography
- Font: Inter (loaded in layout)
- Sizes: text-[15px] for body, text-xl for headers

### Spacing
- Consistent padding: px-4 py-3
- Gap between elements: gap-3

## 📦 Mock Data Structure

See `app/data/mockData.ts` for complete data structures:
- `MockUser` - User profile structure
- `MockPost` - Post structure
- `MockNotification` - Notification structure
- `MockMessage` - Message structure

## 🚀 Quick Start for Backend Team

1. **Keep showcase pages as reference**
2. **Copy component logic to production pages**
3. **Replace mock data imports with API calls**
4. **Update AuthContext with real authentication**
5. **Test with real backend endpoints**

## 📝 TypeScript Types

All types are defined in `app/types/`:
- `post.ts` - Post interface
- `profile.ts` - Profile interface

Match these interfaces with your backend response structures.

## ✅ Production Checklist

- [ ] Replace all mock data with API calls
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Set up authentication flow
- [ ] Configure CORS for API calls
- [ ] Add rate limiting handling
- [ ] Implement optimistic updates
- [ ] Add retry logic for failed requests
- [ ] Set up WebSocket for real-time features
- [ ] Add analytics tracking

## 🎯 Key Features Implemented

✅ Interactive like with animation
✅ Threaded comments
✅ Follow/unfollow with confirmation
✅ Remove follower with confirmation
✅ Repost functionality
✅ Share options
✅ Search and filter
✅ Responsive design
✅ Dark theme (Batman/Gotham style)
✅ Smooth transitions and animations
✅ Empty states
✅ Loading states ready
✅ Error handling ready

## 📞 Support

All components are fully documented with TypeScript types. Check component props and interfaces for integration details.
