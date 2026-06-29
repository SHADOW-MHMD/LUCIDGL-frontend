# LucidGL Frontend Design Revamp Plan

> **Executor**: Code Writer Agent  
> **Author**: Planner Agent  
> **Date**: 2026-06-29  
> **Status**: Ready for execution

---

## 0. Pre-flight: Install & Global Setup

### 0.1 Install Framer Motion
```bash
cd /workspaces/codespaces-blank/frontend
npm install framer-motion
```

### 0.2 `frontend/src/app/globals.css` — Full Replacement

Replace the entire file with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@import "tailwindcss";

:root {
  --background: #0a0a0f;
  --surface: #0d0d1a;
  --foreground: #f1f5f9;
  --muted: rgba(241,245,249,0.5);
  --border: rgba(255,255,255,0.08);
  --accent-primary: #6366f1;
  --accent-hover: #818cf8;
  --accent-secondary: #22d3ee;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

* {
  box-sizing: border-box;
}

html {
  font-family: 'Inter', system-ui, sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes nitroShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.nitro-badge {
  background: linear-gradient(90deg, #b8860b, #ffd700, #ffec8b, #ffd700, #b8860b);
  background-size: 200% auto;
  animation: nitroShimmer 2.5s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.nitro-border {
  border-color: #ffd700;
  box-shadow: 0 0 16px 2px rgba(255,215,0,0.18);
  animation: nitroPulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
}
@keyframes nitroPulse {
  0%,100% { box-shadow: 0 0 16px 2px rgba(255,215,0,0.18); }
  50%      { box-shadow: 0 0 28px 6px rgba(255,215,0,0.38); }
}
```

**Key changes from current globals.css:**
- Add Google Fonts Inter import at top
- `--background` changes from `#020617` → `#0a0a0f`
- Add new CSS custom properties: `--surface`, `--accent-primary`, `--accent-hover`, `--accent-secondary`
- Set `font-family: 'Inter'` on both `html` and `body`
- Add `-webkit-font-smoothing: antialiased` for crisp text
- Move nitro keyframe animations from settings page inline `<style>` to globals (and rename `pulse` → `nitroPulse` to avoid Tailwind clash)
- Remove the settings page inline `<style>` block entirely

---

## 1. `frontend/src/app/(main)/page.tsx` — Landing Page

### Current state summary
- Blue-toned badge (`bg-blue-500/10 border-blue-500/20 text-blue-300`)
- H1 gradient span: `from-blue-400 to-indigo-500`
- CTA outer wrapper gradient: `bg-gradient-to-r from-blue-500/30 to-indigo-500/30` with inner `bg-slate-900/80`
- Feature cards: `bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl hover:bg-white/10`
- Feature icons: yellow-400 (Zap), green-400 (Shield), blue-400 (LayoutGrid)
- Subtitle: `text-slate-400`

### 1.1 Layout changes
- Keep `flex flex-col items-center justify-center py-20 text-center` — no layout change
- Feature grid: keep `grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl`
- Wrap entire JSX in `<motion.div>` page entrance wrapper
- **Remove** the double-div CTA wrapper (outer gradient div + inner button div); flatten to a single motion.button

### 1.2 Exact color replacements

| Element | Old classes | New classes |
|---|---|---|
| Badge pill | `bg-blue-500/10 border-blue-500/20 text-blue-300` | `bg-indigo-500/10 border-indigo-500/20 text-indigo-300` |
| Badge pulse dot | `bg-blue-400` | `bg-indigo-400` |
| H1 gradient span | `from-blue-400 to-indigo-500` | `from-indigo-400 to-violet-500` |
| CTA outer gradient wrapper | `bg-gradient-to-r from-blue-500/30 to-indigo-500/30` (div) | **REMOVE this wrapper div entirely** |
| CTA button bg | `bg-slate-900/80 backdrop-blur-xl border border-white/5` | `bg-indigo-600 hover:bg-indigo-500` (solid, no backdrop needed) |
| CTA button hover | `hover:bg-slate-800` | replaced by above |
| Feature cards | `bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl hover:bg-white/10` | `bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl hover:bg-white/[0.05] hover:border-indigo-500/20` |
| Feature icon containers | `bg-white/10 border border-white/5` | `bg-white/[0.05] border border-white/[0.08]` |
| Zap icon | `text-yellow-400` | `text-indigo-400` |
| Shield icon | `text-green-400` | `text-cyan-400` |
| LayoutGrid icon | `text-blue-400` | `text-violet-400` |
| Subtitle paragraph | `text-slate-400` | `text-slate-400` (no change) |
| H3 card titles | `text-white/90` | `text-white/90` (no change) |
| Card desc | `text-slate-400` | `text-slate-400` (no change) |

### 1.3 Framer Motion animations

Add to imports:
```tsx
import { motion } from "framer-motion";
```

**Page wrapper** — wrap entire return div:
```tsx
<motion.div
  className="flex flex-col items-center justify-center py-20 text-center"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
```

**Badge pill:**
```tsx
<motion.div
  initial={{ opacity: 0, y: -12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8"
>
```

**H1 heading:**
```tsx
<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/40"
>
```

**Subtitle paragraph:**
```tsx
<motion.p
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.3 }}
  className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
>
```

**CTA button (replaces the entire outer+inner div structure):**
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.4 }}
  className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20"
>
  <motion.button
    onClick={signIn}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group transition-colors duration-200"
  >
    Sign in to start earning XP
    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
  </motion.button>
</motion.div>
```

**Feature cards** — convert `.map()` to staggered motion:
```tsx
{[...features].map((feature, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
    whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 20 } }}
    className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] shadow-xl flex flex-col items-center text-center hover:bg-white/[0.05] hover:border-indigo-500/20 transition-colors duration-300"
  >
    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
      {feature.icon}
    </div>
    <h3 className="text-lg font-bold text-white/90 mb-2">{feature.title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
  </motion.div>
))}
```

### 1.4 Typography changes
- H1: keep `text-5xl md:text-7xl font-extrabold tracking-tight` — Inter inherited from globals
- CTA button text: add `tracking-wide` to `font-semibold`
- No other typography changes needed

### 1.5 Button/CTA style updates
- Remove double-wrapper div pattern; use a single `motion.button` with solid `bg-indigo-600`
- Add `shadow-lg shadow-indigo-500/25` for a branded glow
- Arrow icon keeps `group-hover:translate-x-1 transition-transform`

---

## 2. `frontend/src/components/Navigation.tsx` — Bottom Dock

### Current state summary
- Dock container: `bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl`
- Active link: `bg-white/20 shadow-lg scale-110` + icon `text-blue-400`
- Inactive icon: `text-white`
- Hover: `hover:bg-white/10 hover:scale-105`
- Profile button: `hover:bg-white/10 hover:scale-105`
- Profile menu: `bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl`
- Settings link hover: `hover:bg-white/10`

### 2.1 Layout changes
- No layout changes — dock structure stays the same
- Remove CSS `scale-110` / `scale-105` from static classes; replace with Framer Motion `whileHover`

### 2.2 Exact color replacements

| Element | Old classes | New classes |
|---|---|---|
| Dock container | `bg-white/[0.03] backdrop-blur-xl border border-white/10` | `bg-[#0d0d1a]/80 backdrop-blur-xl border border-white/[0.08]` |
| Active link bg | `bg-white/20 shadow-lg scale-110` | `bg-indigo-600/20 shadow-lg shadow-indigo-500/20` (remove scale) |
| Active icon | `text-blue-400` | `text-indigo-400` |
| Inactive icon | `text-white` | `text-white/70` |
| Inactive hover bg | `hover:bg-white/10 hover:scale-105` | `hover:bg-white/[0.06]` (remove scale) |
| Divider | `bg-white/10` | `bg-white/[0.08]` |
| Profile menu bg | `bg-black/80 backdrop-blur-xl border border-white/10` | `bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/[0.08]` |
| Settings link hover | `hover:bg-white/10` | `hover:bg-indigo-500/10 hover:text-indigo-300` |
| Sign out: no change | `hover:bg-red-500/20 text-red-400/80 hover:text-red-400` | (keep — red for danger is correct) |
| Profile button hover | `hover:bg-white/10 hover:scale-105` | `hover:bg-white/[0.06]` (remove scale) |

### 2.3 Framer Motion animations

Add to imports:
```tsx
import { motion, AnimatePresence } from "framer-motion";
```

**Each nav Link** — wrap in `motion.div`:
```tsx
<motion.div
  key={href}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.92 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className="relative"
>
  <Link
    href={href}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${
      isActive
        ? "bg-indigo-600/20 shadow-lg shadow-indigo-500/20"
        : "hover:bg-white/[0.06]"
    }`}
    title={label}
  >
    <Icon size={24} className={isActive ? "text-indigo-400" : "text-white/70"} />
  </Link>
  {isActive && (
    <motion.div
      layoutId="nav-active-dot"
      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400"
    />
  )}
