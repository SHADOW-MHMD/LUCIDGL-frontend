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

## Testing

⚠️ **No testing infrastructure exists yet**. This is a known gap.

**Current state**:
- No Jest, Vitest, or Testing Library configured
- No test files
- No test dependencies

**To add testing**: Agents should propose or implement:
1. Install Testing Library: `npm install --save-dev @testing-library/react @testing-library/jest-dom vitest`
2. Create `vitest.config.ts` (configure for Next.js 16 + React 19)
3. Add test scripts to `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui"
     }
   }
   ```
4. Create test files in `src/` (e.g., `src/components/chat/__tests__/ChatArea.test.tsx`)

**Backend has Vitest + Workers pool** — See [backend/lucid-gl/AGENTS.md](../../backend/lucid-gl/AGENTS.md#testing) for pattern to follow.

## Deployment

**Deployment target**: Vercel (recommended for Next.js 16)

**Pre-deploy checklist**:
1. Run `npm run lint` — Fix any ESLint errors
2. Run `npm run build` — Ensure production build succeeds
3. Verify environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (backend URL)

**Deploy to Vercel**:
```bash
# Option 1: Git push (recommended)
git push origin main
# Vercel auto-deploys on push

# Option 2: Vercel CLI
npm install -g vercel
vercel deploy
```

**Alternative deployment** (self-hosted):
```bash
npm run build
npm run start  # Requires Node.js 18+
```

**Post-deploy**:
- Verify Supabase connection (check browser Network tab for `/auth/` requests)
- Test real-time chat (open in 2 browser windows)
- Check backend API URL is correct (Network tab → `/api/...` requests)

## Common Tasks

| Task | File/Pattern |
|------|-----------|
| Add a new route | Create `app/(main)/my-feature/page.tsx` |
| Add a component | Create in `src/components/` with `'use client'` if interactive |
| Query Supabase | Use `src/lib/supabase.ts` client + real-time subscriptions |
| Call backend API | Fetch to `/api/...` or use `useAuth` hook for auth context |
| Add state persistence | Use React Context + `useEffect` with localStorage (chat, sidebar state) |
| Style with Glassmorphism | `bg-white/5 backdrop-blur-xl border border-white/10` |
| Add a test | Create `src/components/__tests__/MyComponent.test.tsx` (after testing infrastructure is set up) |

## Troubleshooting

- **Next.js 16 types not found**: Run `npm run build` first to generate `.next/`
- **Supabase connection fails**: Check `env.ts` URLs and anon key
- **Real-time not updating**: Verify Supabase subscription is active in `useEffect` cleanup
- **Lint errors on `use client`**: Ensure directive is on **first line** of file
- **Backend API 401 errors**: Verify bearer token is valid; check backend logs for token validation details

---

See [.github/copilot-instructions.md](../../.github/copilot-instructions.md) for full project context.
