"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createOpportunity } from "@/lib/firebase/org"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORIES } from "@/lib/preferences"


const requirementOptions = [
    "Training",
    "Background Check",
    "First Aid",
    "Driver's License",
    "18+",
    "Physical Fitness",
    "Experience Required",
    "None",
]

export default function PostOpportunityPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { userProfile } = useAuth()
    const [showSuccess, setShowSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [form, setForm] = useState({
        organizationName: "",
        title: "",
        description: "",
        location: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        applicationDeadline: "",
        volunteerHours: "",
        category: "",
        requirements: [] as string[],
        contactName: "",
        email: "",
        phone: "",
    })

    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }))
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

    const validate = () => {
        const newErrors: { [key: string]: string } = {}
        if (!form.organizationName) newErrors.organizationName = "Required"
        if (!form.title) newErrors.title = "Required"
        if (!form.description) newErrors.description = "Required"
        if (!form.location) newErrors.location = "Required"
        if (!form.startDate) newErrors.startDate = "Required"
        if (!form.startTime) newErrors.startTime = "Required"
        if (!form.endTime) newErrors.endTime = "Required"
        if (!form.category) newErrors.category = "Required"
        if (!form.contactName) newErrors.contactName = "Required"
        if (!form.email) newErrors.email = "Required"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate() || !userProfile?.uid) return

        setIsSubmitting(true)
        try {
            const dateObj = new Date(form.startDate);
            const displayDate = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
            
            await createOpportunity(userProfile.uid, {
                title: form.title,
                organization: form.organizationName,
                description: form.description,
                location: form.location,
                date: displayDate,
                dateISO: form.startDate,
                time: `${form.startTime} - ${form.endTime}`,
                hours: Number(form.volunteerHours) || 0,
                spotsLeft: 20,
                totalSpots: 20,
                category: form.category,
                commitment: "One-time",
                skills: form.requirements,
                featured: false,
                image: "/event-park-cleanup.png"
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

            {/* Blue Header Bar */}
            <div className="pt-16 md:pt-20 bg-gradient-to-r from-sky-500 to-indigo-600 border-b border-sky-600">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        href={searchParams.get("from") === "dashboard" ? "/org/dashboard" : "/org/opportunities"}
                        className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {searchParams.get("from") === "dashboard" ? "Back to Dashboard" : "Back to Manage Postings"}
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        Post an Opportunity
                    </h1>
                    <p className="text-sky-100 mt-0.5 text-sm">
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
                                {/* Organization Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="org-name" className="text-sm font-semibold text-slate-700">
                                        Organization Name
                                    </Label>
                                    <Input
                                        id="org-name"
                                        placeholder="e.g. Trinity Bellwoods Park"
                                        value={form.organizationName}
                                        onChange={(e) => updateField("organizationName", e.target.value)}
                                        className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 focus:ring-sky-500 focus:border-sky-500 ${errors.organizationName ? "border-red-400 bg-red-50" : ""}`}
                                    />
                                    {errors.organizationName && <p className="text-xs text-red-500">{errors.organizationName}</p>}
                                </div>

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
                                        className={`bg-sky-50/50 border-sky-200 rounded-xl h-11 ${errors.title ? "border-red-400 bg-red-50" : ""}`}
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
                                        rows={4}
                                        className={`w-full rounded-xl border bg-sky-50/50 border-sky-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none ${errors.description ? "border-red-400 bg-red-50" : ""}`}
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
                                </div>

                                {/* Date Fields */}
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
                                            className="bg-sky-50/50 border-sky-200 rounded-xl h-11"
                                        />
                                    </div>
                                </div>

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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                            Volunteer Hours
                                        </Label>
                                        <Input
                                            id="hours"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            placeholder="e.g. 2"
                                            value={form.volunteerHours}
                                            onChange={(e) => updateField("volunteerHours", e.target.value)}
                                            className="bg-sky-50/50 border-sky-200 rounded-xl h-11"
                                        />
                                    </div>
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
