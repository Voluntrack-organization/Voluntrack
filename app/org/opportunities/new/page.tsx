"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createOpportunity } from "@/lib/firebase/org"
import { validateOpportunityContent, containsInappropriateContent } from "@/lib/opportunityValidation"
import { toast } from "sonner"

import {
    ArrowLeft,
    Building2,
    FileText,
    MapPin,
    Calendar,
    Clock,
    Users,
    Tag,
    User,
    Mail,
    Phone,
    CheckCircle,
    X,
    Repeat,
    CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORIES } from "@/lib/preferences"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

const LocationMapPreview = dynamic(() => import("@/components/LocationMapPreview"), { ssr: false })

const requirementOptions = [
    "Background Check",
    "First Aid",
    "Physical Fitness",
    "Experience Required",
    "None",
]

export default function PostOpportunityPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, userProfile } = useAuth()
    const [showSuccess, setShowSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [orgName, setOrgName] = useState("")
    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        numberOfOpenings: "",
        commitment: "One-time" as "One-time" | "Weekly" | "Monthly",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        applicationDeadline: "",
        volunteerHours: "",
        totalVolunteerHours: "",
        category: "",
        requirements: [] as string[],
        contactName: "",
        email: "",
        phone: "",
    })

    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [contentWarning, setContentWarning] = useState<string | null>(null)
    const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle")
    const [mapPreview, setMapPreview] = useState<{ lat: number; lng: number; displayName: string; isValid: boolean } | null>(null)

    useEffect(() => {
        const fetchOrgName = async () => {
            const uid = userProfile?.uid ?? user?.uid
            if (!uid) return
            const profileSnap = await getDoc(doc(db, "volunteer_org_profiles", uid))
            if (!profileSnap.exists()) return
            const { orgId } = profileSnap.data()
            if (!orgId) return
            const orgSnap = await getDoc(doc(db, "volunteer_orgs", orgId))
            if (!orgSnap.exists()) return
            const { name } = orgSnap.data()
            if (name) setOrgName(name)
        }
        fetchOrgName()
    }, [user, userProfile])

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }))
        }
        if ((field === "title" || field === "description") && contentWarning) {
            setContentWarning(null)
        }
    }

    const toggleRequirement = (req: string) => {
        setForm((prev) => ({
            ...prev,
            requirements: prev.requirements.includes(req)
                ? prev.requirements.filter((r) => r !== req)
                : [...prev.requirements, req],
        }))
    }

    function parseTimeToMinutes(time: string): number | null {
        const parts = time.split(":")
        if (parts.length !== 2) return null
        const h = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        if (isNaN(h) || isNaN(m)) return null
        return h * 60 + m
    }

    useEffect(() => {
        if (!form.startTime || !form.endTime) return
        const startMins = parseTimeToMinutes(form.startTime)
        const endMins = parseTimeToMinutes(form.endTime)
        if (startMins === null || endMins === null) return
        const diffMins = endMins - startMins
        if (diffMins <= 0) return
        const rounded = Math.round((diffMins / 60) * 2) / 2
        setForm((prev) => ({ ...prev, volunteerHours: String(rounded) }))
        setErrors((prev) => ({ ...prev, volunteerHours: "" }))
    }, [form.startTime, form.endTime])

    // Auto-calculate total volunteer hours for recurring opportunities
    useEffect(() => {
        if (form.commitment === "One-time") {
            setForm((prev) => ({ ...prev, totalVolunteerHours: "" }))
            return
        }
        if (!form.volunteerHours || !form.startDate || !form.endDate) return
        const start = new Date(form.startDate)
        const end = new Date(form.endDate)
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const sessionCount = form.commitment === "Weekly"
            ? Math.floor(diffDays / 7) + 1
            : Math.floor(diffDays / 30) + 1
        const total = Math.round(sessionCount * Number(form.volunteerHours) * 2) / 2
        setForm((prev) => ({ ...prev, totalVolunteerHours: String(total) }))
    }, [form.commitment, form.volunteerHours, form.startDate, form.endDate])

    useEffect(() => {
        if (form.location.trim().length < 5) {
            setMapPreview(null)
            setLocationStatus("idle")
            return
        }
        setLocationStatus("loading")
        setMapPreview(null)
        const timer = setTimeout(async () => {
            try {
                const res = await fetch("/api/validate-location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: form.location }),
                })
                const data = await res.json()
                if (data.lat != null && data.lng != null) {
                    setMapPreview({ lat: data.lat, lng: data.lng, displayName: data.displayName ?? form.location, isValid: data.valid })
                    setLocationStatus(data.valid ? "valid" : "invalid")
                    if (!data.valid) {
                        setErrors((prev) => ({ ...prev, location: data.reason ?? "Address must be in Ontario, Canada." }))
                    } else {
                        setErrors((prev) => ({ ...prev, location: "" }))
                    }
                } else {
                    setMapPreview(null)
                    setLocationStatus("invalid")
                    setErrors((prev) => ({ ...prev, location: data.reason ?? "Address could not be found." }))
                }
            } catch {
                setMapPreview(null)
                setLocationStatus("idle")
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [form.location])

    const isRecurring = form.commitment !== "One-time"

    const validate = () => {
        const newErrors: { [key: string]: string } = {}
        if (!form.title) newErrors.title = "Required"
        if (!form.description) newErrors.description = "Required"
        if (!form.location) newErrors.location = "Required"
        if (!form.numberOfOpenings || Number(form.numberOfOpenings) < 1) newErrors.numberOfOpenings = "Required"
        if (!form.startDate) newErrors.startDate = "Required"
        if (isRecurring && !form.endDate) newErrors.endDate = "Required for recurring opportunities"
        if (isRecurring && form.startDate && form.endDate && form.endDate <= form.startDate) {
            newErrors.endDate = "End date must be after start date"
        }
        if (!form.startTime) newErrors.startTime = "Required"
        if (!form.endTime) newErrors.endTime = "Required"
        if (!form.category) newErrors.category = "Required"
        if (!form.contactName) newErrors.contactName = "Required"
        else if (containsInappropriateContent(form.contactName)) newErrors.contactName = "This field contains inappropriate content."
        if (!form.email) newErrors.email = "Required"
        // Hours must not exceed event duration
        if (form.startTime && form.endTime && form.volunteerHours) {
            const startMins = parseTimeToMinutes(form.startTime)
            const endMins = parseTimeToMinutes(form.endTime)
            if (startMins !== null && endMins !== null && endMins > startMins) {
                const maxHours = (endMins - startMins) / 60
                if (Number(form.volunteerHours) > maxHours) {
                    newErrors.volunteerHours = `Volunteer hours cannot exceed the event duration (${Number.isInteger(maxHours) ? maxHours : maxHours.toFixed(1)} hrs)`
                }
            }
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleContentBlur = () => {
        const result = validateOpportunityContent(form.title, form.description)
        const contentErrors = result.errors.filter(
            (e) => !e.includes("Title must be") && !e.includes("Description must be")
        )
        if (contentErrors.length > 0) {
            setContentWarning(contentErrors.join(" "))
        } else {
            setContentWarning(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const uid = userProfile?.uid ?? user?.uid
        if (!validate() || !uid) {
            if (!uid) toast.error("You must be logged in to post an opportunity.")
            return
        }

        // Layer 1: keyword check
        const keywordCheck = validateOpportunityContent(form.title, form.description)
        const keywordContentErrors = keywordCheck.errors.filter(
            (e) => !e.includes("Title must be") && !e.includes("Description must be")
        )
        if (keywordContentErrors.length > 0) {
            setContentWarning(keywordContentErrors.join(" "))
            setIsSubmitting(false)
            return
        }

        setIsSubmitting(true)

        // Layer 2: Gemini LLM check
        try {
            const res = await fetch("/api/validate-opportunity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: form.title, description: form.description }),
            })
            const check = await res.json()
            if (!check.valid) {
                const message =
                    check.flagType === "error"
                        ? "Validation service is temporarily unavailable. Please try again later."
                        : check.flagType === "unsafe"
                        ? "This opportunity contains inappropriate or harmful content and cannot be submitted."
                        : check.reason ?? "This opportunity does not appear to be eligible."
                setContentWarning(message)
                setIsSubmitting(false)
                return
            }
        } catch {
            setContentWarning("Validation service is temporarily unavailable. Please try again later.")
            setIsSubmitting(false)
            return
        }

        // Layer 1.75: Ontario location validation
        if (locationStatus === "invalid") {
            setErrors({ location: "Address must be in Ontario, Canada." })
            setIsSubmitting(false)
            return
        } else if (locationStatus !== "valid") {
            // idle or loading — validate now
            try {
                const locRes = await fetch("/api/validate-location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: form.location }),
                })
                const locCheck = await locRes.json()
                if (!locCheck.valid) {
                    setErrors({ location: locCheck.reason ?? "Address must be in Ontario, Canada." })
                    setIsSubmitting(false)
                    return
                }
            } catch {
                // Fail open — network error should not block submission
            }
        }

        try {
            const dateObj = new Date(form.startDate);
            const displayDate = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

            await createOpportunity(uid, {
                title: form.title,
                organization: orgName,
                description: form.description,
                location: form.location,
                date: displayDate,
                dateISO: form.startDate,
                time: `${form.startTime} - ${form.endTime}`,
                hours: Number(form.volunteerHours) || 0,
                ...(form.commitment !== "One-time" && form.totalVolunteerHours && { totalHours: Number(form.totalVolunteerHours) }),
                spotsLeft: Number(form.numberOfOpenings),
                totalSpots: Number(form.numberOfOpenings),
                category: form.category,
                commitment: form.commitment,
                skills: form.requirements,
                featured: false,
                image: "/event-park-cleanup.png",
                ...(mapPreview?.lat != null && { lat: mapPreview.lat }),
                ...(mapPreview?.lng != null && { lng: mapPreview.lng }),
                ...(form.applicationDeadline && { applicationDeadline: form.applicationDeadline }),
            })
            
            toast.success("Opportunity posted successfully!")
            setShowSuccess(true)
            setTimeout(() => {
                router.push("/org/opportunities")
            }, 2000)
        } catch (error) {
            console.error("Failed to create opportunity:", error)
            toast.error("Failed to post opportunity")
            setIsSubmitting(false)
        }
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-sky-50">
                <Navigation />
                <main className="flex-1 pt-20 md:pt-24 flex items-center justify-center px-4">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Opportunity Posted!</h2>
                        <p className="text-slate-500">Redirecting to your postings...</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-sky-50">
            <Navigation />

            {/* Header Section */}
            <div className="pt-16 md:pt-20 bg-white border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        href={searchParams.get("from") === "dashboard" ? "/org/dashboard" : "/org/opportunities"}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-slate-700 font-medium bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {searchParams.get("from") === "dashboard" ? "Back to Dashboard" : "Back to Manage Postings"}
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                        Post an Opportunity
                    </h1>
                    <p className="text-slate-600 mt-0.5 text-sm">
                        Fill in the details below to create a new volunteer opportunity
                    </p>
                </div>
            </div>

            <main className="flex-1 pb-12 px-4 sm:px-6 lg:px-8 pt-8">
                <div className="max-w-3xl mx-auto">

                    {/* Form Card */}
                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 px-6 py-4 border-b border-sky-100">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                                <Building2 className="w-5 h-5 text-sky-600" />
                                Organization Information
                            </h2>
                        </div>

                        <CardContent className="p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {contentWarning && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        <span className="mt-0.5 shrink-0">⚠️</span>
                                        <span>{contentWarning}</span>
                                    </div>
                                )}
                                {/* Opportunity Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                                        Opportunity Title
                                    </Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Park Clean-Up"
                                        value={form.title}
                                        onChange={(e) => updateField("title", e.target.value)}
                                        onBlur={handleContentBlur}
                                        className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.title || contentWarning ? "border-red-400 bg-red-50" : ""}`}
                                    />
                                    {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                                        Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        placeholder="Describe the volunteer opportunity, what volunteers will do, and any other relevant details..."
                                        value={form.description}
                                        onChange={(e) => updateField("description", e.target.value)}
                                        onBlur={handleContentBlur}
                                        rows={4}
                                        className={`w-full rounded-xl border bg-sky-50/50 border-sky-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none ${errors.description || contentWarning ? "border-red-400 bg-red-50" : ""}`}
                                    />
                                    {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-sm font-semibold text-slate-700">
                                        Location
                                    </Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="location"
                                            placeholder="e.g. 790 Queen St W, Toronto, ON M6J 1G3"
                                            value={form.location}
                                            onChange={(e) => updateField("location", e.target.value)}
                                            className={`pl-10 bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.location ? "border-red-400 bg-red-50" : ""}`}
                                        />
                                    </div>
                                    {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                                    {locationStatus === "loading" && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                                            <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                                            Validating address…
                                        </div>
                                    )}
                                    {locationStatus === "valid" && !errors.location && (
                                        <p className="text-xs text-emerald-600 font-medium mt-1">Address confirmed in Ontario</p>
                                    )}
                                    {mapPreview && (
                                        <LocationMapPreview
                                            lat={mapPreview.lat}
                                            lng={mapPreview.lng}
                                            displayName={mapPreview.displayName}
                                            isValid={mapPreview.isValid}
                                        />
                                    )}
                                </div>

                                {/* Number of Openings */}
                                <div className="space-y-2">
                                    <Label htmlFor="openings" className="text-sm font-semibold text-slate-700">
                                        Number of Openings
                                    </Label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="openings"
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="e.g. 20"
                                            value={form.numberOfOpenings}
                                            onChange={(e) => updateField("numberOfOpenings", e.target.value)}
                                            className={`pl-10 bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.numberOfOpenings ? "border-red-400 bg-red-50" : ""}`}
                                        />
                                    </div>
                                    {errors.numberOfOpenings && <p className="text-xs text-red-500">{errors.numberOfOpenings}</p>}
                                </div>

                                {/* Commitment Type Toggle */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">
                                        Experience Type
                                    </Label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm(prev => ({ ...prev, commitment: "One-time", endDate: "" }))
                                                setErrors(prev => ({ ...prev, endDate: "" }))
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                                                !isRecurring
                                                    ? "bg-sky-50 border-sky-400 text-sky-700 shadow-sm ring-1 ring-sky-200"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-sky-200 hover:bg-sky-50/50"
                                            }`}
                                        >
                                            <CalendarDays className="w-4.5 h-4.5" />
                                            One-Time
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, commitment: "Weekly" }))}
                                            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                                                isRecurring
                                                    ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                                            }`}
                                        >
                                            <Repeat className="w-4.5 h-4.5" />
                                            Recurring
                                        </button>
                                    </div>
                                </div>

                                {/* Recurring Frequency Selector */}
                                {isRecurring && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">
                                            Frequency
                                        </Label>
                                        <div className="flex gap-2">
                                            {(["Weekly", "Monthly"] as const).map((freq) => (
                                                <button
                                                    key={freq}
                                                    type="button"
                                                    onClick={() => setForm(prev => ({ ...prev, commitment: freq }))}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                                                        form.commitment === freq
                                                            ? "bg-indigo-100 border-indigo-400 text-indigo-700 shadow-sm"
                                                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                                                    }`}
                                                >
                                                    {form.commitment === freq && <span className="mr-1">✓</span>}
                                                    {freq}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Date Fields */}
                                {isRecurring ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start-date" className="text-sm font-semibold text-slate-700">
                                                Start Date
                                            </Label>
                                            <Input
                                                id="start-date"
                                                type="date"
                                                value={form.startDate}
                                                onChange={(e) => updateField("startDate", e.target.value)}
                                                className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.startDate ? "border-red-400 bg-red-50" : ""}`}
                                            />
                                            {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="end-date" className="text-sm font-semibold text-slate-700">
                                                End Date
                                            </Label>
                                            <Input
                                                id="end-date"
                                                type="date"
                                                value={form.endDate}
                                                onChange={(e) => updateField("endDate", e.target.value)}
                                                className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.endDate ? "border-red-400 bg-red-50" : ""}`}
                                            />
                                            {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="start-date" className="text-sm font-semibold text-slate-700">
                                            Date
                                        </Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => updateField("startDate", e.target.value)}
                                            className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.startDate ? "border-red-400 bg-red-50" : ""}`}
                                        />
                                        {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
                                    </div>
                                )}

                                {/* Time Fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-time" className="text-sm font-semibold text-slate-700">
                                            Start Time
                                        </Label>
                                        <Input
                                            id="start-time"
                                            type="time"
                                            value={form.startTime}
                                            onChange={(e) => updateField("startTime", e.target.value)}
                                            className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.startTime ? "border-red-400 bg-red-50" : ""}`}
                                        />
                                        {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-time" className="text-sm font-semibold text-slate-700">
                                            End Time
                                        </Label>
                                        <Input
                                            id="end-time"
                                            type="time"
                                            value={form.endTime}
                                            onChange={(e) => updateField("endTime", e.target.value)}
                                            className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.endTime ? "border-red-400 bg-red-50" : ""}`}
                                        />
                                        {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
                                    </div>
                                </div>

                                {/* Deadline & Hours */}
                                <div className={`grid grid-cols-1 ${isRecurring ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                                    <div className="space-y-2">
                                        <Label htmlFor="deadline" className="text-sm font-semibold text-slate-700">
                                            Application Deadline
                                        </Label>
                                        <Input
                                            id="deadline"
                                            type="date"
                                            value={form.applicationDeadline}
                                            onChange={(e) => updateField("applicationDeadline", e.target.value)}
                                            className="bg-sky-50/50 border-sky-200 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hours" className="text-sm font-semibold text-slate-700">
                                            {isRecurring ? "Hours Per Session" : "Volunteer Hours"}
                                        </Label>
                                        <Input
                                            id="hours"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            placeholder="Auto-calculated from times"
                                            value={form.volunteerHours}
                                            onChange={(e) => updateField("volunteerHours", e.target.value)}
                                            className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.volunteerHours ? "border-red-400 bg-red-50" : ""}`}
                                        />
                                        {errors.volunteerHours && <p className="text-xs text-red-500">{errors.volunteerHours}</p>}
                                    </div>
                                    {isRecurring && (
                                        <div className="space-y-2">
                                            <Label htmlFor="total-hours" className="text-sm font-semibold text-slate-700">
                                                Total Volunteer Hours
                                            </Label>
                                            <Input
                                                id="total-hours"
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                placeholder="Auto-calculated"
                                                value={form.totalVolunteerHours}
                                                onChange={(e) => updateField("totalVolunteerHours", e.target.value)}
                                                className="bg-sky-50/50 border-sky-200 rounded-xl h-11"
                                            />
                                            {form.volunteerHours && form.startDate && form.endDate && form.totalVolunteerHours && (
                                                <p className="text-xs text-slate-500">
                                                    ≈ {Math.round(Number(form.totalVolunteerHours) / Number(form.volunteerHours))} sessions × {form.volunteerHours} hrs
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Category & Requirements */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-sm font-semibold text-slate-700">
                                            Category
                                        </Label>
                                        <select
                                            id="category"
                                            value={form.category}
                                            onChange={(e) => updateField("category", e.target.value)}
                                            className={`w-full h-11 rounded-xl border bg-sky-50/50 border-sky-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${errors.category ? "border-red-400 bg-red-50" : ""} ${!form.category ? "text-slate-400" : "text-slate-900"}`}
                                        >
                                            <option value="" disabled>
                                                Select a category
                                            </option>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Requirements</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {requirementOptions.map((req) => (
                                                <button
                                                    key={req}
                                                    type="button"
                                                    onClick={() => toggleRequirement(req)}
                                                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${form.requirements.includes(req)
                                                        ? "bg-sky-100 border-sky-400 text-sky-700 font-semibold shadow-sm"
                                                        : "bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50"
                                                        }`}
                                                >
                                                    {form.requirements.includes(req) && (
                                                        <span className="mr-1">✓</span>
                                                    )}
                                                    {req}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-100 pt-6">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 tracking-tight">
                                        <User className="w-4 h-4 text-sky-600" />
                                        Contact Information
                                    </h3>
                                </div>

                                {/* Contact Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="contact-name" className="text-sm font-semibold text-slate-700">
                                        Contact Name
                                    </Label>
                                    <Input
                                        id="contact-name"
                                        placeholder="Full name"
                                        value={form.contactName}
                                        onChange={(e) => updateField("contactName", e.target.value)}
                                        className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.contactName ? "border-red-400 bg-red-50" : ""}`}
                                    />
                                    {errors.contactName && <p className="text-xs text-red-500">{errors.contactName}</p>}
                                </div>

                                {/* Email & Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                            Email
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="contact@org.com"
                                                value={form.email}
                                                onChange={(e) => updateField("email", e.target.value)}
                                                className={`pl-10 bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.email ? "border-red-400 bg-red-50" : ""}`}
                                            />
                                        </div>
                                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                                            Phone #
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="(416) 555-0123"
                                                value={form.phone}
                                                onChange={(e) => updateField("phone", e.target.value)}
                                                className="pl-10 bg-sky-50/50 border-sky-200 rounded-xl h-11"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex items-center gap-4 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-12 text-base font-semibold shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-300 disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            {isSubmitting ? "Posting..." : "Post Opportunity"}
                                        </Button>
                                    <Link href="/org/opportunities">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl h-12 px-6 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900 hover:border-slate-400"
                                        >
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
