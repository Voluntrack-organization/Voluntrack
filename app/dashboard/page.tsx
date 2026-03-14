"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { getStudentProfile } from "@/lib/firebase/student-profiles"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HorizontalProgressTracker } from "@/components/horizontal-progress-tracker"
import { CalendarModal } from "@/components/calendar-modal"

import {
  Sparkles,
  TrendingUp,
  FolderOpen,
  ArrowRight,
  Plus,
  Search,
  Calendar,
  FileText,
  Zap,
  BarChart3,
  User,
  Newspaper,
  Award,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Star,
  Target,
  Heart,
  MapPin,
  Clock,
  Leaf,
  BookOpen,
  X,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  Flag,
  Download,
} from "lucide-react"
import {
  getUserApplications,
  getUserSaved,
  toggleSaveOpportunity,
  updateApplicationStatus,
  UserApplication
} from "@/lib/firebase/dashboard"
import { submitReport } from "@/lib/firebase/reports"
import { toast } from "sonner"
import { categoryColors, statusColors, defaultCategoryColor } from "@/lib/ui-config"
import { generateVolunteerPDF } from "@/lib/pdf-generator"

const tabs = [
  { id: "progress", label: "Progress Tracking", icon: TrendingUp },
  { id: "applications", label: "Applications", icon: FileText },
  { id: "account", label: "My Account", icon: User },
]
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const badges = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first hour",
    icon: Star,
    color: "bg-yellow-500",
  },
  {
    id: "helping-hand",
    name: "Helping Hand",
    description: "Log 10 volunteer hours",
    icon: Heart,
    color: "bg-pink-500",
  },
  {
    id: "community-hero",
    name: "Community Hero",
    description: "Complete 5 opportunities",
    icon: Trophy,
    color: "bg-purple-500",
  },
  { id: "goal-setter", name: "Goal Setter", description: "Reach 40 hours", icon: Target, color: "bg-blue-500" },
  {
    id: "team-player",
    name: "Team Player",
    description: "Join a group event",
    icon: Award,
    color: "bg-teal-500",
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Apply within 24 hours",
    icon: Zap,
    color: "bg-orange-500",
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Volunteer 3 weeks in a row",
    icon: Calendar,
    color: "bg-indigo-500",
  },
  {
    id: "active-applicant",
    name: "Active Applicant",
    description: "Apply to 5 opportunities",
    icon: FileText,
    color: "bg-cyan-500",
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Try 3 different categories",
    icon: Search,
    color: "bg-green-500",
  },
]

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("progress")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const badgesRef = useRef<HTMLDivElement>(null)
  const [applications, setApplications] = useState<UserApplication[]>([])
  const [savedOpps, setSavedOpps] = useState<UserApplication[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<UserApplication | null>(null)
  const [selectedSaved, setSelectedSaved] = useState<UserApplication | null>(null)
  const [reflectionText, setReflectionText] = useState("")
  const [reportOpportunity, setReportOpportunity] = useState<UserApplication | null>(null)
  const [reportConcern, setReportConcern] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const completedOpportunitiesRef = useRef<HTMLDivElement>(null)
  const [studentHours, setStudentHours] = useState(0)
  const [studentBadges, setStudentBadges] = useState<string[]>([])

  const fetchData = async () => {
    if (!user?.uid) return
    setDataLoading(true)
    try {
      const [userApps, userSaved, studentProfile] = await Promise.all([
        getUserApplications(user.uid),
        getUserSaved(user.uid),
        getStudentProfile(user.uid)
      ])
      setApplications(userApps)
      setSavedOpps(userSaved)
      setStudentHours(studentProfile?.hoursCompleted ?? 0)
      setStudentBadges(studentProfile?.badges ?? [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data.")
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.uid])

  const handleMarkComplete = async (app: UserApplication) => {
    if (!user?.uid) return
    try {
      await updateApplicationStatus(user.uid, app.opportunityId, "completed")
      toast.success("Opportunity marked as complete! Hours updated.")
      fetchData() // Refresh data
    } catch (error) {
      toast.error("Failed to update status.")
    }
  }

  const handleUnsave = async (opp: UserApplication) => {
    if (!user?.uid) return
    try {
      // Reconstruct minimal Opportunity object for toggleSaveOpportunity
      const oppData = { ...opp, id: opp.opportunityId } as any
      const stillSaved = await toggleSaveOpportunity(user.uid, oppData)
      if (!stillSaved) {
        setSavedOpps(prev => prev.filter(o => o.opportunityId !== opp.opportunityId))
        if (selectedSaved?.opportunityId === opp.opportunityId) {
          setSelectedSaved(null)
        }
        toast.success("Removed from saved list")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update saved list.")
    }
  }

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      await generateVolunteerPDF(userProfile, completedOpportunities)
      toast.success("PDF generated successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const recentApplications = applications.filter((app) => app.status !== "completed").slice(0, 5)
  const completedOpportunities = applications.filter((app) => app.status === "completed")
  const pendingCount = applications.filter((app) => app.status === "pending").length

  const events: { [key: number]: string } = {}
  applications.filter(app => app.status === "approved").forEach(app => {
    const appDate = new Date(app.dateISO)
    if (appDate.getMonth() === currentDate.getMonth() && appDate.getFullYear() === currentDate.getFullYear()) {
      events[appDate.getDate()] = "blue"
    }
  })

  const upcomingShifts = applications
    .filter(app => app.status === "approved")
    .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
    .slice(0, 6)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!badgesRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - badgesRef.current.offsetLeft)
    setScrollLeft(badgesRef.current.scrollLeft)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !badgesRef.current) return
    e.preventDefault()
    const x = e.pageX - badgesRef.current.offsetLeft
    const walk = (x - startX) * 2
    badgesRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay }
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header with Stats */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Welcome Message and Button */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                      Welcome back,{" "}
                      {authLoading ? (
                        "..."
                      ) : (
                        userProfile?.firstName
                          ? userProfile.firstName.charAt(0).toUpperCase() +
                          userProfile.firstName.slice(1).toLowerCase()
                          : "User"
                      )}
                      !
                    </h1>
                    <p className="text-muted-foreground mt-1">Ready to make a difference today?</p>
                  </div>
                </div>
              </div>

              {/* Stats in Banner */}
              <div className="flex flex-wrap gap-4">
                {/* Completed Opportunities Stat */}
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 font-medium">Completed</p>
                    <p className="text-xl font-bold text-teal-700">{completedOpportunities.length}</p>
                  </div>
                </div>

                {/* Pending Applications Stat */}
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Pending</p>
                    <p className="text-xl font-bold text-orange-700">{pendingCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl mb-6 shadow-sm overflow-x-auto">
            <div className="flex w-full">
              {tabs.map((tab) => {
                const isLinkTab = tab.id === "applications" || tab.id === "account"
                const isActive = isLinkTab ? false : activeTab === tab.id

                if (isLinkTab) {
                  const href = tab.id === "applications" ? "/applications" : "/account"
                  return (
                    <Link
                      key={tab.id}
                      href={href}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </Link>
                  )
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${isActive
                      ? "border-blue-500 text-blue-600 bg-blue-50/50"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-4 mb-4">
            {/* Left side: Full-width Hour Progress Card */}
            <div className="lg:col-span-3">
              {/* Blue Card - Hours Progress with Rocket - Now Full Width */}
              <Card
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 border-0 text-white overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer h-[260px] shadow-xl hover:shadow-2xl ring-1 ring-white/10"
                onClick={() => completedOpportunitiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <CardContent className="p-4 h-full relative">
                  <HorizontalProgressTracker completedHours={studentHours} goalHours={userProfile?.goalHours || 40} />
                </CardContent>
              </Card>
            </div>

            {/* Right side: Interactive Calendar */}
            <Card className="shadow-sm transition-transform duration-200 hover:scale-[1.02] cursor-pointer row-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-sm">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={i} className="text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: currentDate.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-1" />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentDate).daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const hasEvent = events[day]
                    const isToday =
                      day === new Date().getDate() &&
                      currentDate.getMonth() === new Date().getMonth() &&
                      currentDate.getFullYear() === new Date().getFullYear()
                    return (
                      <button
                        key={day}
                        className={`p-1 text-xs rounded-full transition-colors relative ${isToday ? "bg-blue-500 text-white font-bold" : "hover:bg-muted"
                          }`}
                      >
                        {day}
                        {hasEvent && !isToday && (
                          <span
                            className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${hasEvent === "blue"
                              ? "bg-blue-500"
                              : hasEvent === "teal"
                                ? "bg-teal-500"
                                : "bg-orange-500"
                              }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Upcoming Shifts section below the calendar */}
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-bold text-sm mb-3 tracking-tight">Upcoming Shifts</h3>
                  <ul className="space-y-3">
                    {upcomingShifts.length > 0 ? (
                      upcomingShifts.map((app) => (
                        <li key={app.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 truncate pr-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{app.title}</span>
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap text-xs">
                            {(app.date || "").split(',').pop()?.trim()}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground text-center py-2 italic">
                        No upcoming shifts
                      </li>
                    )}
                  </ul>
                  <CalendarModal applications={applications}>
                    <button
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 mt-4 w-full justify-center py-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View Full Calendar
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </CalendarModal>
                </div>
              </CardContent>
            </Card>

            {/* Badges Container */}
            <div className="lg:col-span-3">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold tracking-tight">Your Badges</h2>
                      <p className="text-xs text-muted-foreground">Achievements you've earned</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <ChevronLeft className="w-3 h-3" />
                      <span>Scroll to explore</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                    <div
                      ref={badgesRef}
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      className={`flex gap-4 overflow-x-auto pb-2 scrollbar-hide ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {badges.map((badge) => {
                        const isEarned = studentBadges.includes(badge.id)
                        return (
                          <div
                            key={badge.id}
                            className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl border w-28 select-none ${isEarned ? "bg-white" : "bg-muted/50 opacity-50"
                              }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center mb-2 ${!isEarned && "grayscale"}`}
                            >
                              <badge.icon className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm font-medium text-center">{badge.name}</p>
                            <p className="text-xs text-muted-foreground text-center">{badge.description}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Recent Applications */}
            <div className="lg:col-span-3">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold tracking-tight">Recent Applications</h2>
                        <p className="text-xs text-muted-foreground">Your latest volunteer applications</p>
                      </div>
                    </div>
                    <Link
                      href="/applications"
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {applications.length > 0 ? (
                    <div>
                      <div className="space-y-2">
                        {recentApplications.map((app) => (
                          <div
                            key={app.id}
                            onClick={() => setSelectedApplication(app)}
                            className={`border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm hover:shadow transition-all duration-200 cursor-pointer ${categoryColors[app.category]?.cardBg || defaultCategoryColor.cardBg}`}
                          >
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground text-sm truncate">{app.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <MapPin className="w-3 h-3 shrink-0 text-red-500" />
                                <span className="truncate">{app.location.split(",")[0]}</span>
                                <span>•</span>
                                <span>{app.hours}</span>
                                <span>•</span>
                                <span>{app.category}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${app.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                  : app.status === "completed"
                                    ? "bg-teal-100 text-teal-700 border border-teal-300"
                                    : app.status === "denied"
                                      ? "bg-red-100 text-red-700 border border-red-300"
                                      : "bg-green-100 text-green-700 border border-green-300"
                                  }`}
                              >
                                {app.status === "pending"
                                  ? "Pending"
                                  : app.status === "completed"
                                    ? "Completed"
                                    : app.status === "denied"
                                      ? "Not Approved"
                                      : "Approved"}
                              </span>
                              {app.status === "approved" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 hover:text-green-800 rounded-full text-xs h-7"
                                  onClick={(e) => { e.stopPropagation(); handleMarkComplete(app); }}
                                >
                                  Complete
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200 hover:text-orange-800 rounded-full text-xs h-7"
                                onClick={(e) => { e.stopPropagation(); setSelectedApplication(app); }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-center mt-3 text-sm font-medium text-muted-foreground">
                        Total: {recentApplications.length}
                      </p>
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-lg bg-muted mx-auto flex items-center justify-center mb-3">
                        <FolderOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-medium text-foreground">No applications yet</h3>
                      <p className="text-muted-foreground text-xs mt-1 mb-3">
                        Start exploring opportunities to make a difference
                      </p>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
                        <Plus className="w-3 h-3" />
                        Browse Opportunities
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completed Opportunities */}
              <div ref={completedOpportunitiesRef}>
                <Card className="shadow-sm mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold tracking-tight">Completed Opportunities</h2>
                          <p className="text-xs text-muted-foreground">Volunteer opportunities you've finished</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportPDF}
                          disabled={isGeneratingPDF || completedOpportunities.length === 0}
                          className="h-8 gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isGeneratingPDF ? "Exporting..." : "Export PDF"}
                        </Button>
                        <Link
                          href="/applications"
                          className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
                        >
                          View All
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {completedOpportunities.length > 0 ? (
                      <div>
                        <div className="space-y-2">
                          {completedOpportunities.map((app) => (
                            <div
                              key={app.id}
                              onClick={() => setSelectedApplication(app)}
                              className={`border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm hover:shadow transition-all duration-200 cursor-pointer ${categoryColors[app.category]?.cardBg || defaultCategoryColor.cardBg}`}
                            >
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-foreground text-sm truncate tracking-tight">{app.title}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <MapPin className="w-3 h-3 shrink-0 text-red-500" />
                                  <span className="truncate">{app.location.split(",")[0]}</span>
                                  <span>•</span>
                                  <span>{app.hours}</span>
                                  <span>•</span>
                                  <span>{app.category}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReportOpportunity(app); setReportConcern(""); }}
                                  className="p-1.5 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Report a concern"
                                >
                                  <Flag className="w-4 h-4" />
                                </button>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-300">
                                  Completed
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200 hover:text-orange-800 rounded-full text-xs h-7"
                                  onClick={(e) => { e.stopPropagation(); setSelectedApplication(app); }}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-center mt-3 text-sm font-medium text-muted-foreground">
                          Total: {completedOpportunities.length}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-xs">No completed opportunities yet.</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Complete approved opportunities to see them here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Resources and Quick Actions Column */}
            <div className="lg:col-span-1 space-y-6">

              {/* Saved */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-pink-600" />
                    </div>
                    <h2 className="text-base font-bold tracking-tight">Saved</h2>
                  </div>

                  <div className="space-y-3">
                    {savedOpps.map((opp) => (
                        <div
                          key={opp.opportunityId}
                          onClick={() => setSelectedSaved(opp)}
                          className={`group rounded-xl p-3 flex items-center gap-3 border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${categoryColors[opp.category]?.cardBg || defaultCategoryColor.cardBg}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${categoryColors[opp.category]?.bg || defaultCategoryColor.bg}`}>
                            <Star className={`w-5 h-5 ${categoryColors[opp.category]?.text || defaultCategoryColor.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{opp.title}</p>
                            <p className="text-xs text-muted-foreground">{opp.date}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUnsave(opp); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Remove from saved"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                    ))}
                  </div>

                  <Link
                    href="/applications"
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 mt-4"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main >

      {/* Application Detail Modal */}
      {
        selectedApplication && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedApplication(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Image */}
              <div className="relative h-48">
                <Image
                  src={selectedApplication.image}
                  alt={selectedApplication.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-1.5 border backdrop-blur-sm ${statusColors[selectedApplication.status].bg} ${statusColors[selectedApplication.status].text} ${statusColors[selectedApplication.status].border}`}
                  >
                    {(() => { const StatusIcon = statusColors[selectedApplication.status]?.icon || CheckCircle; return <StatusIcon className="w-4 h-4" />; })()}
                    {statusColors[selectedApplication.status]?.label || "Unknown"}
                  </span>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{selectedApplication.title}</h2>
                  <p className="text-white/90 drop-shadow">{selectedApplication.organization}</p>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className={`text-sm px-3 py-1 rounded-full ${categoryColors[selectedApplication.category]?.bg} ${categoryColors[selectedApplication.category]?.text}`}>
                    {selectedApplication.category}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    {selectedApplication.commitment}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                    {selectedApplication.hours}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                    <p className="text-2xl font-bold text-sky-700">{selectedApplication.spotsLeft}</p>
                    <p className="text-sm text-slate-600">Spots Remaining</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-2xl font-bold text-slate-700">{selectedApplication.totalSpots}</p>
                    <p className="text-sm text-slate-600">Total Capacity</p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{selectedApplication.date.split(',').slice(0, 2).join(',')}</p>
                      <p className="text-sm">{selectedApplication.date.split(',').slice(2).join(',').trim()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-rose-600" />
                    </div>
                    <span>{selectedApplication.location}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-2">Helpful Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedApplication.skills || []).map((skill) => (
                      <span key={skill} className="text-sm px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-2">About This Opportunity</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedApplication.description || "No description provided."}
                  </p>
                </div>

                {/* Application Info */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-2">Your Application</h3>
                  <p className="text-sm text-blue-600">
                    Applied on: {new Date(selectedApplication.appliedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Status-specific message */}
                {selectedApplication.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-yellow-800 text-sm">
                      <strong>Pending Review:</strong> Your application is currently being reviewed by the organization. You will be notified once a decision is made.
                    </p>
                  </div>
                )}
                {selectedApplication.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <p className="text-green-800 text-sm">
                      <strong>Approved!</strong> Congratulations! Your application has been approved. Make sure to arrive on time at the specified location.
                    </p>
                  </div>
                )}
                {selectedApplication.status === 'completed' && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
                    <p className="text-teal-800 text-sm">
                      <strong>Completed!</strong> Great work! You've successfully completed this volunteer opportunity.
                    </p>
                  </div>
                )}

                {selectedApplication.status === 'completed' && (
                  <div className="mb-6">
                    <label htmlFor="reflection" className="block text-sm font-medium text-foreground mb-2">
                      Reflection (optional): Reflect on your volunteer experience: What did you do, what impact did you make, and what did you learn?
                    </label>
                    <textarea
                      id="reflection"
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="Share your thoughts on this volunteer experience..."
                      className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                      rows={4}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {selectedApplication.status === 'pending' && (
                    <Button variant="outline" className="flex-1 rounded-full py-6 border-red-300 text-red-600 hover:bg-red-50">
                      Withdraw Application
                    </Button>
                  )}
                  {selectedApplication.status === 'approved' && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full py-6">
                      Add to Calendar
                    </Button>
                  )}
                  {selectedApplication.status === 'completed' && (
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full py-6 border-red-300 text-red-600 hover:bg-red-50 gap-2"
                      onClick={() => { setReportOpportunity(selectedApplication); setReportConcern(""); }}
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="px-6 rounded-full py-6 border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => { setSelectedApplication(null); setReflectionText(""); }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Report Concern Modal */}
      {
        reportOpportunity && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setReportOpportunity(null); setReportConcern(""); }}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Report a Concern</h2>
                  <p className="text-sm text-muted-foreground">{reportOpportunity.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Please express your concern and we will get back to you within 24 hours.
              </p>
              <textarea
                value={reportConcern}
                onChange={(e) => setReportConcern(e.target.value)}
                placeholder="Describe your concern..."
                className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y mb-4"
                rows={4}
              />
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={reportSubmitting}
                  onClick={async () => {
                    const trimmed = reportConcern.trim()
                    if (!trimmed) {
                      toast.error("Please describe your concern before submitting.")
                      return
                    }
                    if (!user?.uid || !reportOpportunity) return
                    setReportSubmitting(true)
                    try {
                      await submitReport(user.uid, reportOpportunity.opportunityId, trimmed)
                      setReportOpportunity(null)
                      setReportConcern("")
                      toast.success("Report has been successfully submitted. We'll get back to you within 24 hours.")
                    } catch (err: any) {
                      toast.error(err.message || "Failed to submit report. Please try again.")
                    } finally {
                      setReportSubmitting(false)
                    }
                  }}
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setReportOpportunity(null); setReportConcern(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Saved Opportunity Detail Modal */}
      {
        selectedSaved && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedSaved(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Image */}
              <div className="relative h-48">
                <Image
                  src={selectedSaved.image}
                  alt={selectedSaved.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                <button
                  onClick={() => setSelectedSaved(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-1.5 border backdrop-blur-sm ${categoryColors[selectedSaved.category]?.bg} ${categoryColors[selectedSaved.category]?.text} ${categoryColors[selectedSaved.category]?.border}`}
                  >
                    {selectedSaved.category}
                  </span>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{selectedSaved.title}</h2>
                  <p className="text-white/90 drop-shadow">{selectedSaved.organization}</p>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className={`text-sm px-3 py-1 rounded-full ${categoryColors[selectedSaved.category]?.bg} ${categoryColors[selectedSaved.category]?.text}`}>
                    {selectedSaved.category}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    {selectedSaved.commitment}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                    {selectedSaved.hours}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                    <p className="text-2xl font-bold text-sky-700">{selectedSaved.spotsLeft}</p>
                    <p className="text-sm text-slate-600">Spots Remaining</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-2xl font-bold text-slate-700">{selectedSaved.totalSpots}</p>
                    <p className="text-sm text-slate-600">Total Capacity</p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{selectedSaved.date.split(',').slice(0, 2).join(',')}</p>
                      <p className="text-sm">{selectedSaved.date.split(',').slice(2).join(',').trim() || "Time TBD"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-rose-600" />
                    </div>
                    <span>{selectedSaved.location}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-2">Helpful Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedSaved.skills || []).map((skill) => (
                      <span key={skill} className="text-sm px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-2">About This Opportunity</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedSaved.description || "No description provided."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-6"
                    onClick={() => {
                      setSelectedApplication({ ...selectedSaved, status: 'pending' } as any);
                      setSelectedSaved(null);
                    }}
                  >
                    Apply Now
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full py-6 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleUnsave(selectedSaved)}
                  >
                    Remove from Saved
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 rounded-full py-6 border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => setSelectedSaved(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
