"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Calendar,
    MapPin,
    Clock,
    ChevronDown,
    ChevronUp,
    Filter,
    X,
    Sparkles,
    TrendingUp,
    FileText,
    FolderOpen,
    Newspaper,
    User,
    Search,
    ArrowRight,
    Award,
    BarChart3,
    RotateCcw,
    Bookmark,
    Leaf,
    BookOpen,
    ArrowUpDown,
    CheckCircle,
    CheckCircle2,
    XCircle,
    Clock3,
    Flag,
    Download,
    Plus,
    Zap,
} from "lucide-react"
import {
    getUserApplications,
    getUserSaved,
    toggleSaveOpportunity,
    applyToOpportunity,
    updateApplicationStatus,
    unsaveOpportunity,
    applyToOpportunity,
    UserApplication,
    SavedOpportunity
} from "@/lib/firebase/dashboard"
import { submitReport } from "@/lib/firebase/reports"
import { toast } from "sonner"
import { CATEGORIES } from "@/lib/preferences"
import { generateVolunteerPDF } from "@/lib/pdf-generator"
import { categoryColors, statusColors, defaultCategoryColor } from "@/lib/ui-config"
import { AddExternalOpportunityModal } from "@/components/add-external-opportunity-modal"

const eventCategories = [...CATEGORIES]

const statusOptions = [
    { id: "approved", label: statusColors.approved.label, color: statusColors.approved },
    { id: "pending", label: statusColors.pending.label, color: statusColors.pending },
    { id: "denied", label: statusColors.denied.label, color: statusColors.denied },
    { id: "completed", label: statusColors.completed.label, color: statusColors.completed },
]

const sortOptions = [
    { id: "recent", label: "Most Recent" },
    { id: "oldest", label: "Oldest First" },
    { id: "az", label: "Alphabetical A-Z" },
    { id: "za", label: "Alphabetical Z-A" },
]

// Dashboard tabs
const tabs = [
    { id: "progress", label: "Progress Tracking", icon: TrendingUp, href: "/dashboard" },
    { id: "applications", label: "Applications", icon: FileText, href: "/applications" },
    { id: "account", label: "My Account", icon: User, href: "/account" },
]

