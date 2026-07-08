# Frontend: Next.js 16 + React 19

## ⚠️ Breaking Changes Alert

This is **Next.js 16 with React 19**. Your training data is likely outdated. Before writing any code:
1. Check [Node.js React docs](https://react.dev) for use-client/use-server directives
2. Review [Next.js 16 App Router](https://nextjs.org/docs/app) for layout/page conventions
3. Verify any deprecated APIs in `node_modules/next/dist/docs/`

## Commands

```bash
npm run dev          # http://localhost:3000 (hot reload)
npm run build        # Production build
npm run lint         # ESLint with Next.js config
```

## Architecture

**App Router Structure** (app/ directory):
- `layout.tsx` — Root layout + provider wrapper
- `(main)/layout.tsx` — Main app layout
- `(main)/page.tsx` — Dashboard
- Feature routes: `chat/`, `reels/`, `code/`, `leaderboard/`, `discover/`, `analytics/`, `faces/`, `settings/`, `messages/`

**Components** (`src/components/`):
- `chat/` — Chat UI, channel sidebar, modals (community/DM creation, settings)
- `communities/` — Community features (invites)
- `ui/` — Shared UI atoms (context menu, badges, etc.)

**Hooks** (`src/hooks/`):
- `useAuth.tsx` — OAuth login flow + user registration (calls `/api/users/register`)
- `useGamification.ts` — Caches user levels, computes badge tier

**Styling**: Tailwind CSS 4 + Framer Motion for animations

## Key Patterns

**State Management**:
- Supabase Real-time subscriptions for chat messages/presence
- React Context (`ReelsContext.tsx`, `ReelsSidebarRobot.tsx`) for shared UI state
- Component-level `status: 'idle' | 'dragging' | 'success' | 'error'` for animations

**Authentication**:
- OAuth (Google) via `useAuth.tsx`
- Bearer token sent in headers to backend
- User profile dual-written to Supabase for real-time chat

**Chat System**:
- Supabase Realtime subscriptions for messages
- `ChatArea.tsx` batches user level fetches (1 POST per render, not per message)
- Presence tracking for typing indicators

**Supabase Config**: See [src/lib/env.ts](src/lib/env.ts) (anon key is public/intentional)

## Common Tasks

| Task | File/Pattern |
|------|-----------|
| Add a new route | Create `app/(main)/my-feature/page.tsx` |
| Add a component | Create in `src/components/` with `'use client'` if interactive |
| Query Supabase | Use `src/lib/supabase.ts` client + real-time subscriptions |
| Call backend API | Fetch to `/api/...` or use `useAuth` hook for auth context |
| Add state persistence | Use React Context + `useEffect` with localStorage (chat, sidebar state) |
| Style with Glassmorphism | `bg-white/5 backdrop-blur-xl border border-white/10` |

## Troubleshooting

- **Next.js 16 types not found**: Run `npm run build` first to generate `.next/`
- **Supabase connection fails**: Check `env.ts` URLs and anon key
- **Real-time not updating**: Verify Supabase subscription is active in `useEffect` cleanup
- **Lint errors on `use client`**: Ensure directive is on first line of file

---

See [.github/copilot-instructions.md](../../.github/copilot-instructions.md) for full project context.
