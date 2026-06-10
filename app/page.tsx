'use client'

import { useState } from 'react'
import {
  Menu,
  X,
  Home,
  Palette,
  Zap,
  BarChart3,
  User,
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Flame,
  Trophy,
  Settings,
  LogOut,
} from 'lucide-react'

// ==================== MOCK DATA ====================

const mockUsers = [
  {
    id: 1,
    name: 'SHADOW-MHMD',
    handle: '@SHADOW-MHMD',
    avatar: '🎨',
    badge: 'SHADOW-STUDIO Founder',
    league: 'Apex',
    points: 48500,
    streak: 42,
    rank: 1,
  },
  {
    id: 2,
    name: 'Alex Rivera',
    handle: '@alexrivera',
    avatar: '💻',
    league: 'Diamond',
    points: 42300,
    streak: 28,
    rank: 2,
  },
  {
    id: 3,
    name: 'Jordan Lee',
    handle: '@jordanlee',
    avatar: '🚀',
    league: 'Gold',
    points: 38200,
    streak: 15,
    rank: 3,
  },
  {
    id: 4,
    name: 'Sam Chen',
    handle: '@samchen',
    avatar: '⚡',
    league: 'Gold',
    points: 35900,
    streak: 8,
    rank: 4,
  },
  {
    id: 5,
    name: 'Morgan Smith',
    handle: '@msmith',
    avatar: '🎭',
    league: 'Silver',
    points: 32100,
    streak: 5,
    rank: 5,
  },
  {
    id: 6,
    name: 'Casey Park',
    handle: '@caseypark',
    avatar: '🌊',
    league: 'Silver',
    points: 28500,
    streak: 12,
    rank: 6,
  },
  {
    id: 7,
    name: 'Taylor Wright',
    handle: '@taylorwright',
    avatar: '🎯',
    league: 'Bronze',
    points: 22300,
    streak: 3,
    rank: 7,
  },
]

const mockPosts = Array.from({ length: 24 }, (_, i) => {
  // Use deterministic calculations instead of Math.random() to avoid hydration mismatches
  const userIndex = i % mockUsers.length
  const hours = (i % 23) + 1
  const upvotesSeed = (i * 7919) % 5000 + 100
  const downvotesSeed = (i * 1337) % 50
  const commentsSeed = (i * 4649) % 200
  
  return {
    id: i + 1,
    author: mockUsers[userIndex],
    timestamp: `${hours}h ago`,
    content: `Project Showcase #${i + 1}`,
    image: `Project UI Design ${i + 1}`,
    upvotes: upvotesSeed,
    downvotes: downvotesSeed,
    comments: commentsSeed,
    isSponsored: (i + 1) % 8 === 0,
    isFeatured: i < 8,
  }
})

const mockStats = {
  downloads: '12,450',
  upvotes: '89,230',
  storage: '1.2 GB / 5.0 GB',
  traffic: [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 52 },
    { day: 'Wed', value: 48 },
    { day: 'Thu', value: 61 },
    { day: 'Fri', value: 55 },
    { day: 'Sat', value: 67 },
    { day: 'Sun', value: 72 },
  ],
}

const mockProjects = [
  { id: 1, name: 'React UI Kit', downloads: '5.2K', stars: '2.1K' },
  { id: 2, name: 'Design System Pro', downloads: '3.8K', stars: '1.9K' },
  { id: 3, name: 'Animation Library', downloads: '4.1K', stars: '2.4K' },
  { id: 4, name: 'Developer Dashboard', downloads: '6.3K', stars: '3.2K' },
  { id: 5, name: 'Mobile UI Components', downloads: '7.1K', stars: '3.8K' },
  { id: 6, name: 'API Integration Suite', downloads: '2.9K', stars: '1.5K' },
]

// ==================== COMPONENTS ====================

interface NavLink {
  id: string
  icon: React.ReactNode
  label: string
}

