"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getOrgOpportunities, getOrgApplicants } from "@/lib/firebase/org"
import { Opportunity } from "@/lib/firebase/opportunities"
import { UserApplication } from "@/lib/firebase/dashboard"
import { categoryColors, defaultCategoryColor } from "@/lib/ui-config"
import {
    BarChart3,
    Users,
    FileText,
    TrendingUp,
    Plus,
    ArrowUpRight,
    Calendar,
    MapPin,
    Clock,
    Eye,
    Leaf,
    GraduationCap,
    Heart,
    Dog,
    Palette,
    Stethoscope,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"



export default function OrgDashboardPage() {
    const { userProfile, loading: authLoading } = useAuth()
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [applicants, setApplicants] = useState<UserApplication[]>([])
    const [loadingData, setLoadingData] = useState(true)

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            if (userProfile?.uid) {
                try {
                    const [oppsData, appsData] = await Promise.all([
                        getOrgOpportunities(userProfile.uid),
                        getOrgApplicants(userProfile.uid)
                    ]);
                    if (mounted) {
                        setOpportunities(oppsData);
                        setApplicants(appsData);
                        setLoadingData(false);
                    }
                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                    if (mounted) setLoadingData(false);
                }
            } else if (!authLoading) {
                if (mounted) setLoadingData(false);
            }
        };
        fetchData();
        return () => { mounted = false; }
    }, [userProfile?.uid, authLoading]);

    const getApplicantCount = (opportunityId: string) => {
        return applicants.filter(a => a.opportunityId === opportunityId).length;
    };

    // Analytics calculations
    const totalPostings = opportunities.length
    const totalApplicants = applicants.length
    const totalHours = opportunities.reduce((sum, p) => sum + (p.hours || 0), 0)
    const activePostings = opportunities.length

    // Category breakdown
    const categoryBreakdown = opportunities.reduce(
        (acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1
            return acc
        },
        {} as { [key: string]: number }
    )

    // Recent activity
    const recentPostings = [...opportunities]
        .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
        .slice(0, 3)

    // Postings for selected category
    const categoryPostings = selectedCategory
        ? opportunities.filter((p) => p.category === selectedCategory)
        : []

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-sky-50">
            <Navigation />

            <main className="flex-1 pt-20 md:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                            Organization Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {authLoading || loadingData ? "Loading..." : `Welcome back, ${userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : "Organization"}`}
                        </p>
                    </div>

                    {/* Quick Action Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                        <Link href="/org/opportunities/new?from=dashboard" className="group">
                            <Card className="bg-gradient-to-br from-sky-400 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Plus className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base tracking-tight">Post Opportunity</h3>
                                        <p className="text-sky-100 text-sm mt-0.5">Create a new posting</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/org/opportunities?view=manage&from=dashboard" className="group">
                            <Card className="bg-gradient-to-br from-violet-500 to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Eye className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base tracking-tight">Manage Postings</h3>
                                        <p className="text-purple-100 text-sm mt-0.5">View & edit your listings</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/org/applicants" className="group">
                            <Card className="bg-gradient-to-br from-emerald-400 to-teal-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Users className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base tracking-tight">View Applicants</h3>
                                        <p className="text-emerald-100 text-sm mt-0.5">Review applications</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-sky-600" />
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Active
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{totalPostings}</p>
                                <p className="text-sm text-slate-500 mt-1">Total Postings</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                        All Time
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{totalApplicants}</p>
                                <p className="text-sm text-slate-500 mt-1">Total Applicants</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                        Offered
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{totalHours}h</p>
                                <p className="text-sm text-slate-500 mt-1">Volunteer Hours</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                        <BarChart3 className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        Live
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{activePostings}</p>
                                <p className="text-sm text-slate-500 mt-1">Active Postings</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Category Breakdown */}
                        <Card className="lg:col-span-1 bg-white border-0 shadow-md">
                            <CardContent className="p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-5 tracking-tight">Postings by Category</h2>
                                <div className="space-y-4">
                                    {Object.entries(categoryBreakdown).map(([category, count]) => {
                                        const colors = categoryColors[category] || defaultCategoryColor
                                        const Icon = colors.icon
                                        const percentage = Math.round((count / totalPostings) * 100)

                                        return (
                                            <button
                                                key={category}
                                                className="flex items-center gap-3 w-full text-left hover:bg-slate-50 rounded-lg p-1.5 -m-1.5 transition-colors cursor-pointer"
                                                onClick={() => setSelectedCategory(category)}
                                            >
                                                <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className={`w-4 h-4 ${colors.text}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-slate-700 truncate">{category}</span>
                                                        <span className="text-sm font-bold text-slate-900">{count}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full bg-sky-500 transition-all duration-500`}
                                                            style={{ width: `${percentage}%`, backgroundColor: colors.leftColor }}
                                                        />
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Postings */}
                        <Card className="lg:col-span-2 bg-white border-0 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Postings</h2>
                                    <Link
                                        href="/org/opportunities?view=manage"
                                        className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors"
                                    >
                                        View All
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="space-y-4">
                                    {recentPostings.map((posting) => {
                                        const colors = categoryColors[posting.category] || defaultCategoryColor
                                        const Icon = colors.icon

                                        return (
                                            <div
                                                key={posting.id}
                                                className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-sky-50/50 transition-colors duration-200"
                                                style={{ borderLeftWidth: '6px', borderLeftStyle: 'solid', borderLeftColor: colors.leftColor }}
                                            >
                                                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                    <Icon className={`w-5 h-5 ${colors.text}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{posting.title}</h3>
                                                            <p className="text-xs text-slate-500 mt-0.5">{posting.organization}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200 flex-shrink-0">
                                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-xs font-semibold text-slate-700">{getApplicantCount(posting.id)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {posting.location.split(",")[0]}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {posting.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {posting.hours} Hr
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Category Postings Popup */}
            {selectedCategory && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedCategory(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const colors = categoryColors[selectedCategory as string] || defaultCategoryColor
                                    const Icon = colors.icon
                                    return (
                                        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${colors.text}`} />
                                        </div>
                                    )
                                })()}
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{selectedCategory}</h2>
                                    <p className="text-sm text-slate-500">{categoryPostings.length} posting{categoryPostings.length !== 1 ? "s" : ""}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {/* Postings List */}
                        <div className="p-4 space-y-3">
                            {categoryPostings.map((posting) => {
                                const colors = categoryColors[posting.category] || defaultCategoryColor
                                return (
                                    <Link
                                        key={posting.id}
                                        href={`/org/opportunities?view=manage`}
                                        onClick={() => setSelectedCategory(null)}
                                        className="block p-4 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all duration-200 cursor-pointer"
                                    >
                                        <h3 className="font-bold text-slate-900 tracking-tight">{posting.title}</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">{posting.organization}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {posting.location.split(",")[0]}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {posting.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {posting.hours} Hr
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {getApplicantCount(posting.id)} applicants
                                            </span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
