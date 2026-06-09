'use client'

import React, { useState } from 'react'
import {
  Menu,
  X,
  Home,
  Zap,
  Trophy,
  BarChart3,
  User,
  Search,
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Crown,
  TrendingUp,
  Star,
  Award,
  Sparkles,
  Download,
  GitBranch,
  Code2,
  Clock,
} from 'lucide-react'

// ============ MOCK DATA ============

const mockUsers = [
  {
    id: '1',
    name: 'SHADOW-MHMD',
    handle: '@shadow_mhmd',
    avatar: 'SM',
    badge: 'SHADOW-STUDIO Founder',
    isCurrent: true,
  },
  {
    id: '2',
    name: 'Alex Chen',
    handle: '@alexchen',
    avatar: 'AC',
    badge: 'Full Stack Dev',
  },
  {
    id: '3',
    name: 'Jordan Lee',
    handle: '@jordanlee',
    avatar: 'JL',
    badge: 'UI/UX Designer',
  },
  {
    id: '4',
    name: 'Sam Rivera',
    handle: '@samrivera',
    avatar: 'SR',
    badge: 'React Specialist',
  },
  {
    id: '5',
    name: 'Taylor Kim',
    handle: '@taylorkim',
    avatar: 'TK',
    badge: 'DevOps Engineer',
  },
]

const mockPosts = Array.from({ length: 20 }, (_, i) => {
  const isAd = (i + 1) % 8 === 0
  const timestamps = ['2h ago', '4h ago', '6h ago', '8h ago', '12h ago', '1h ago', '3h ago', '5h ago', '7h ago', '9h ago', '11h ago', '13h ago', '15h ago', '18h ago', '20h ago', '22h ago', '23h ago', '19h ago', '17h ago', '14h ago']
  const upvoteCounts = [2450, 3200, 1800, 4100, 5200, 1950, 3400, 2100, 4500, 1650, 2800, 3900, 1200, 5100, 2300, 3700, 4200, 1500, 3500, 2900]
  const downvoteCounts = [45, 120, 60, 95, 180, 55, 140, 70, 160, 50, 85, 130, 40, 190, 75, 110, 155, 65, 135, 90]
  const commentCounts = [230, 450, 280, 520, 380, 210, 490, 310, 540, 190, 360, 420, 150, 580, 290, 480, 350, 220, 510, 340]
  
  return {
    id: `post-${i}`,
    user: mockUsers[i % mockUsers.length],
    title: isAd
      ? 'Advanced Caching Strategies for Modern Web Apps'
      : ['Neural Network UI Framework', 'Real-time Collab Editor', 'AI Art Generator', 'Quantum Computing Sim'][i % 4],
    description: isAd ? 'Sponsored: Learn about Redis, Memcached, and edge caching.' : 'Check out my latest project',
    timestamp: timestamps[i],
    upvotes: upvoteCounts[i],
    downvotes: downvoteCounts[i],
    comments: commentCounts[i],
    isSponsored: isAd,
    imageColor: isAd ? 'from-blue-600 to-purple-600' : ['from-cyan-500 to-blue-600', 'from-purple-500 to-pink-600', 'from-green-500 to-cyan-600', 'from-orange-500 to-red-600'][i % 4],
  }
})

const mockLeaderboard = [
  { rank: 1, user: mockUsers[0], league: 'Apex', points: 18500, streak: 42 },
  { rank: 2, user: mockUsers[1], league: 'Diamond', points: 16200, streak: 28 },
  { rank: 3, user: mockUsers[2], league: 'Gold', points: 14800, streak: 35 },
  { rank: 4, user: mockUsers[3], league: 'Gold', points: 12400, streak: 19 },
  { rank: 5, user: mockUsers[4], league: 'Silver', points: 11100, streak: 14 },
  { rank: 6, user: { ...mockUsers[0], name: 'Casey Morgan', handle: '@caseym' }, league: 'Silver', points: 9800, streak: 7 },
  { rank: 7, user: { ...mockUsers[1], name: 'Jamie Park', handle: '@jamiepark' }, league: 'Bronze', points: 8500, streak: 5 },
]