</motion.div>
```

**Profile button:**
```tsx
<motion.button
  onClick={() => setShowProfileMenu(!showProfileMenu)}
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.94 }}
  transition={{ type: "spring", stiffness: 400, damping: 22 }}
  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 hover:bg-white/[0.06]"
>
```

**Profile menu popup — AnimatePresence:**
```tsx
<AnimatePresence>
  {showProfileMenu && (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute bottom-full mb-4 right-0 w-48 bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50"
    >
      {/* Settings link and Sign Out button — unchanged internally */}
    </motion.div>
  )}
</AnimatePresence>
```

### 2.4 Typography changes
- Link title attributes: no change
- Profile menu text: `text-sm` stays; no explicit font changes needed
- All font-family inherited from globals (Inter)

### 2.5 Button/CTA style updates
- Active nav items: slide `layoutId="nav-active-dot"` indicator provides visual continuity
- Remove all Tailwind `scale-*` and `hover:scale-*` from nav links — replaced by Framer Motion spring

---

## 3. `frontend/src/app/(main)/reels/page.tsx` — Reels Feed

### Current state summary
- Loading spinner: `border-4 border-t-blue-500 border-white/10`
- Empty state text: `text-slate-400`
- ReelCard container: `bg-slate-900 border border-white/10 rounded-[2.5rem]`
- Overlay gradient: `from-black/80 via-black/40 to-transparent`
- Like button active: `bg-red-500/20 text-red-500`
- Like button inactive: `bg-black/20 text-white group-hover:bg-white/10`
- Comment/Share buttons: `bg-black/20 text-white backdrop-blur-md group-hover:bg-white/10`
- Username avatar: `from-indigo-500 to-purple-600` (keep — already good)
- Badge pill: `bg-white/20 backdrop-blur-md text-white tracking-wider`
- PAUSED badge: `bg-white/20 backdrop-blur-md` with `font-bold text-xs tracking-widest`

### 3.1 Layout changes
- Main container: keep `flex flex-col items-center py-6`
- Scroll container: keep `w-full max-w-md flex flex-col gap-8 snap-y snap-mandatory`
- Action buttons column: keep `flex flex-col gap-6 items-center z-40`
- No structural changes — animate existing structure

### 3.2 Exact color replacements

| Element | Old classes | New classes |
|---|---|---|
| Loading spinner border-t | `border-t-blue-500` | `border-t-indigo-500` |
| Loading spinner body | `border-white/10` | `border-white/[0.08]` |
| Loading text | `text-white/60` | `text-white/50` |
| Empty state | `text-slate-400` | `text-white/40` |
| ReelCard bg | `bg-slate-900` | `bg-[#0d0d1a]` |
| ReelCard border | `border border-white/10` | `border border-white/[0.08]` |
| Badge pill | `bg-white/20 backdrop-blur-md text-white tracking-wider` | `bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/20 text-indigo-200 tracking-wider` |
| Like active | `bg-red-500/20 text-red-500` | `bg-rose-500/20 text-rose-400` |
| Like inactive | `bg-black/20 text-white group-hover:bg-white/10` | `bg-black/30 text-white/80 group-hover:bg-white/[0.12]` |
| Comment button | `bg-black/20 text-white backdrop-blur-md group-hover:bg-white/10` | `bg-black/30 text-white/80 backdrop-blur-md group-hover:bg-white/[0.12]` |
| Share button | (same as comment) | (same new pattern) |
| Heart icon active fill | `fill-red-500` | `fill-rose-400` |
| PAUSED overlay backdrop | `bg-white/20 backdrop-blur-md` | `bg-black/30 backdrop-blur-md border border-white/[0.08]` |
| PAUSED text | `text-white font-bold text-xs tracking-widest` | `text-white/60 font-medium text-xs tracking-[0.2em]` |

### 3.3 Framer Motion animations

Add to imports (at `ReelsPage` component level):
```tsx
import { motion } from "framer-motion";
```

**Loading state entrance:**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
>
```

**Each ReelCard in the list** — stagger entrance:
```tsx
{reels.map((reel, index) => (
  <motion.div
    key={reel.id}
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
  >
    <ReelCard reel={reel} onOpenComments={() => setActiveCommentPostId(reel.id)} />
  </motion.div>
))}
```

**Inside `ReelCard` — like button with spring tap:**
```tsx
<motion.button
  type="button"
  onClick={handleLike}
  whileTap={{ scale: 1.4 }}
  transition={{ type: "spring", stiffness: 500, damping: 20 }}
  className="flex flex-col items-center gap-1 group relative z-40"
>
  <motion.div
    animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
    transition={{ duration: 0.3 }}
    className={`p-3 rounded-full backdrop-blur-md transition-colors ${
      isLiked ? 'bg-rose-500/20 text-rose-400' : 'bg-black/30 text-white/80 group-hover:bg-white/[0.12]'
    }`}
  >
    <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-400' : ''}`} />
  </motion.div>
  <span className="text-white font-medium text-xs drop-shadow-md">{likes}</span>
</motion.button>
```

**Comment button:**
```tsx
<motion.button
  onClick={onOpenComments}
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.92 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className="flex flex-col items-center gap-1 group relative z-40"
>
```

**Share button:**
```tsx
<motion.button
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.92 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className="flex flex-col items-center gap-1 group"
>
```

**MoreVertical button:**
```tsx
<motion.button
  whileHover={{ rotate: 90 }}
  transition={{ duration: 0.2 }}
  className="p-2 text-white/80 hover:text-white transition-colors"
>
```

### 3.4 Typography changes
- Username: keep `font-bold text-white`
- Caption: keep `text-white/90 text-sm drop-shadow-md`
- Like/comment counts: keep `text-white font-medium text-xs`
- Badge tracking: `tracking-wider` stays

### 3.5 Button/CTA style updates
- All action buttons: apply Framer Motion spring (see 3.3)
- Remove static Tailwind `hover:scale-*` from any action buttons

---

## 4. `frontend/src/app/(main)/discover/page.tsx` — Discover Page

### Current state summary
- Loading spinner: `border-t-white border-white/20`
- H1: `from-blue-400 to-indigo-500`
- Subtitle: `text-slate-400`
- Section Code2 icon: `text-blue-400`
- Cards: `bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-3xl hover:bg-white/[0.05]`
- Level badge: `bg-blue-500/20 text-blue-300`
- XP stat box: `bg-black/20 rounded-xl`
- Code type badge: `bg-indigo-500/20 text-indigo-300 border border-indigo-500/30`
- Downloads badge: `text-emerald-400 bg-emerald-400/10`
- Author name: `text-slate-500`
- Empty states: `text-slate-500`

### 4.1 Layout changes
- Keep `max-w-6xl mx-auto py-12 px-4 space-y-16`
- Keep all `grid grid-cols-1 md:grid-cols-3 gap-6` grids
- **Card border-radius**: `rounded-3xl` → `rounded-2xl` on all cards (aligns with design system)
- Add `motion.section` wrappers for scroll-reveal per section

### 4.2 Exact color replacements

| Element | Old classes | New classes |
|---|---|---|
| Loading spinner | `border-t-white border-white/20` | `border-t-indigo-400 border-white/[0.08]` |
| Loading text | `text-white/70` | `text-white/50` |
| H1 gradient | `from-blue-400 to-indigo-500` | `from-indigo-400 to-violet-400` |
| Subtitle | `text-slate-400` | `text-white/50` |
| Code2 icon | `text-blue-400` | `text-indigo-400` |
| All cards border | `border-white/[0.1]` | `border-white/[0.08]` |
| All cards shape | `rounded-3xl` | `rounded-2xl` |
| All cards hover | `hover:bg-white/[0.05]` | `hover:bg-white/[0.04] hover:border-indigo-500/20` |
| Level badge | `bg-blue-500/20 text-blue-300` | `bg-indigo-500/15 text-indigo-300 border border-indigo-500/20` |
| XP stat box | `bg-black/20 rounded-xl` | `bg-white/[0.04] border border-white/[0.06] rounded-xl` |
| XP label | `text-slate-400 text-sm` | `text-white/40 text-xs font-medium uppercase tracking-wider` |
| XP value | `font-mono font-bold text-white` | `font-mono font-bold text-white text-lg` |
| Code type badge | `bg-indigo-500/20 text-indigo-300 border-indigo-500/30` | keep (already correct) |
| Downloads badge | `text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full` | `text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/15` |
| Author name | `text-slate-500` | `text-white/40` |
| Empty state text | `text-slate-500` | `text-white/30` |
| Image placeholder | `text-white/20` | `text-white/15` |

### 4.3 Framer Motion animations

Add to imports:
```tsx
import { motion } from "framer-motion";
```

**Page entrance:**
```tsx
<motion.div
  className="max-w-6xl mx-auto py-12 px-4 space-y-16"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}