const navLinks: NavLink[] = [
  { id: 'feed', icon: <Home size={20} />, label: 'Faces Feed' },
  { id: 'sketchbook', icon: <Palette size={20} />, label: 'SketchBook' },
  { id: 'leaderboard', icon: <Zap size={20} />, label: 'Leaderboard' },
  { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
  { id: 'profile', icon: <User size={20} />, label: 'Profile' },
]

function Sidebar({ currentView, setCurrentView, isMobileOpen, setIsMobileOpen }: any) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 glass-dark border-r border-white/10 p-6 hidden md:flex flex-col z-40">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            NODEIO
          </h1>
          <p className="text-xs text-white/40 mt-1">Dev Portfolio & Social</p>
        </div>

        <nav className="space-y-2 flex-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setCurrentView(link.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                currentView === link.id
                  ? 'bg-white/10 text-cyan-300 border border-cyan-400/50'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {link.icon}
              <span className="text-sm font-medium">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 pt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white/80 hover:bg-white/5 transition-smooth">
            <Settings size={20} />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white/80 hover:bg-white/5 transition-smooth">
            <LogOut size={20} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
      <div
        className={`fixed left-0 top-0 h-screen w-64 glass-dark border-r border-white/10 p-6 flex flex-col z-40 md:hidden transition-transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            NODEIO
          </h1>
          <button onClick={() => setIsMobileOpen(false)} className="text-white/60">
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentView(link.id)
                setIsMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                currentView === link.id
                  ? 'bg-white/10 text-cyan-300 border border-cyan-400/50'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {link.icon}
              <span className="text-sm font-medium">{link.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

function TopBar({ isMobileOpen, setIsMobileOpen }: any) {
  return (
    <div className="sticky top-0 glass-dark border-b border-white/10 h-16 flex items-center px-4 md:px-8 gap-4 z-20">
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden text-white/60 hover:text-white transition-smooth"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
        <Search size={18} className="text-white/40" />
        <input
          type="text"
          placeholder="Search projects, developers..."
          className="bg-transparent text-white/80 placeholder-white/40 outline-none flex-1 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-lg nitro-glow">
          🎨
        </div>
      </div>
    </div>
  )
}

function PostCard({ post }: { post: (typeof mockPosts)[number] }) {
  return (
    <div className={`glass rounded-xl overflow-hidden transition-smooth hover:bg-white/10 ${post.isSponsored ? 'border-amber-500/30' : ''}`}>
      {post.isSponsored && (
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-bold text-amber-400">SPONSORED</span>
        </div>
      )}

      <div className="aspect-video bg-gradient-to-br from-white/5 to-white/[0.02] border-b border-white/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-purple-600/20 to-cyan-600/20" />
        <span className="text-white/40 text-sm font-medium relative z-10">
          {post.isSponsored ? 'Ad: ' : ''}{post.image}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-white/10">
            {post.author.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{post.author.handle}</p>
            <p className="text-xs text-white/40">{post.timestamp}</p>
          </div>
        </div>

        <p className="text-sm text-white/70 mb-4">{post.content}</p>

        <div className="flex items-center gap-4 pt-3 border-t border-white/10 text-white/40">
          <button className="flex items-center gap-1 hover:text-cyan-400 transition-smooth text-xs">
            <ThumbsUp size={16} />
            {post.upvotes}
          </button>
          <button className="flex items-center gap-1 hover:text-red-400 transition-smooth text-xs">
            <ThumbsDown size={16} />
            {post.downvotes}
          </button>
          <button className="flex items-center gap-1 hover:text-purple-400 transition-smooth text-xs">
            <MessageCircle size={16} />
            {post.comments}
          </button>
        </div>
      </div>
    </div>
  )
}

function FacesFeedView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

function SketchbookView() {
  const featuredPosts = mockPosts.filter((p) => p.isFeatured)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {featuredPosts.map((post) => (
        <div key={post.id} className={`glass rounded-2xl overflow-hidden glow-border-purple transition-smooth hover:bg-white/10`}>
          <div className="aspect-video bg-gradient-to-br from-white/5 to-white/[0.02] border-b border-white/10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-purple-600/30 to-cyan-600/30" />
            <span className="text-white/40 text-lg font-medium relative z-10">{post.image}</span>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/10">
                  {post.author.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{post.author.handle}</p>
                  <p className="text-xs text-white/40">{post.timestamp}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-transparent bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text">
                  {post.upvotes}+
                </p>
                <p className="text-xs text-white/40">Upvotes</p>
              </div>
            </div>

            <p className="text-sm text-white/70 mb-6">{post.content}</p>

            <div className="flex items-center gap-4 pt-4 border-t border-white/10 text-white/40">
              <button className="flex items-center gap-2 hover:text-cyan-400 transition-smooth">
                <ThumbsUp size={18} />
                <span className="text-sm font-medium">{post.upvotes}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-red-400 transition-smooth">
                <ThumbsDown size={18} />
                <span className="text-sm font-medium">{post.downvotes}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-purple-400 transition-smooth">
                <MessageCircle size={18} />
                <span className="text-sm font-medium">{post.comments}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LeaderboardView() {
  const getLeagueBadge = (league: string) => {
    const badges: any = {
      Bronze: '🥉',
      Silver: '🥈',
      Gold: '🥇',
      Diamond: '💎',
      Apex: '👑',
    }
    return badges[league] || '•'
  }

  return (
    <div className="space-y-2">
      {mockUsers.map((user) => (
        <div
          key={user.id}
          className={`glass rounded-xl p-4 transition-smooth ${
            user.name === 'SHADOW-MHMD'
              ? 'ring-2 ring-cyan-400/50 bg-cyan-400/10'
              : 'hover:bg-white/10'
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center font-bold text-white/60 text-sm">
                #{user.rank}
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/10">
                {user.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.handle}</p>
                {user.badge && <p className="text-xs text-purple-400 truncate">{user.badge}</p>}
              </div>
            </div>

            <div className="text-center hidden md:block">
              <p className="text-lg font-bold">{getLeagueBadge(user.league)}</p>
              <p className="text-xs text-white/40">{user.league}</p>
            </div>

            <div className="text-center hidden md:block">
              <p className="text-lg font-bold text-cyan-400">{user.points.toLocaleString()}</p>
              <p className="text-xs text-white/40">Points</p>
            </div>

            <div className="text-center md:col-span-2 flex items-center justify-center md:justify-start gap-2">
              <Flame size={16} className="text-orange-400" />
              <span className="font-semibold text-white">{user.streak}</span>
              <span className="text-xs text-white/40">Days</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AnalyticsView() {
  const maxValue = Math.max(...mockStats.traffic.map((d) => d.value))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Downloads', value: mockStats.downloads, icon: '📥' },
          { label: 'Total Upvotes', value: mockStats.upvotes, icon: '👍' },
          { label: 'Storage Used', value: mockStats.storage, icon: '💾' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-cyan-400">{stat.value}</p>
              </div>
              <span className="text-4xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">30-Day Traffic</h3>
        <div className="flex items-end gap-3 h-40">
          {mockStats.traffic.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-cyan-500/80 to-purple-500/60 rounded-t-lg transition-all hover:opacity-80"
                style={{ height: `${(day.value / maxValue) * 100}%` }}
              />
              <span className="text-xs text-white/40">{day.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileView() {
  const currentUser = mockUsers[0]

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 relative" />

        {/* Profile Info */}
        <div className="px-6 pb-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 mb-6 relative z-10">
            <div className="w-32 h-32 rounded-full flex items-center justify-center text-6xl bg-gradient-to-br from-purple-500 to-cyan-500 nitro-glow border-4 border-slate-950">
              {currentUser.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{currentUser.name}</h1>
                <span className="px-3 py-1 rounded-lg bg-purple-600/30 border border-purple-500/50 text-xs font-semibold text-purple-300">
                  {currentUser.badge}
                </span>
              </div>
              <p className="text-white/60">{currentUser.handle}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-lg p-3 text-center">
              <p className="text-sm text-white/60">Followers</p>
              <p className="text-2xl font-bold text-cyan-400">24.5K</p>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <p className="text-sm text-white/60">Projects</p>
              <p className="text-2xl font-bold text-purple-400">{mockProjects.length}</p>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <p className="text-sm text-white/60">Rank</p>
              <p className="text-2xl font-bold text-yellow-400">#{currentUser.rank}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProjects.map((project) => (
            <div key={project.id} className="glass rounded-xl p-4 hover:bg-white/10 transition-smooth">
              <div className="w-full h-32 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg mb-3 flex items-center justify-center border border-white/10">
                <span className="text-white/40 text-sm">Project {project.id}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{project.name}</h3>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>📥 {project.downloads}</span>
                <span>⭐ {project.stars}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN APP ====================

export default function NodeioApp() {
  const [currentView, setCurrentView] = useState('feed')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return <FacesFeedView />
      case 'sketchbook':
        return <SketchbookView />
      case 'leaderboard':
        return <LeaderboardView />
      case 'analytics':
        return <AnalyticsView />
      case 'profile':
        return <ProfileView />
      default:
        return <FacesFeedView />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 relative overflow-hidden">
      {/* Ambient Glow Blobs */}
      <div className="ambient-glow glow-purple" style={{ width: '500px', height: '500px', top: '10%', left: '5%' }} />
      <div className="ambient-glow glow-cyan" style={{ width: '400px', height: '400px', bottom: '20%', right: '10%' }} />
      <div className="ambient-glow glow-purple" style={{ width: '300px', height: '300px', top: '50%', right: '5%', opacity: 0.1 }} />

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <TopBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white">
                {navLinks.find((l) => l.id === currentView)?.label || 'Nodeio'}
              </h2>
              <p className="text-white/40 text-sm mt-1">
                {currentView === 'feed' && 'Explore cutting-edge developer projects'}
                {currentView === 'sketchbook' && 'Premium showcase of elite community work'}
                {currentView === 'leaderboard' && 'Top developers and community rankings'}
                {currentView === 'analytics' && 'Your portfolio performance metrics'}
                {currentView === 'profile' && 'Your developer profile and projects'}
              </p>
            </div>

            {renderView()}
          </div>
        </main>
      </div>
    </div>
  )
}