const mockAnalytics = {
  totalDownloads: 24580,
  totalUpvotes: 156800,
  storageUsed: 1.2,
  storageFree: 5.0,
  chartData: [
    { day: 1, value: 3245 },
    { day: 2, value: 3890 },
    { day: 3, value: 2950 },
    { day: 4, value: 4120 },
    { day: 5, value: 3670 },
    { day: 6, value: 4890 },
    { day: 7, value: 3120 },
    { day: 8, value: 4560 },
    { day: 9, value: 2890 },
    { day: 10, value: 5120 },
    { day: 11, value: 3450 },
    { day: 12, value: 4780 },
    { day: 13, value: 3340 },
    { day: 14, value: 4950 },
    { day: 15, value: 2670 },
    { day: 16, value: 5230 },
    { day: 17, value: 3890 },
    { day: 18, value: 4340 },
    { day: 19, value: 3560 },
    { day: 20, value: 5670 },
    { day: 21, value: 2980 },
    { day: 22, value: 4120 },
    { day: 23, value: 3750 },
    { day: 24, value: 5340 },
    { day: 25, value: 3210 },
    { day: 26, value: 4890 },
    { day: 27, value: 3945 },
    { day: 28, value: 5120 },
    { day: 29, value: 2850 },
    { day: 30, value: 4670 },
  ],
}

const mockProfileProjects = [
  { id: '1', title: 'Quantum Cascade', desc: 'Advanced ML Framework', stars: 2400, fork: true },
  { id: '2', title: 'Nexus Protocol', desc: 'Real-time Data Sync', stars: 1800, fork: false },
  { id: '3', title: 'Aurora UI Kit', desc: 'Component Library', stars: 3200, fork: false },
  { id: '4', title: 'VortexEngine', desc: 'Game Engine', stars: 1600, fork: true },
]

// ============ COMPONENTS ============