>
```

**Header (h1 + subtitle):**
```tsx
<motion.div
  className="text-center mt-10"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
>
```

**Each `<section>` — scroll reveal:**
```tsx
<motion.section
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-60px" }}
  transition={{ duration: 0.45, ease: "easeOut" }}
>
```

**Each card in top_users grid — staggered lift on hover:**
```tsx
{data?.top_users?.slice(0, 3).map((user, i) => (
  <motion.div
    key={user.id || i}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.35, delay: i * 0.08 }}
    whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
    className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 shadow-xl hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors"
  >
```

Apply **identical stagger pattern** to `trending_code` cards and `top_faces` cards (swap `i * 0.08` delay).

**Top Faces card** — add motion wrapper for combined scroll-reveal + hover lift:
```tsx
<motion.div
  key={post.id || i}
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.35, delay: i * 0.08 }}
  whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 22 } }}
  className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors group"
>
```

### 4.4 Typography changes
- H1: keep `text-5xl font-extrabold tracking-tight` — gradient update only
- Section h2: keep `text-3xl font-bold text-white/90`
- Card h3: keep `text-xl font-bold text-white`
- XP label: add `uppercase tracking-wider text-xs` (see 4.2 table)
- Downloads badge label count: keep `font-semibold`

### 4.5 Button/CTA style updates
- No primary CTA buttons on discover page
- Downloads badge: add `cursor-default select-none`

---

## 5. `frontend/src/app/(main)/code/page.tsx` — Code Hub

### Current state summary
- H1: `text-4xl font-bold text-white tracking-tight`
- Upload section card: `bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-2xl`
- Upload icon heading: `text-blue-400`
- Drop zone: `border-2 border-dashed border-white/20 hover:border-blue-400/50`
- `.zip` span: `text-green-400`
- `.apk` span: `text-blue-400`
- Textarea focus: `focus:border-blue-500/50`
- Submit button: `from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20`
- APK icon bg: `bg-blue-500/10`, icon: `text-blue-400`
- ZIP icon bg: `bg-green-500/10`, icon: `text-green-400`
- APK badge: `bg-blue-500/20 text-blue-300 border-blue-500/30`
- ZIP badge: `bg-green-500/20 text-green-300 border-green-500/30`
- Download button hover: `hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30`
- Download count: `text-white/30`
- Success message: `text-green-400 bg-green-500/10 border-green-500/20`
- Loader: `text-white/40`

### 5.1 Layout changes
- Keep `min-h-screen pt-28 pb-16 px-4` and `max-w-3xl mx-auto space-y-8`
- No grid changes needed
- Add `group` class to drop zone for icon color transition

### 5.2 Exact color replacements

| Element | Old classes | New classes |
|---|---|---|
| Upload icon (h2) | `text-blue-400` | `text-indigo-400` |
| Drop zone border | `border-white/20 hover:border-blue-400/50` | `border-white/[0.10] hover:border-indigo-500/40` |
| FileArchive icon in drop zone | `text-white/30` | `text-white/25 group-hover:text-indigo-400 transition-colors` |
| `.zip` highlight text | `text-green-400` | `text-cyan-400` |
| `.apk` highlight text | `text-blue-400` | `text-indigo-400` |
| Textarea/input focus | `focus:border-blue-500/50` | `focus:border-indigo-500/50` |
| Submit button gradient | `from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500` | `from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500` |
| Submit button shadow | `shadow-blue-500/20` | `shadow-indigo-500/25` |
| Card border | `border-white/[0.1]` | `border-white/[0.08]` |
| APK icon bg | `bg-blue-500/10` | `bg-indigo-500/10` |
| APK icon | `text-blue-400` | `text-indigo-400` |
| ZIP icon bg | `bg-green-500/10` | `bg-cyan-500/10` |
| ZIP icon | `text-green-400` | `text-cyan-400` |
| APK badge | `bg-blue-500/20 text-blue-300 border-blue-500/30` | `bg-indigo-500/15 text-indigo-300 border-indigo-500/25` |
| ZIP badge | `bg-green-500/20 text-green-300 border-green-500/30` | `bg-cyan-500/15 text-cyan-300 border-cyan-500/25` |
| Download hover | `hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30` | `hover:bg-indigo-500/15 hover:text-indigo-400 hover:border-indigo-500/25` |
| Download count | `text-white/30` | `text-white/40` |
| Success message | `text-green-400 bg-green-500/10 border-green-500/20` | `text-emerald-400 bg-emerald-500/10 border-emerald-500/20` |
| Loader main | `text-white/40` | `text-indigo-400/40` |

### 5.3 Framer Motion animations

Add to imports:
```tsx
import { motion, AnimatePresence } from "framer-motion";
```

**Page entrance:**
```tsx
<motion.div
  className="min-h-screen pt-28 pb-16 px-4"
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

