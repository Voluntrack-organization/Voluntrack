"use client"

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { getOrgOpportunities, deleteOpportunity, updateOpportunity } from "@/lib/firebase/org"
import { Opportunity } from "@/lib/firebase/opportunities"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  Search,
  ArrowUpDown,
  RotateCcw,
  Users,
  Heart,
  Leaf,
  BookOpen,
  Star,
  Zap,
  Building2,
  Stethoscope,
  Dog,
  Palette,
  GraduationCap,
  HandHeart,
  Play,
  Info,
  Plus,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Eye,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react"
import { CATEGORIES } from "@/lib/preferences"
import { categoryColors, commitmentColors, defaultCategoryColor } from "@/lib/ui-config"

const allCategories = [...CATEGORIES]
const commitmentTypes = ["One-time", "Weekly", "Monthly"]
const sortOptions = [
  { value: "date", label: "Date (Soonest)" },
  { value: "spots", label: "Spots Available" },
  { value: "hours", label: "Hours (Low to High)" },
  { value: "featured", label: "Featured First" },
]

export default function OrgOpportunitiesPage() {
  const { userProfile, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"browse" | "manage">(searchParams.get("view") === "manage" ? "manage" : "browse")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [manageSearch, setManageSearch] = useState("")
  const [editingPosting, setEditingPosting] = useState<Opportunity | null>(null)
  const [editForm, setEditForm] = useState({ title: "", description: "", location: "", date: "", time: "", hours: 0, category: "" })

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (userProfile?.uid) {
        try {
          const opps = await getOrgOpportunities(userProfile.uid);
          if (mounted) {
            setOpportunities(opps);
            setLoadingData(false);
          }
        } catch (error) {
          console.error("Error fetching opportunities:", error);
          if (mounted) setLoadingData(false);
        }
      } else if (!authLoading) {
        if (mounted) setLoadingData(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [userProfile?.uid, authLoading]);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCommitments, setSelectedCommitments] = useState<string[]>([])
  const [selectedHours, setSelectedHours] = useState<string[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined)
  const [sortBy, setSortBy] = useState("featured")
  const [showFilters, setShowFilters] = useState(false)



  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(query) ||
        opp.organization.toLowerCase().includes(query) ||
        opp.description.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(opp => selectedCategories.includes(opp.category))
    }

    // Commitment filter
    if (selectedCommitments.length > 0) {
      filtered = filtered.filter(opp => selectedCommitments.includes(opp.commitment))
    }

    // Hours filter ("Up to X hours" - shows opportunities that fit within user's available time)
    if (selectedHours.length > 0) {
      const maxHours = Math.max(...selectedHours.map(h => parseInt(h, 10)))
      filtered = filtered.filter(opp => opp.hours <= maxHours)
    }

    // Date filter (calendar date range)
    if (selectedDateRange?.from) {
      const rangeStart = new Date(selectedDateRange.from)
      rangeStart.setHours(0, 0, 0, 0)
      const rangeEnd = selectedDateRange.to
        ? new Date(selectedDateRange.to)
        : new Date(selectedDateRange.from)
      rangeEnd.setHours(23, 59, 59, 999)

      filtered = filtered.filter(opp => {
        const oppDate = new Date(opp.dateISO)
        oppDate.setHours(12, 0, 0, 0)
        return oppDate >= rangeStart && oppDate <= rangeEnd
      })
    }

    // Sort
    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
        break
      case "spots":
        filtered.sort((a, b) => b.spotsLeft - a.spotsLeft)
        break
      case "hours":
        filtered.sort((a, b) => a.hours - b.hours)
        break
      case "featured":
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        break
    }

    return filtered
  }, [opportunities, searchQuery, selectedCategories, selectedCommitments, selectedHours, selectedDateRange, sortBy])

  // Group by category
  const groupedByCategory = useMemo(() => {
    const groups: { [key: string]: Opportunity[] } = {}
    filteredOpportunities.forEach((opp) => {
      if (!groups[opp.category]) {
        groups[opp.category] = []
      }
      groups[opp.category].push(opp)
    })
    return groups
  }, [filteredOpportunities])

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Toggle commitment filter
  const toggleCommitment = (commitment: string) => {
    setSelectedCommitments(prev =>
      prev.includes(commitment)
        ? prev.filter(c => c !== commitment)
        : [...prev, commitment]
    )
  }

  // Toggle hours filter (single select for "up to X hours" - click same to clear)
  const toggleHours = (hours: string) => {
    setSelectedHours(prev =>
      prev.includes(hours)
        ? prev.filter(h => h !== hours)
        : [hours]
    )
  }


  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedCommitments([])
    setSelectedHours([])
    setSelectedDateRange(undefined)
    setSearchQuery("")
    setSortBy("featured")
  }

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value)
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedCommitments.length > 0 || selectedHours.length > 0 || !!selectedDateRange?.from || searchQuery

  // Manage view helpers
  const filteredManagePostings = opportunities.filter(
    (p) =>
      p.title.toLowerCase().includes(manageSearch.toLowerCase()) ||
      p.organization.toLowerCase().includes(manageSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(manageSearch.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteOpportunity(id);
      setOpportunities(opportunities.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      toast.success("Opportunity deleted");
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast.error("Failed to delete opportunity");
    }
  }


  // Opportunity Card - memoized to prevent re-renders from parent state changes
  const OpportunityCard = React.memo(({ opportunity }: { opportunity: Opportunity }) => {
    const [isHovered, setIsHovered] = useState(false)
    const categoryColor = categoryColors[opportunity.category] || defaultCategoryColor


    return (
      <div
        className="relative flex-shrink-0 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setSelectedOpportunity(opportunity)}
        style={{
          width: isHovered ? '320px' : '200px',
          transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div
          className="relative h-64 bg-white rounded-xl overflow-hidden border border-slate-200"
          style={{
            transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'scale(1.02) translateY(-4px)' : 'scale(1)',
            boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          {/* Background Image with subtle overlay */}
          <div className="absolute inset-0">
            <Image
              src={opportunity.image}
              alt={opportunity.title}
              fill
              className="object-cover"
            />
            {/* Very subtle color tint - much more transparent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor.gradient}`} />
            {/* Strong dark gradient at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>

          {/* Featured badge */}
          {opportunity.featured && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-white text-xs font-bold shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </div>
          )}

          {/* Spots indicator */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-slate-700 text-xs font-medium shadow-sm">
            {opportunity.spotsLeft} spots left
          </div>

          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <h3 className="font-bold text-white text-base leading-tight mb-1 drop-shadow-lg tracking-tight">
              {opportunity.title}
            </h3>
            <p className="text-white/90 text-sm mb-2 drop-shadow">{opportunity.organization}</p>

            {/* Quick info */}
            <div className="flex items-center gap-3 text-xs text-white/90 mb-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {opportunity.hours}h
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {opportunity.location.split(',')[0]}
              </span>
            </div>

            {/* Tags */}
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm`}>
                {opportunity.commitment}
              </span>
            </div>

            {/* Expanded content */}
            <div
              className="overflow-hidden"
              style={{
                maxHeight: isHovered ? '100px' : '0',
                opacity: isHovered ? 1 : 0,
                marginTop: isHovered ? '12px' : '0',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <p className="text-white/90 text-xs leading-relaxed line-clamp-2 mb-3 drop-shadow">
                {opportunity.description}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-slate-300 text-slate-500 rounded-full text-xs font-bold gap-1 cursor-not-allowed hover:bg-slate-300"
                  disabled
                  onClick={(e) => e.stopPropagation()}
                >
                  <Zap className="w-3 h-3" />
                  Apply Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-full border-2 border-slate-300 bg-transparent cursor-not-allowed hover:bg-transparent"
                  disabled
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  })

  OpportunityCard.displayName = 'OpportunityCard'

  // Scrollable row component
  const OpportunityRow = ({ title, opportunities, titleColor = "text-slate-800" }: { title: string, opportunities: Opportunity[], titleColor?: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({
          left: direction === 'left' ? -400 : 400,
          behavior: 'smooth'
        })
      }
    }

    if (opportunities.length === 0) return null

    return (
      <div className="mb-10 group/row">
        <h2 className={`text-xl font-bold ${titleColor} mb-4 px-2 tracking-tight`}>{title}</h2>

        <div className="relative">
          {/* Left scroll */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-sky-50 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
          >
            <div className="w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </div>
          </button>

          {/* Cards container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>

          {/* Right scroll */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-sky-50 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
          >
            <div className="w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-sky-50">
      <Navigation />

      {/* Blue Header Bar - shown when navigating from dashboard */}
      {searchParams.get("from") === "dashboard" && (
        <div className="pt-16 md:pt-20 bg-gradient-to-r from-sky-500 to-indigo-600 border-b border-sky-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <Link
              href="/org/dashboard"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Manage Postings
              </h1>
              <p className="text-sky-100 mt-0.5 text-sm">
                View and manage your organization&apos;s volunteer opportunities
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle Bar - hidden when coming from dashboard */}
      {searchParams.get("from") !== "dashboard" && (
        <div className="pt-16 md:pt-20 bg-gradient-to-r from-sky-100 via-sky-50 to-indigo-50 border-b border-sky-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("browse")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "browse"
                  ? "bg-sky-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Browse Opportunities
              </button>
              <button
                onClick={() => setViewMode("manage")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "manage"
                  ? "bg-sky-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
              >
                <Eye className="w-4 h-4" />
                Manage Postings
              </button>
            </div>
            <Link href="/org/opportunities/new">
              <Button className="bg-sky-600 hover:bg-sky-700 text-white rounded-full px-5 py-2.5 shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-300 flex items-center gap-2 text-sm font-semibold">
                <Plus className="w-4 h-4" />
                Post New Opportunity
              </Button>
            </Link>
          </div>
        </div>
      )}

      {viewMode === "manage" ? (
        /* ===== Manage Postings View ===== */
        <main className="flex-1 pb-12 px-4 sm:px-6 lg:px-8 pt-8">
          <div className="max-w-5xl mx-auto">
            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search postings..."
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  className="pl-10 bg-white border-slate-200 rounded-xl h-11"
                />
              </div>
            </div>

            {/* Postings Card */}
            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 px-6 py-4 border-b border-sky-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Organization Postings</h2>
                  <span className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                    # of Postings: <span className="font-bold text-sky-700">{filteredManagePostings.length}</span>
                  </span>
                </div>
              </div>
              <CardContent className="p-0">
                {filteredManagePostings.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">No postings found</h3>
                    <p className="text-slate-500 mt-1">
                      {manageSearch ? "Try adjusting your search." : "Create your first opportunity posting!"}
                    </p>
                    {!manageSearch && (
                      <Link href="/org/opportunities/new">
                        <Button className="mt-4 bg-sky-600 hover:bg-sky-700 rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Post Opportunity
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {filteredManagePostings.map((posting) => {
                      const colors = categoryColors[posting.category] || defaultCategoryColor
                      const CatIcon = colors.icon
                      const filledPercent = posting.totalSpots > 0 ? (posting.totalSpots - posting.spotsLeft) / posting.totalSpots : 0
                      const spotsColors = filledPercent > 0.8
                        ? "bg-red-50 border-red-200 text-red-800"
                        : filledPercent > 0.5
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800"

                      return (
                        <div key={posting.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-sky-200 transition-all duration-200" style={{ borderLeftWidth: '6px', borderLeftColor: colors.leftColor }}>
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{posting.organization}</h3>
                                  <p className="text-sm text-slate-600 mt-0.5">Title: {posting.title}</p>
                                </div>
                                <div className={`flex items-center gap-2 ${spotsColors} border px-3 py-1.5 rounded-lg flex-shrink-0`}>
                                  <span className="text-sm font-bold">
                                    Spots: {posting.spotsLeft}/{posting.totalSpots}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-slate-600">
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                                  {posting.location}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {posting.date}, {posting.time}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  Volunteer Hours: {posting.hours} Hr
                                </span>
                              </div>
                              <div className="mt-2">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                  <CatIcon className="w-3 h-3" />
                                  Category: {posting.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 mt-4">
                            {deleteConfirm === posting.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-red-600 font-medium">Confirm Delete?</span>
                                <Button size="sm" variant="destructive" className="rounded-lg h-9 px-4" onClick={() => handleDelete(posting.id)}>Yes, Delete</Button>
                                <Button size="sm" variant="outline" className="rounded-lg h-9 px-4" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" className="rounded-lg h-9 px-5 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-colors" onClick={() => {
                                  setEditingPosting(posting)
                                  setEditForm({
                                    title: posting.title,
                                    description: posting.description,
                                    location: posting.location,
                                    date: posting.date,
                                    time: posting.time || "",
                                    hours: posting.hours,
                                    category: posting.category,
                                  })
                                }}>
                                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-lg h-9 px-5 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors" onClick={() => setDeleteConfirm(posting.id)}>
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      ) : (

        <main className="flex-1">
          {/* Filter/Sort Bar */}
          <div className="sticky top-16 md:top-20 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 rounded-full"
                  />
                </div>

                {/* Filter toggle button */}
                <Button
                  variant={showFilters ? "default" : "outline"}
                  className={`rounded-full gap-2 ${showFilters ? 'bg-sky-600 text-white' : 'border-slate-300'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </Button>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-700 gap-1"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear
                  </Button>
                )}

                {/* Results count */}
                <span className="text-sm text-slate-500 ml-auto">
                  {filteredOpportunities.length} opportunities
                </span>
              </div>

              {/* Expanded filter options */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Category filters */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {allCategories.map(category => (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedCategories.includes(category)
                            ? `${categoryColors[category].bg} ${categoryColors[category].text} ring-2 ring-offset-1 ring-sky-400`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Commitment filters */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Commitment</h4>
                    <div className="flex flex-wrap gap-2">
                      {commitmentTypes.map(commitment => (
                        <button
                          key={commitment}
                          onClick={() => toggleCommitment(commitment)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedCommitments.includes(commitment)
                            ? `${commitmentColors[commitment].bg} ${commitmentColors[commitment].text} ring-2 ring-offset-1 ring-sky-400`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {commitment}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hours filter - "Up to X hours" (single select) */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Hours (up to)</h4>
                    <p className="text-xs text-slate-500 mb-2">Show opportunities that fit within your available time</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        onClick={() => setSelectedHours([])}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedHours.length === 0
                          ? 'bg-sky-100 text-sky-700 ring-2 ring-offset-1 ring-sky-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        Any
                      </button>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(hours => (
                        <button
                          key={hours}
                          onClick={() => toggleHours(String(hours))}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedHours.includes(String(hours))
                            ? 'bg-sky-100 text-sky-700 ring-2 ring-offset-1 ring-sky-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {hours} {hours === 1 ? 'hour' : 'hours'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date filter - Calendar */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Date</h4>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal rounded-lg ${!selectedDateRange?.from ? "text-slate-500" : "text-slate-700"}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedDateRange?.from ? (
                            selectedDateRange.to ? (
                              <>
                                {format(selectedDateRange.from, "MMM d, yyyy")} – {format(selectedDateRange.to, "MMM d, yyyy")}
                              </>
                            ) : (
                              format(selectedDateRange.from, "MMM d, yyyy")
                            )
                          ) : (
                            "Pick a date or range"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="range"
                          defaultMonth={selectedDateRange?.from}
                          selected={selectedDateRange}
                          onSelect={setSelectedDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simplified List View */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 tracking-tight">
              All Opportunities {hasActiveFilters && `(${filteredOpportunities.length})`}
            </h2>
            <div className="space-y-3">
              {filteredOpportunities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">No opportunities found</h3>
                  <p className="text-slate-500 mt-1">Try adjusting your filters or search.</p>
                </div>
              ) : (
                filteredOpportunities.map((opp) => {
                  const catColor = categoryColors[opp.category] || categoryColors["Environment"]
                  const commitColor = commitmentColors[opp.commitment]
                  const CatIcon = catColor.icon
                  return (
                    <div
                      key={opp.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-sky-200 transition-all duration-200 cursor-pointer"
                      onClick={() => setSelectedOpportunity(opp)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Title & Org */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 truncate">{opp.title}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">{opp.organization}</p>
                        </div>

                        {/* Meta info pills */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${catColor.bg} ${catColor.text}`}>
                            <CatIcon className="w-3 h-3" />
                            {opp.category}
                          </span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${commitColor?.bg} ${commitColor?.text}`}>
                            {opp.commitment}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {opp.date}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {opp.location.split(',')[0]}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {opp.hours}h
                          </span>
                          <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
                            {opp.spotsLeft}/{opp.totalSpots} spots
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedOpportunity(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative h-64">
              <Image
                src={selectedOpportunity.image}
                alt={selectedOpportunity.title}
                fill
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${categoryColors[selectedOpportunity.category]?.heroGradient || 'from-slate-900/80 to-transparent'}`} />
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              {/* Featured badge */}
              {selectedOpportunity.featured && (
                <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-white text-sm font-medium shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                  Featured
                </div>
              )}

              {/* Title overlay */}
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{selectedOpportunity.title}</h2>
                <p className="text-white/90 drop-shadow">{selectedOpportunity.organization}</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className={`text-sm px-3 py-1 rounded-full ${categoryColors[selectedOpportunity.category]?.bg} ${categoryColors[selectedOpportunity.category]?.text}`}>
                  {selectedOpportunity.category}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${commitmentColors[selectedOpportunity.commitment]?.bg || "bg-slate-100"} ${commitmentColors[selectedOpportunity.commitment]?.text || "text-slate-700"}`}>
                  {selectedOpportunity.commitment}
                </span>
                <span className="text-sm px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                  {selectedOpportunity.hours} hours
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                  <p className="text-2xl font-bold text-sky-700">{selectedOpportunity.spotsLeft}</p>
                  <p className="text-sm text-slate-600">Spots Remaining</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-2xl font-bold text-slate-700">{selectedOpportunity.totalSpots}</p>
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
                    <p className="font-medium text-slate-800">{selectedOpportunity.date}</p>
                    <p className="text-sm">{selectedOpportunity.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-rose-600" />
                  </div>
                  <span>{selectedOpportunity.location}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-2">Helpful Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOpportunity.skills.map((skill) => (
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
                  {selectedOpportunity.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-slate-300 text-slate-500 rounded-full py-6 text-base font-medium shadow-none cursor-not-allowed hover:bg-slate-300" disabled>
                  <Zap className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <Button variant="outline" className="flex-1 rounded-full py-6 text-base font-medium border-slate-200 text-slate-400 cursor-not-allowed hover:bg-white" disabled>
                  Save for later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Posting Modal */}
      {editingPosting && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingPosting(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Opportunity</h2>
              <button
                onClick={() => setEditingPosting(null)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="Environment">Environment</option>
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Animal Welfare">Animal Welfare</option>
                    <option value="Arts & Culture">Arts & Culture</option>
                    <option value="Senior Care">Senior Care</option>
                    <option value="Mental Health">Mental Health</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                  <Input
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
                  <Input
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Hours</label>
                  <Input
                    type="number"
                    value={editForm.hours}
                    onChange={(e) => setEditForm({ ...editForm, hours: Number(e.target.value) })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <Button variant="outline" className="rounded-xl px-5" onClick={() => setEditingPosting(null)}>
                Cancel
              </Button>
              <Button
                className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-6"
                onClick={async () => {
                  if (!editingPosting) return;
                  try {
                    const dataToUpdate = {
                        title: editForm.title,
                        description: editForm.description,
                        location: editForm.location,
                        date: editForm.date,
                        time: editForm.time,
                        hours: editForm.hours,
                        category: editForm.category
                    };
                    await updateOpportunity(editingPosting.id, dataToUpdate);
                    setOpportunities(prev => prev.map(p =>
                      p.id === editingPosting.id
                        ? { ...p, ...dataToUpdate }
                        : p
                    ));
                    setEditingPosting(null);
                    toast.success("Opportunity updated successfully");
                  } catch (error) {
                      console.error("Failed to update opportunity", error);
                      toast.error("Failed to update opportunity");
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