const SidebarLink = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: any
  label: string
  isActive: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-primary/20 text-primary border border-primary/30'
        : 'text-text-secondary hover:bg-white/5 hover:text-text border border-transparent'
    }`}
  >
    <Icon size={20} />
    <span className="text-sm font-medium hidden sm:inline">{label}</span>
  </button>
)

const PostCard = ({ post }: { post: any }) => (
  <div
    className={`glass p-4 hover:border-primary/30 transition-all duration-300 group ${
      post.isSponsored ? 'border-yellow-500/30 bg-yellow-500/5' : ''
    }`}
  >
    {post.isSponsored && (
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
          SPONSORED
        </span>
      </div>
    )}
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-xs font-bold text-background">
        {post.user.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-text">{post.user.name}</div>
        <div className="text-xs text-text-secondary">{post.user.handle} · {post.timestamp}</div>
      </div>
    </div>

    <h3 className="font-bold text-text mb-2 text-sm line-clamp-2">{post.title}</h3>

    <div
      className={`w-full h-40 rounded-lg mb-3 bg-gradient-to-br ${post.imageColor} opacity-80 group-hover:opacity-100 transition-opacity`}
    ></div>

    <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-white/5">
      <button className="flex items-center gap-1 hover:text-primary transition-colors">
        <ThumbsUp size={16} />
        <span>{post.upvotes.toLocaleString()}</span>
      </button>
      <button className="flex items-center gap-1 hover:text-accent transition-colors">
        <MessageCircle size={16} />
        <span>{post.comments.toLocaleString()}</span>
      </button>
      <button className="flex items-center gap-1 hover:text-primary transition-colors">
        <Share2 size={16} />
      </button>
    </div>
  </div>
)

const SketchbookCard = ({ post }: { post: any }) => (
  <div className="glass p-6 border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 text-sm font-bold text-background">
          {post.user.avatar}
        </div>
        <div>
          <div className="font-bold text-text">{post.user.name}</div>
          <div className="text-sm text-text-secondary">{post.user.handle}</div>
        </div>
      </div>
      <Sparkles className="text-accent" size={20} />
    </div>

    <div
      className={`w-full h-64 rounded-lg mb-4 bg-gradient-to-br ${post.imageColor} opacity-90 group-hover:opacity-100 transition-opacity`}
    ></div>

    <h2 className="text-xl font-bold text-text mb-2">{post.title}</h2>
    <p className="text-text-secondary text-sm mb-4">{post.description}</p>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Star className="text-accent" size={18} />
        <span className="font-bold text-lg text-text">10k+</span>
      </div>
      <button className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-semibold">
        VIEW PROJECT
      </button>
    </div>
  </div>
)

const LeaderboardRow = ({ entry, isCurrent }: { entry: any; isCurrent: boolean }) => (
  <div
    className={`glass p-4 flex items-center gap-4 transition-all duration-300 ${
      isCurrent ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/20'
    }`}
  >
    <div className="text-2xl font-bold text-primary min-w-fit w-12">#{entry.rank}</div>

    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-background">
        {entry.user.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text text-sm">{entry.user.name}</div>
        <div className="text-xs text-text-secondary">{entry.user.handle}</div>
      </div>
    </div>

    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/10 border border-accent/20">
      <Crown size={16} className="text-accent" />
      <span className="text-xs font-bold text-accent">{entry.league}</span>
    </div>

    <div className="text-right min-w-fit">
      <div className="font-bold text-primary text-sm">{entry.points.toLocaleString()}</div>
      <div className="text-xs text-text-secondary flex items-center gap-1 justify-end">
        <Flame size={14} className="text-orange-500" />
        {entry.streak} days
      </div>
    </div>
  </div>
)

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div className="glass p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="text-text-secondary text-sm mb-1">{label}</div>
        <div className="text-2xl font-bold text-primary">{value}</div>
      </div>
      <Icon size={24} className="text-accent opacity-60" />
    </div>
  </div>
)

const ProfileProjectCard = ({ project }: { project: any }) => (
  <div className="glass p-4 hover:border-primary/40 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-bold text-text">{project.title}</h3>
        <p className="text-xs text-text-secondary">{project.desc}</p>
      </div>
      {project.fork && <GitBranch size={16} className="text-accent flex-shrink-0" />}
    </div>
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <Star size={14} className="text-yellow-500" />
      <span>{project.stars.toLocaleString()}</span>
    </div>
  </div>
)

// ============ MAIN APP ============

export default function NodeioApp() {
  const [activeView, setActiveView] = useState('feed')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const viewConfig = [
    { id: 'feed', label: 'Faces Feed', icon: Home },
    { id: 'sketchbook', label: 'SketchBook', icon: Zap },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 glass border-r border-white/10 p-4 flex flex-col gap-6 transition-all duration-300 z-40 sm:relative sm:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Nodeio
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {viewConfig.map(({ id, label, icon: Icon }) => (
            <SidebarLink
              key={id}
              icon={Icon}
              label={label}
              isActive={activeView === id}
              onClick={() => {
                setActiveView(id)
                setSidebarOpen(false)
              }}
            />
          ))}
        </nav>

        <div className="glass p-3 rounded-lg text-center text-xs text-text-secondary">
          <div className="font-semibold text-text mb-2">SHADOW-STUDIO</div>
          <div>Premium Member</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 glass border-b border-white/10 backdrop-blur-md">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="sm:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            <div className="flex-1 max-w-2xl hidden sm:block">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  placeholder="Search projects, users, tags..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-text text-sm placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-background cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all">
                SM
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-4 sm:p-6 pb-20">
          {/* FACES FEED */}
          {activeView === 'feed' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-3xl font-black mb-2">Faces Feed</h2>
                <p className="text-text-secondary text-sm">Discover and celebrate amazing developer projects</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* SKETCHBOOK */}
          {activeView === 'sketchbook' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-black mb-2">SketchBook</h2>
                <p className="text-text-secondary text-sm">Elite featured showcase of top-tier community projects</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockPosts.slice(0, 8).map((post) => (
                  <SketchbookCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* LEADERBOARD */}
          {activeView === 'leaderboard' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-3xl font-black mb-2">Leaderboard</h2>
                <p className="text-text-secondary text-sm">Gamified leagues and developer rankings</p>
              </div>
              <div className="space-y-2 max-w-2xl">
                {mockLeaderboard.map((entry) => (
                  <LeaderboardRow key={entry.rank} entry={entry} isCurrent={entry.rank === 1} />
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeView === 'analytics' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-black mb-2">Analytics Dashboard</h2>
                <p className="text-text-secondary text-sm">Your creator statistics and insights</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Downloads"
                  value={mockAnalytics.totalDownloads.toLocaleString()}
                  icon={Download}
                />
                <StatCard
                  label="Total Upvotes"
                  value={`${(mockAnalytics.totalUpvotes / 1000).toFixed(0)}k`}
                  icon={ThumbsUp}
                />
                <StatCard
                  label="Storage Used"
                  value={`${mockAnalytics.storageUsed}GB`}
                  icon={Code2}
                />
                <StatCard
                  label="Free Tier"
                  value={`${mockAnalytics.storageFree}GB`}
                  icon={Sparkles}
                />
              </div>

              <div className="glass p-6">
                <h3 className="font-bold text-text mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  30-Day Traffic
                </h3>
                <div className="h-64 flex items-end gap-1">
                  {mockAnalytics.chartData.map((data, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t opacity-60 hover:opacity-100 transition-opacity"
                      style={{
                        height: `${(data.value / Math.max(...mockAnalytics.chartData.map((d) => d.value))) * 100}%`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeView === 'profile' && (
            <div className="space-y-6">
              {/* PROFILE HEADER */}
              <div className="glass border-primary/30">
                <div className="h-40 bg-gradient-to-r from-primary/30 to-accent/30 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30">
                    <div
                      className="absolute rounded-full blur-xl"
                      style={{
                        width: '280px',
                        height: '280px',
                        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%)',
                        left: '10%',
                        top: '20%',
                      }}
                    ></div>
                    <div
                      className="absolute rounded-full blur-xl"
                      style={{
                        width: '320px',
                        height: '320px',
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
                        left: '60%',
                        top: '10%',
                      }}
                    ></div>
                    <div
                      className="absolute rounded-full blur-xl"
                      style={{
                        width: '250px',
                        height: '250px',
                        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%)',
                        left: '40%',
                        top: '50%',
                      }}
                    ></div>
                  </div>
                </div>

                <div className="relative px-6 pb-6 -mt-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent border-4 border-background flex items-center justify-center text-2xl font-black text-background relative group animate-pulse-glow">
                      SM
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full border-2 border-background flex items-center justify-center">
                        <Crown size={14} className="text-background" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h1 className="text-3xl font-black text-text">SHADOW-MHMD</h1>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-primary">@shadow_mhmd</span>
                        <span className="px-3 py-1 rounded-lg bg-accent/20 border border-accent/40 text-xs font-bold text-accent">
                          SHADOW-STUDIO Founder
                        </span>
                      </div>
                    </div>

                    <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-background font-bold hover:shadow-lg hover:shadow-primary/30 transition-all">
                      Follow
                    </button>
                  </div>

                  <p className="mt-6 text-text-secondary text-sm max-w-2xl">
                    Full-stack developer, open-source enthusiast, and creator of innovative digital experiences. Passionate about building the future of web development with cutting-edge technologies.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      React
                    </span>
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                      Node.js
                    </span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      TypeScript
                    </span>
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                      Web3
                    </span>
                  </div>
                </div>
              </div>

              {/* PROJECTS GRID */}
              <div>
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                  <Code2 size={24} className="text-primary" />
                  Featured Projects
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockProfileProjects.map((project) => (
                    <ProfileProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>

              {/* APK REPOSITORY */}
              <div className="glass p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Download size={20} className="text-accent" />
                  APK Repository
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'MobileHub v2.1', size: '24.5 MB', dl: 1240 },
                    { name: 'DesktopSync v1.8', size: '18.3 MB', dl: 820 },
                  ].map((apk, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-primary/20 transition-colors">
                      <div>
                        <div className="font-semibold text-sm text-text">{apk.name}</div>
                        <div className="text-xs text-text-secondary">{apk.size}</div>
                      </div>
                      <button className="p-2 hover:bg-primary/20 rounded-lg transition-colors">
                        <Download size={16} className="text-primary" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