**Header:**
```tsx
<motion.div
  className="text-center"
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
>
```

**Upload card:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.2 }}
  className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6"
>
```

**File list items — AnimatePresence stagger:**
```tsx
<AnimatePresence>
  {files.map((file, i) => (
    <motion.div
      key={file.id}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3, delay: i * 0.05 }}
      whileHover={{ x: 4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors duration-300"
    >
```

**Success/error messages — AnimatePresence:**
```tsx
<AnimatePresence>
  {uploadError && (
    <motion.p
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
    >
      {uploadError}
    </motion.p>
  )}
  {uploadSuccess && (
    <motion.p
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
    >
      ✓ File uploaded successfully!
    </motion.p>
  )}
</AnimatePresence>
```

**Submit button:**
```tsx
<motion.button
  type="submit"
  disabled={!selectedFile || uploading}
  whileHover={!selectedFile || uploading ? {} : { scale: 1.02 }}
  whileTap={!selectedFile || uploading ? {} : { scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 22 }}
  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
>
```

**Download button per file:**
```tsx
<motion.button
  onClick={() => handleDownload(file)}
  disabled={downloadingId === file.id}
  whileHover={downloadingId !== file.id ? { scale: 1.04 } : {}}
  whileTap={{ scale: 0.96 }}
  transition={{ type: "spring", stiffness: 400, damping: 22 }}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-indigo-500/15 hover:text-indigo-400 hover:border-indigo-500/25 border border-white/[0.08] text-white/60 transition-colors duration-200 text-sm font-medium disabled:opacity-40 whitespace-nowrap"
>
```

### 5.4 Typography changes
- H1: keep `text-4xl font-bold text-white tracking-tight`
- H2 sections: `text-white font-semibold text-lg` — no change
- File names: `text-white font-medium text-sm` — no change
- Download count: `text-white/40 text-xs` (was /30)

### 5.5 Button/CTA style updates
- Drop zone: add `group` class to outer div; `FileArchive` icon gets color-transition on group-hover
- All buttons use motion (see 5.3)

---

## 6. `frontend/src/app/messages/page.tsx` — Messages

### Current state summary
- Full-screen layout: `flex h-screen w-full overflow-hidden bg-transparent font-sans`
- Messages page has its own **inline bottom dock** (separate from Navigation.tsx) at lines 284–332
- Inline dock: same glass pattern as Navigation, plus community rings
- Empty "no channel" state: `bg-black/10` with compass icon `text-white/20`
- Auth error: `text-white/90` h2, `text-slate-400` para

### 6.1 Layout changes
- Keep `flex h-screen w-full overflow-hidden`
- No structural changes — update inline dock colors and apply motion
- Empty state: no layout change

### 6.2 Exact color replacements

**Inline bottom dock container (line ~284):**

| Element | Old classes | New classes |
|---|---|---|
| Dock container | `bg-white/[0.03] backdrop-blur-xl border border-white/10` | `bg-[#0d0d1a]/80 backdrop-blur-xl border border-white/[0.08]` |
| Dividers | `bg-white/10` | `bg-white/[0.08]` |
| Back button hover | `hover:bg-white/10 hover:scale-105` | `hover:bg-white/[0.06]` |
| DM button active | `bg-white/20 shadow-lg scale-110` | `bg-indigo-600/20 shadow-lg shadow-indigo-500/20` |
| DM button inactive | `hover:bg-white/10 hover:scale-105` | `hover:bg-white/[0.06]` |
| Community active ring | `ring-2 ring-cyan-500/50 bg-white/20 shadow-lg scale-110` | `ring-2 ring-cyan-400/40 bg-indigo-600/15 shadow-lg shadow-cyan-500/10` |
| Community inactive | `bg-white/5 hover:bg-white/10 hover:scale-105` | `bg-white/[0.04] hover:bg-white/[0.07]` |
| Create community btn | `text-cyan-400` | `text-cyan-400` (keep — already cyan accent) |
| Create community hover | `hover:bg-white/10 hover:scale-105` | `hover:bg-white/[0.06]` |

**Empty "no channel" state (line ~210):**

| Element | Old classes | New classes |
|---|---|---|
| Outer bg | `bg-black/10` | `bg-[#0a0a0f]/40` |
| Icon container | `bg-white/5 border border-white/10` | `bg-white/[0.04] border border-white/[0.08]` |
| Compass icon | `text-white/20` | `text-white/15` |
| H2 | `text-white/60 text-xl font-bold` | `text-white/50 text-lg font-semibold` |
| Subtitle | `text-white/30` | `text-white/30` (no change) |

**Auth error state (line ~158):**

| Element | Old classes | New classes |
|---|---|---|
| Para | `text-slate-400` | `text-white/50` |

### 6.3 Framer Motion animations

Add to imports:
```tsx
import { motion, AnimatePresence } from "framer-motion";
```

**All inline dock buttons** — replace static `hover:scale-105` with motion:
```tsx
// Back button
<motion.button
  onClick={() => router.push('/reels')}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06]"
  title="Back to Reels"
>

// DM button
<motion.button
  onClick={() => setSelectedCommunityId(null)}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
    selectedCommunityId === null
      ? 'bg-indigo-600/20 shadow-lg shadow-indigo-500/20'
      : 'hover:bg-white/[0.06]'
  }`}
  title="Direct Messages"
>

// Community buttons
{communities.map(c => (
  <motion.button
    key={c.id}
    onClick={() => setSelectedCommunityId(c.id)}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors overflow-hidden ${
      selectedCommunityId === c.id
        ? 'ring-2 ring-cyan-400/40 bg-indigo-600/15 shadow-lg shadow-cyan-500/10'
        : 'bg-white/[0.04] hover:bg-white/[0.07]'
    }`}
    title={c.name}
  >

// Create community button (add rotate on hover for playfulness)
<motion.button
  onClick={() => setIsCreatingCommunity(true)}
  whileHover={{ scale: 1.1, rotate: 5 }}
  whileTap={{ scale: 0.9 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06] text-cyan-400"
  title="Create Community"
>
```

**Empty state — animate in:**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.96 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
  className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0a0a0f]/40"
>
```

### 6.4 Typography changes
- "No channel selected" h2: `text-white/60 text-xl font-bold` → `text-white/50 text-lg font-semibold`
- Auth error para: `text-slate-400` → `text-white/50`

### 6.5 Button/CTA style updates
- All inline dock buttons: apply motion wrappers (see 6.3)
- Remove all static `scale-110` and `hover:scale-105` Tailwind classes from dock buttons

---

## 7. `frontend/src/app/(main)/settings/page.tsx` — Settings

### Current state summary
- Has an inline `<style>` block (lines 97–119) with `nitroShimmer` and `pulse` keyframes — **REMOVE THIS BLOCK** (moved to globals.css)
- H1: `text-4xl font-bold text-white tracking-tight`
- Card: `bg-white/[0.03] backdrop-blur-lg border rounded-2xl p-6`
- Non-nitro border: `border-white/[0.1]`
- Inputs/textarea focus: `focus:border-blue-500/50`
- Save button: `from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20`
- Avatar placeholder: `bg-white/10 border-2 border-white/20`
- Labels: `text-white/70 text-xs font-medium`
- Loader: `text-white/40`

### 7.1 Layout changes
- Keep `min-h-screen pt-28 pb-16 px-4` and `max-w-xl mx-auto space-y-8`
- **Remove** the inline `<style>` JSX block entirely (styles now in globals.css)
- Avatar + username row: `flex items-center gap-4` — no change
- Form: `space-y-5` — no change

### 7.2 Exact color replacements

| Element | Old classes | New classes |
|---|---|---|
| Inline `<style>` block | present (lines 97–119) | **DELETE ENTIRELY** |
| Input focus | `focus:border-blue-500/50` | `focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20` |
| Textarea focus | `focus:border-blue-500/50` | `focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20` |
| Save button gradient | `from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500` | `from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500` |
| Save button shadow | `shadow-blue-500/20` | `shadow-indigo-500/25` |
| Non-nitro border | `border-white/[0.1]` | `border-white/[0.08]` |
| Avatar placeholder bg | `bg-white/10` | `bg-white/[0.06]` |
| Avatar placeholder border | `border-2 border-white/20` | `border-2 border-white/[0.12]` |
| Avatar image border | `border-2 border-white/20` | `border-2 border-white/[0.12]` |
| User2 icon | `text-white/40` | `text-white/30` |
| Loader | `text-white/40` | `text-indigo-400/40` |
| Email | `text-white/40 text-xs` | `text-white/35 text-xs` |
| Labels | `text-white/70 text-xs font-medium` | `text-white/60 text-xs font-medium uppercase tracking-wider` |

### 7.3 Framer Motion animations

Add to imports:
```tsx
import { motion, AnimatePresence } from "framer-motion";
```

**Page entrance:**
```tsx
<motion.div
  className="min-h-screen pt-28 pb-16 px-4"
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

**Settings card:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.45, delay: 0.15 }}
  className={`bg-white/[0.03] backdrop-blur-sm border rounded-2xl p-6 space-y-6 transition-all duration-300 ${nitroTier > 0 ? "nitro-border border" : "border-white/[0.08]"}`}
>
```

**Avatar image — fade-in on load:**
```tsx
<motion.img
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
  src={avatarUrl}
  alt="Avatar preview"
  className="w-16 h-16 rounded-full object-cover border-2 border-white/[0.12]"
  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
/>
```

**Save button:**
```tsx
<motion.button
  type="submit"
  disabled={saving}
  whileHover={!saving ? { scale: 1.02 } : {}}
  whileTap={!saving ? { scale: 0.97 } : {}}
  transition={{ type: "spring", stiffness: 400, damping: 22 }}
  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
>
```

**Success/error banners — AnimatePresence:**
```tsx
<AnimatePresence>
  {saveError && (
    <motion.p
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
    >
      {saveError}
    </motion.p>
  )}
  {saveSuccess && (
    <motion.p
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
    >
      ✓ Profile saved successfully!
    </motion.p>
  )}
</AnimatePresence>
```

### 7.4 Typography changes
- H1: keep `text-4xl font-bold text-white tracking-tight`
- Labels: add `uppercase tracking-wider` (see 7.2)
- Username display: `text-white font-semibold` — no change
- Bio char count: keep `tabular-nums`

### 7.5 Button/CTA style updates
- Save button: motion wrapper with spring (see 7.3)
- Inputs get soft focus ring: `focus:ring-1 focus:ring-indigo-500/20` (see 7.2)

---

## 8. `frontend/src/app/(main)/analytics/page.tsx` — Analytics

### Current state summary
- H1: `text-4xl font-bold text-white tracking-tight`
- H1 subtitle: `text-white/50 mt-2 text-sm`
- Stats grid: `grid-cols-1 sm:grid-cols-3 gap-4`
- Cards: `bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-2xl hover:bg-white/[0.05] hover:border-white/[0.15]`
- Icons: purple-400 (impressions), blue-400 (downloads), pink-400 (upvotes)
- Icon bgs: purple-500/10, blue-500/10, pink-500/10
- Icon borders: purple-500/20, blue-500/20, pink-500/20
- Stat value: `text-5xl font-bold text-white tabular-nums`
- Stat label: `text-white/50 text-sm mt-2 font-medium`
- Loader: `text-white/40`
- Footer note: `text-white/25 text-xs`

### 8.1 Layout changes
- Keep `min-h-screen pt-28 pb-16 px-4` and `max-w-4xl mx-auto space-y-8`
- Stats grid: keep `grid-cols-1 sm:grid-cols-3 gap-4`
- No structural changes — animate existing structure

### 8.2 Exact color replacements

Update the `stats` array construction to use new colors:
```tsx
const stats = analytics
  ? [
      {
        label: "Profile Impressions",
        value: analytics.impressions,
        icon: Eye,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20"
      },
      {
        label: "File Downloads",
        value: analytics.downloads,
        icon: Download,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20"
      },
      {
        label: "Upvotes Received",
        value: analytics.upvotes_received,
        icon: ThumbsUp,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
        border: "border-violet-500/20"
      },
    ]
  : [];
```

Then update card classes:

| Element | Old classes | New classes |
|---|---|---|
| Card border | `border-white/[0.1]` | `border-white/[0.08]` |
| Card hover bg | `hover:bg-white/[0.05]` | `hover:bg-white/[0.04]` |
| Card hover border | `hover:border-white/[0.15]` | `hover:border-indigo-500/20` |
| Stat label | `text-white/50 text-sm mt-2 font-medium` | `text-white/40 text-xs mt-2 font-medium uppercase tracking-wider` |
| Loader | `text-white/40` | `text-indigo-400/40` |
| Footer note | `text-white/25 text-xs` | `text-white/20 text-xs` |

### 8.3 Framer Motion animations

Add to imports:
```tsx
import { motion } from "framer-motion";
```

**Page entrance:**
```tsx
<motion.div
  className="min-h-screen pt-28 pb-16 px-4"
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

**Header:**
```tsx
<motion.div
  className="text-center"
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
>
```

**Stats grid — stagger children with variants:**
```tsx
<motion.div
  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }}
>
  {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
    <motion.div
      key={label}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
      }}
      whileHover={{
        y: -6,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors duration-300 cursor-default"
    >
      <div className={`p-3 rounded-xl ${bg} border ${border} mb-4`}>
        <Icon size={24} className={color} />
      </div>
      <motion.span
        className="text-5xl font-bold text-white tabular-nums"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      >
        {value.toLocaleString()}
      </motion.span>
      <span className="text-white/40 text-xs mt-2 font-medium uppercase tracking-wider">
        {label}
      </span>
    </motion.div>
  ))}
</motion.div>
```

**Stat number count-up** (optional enhancement — add `AnimatedNumber` component at bottom of file):
```tsx
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value);
      setDisplay(Math.round(current));
      if (step >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}
```
Replace `{value.toLocaleString()}` inside stat card span with `<AnimatedNumber value={value} />`.

**Footer note — delayed fade in:**
```tsx
<motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4, delay: 0.7 }}
  className="text-center text-white/20 text-xs"
>
  Stats refresh on each page load
</motion.p>
```

### 8.4 Typography changes
- H1: keep `text-4xl font-bold text-white tracking-tight`
- Stat label: add `uppercase tracking-wider`, reduce to `text-xs` (see 8.2)
- Stat value: keep `text-5xl font-bold text-white tabular-nums`

### 8.5 Button/CTA style updates
- No CTA buttons on analytics page
- Stat cards: add `cursor-default` class

---

## 9. Execution Order

Execute in this exact order to minimize risk:

1. `npm install framer-motion`
2. **`globals.css`** — all pages depend on Inter font and CSS vars
3. **`Navigation.tsx`** — affects every page; complete before testing others
4. **`page.tsx`** (landing) — standalone, safest to do early
5. **`analytics/page.tsx`** — simplest page, fewest dependencies
6. **`settings/page.tsx`** — remove `<style>` block, update colors
7. **`discover/page.tsx`** — medium complexity, `whileInView` scroll reveals
8. **`code/page.tsx`** — medium complexity, `AnimatePresence` for list items
9. **`reels/page.tsx`** — complex (video + optimistic state + like animation)
10. **`messages/page.tsx`** — most complex; touch only inline dock + empty state

---

## 10. Validation Checklist

After executing all changes, verify:

- [ ] Inter font loads from Google Fonts (check Network tab for `fonts.googleapis.com`)
- [ ] Background is visibly `#0a0a0f` (deep near-black with blue tint), not pure black
- [ ] All `from-blue-*` / `to-blue-*` gradient classes replaced with `indigo/violet`
- [ ] All active/selected nav/dock states use `indigo-600/20` glow (not `white/20`)
- [ ] Active nav icon color is `text-indigo-400` (not `text-blue-400`)
- [ ] All card borders are `border-white/[0.08]` (not `border-white/10`)
- [ ] Framer Motion page entrance animations trigger on load (y + opacity)
- [ ] `whileHover` spring animations work on cards, buttons, nav items
- [ ] `AnimatePresence` correctly animates profile menu in/out in Navigation
- [ ] Settings page has NO inline `<style>` block (moved to globals.css)
- [ ] Nitro badge still renders correctly using `.nitro-badge` / `.nitro-border` from globals
- [ ] Reels like button has heart scale animation on tap (`whileTap: { scale: 1.4 }`)
- [ ] Analytics stat cards stagger in with `variants` + `staggerChildren` pattern
- [ ] Stat number counter (`AnimatedNumber`) counts up on page load
- [ ] Code Hub file list items slide in from left on mount
- [ ] Upload/save success messages animate in with `AnimatePresence`
- [ ] Messages page inline dock uses motion spring on all buttons (no `hover:scale-*`)
- [ ] No remaining `blue-400`, `blue-500`, `blue-600` color classes anywhere in the 8 files
- [ ] No remaining `bg-slate-900` or `bg-black/80` in dock/card backgrounds

---

## 11. Color Quick-Reference Card

| Semantic Role | Old Tailwind | New Tailwind |
|---|---|---|
| Primary accent icon | `blue-400` | `indigo-400` |
| Primary accent bg | `blue-500` / `blue-600` | `indigo-600` |
| Primary gradient end | `indigo-500` / `indigo-600` | `violet-500` / `violet-600` |
| Secondary accent | — | `cyan-400` |
| Active state bg | `bg-white/20` | `bg-indigo-600/20` |
| Active state shadow | — | `shadow-indigo-500/20` |
| Card background | `bg-white/5` | `bg-white/[0.03]` |
| Card border | `border-white/10` | `border-white/[0.08]` |
| Card hover bg | `hover:bg-white/10` | `hover:bg-white/[0.04]` – `[0.06]` |
| Card hover border | — | `hover:border-indigo-500/20` |
| Surface/dock bg | `bg-black/80` / `bg-white/[0.03]` | `bg-[#0d0d1a]/80` |
| Page background | `#020617` | `#0a0a0f` |
| Muted text | `text-slate-400` | `text-white/50` (or keep slate-400 for body copy) |
| Spinner border-t | `border-t-blue-500` | `border-t-indigo-500` |
| Button gradient | `from-blue-600 to-indigo-600` | `from-indigo-600 to-violet-600` |
| Button shadow | `shadow-blue-500/20` | `shadow-indigo-500/25` |
| ZIP file accent | `green-400` | `cyan-400` |
| APK file accent | `blue-400` | `indigo-400` |