export default function ApplicationsPage() {
    const { userProfile, loading } = useAuth()
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [sortBy, setSortBy] = useState("recent")
    const [showMoreCategories, setShowMoreCategories] = useState(false)
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [savedExpanded, setSavedExpanded] = useState(false)
    const [applications, setApplications] = useState<UserApplication[]>([])
    const [savedOpps, setSavedOpps] = useState<SavedOpportunity[]>([])
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [dataLoading, setDataLoading] = useState(true)
    const [selectedApplication, setSelectedApplication] = useState<UserApplication | null>(null)
    const [selectedSaved, setSelectedSaved] = useState<UserApplication | null>(null)
    const [reflectionText, setReflectionText] = useState("")
    const [reportOpportunity, setReportOpportunity] = useState<UserApplication | null>(null)
    const [reportConcern, setReportConcern] = useState("")
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [reportSubmitting, setReportSubmitting] = useState(false)
    const [showExternalOppModal, setShowExternalOppModal] = useState(false)

    const { user } = useAuth()

    const fetchData = React.useCallback(async () => {
        if (!user?.uid) return
        setDataLoading(true)
        try {
            const [userApps, userSaved] = await Promise.all([
                getUserApplications(user.uid),
                getUserSaved(user.uid)
            ])
            setApplications(userApps)
            setAppliedIds(new Set(userApps.map(a => a.opportunityId)))
            setSavedOpps(userSaved)
        } catch (error) {
            console.error("Error fetching applications data:", error)
            toast.error("Failed to load your applications.")
        } finally {
            setDataLoading(false)
        }
    }, [user?.uid])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

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

    const handleApplyFromSaved = async (opp: UserApplication) => {
        if (!user?.uid) {
            toast.error("Please sign in to apply.")
            return
        }
        try {
            // Reconstruct minimal Opportunity object
            const oppData = { ...opp, id: opp.opportunityId } as any
            await applyToOpportunity(user.uid, oppData)
            toast.success("Application submitted successfully!")
            setSelectedSaved(null)
            fetchData() // Refresh both lists
        } catch (err: any) {
            toast.error(err.message || "Failed to apply.")
        }
    }

    const handleExportPDF = async () => {
        setIsGeneratingPDF(true)
        try {
            const completedOpportunities = applications.filter(app => app.status === "completed")
            await generateVolunteerPDF(userProfile, completedOpportunities)
            toast.success("PDF generated successfully!")
        } catch (error) {
            console.error("Error generating PDF:", error)
            toast.error("Failed to generate PDF.")
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    const handleUnsave = async (opp: SavedOpportunity) => {
        if (!user?.uid) return
        setActionLoading(`unsave-${opp.opportunityId}`)
        try {
            await unsaveOpportunity(user.uid, opp.opportunityId)
            setSavedOpps(prev => prev.filter(s => s.opportunityId !== opp.opportunityId))
            setSelectedSaved(null)
            toast.success("Removed from saved list")
        } catch {
            toast.error("Failed to remove from saved list.")
        } finally {
            setActionLoading(null)
        }
    }

    const handleApplyFromSaved = async (opp: SavedOpportunity) => {
        if (!user?.uid || appliedIds.has(opp.opportunityId)) return
        setActionLoading(`apply-${opp.opportunityId}`)
        try {
            await applyToOpportunity(user.uid, opp as any)
            setAppliedIds(prev => new Set([...Array.from(prev), opp.opportunityId]))
            toast.success("Application submitted successfully!")
        } catch (err: any) {
            toast.error(err.message || "Failed to apply.")
        } finally {
            setActionLoading(null)
        }
    }

    const toggleStatus = (status: string) => {
        setSelectedStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        )
    }

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        )
    }

    const clearFilters = () => {
        setSelectedStatuses([])
        setSelectedCategories([])
        setStartDate("")
        setEndDate("")
        setSortBy("recent")
        setSearchQuery("")
    }

    // Filter and sort applications
    const filteredApplications = useMemo(() => {
        let result = applications.filter((app) => {
            // Filter by status
            if (selectedStatuses.length > 0 && !selectedStatuses.includes(app.status)) {
                return false
            }

            // Filter by category
            if (selectedCategories.length > 0 && !selectedCategories.includes(app.category)) {
                return false
            }

            // Filter by date range (applied date)
            if (startDate) {
                const appDate = new Date(app.appliedDate)
                const filterStartDate = new Date(startDate)
                if (appDate < filterStartDate) return false
            }

            if (endDate) {
                const appDate = new Date(app.appliedDate)
                const filterEndDate = new Date(endDate)
                if (appDate > filterEndDate) return false
            }

            // Filter by search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase()
                const matchesSearch =
                    app.title.toLowerCase().includes(query) ||
                    app.location.toLowerCase().includes(query) ||
                    app.category.toLowerCase().includes(query) ||
                    app.status.toLowerCase().includes(query)
                if (!matchesSearch) return false
            }

            return true
        })

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case "recent":
                    return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
                case "oldest":
                    return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime()
                case "az":
                    return a.title.localeCompare(b.title)
                case "za":
                    return b.title.localeCompare(a.title)
                default:
                    return 0
            }
        })

        return result
    }, [applications, selectedStatuses, selectedCategories, startDate, endDate, sortBy, searchQuery])

    const displayedCategories = showMoreCategories ? eventCategories : eventCategories.slice(0, 4)

    const hasActiveFilters = selectedStatuses.length > 0 || selectedCategories.length > 0 || startDate || endDate || searchQuery || sortBy !== "recent"

    const FilterSidebar = () => (
        <div className="h-full overflow-y-auto pr-2 space-y-6">
            {/* Filter Header */}
            <div className="flex items-center justify-between sticky top-0 bg-card py-2 z-10">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-foreground" />
                    <h2 className="font-bold text-lg tracking-tight">Filter</h2>
                </div>
            </div>

            {/* Active Filters Section */}
            {hasActiveFilters && (
                <div className="pb-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-sm text-foreground">Active filters</h3>
                        <span className="text-xs text-muted-foreground">{filteredApplications.length} results</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Status Tags */}
                        {selectedStatuses.map(statusId => {
                            const status = statusOptions.find(s => s.id === statusId)
                            if (!status) return null
                            return (
                                <button
                                    key={statusId}
                                    onClick={() => toggleStatus(statusId)}
                                    className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 hover:opacity-80 transition-opacity ${status.color.bg} ${status.color.text} ${status.color.border}`}
                                >
                                    {status.label}
                                    <X className="w-3 h-3 ml-1" />
                                </button>
                            )
                        })}

                        {/* Category Tags */}
                        {selectedCategories.map(cat => {
                            const colors = categoryColors[cat] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" }
                            return (
                                <button
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 hover:opacity-80 transition-opacity ${colors.bg} ${colors.text} ${colors.border}`}
                                >
                                    {cat}
                                    <X className="w-3 h-3 ml-1" />
                                </button>
                            )
                        })}

                        {/* Date Tags */}
                        {startDate && (
                            <button
                                onClick={() => setStartDate("")}
                                className="text-xs px-2 py-1 rounded-full border bg-secondary text-secondary-foreground border-border flex items-center gap-1 hover:bg-secondary/80"
                            >
                                After: {startDate} <X className="w-3 h-3 ml-1" />
                            </button>
                        )}
                        {endDate && (
                            <button
                                onClick={() => setEndDate("")}
                                className="text-xs px-2 py-1 rounded-full border bg-secondary text-secondary-foreground border-border flex items-center gap-1 hover:bg-secondary/80"
                            >
                                Before: {endDate} <X className="w-3 h-3 ml-1" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-foreground mt-3 underline decoration-dotted underline-offset-4"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Sorting */}
            <div>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 tracking-tight">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort By
                </h3>
                <div className="space-y-2">
                    {sortOptions.map((option) => (
                        <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="sortBy"
                                checked={sortBy === option.id}
                                onChange={() => setSortBy(option.id)}
                                className="w-4 h-4 text-blue-500"
                            />
                            <span className="text-sm">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-border" />

            {/* Status Filter */}
            <div>
                <h3 className="font-bold text-sm mb-3 tracking-tight">Application Status</h3>
                <div className="space-y-2">
                    {statusOptions.map((status) => (
                        <label key={status.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={selectedStatuses.includes(status.id)}
                                onCheckedChange={() => toggleStatus(status.id)}
                            />
                            <span className={`text-sm px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.color.bg} ${status.color.text} ${status.color.border}`}>
                                <status.color.icon className="w-3 h-3" />
                                {status.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-border" />

            {/* Category Filter */}
            <div>
                <h3 className="font-bold text-sm mb-3 tracking-tight">Category</h3>
                <div className="space-y-2">
                    {displayedCategories.map((category) => {
                        const colors = categoryColors[category] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" }
                        return (
                            <label key={category} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={selectedCategories.includes(category)}
                                    onCheckedChange={() => toggleCategory(category)}
                                />
                                <span className={`text-sm px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                                    {category}
                                </span>
                            </label>
                        )
                    })}
                </div>
                {eventCategories.length > 4 && (
                    <button
                        onClick={() => setShowMoreCategories(!showMoreCategories)}
                        className="text-sm text-blue-500 hover:text-blue-600 mt-2 flex items-center gap-1"
                    >
                        {showMoreCategories ? (
                            <>
                                Show less <ChevronUp className="w-3 h-3" />
                            </>
                        ) : (
                            <>
                                Show more <ChevronDown className="w-3 h-3" />
                            </>
                        )}
                    </button>
                )}
            </div>

            <hr className="border-border" />

            {/* Date Range */}
            <div>
                <h3 className="font-bold text-sm mb-3 tracking-tight">Applied Date Range</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-lg"
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background">
            <Navigation />

            <main className="flex-1 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Header - Same as Dashboard */}
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
                                            {loading
                                                ? "..."
                                                : userProfile?.firstName
                                                    ? userProfile.firstName.charAt(0).toUpperCase() +
                                                    userProfile.firstName.slice(1).toLowerCase()
                                                    : "User"}
                                            !
                                        </h1>
                                    </div>
                                </div>
                                <div className="mt-4 ml-16 flex flex-col sm:flex-row">
                                    <Link href="/opportunities">
                                        <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2 rounded-full mb-2 sm:mb-0 sm:mr-2 w-full sm:w-auto">
                                            <FolderOpen className="w-4 h-4" />
                                            View Opportunities
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline" 
                                        className="gap-2 rounded-full w-full sm:w-auto"
                                        onClick={() => setShowExternalOppModal(true)}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add External Opportunity
                                    </Button>
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
                                        <p className="text-xl font-bold text-teal-700">{applications.filter(a => a.status === "completed").length}</p>
                                    </div>
                                </div>

                                {/* Pending Applications Stat */}
                                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-orange-600 font-medium">Pending</p>
                                        <p className="text-xl font-bold text-orange-700">{applications.filter(a => a.status === "pending").length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white rounded-xl mb-6 shadow-sm overflow-x-auto">
                        <div className="flex w-full">
                            {tabs.map((tab) => (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${tab.id === "applications"
                                        ? "border-blue-500 text-blue-600 bg-blue-50/50"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Page Title & Actions */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">My Applications</h2>
                            <p className="text-muted-foreground mt-1">
                                Track all your volunteer applications and their status
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleExportPDF}
                            disabled={isGeneratingPDF || applications.filter(a => a.status === "completed").length === 0}
                            className="gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                        >
                            <Download className="w-4 h-4" />
                            {isGeneratingPDF ? "Exporting..." : "Export PDF History"}
                        </Button>
                    </div>

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden mb-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="gap-2 rounded-full"
                        >
                            <Filter className="w-4 h-4" />
                            {showMobileFilters ? "Hide Filters" : "Show Filters"}
                        </Button>
                    </div>

                    <div className="flex gap-6">
                        {/* Filter Sidebar - Desktop */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <Card className="shadow-sm sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden">
                                <CardContent className="p-5 h-full max-h-[calc(100vh-160px)] overflow-y-auto">
                                    <FilterSidebar />
                                </CardContent>
                            </Card>
                        </aside>

                        {/* Mobile Filter Drawer */}
                        {showMobileFilters && (
                            <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
                                <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-card p-6 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-semibold text-lg">Filters</h2>
                                        <button onClick={() => setShowMobileFilters(false)}>
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <FilterSidebar />
                                </div>
                            </div>
                        )}

                        {/* Applications List */}
                        <div className="flex-1">
                            {/* Search Bar */}
                            <div className="mb-6">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                    <Input
                                        type="text"
                                        placeholder="Search applications by title, location, category, or status..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-12 py-6 text-base bg-white dark:bg-card rounded-full border-2 focus:border-blue-400 shadow-sm xl:w-[calc(100%+296px)]"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted right-4 xl:right-[-272px]"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Results count */}
                            <p className="text-sm text-muted-foreground mb-4">
                                Showing {filteredApplications.length} of {applications.length} applications
                            </p>

                            {/* Applications Cards */}
                            <div className="space-y-4">
                                {filteredApplications.map((app) => {
                                    const categoryColor = categoryColors[app.category] || { cardBg: "bg-gray-50 border-gray-200" }
                                    const statusColor = statusColors[app.status]
                                    const StatusIcon = statusColor.icon

                                    return (
                                        <div
                                            key={app.id}
                                            className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] ${categoryColor.cardBg}`}
                                            onClick={() => setSelectedApplication(app)}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-bold text-foreground mb-2 tracking-tight">{app.title}</h3>
                                                <div className="space-y-1 text-sm">
                                                    <p className="flex items-center gap-2">
                                                        <span className="text-red-500 font-medium">Location</span>
                                                        <MapPin className="w-3 h-3 text-red-500" />
                                                        <span className="text-muted-foreground">: {app.location}</span>
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <span className="text-yellow-600 font-medium">Time</span>
                                                        <Clock className="w-3 h-3 text-yellow-600" />
                                                        <span className="text-muted-foreground">: {app.date}</span>
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">Volunteer Hours</span>
                                                        <span className="text-muted-foreground"> : {app.hours}</span>
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">Category:</span>
                                                        <span className="text-muted-foreground"> {app.category}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Applied: {new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2">
                                                    {app.status === "completed" && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setReportOpportunity(app); setReportConcern(""); }}
                                                            className="p-1.5 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                            title="Report a concern"
                                                        >
                                                            <Flag className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                                                    >
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusOptions.find(s => s.id === app.status)?.label}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {app.status === "approved" && (
                                                        <Button
                                                            variant="outline"
                                                            className="bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 hover:text-green-800 rounded-full"
                                                            onClick={(e) => { e.stopPropagation(); handleMarkComplete(app); }}
                                                        >
                                                            Complete
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        className="bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200 hover:text-orange-800 rounded-full"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedApplication(app); }}
                                                    >
                                                        View Posting
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Empty State */}
                            {filteredApplications.length === 0 && (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                                        <FolderOpen className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">No applications found</h3>
                                    <p className="text-muted-foreground mt-2 mb-6">
                                        Try adjusting your filters to find more applications
                                    </p>
                                    <Button onClick={clearFilters} variant="outline" className="gap-2 rounded-full">
                                        <RotateCcw className="w-4 h-4" />
                                        Reset All Filters
                                    </Button>
                                </div>
                            )}

                            {/* Total Count */}
                            {filteredApplications.length > 0 && (
                                <p className="text-center mt-6 font-semibold">
                                    Total Applications: {filteredApplications.length}
                                </p>
                            )}
                        </div>

                        {/* Saved Opportunities - Right Column */}
                        <aside className="hidden xl:block w-72 flex-shrink-0">
                            {/* Spacer to align with first application card */}
                            <div className="h-[112px]" />
                            <Card className={`shadow-sm sticky top-24 transition-all duration-300 ${savedExpanded ? 'max-h-[calc(100vh-120px)] flex flex-col' : ''}`}>
                                <CardContent className={`p-5 ${savedExpanded ? 'flex flex-col flex-1 overflow-hidden' : ''}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <Bookmark className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <h2 className="text-base font-semibold">Saved</h2>
                                    </div>

                                    <div className={`space-y-3 ${savedExpanded ? 'flex-1 overflow-y-auto pr-1' : ''}`}>
                                        {(savedExpanded ? savedOpps : savedOpps.slice(0, 5)).map((opp) => (
                                            <div
                                                key={opp.opportunityId}
                                                onClick={() => setSelectedSaved(opp)}
                                                className="group flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all cursor-pointer hover:scale-[1.02]"
                                            >
                                                <div className={`w-8 h-8 rounded-lg ${categoryColors[opp.category]?.bg || "bg-amber-100"} flex items-center justify-center flex-shrink-0`}>
                                                    <Bookmark className={`w-4 h-4 ${categoryColors[opp.category]?.text || "text-amber-600"}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-foreground line-clamp-2">
                                                        {opp.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {opp.date}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUnsave(opp); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ml-auto"
                                                    title="Remove from saved"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setSavedExpanded(!savedExpanded)}
                                        className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 mt-4"
                                    >
                                        {savedExpanded ? (
                                            <>
                                                Show Less
                                                <ChevronUp className="w-4 h-4" />
                                            </>
                                        ) : (
                                            <>
                                                View All
                                                <ChevronDown className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Application Detail Modal */}
            {selectedApplication && (
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
                                    {(() => { const StatusIcon = statusColors[selectedApplication.status].icon; return <StatusIcon className="w-4 h-4" />; })()}
                                    {statusOptions.find(s => s.id === selectedApplication.status)?.label}
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
                                        <p className="font-medium text-slate-800">{(selectedApplication.date || "").split(',').slice(0, 2).join(',')}</p>
                                        <p className="text-sm">{(selectedApplication.date || "").split(',').slice(2).join(',').trim()}</p>
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
                            {selectedApplication.status === 'denied' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                    <p className="text-red-800 text-sm">
                                        <strong>Not Approved:</strong> Unfortunately, your application was not approved for this opportunity. Feel free to explore other opportunities that match your interests.
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
                                {selectedApplication.status === 'denied' && (
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-6">
                                        Browse Similar Opportunities
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
            )}

            {/* Report Concern Modal */}
            {reportOpportunity && (
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
            )}

            {/* Saved Opportunity Detail Modal */}
            {selectedSaved && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedSaved(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header with Image */}
                        <div className="relative h-64">
                            <img
                                src={selectedSaved.image}
                                alt={selectedSaved.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/icon.svg' }}
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${categoryColors[selectedSaved.category]?.heroGradient || 'from-slate-900/80 to-transparent'}`} />
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
                                        <p className="font-medium text-slate-800">{(selectedSaved.date || "").split(',').slice(0, 2).join(',')}</p>
                                        <p className="text-sm">{(selectedSaved.date || "").split(',').slice(2).join(',').trim()}</p>
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
                            <div className="flex gap-3">
                                <Button
                                    className={`flex-1 rounded-full py-6 text-base font-medium transition-all hover:scale-[1.02] ${appliedIds.has(selectedSaved.opportunityId)
                                        ? "bg-green-500 hover:bg-green-600 text-white cursor-default"
                                        : "bg-sky-600 hover:bg-sky-700 text-white"}`}
                                    onClick={() => handleApplyFromSaved(selectedSaved)}
                                    disabled={actionLoading === `apply-${selectedSaved.opportunityId}` || appliedIds.has(selectedSaved.opportunityId)}
                                >
                                    {actionLoading === `apply-${selectedSaved.opportunityId}` ? (
                                        "Applying..."
                                    ) : appliedIds.has(selectedSaved.opportunityId) ? (
                                        <><CheckCircle2 className="w-4 h-4 mr-1" />Applied</>
                                    ) : (
                                        <><Zap className="w-4 h-4 mr-1" />Apply Now</>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="px-6 rounded-full py-6 border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={() => handleUnsave(selectedSaved)}
                                    disabled={actionLoading === `unsave-${selectedSaved.opportunityId}`}
                                >
                                    {actionLoading === `unsave-${selectedSaved.opportunityId}` ? "Removing..." : "Unsave"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AddExternalOpportunityModal 
                open={showExternalOppModal} 
                onOpenChange={setShowExternalOppModal}
                onSuccess={() => {
                    fetchData()
                }}
            />
        </div>
    )
}
