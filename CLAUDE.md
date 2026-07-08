# Frontend: Claude-Specific Guidelines

## Quick Start

This is a **Next.js 16** project. Start here:
1. Read [AGENTS.md](AGENTS.md) for Next.js 16 breaking changes
2. Review [../../../.github/copilot-instructions.md](../../.github/copilot-instructions.md) for full project context
3. Run `npm run dev` to start local server on http://localhost:3000

## Key Context

**Stack**: Next.js 16 + React 19 + Tailwind CSS 4 + Supabase + Framer Motion

**Features this frontend supports**:
- Real-time chat (Supabase subscriptions)
- Image posts with reactions and comments
- Communities with typed channels (public/DM)
- Leaderboard and gamification display
- Code repository viewer
- Analytics dashboard
- User settings and profiles

## Important Patterns

### Component Structure
```typescript
'use client'  // Always mark interactive components
import { FC } from 'react'

const MyComponent: FC<Props> = ({ prop }) => {
  // Use hooks, state, etc.
  return (...)
}
```

### Supabase Real-time
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('my-channel')
    .on('postgres_changes', { event: '*' }, (payload) => {
      setData(payload.new)
    })
    .subscribe()
  
  return () => supabase.removeChannel(subscription)
}, [])
```

### Authentication
- OAuth handled by `useAuth()` hook
- Bearer token sent automatically in requests
- User synced to Supabase profiles for real-time chat

### Styling
- Use Tailwind CSS with glassmorphic aesthetic
- Pattern: `bg-white/5 backdrop-blur-xl border border-white/10`
- Framer Motion for state animations

## Common Issues

| Issue | Solution |
|-------|----------|
| Types not found | Run `npm run build` to generate `.next/` |
| Supabase not connecting | Verify URLs and anon key in [src/lib/env.ts](src/lib/env.ts) |
| Real-time not updating | Check subscription lifecycle in useEffect cleanup |
| Lint errors | Run `npm run lint` and fix ESLint + Next.js issues |

## File Organization

```
src/
├── app/              # Pages (App Router)
├── components/       # Reusable UI
│   ├── chat/         # Chat-specific components
│   ├── communities/  # Community features
│   └── ui/           # Shared atoms
├── hooks/            # useAuth, useGamification
├── lib/              # Utilities (Supabase client, env)
└── types/            # TypeScript definitions
```

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Production server
```

---

See [AGENTS.md](AGENTS.md) for detailed Next.js 16 migration notes.
