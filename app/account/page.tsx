"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/contexts/AuthContext"
import { updateUserProfile } from "@/lib/firebase/auth"
import { updateStudentProfile, getStudentProfile } from "@/lib/firebase/student-profiles"
import { SchoolSelector } from "@/components/school-selector"
import { toast } from "sonner"
import { INTERESTS, VOLUNTEER_OPTIONS, AVAILABILITY_OPTIONS } from "@/lib/preferences"
import { getUserApplications, UserApplication } from "@/lib/firebase/dashboard"
import { cn } from "@/lib/utils"
import {
    Sparkles,
    TrendingUp,
    FileText,
    User,
    Award,
    Pencil,
    Check,
    Settings,
} from "lucide-react"

// Dashboard tabs
const tabs = [
    { id: "progress", label: "Progress Tracking", icon: TrendingUp, href: "/dashboard" },
    { id: "applications", label: "Applications", icon: FileText, href: "/applications" },
    { id: "account", label: "My Account", icon: User, href: "/account" },
]

export default function AccountPage() {
    const { user, userProfile, loading, refreshProfile } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [school, setSchool] = useState("")
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [volunteerPreference, setVolunteerPreference] = useState("")
    const [availability, setAvailability] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isEditingPrefs, setIsEditingPrefs] = useState(false)
    const [prefsSaveError, setPrefsSaveError] = useState<string | null>(null)
    const [applications, setApplications] = useState<UserApplication[]>([])

    useEffect(() => {
        if (userProfile) {
            const parts = ((userProfile as any).fullName || "").trim().split(" ")
            setFirstName(userProfile.firstName || parts[0] || "")
            setLastName(userProfile.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : "") || "")
            setEmail(userProfile.email || user?.email || "")
        }
    }, [userProfile, user?.email])

    // Fetch student profile for preferences + school
    useEffect(() => {
        const fetchStudentProfile = async () => {
            if (!user?.uid) return
            try {
                const profile = await getStudentProfile(user.uid)
                if (profile) {
                    setSchool(profile.school || "")
                    setSelectedInterests(
                        (profile.interests || []).map((id: string) => (id === "senior-security" ? "senior-care" : id))
                    )
                    setVolunteerPreference(profile.volunteerFormat || "")
                    setAvailability(profile.availability || "")
                }
            } catch (err) {
                console.error("Error fetching student profile:", err)
            }
        }
        fetchStudentProfile()
    }, [user?.uid])

    useEffect(() => {
        const fetchApps = async () => {
            if (!user?.uid) return
            try {
                const apps = await getUserApplications(user.uid)
                setApplications(apps)
            } catch (error) {
                console.error("Error fetching applications for account stats:", error)
            }
        }
        fetchApps()
    }, [user?.uid])

    const [interestLimitMessage, setInterestLimitMessage] = useState("")

    const handleInterestToggle = (id: string) => {
        setSelectedInterests((prev) => {
            if (prev.includes(id)) {
                setInterestLimitMessage("")
                return prev.filter((x) => x !== id)
            }
            if (prev.length < 2) {
                setInterestLimitMessage("")
                return [...prev, id]
            }
            setInterestLimitMessage("You can only pick two.")
            return prev
        })
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.uid) return
        setIsSaving(true)
        setSaveError(null)
        try {
            await updateUserProfile(user.uid, { firstName, lastName, email })
            // Save school to student_profiles
            await updateStudentProfile(user.uid, { school })
            await refreshProfile()
            setIsEditing(false)
            toast.success("Changes saved successfully")
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSavePrefs = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.uid) return
        setIsSaving(true)
        setPrefsSaveError(null)
        try {
            await updateStudentProfile(user.uid, {
                interests: selectedInterests,
                volunteerFormat: volunteerPreference || undefined,
                availability: availability || undefined,
            })
            await refreshProfile()
            setIsEditingPrefs(false)
            toast.success("Preferences saved successfully")
        } catch (err) {
            setPrefsSaveError(err instanceof Error ? err.message : "Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

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
                                            Welcome back, {loading ? "..." : (userProfile?.firstName || "User")}!
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
                                        <p className="text-xl font-bold text-teal-700">
                                            {applications.filter((a) => a.status === "completed").length}
                                        </p>
                                    </div>
                                </div>

                                {/* Pending Applications Stat */}
                                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-orange-600 font-medium">Pending</p>
                                        <p className="text-xl font-bold text-orange-700">
                                            {applications.filter((a) => a.status === "pending").length}
                                        </p>
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
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${tab.id === "account"
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

                    {/* Page Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">My Account</h2>
                        <p className="text-muted-foreground mt-1">
                            View and manage your personal information
                        </p>
                    </div>

                    {/* Your information - editable fields matching signup */}
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <form onSubmit={handleSave}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-bold tracking-tight">Your information</h3>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setIsEditing(false)
                                                    if (userProfile) {
                                                        setFirstName(userProfile.firstName || "")
                                                        setLastName(userProfile.lastName || "")
                                                        setEmail(userProfile.email || user?.email || "")
                                                    }
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" size="sm" disabled={isSaving}>
                                                {isSaving ? "Saving..." : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Save
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <Pencil className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>

                                {saveError && (
                                    <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                        {saveError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first-name">First Name</Label>
                                        {isEditing ? (
                                            <Input
                                                id="first-name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="John"
                                                required
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground py-2">{firstName || "—"}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="last-name">Last Name</Label>
                                        {isEditing ? (
                                            <Input
                                                id="last-name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Doe"
                                                required
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground py-2">{lastName || "—"}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        {isEditing ? (
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="m@example.com"
                                                required
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground py-2">{email || "—"}</p>
                                        )}
                                        {isEditing && (
                                            <p className="text-[10px] text-muted-foreground">* Please use your school email address.</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2 md:col-span-2">
                                        <Label htmlFor="school">School name</Label>
                                        <SchoolSelector
                                            value={school}
                                            onChange={setSchool}
                                            disabled={!isEditing}
                                            placeholder="Search for your school..."
                                        />
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Your preferences - editable */}
                    <Card className="shadow-sm mt-6">
                        <CardContent className="p-6">
                            <form onSubmit={handleSavePrefs}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                                            <Settings className="w-5 h-5 text-sky-600" />
                                        </div>
                                        <h3 className="text-lg font-bold tracking-tight">Your preferences</h3>
                                    </div>
                                    {isEditingPrefs ? (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    setIsEditingPrefs(false)
                                                    // Restore from student profile
                                                    if (user?.uid) {
                                                        try {
                                                            const profile = await getStudentProfile(user.uid)
                                                            if (profile) {
                                                                setSelectedInterests(profile.interests || [])
                                                                setVolunteerPreference(profile.volunteerFormat || "")
                                                                setAvailability(profile.availability || "")
                                                            }
                                                        } catch (err) {
                                                            console.error("Error restoring preferences:", err)
                                                        }
                                                    }
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" size="sm" disabled={isSaving}>
                                                {isSaving ? "Saving..." : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Save
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPrefs(true)}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <Pencil className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>

                                {prefsSaveError && (
                                    <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                        {prefsSaveError}
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Interests */}
                                    <div>
                                        <Label className="text-base font-bold mb-4 block tracking-tight">
                                            What are you most interested in? (pick 1-2)
                                        </Label>
                                        {!isEditingPrefs ? (
                                            <p className="font-medium text-foreground py-2">
                                                {selectedInterests.length > 0
                                                    ? selectedInterests
                                                        .map((id) => INTERESTS.find((i) => i.id === id)?.label ?? (id === "senior-security" ? "Senior Care" : id))
                                                        .filter(Boolean)
                                                        .join(", ")
                                                    : "—"}
                                            </p>
                                        ) : (
                                            <>
                                                {interestLimitMessage && (
                                                    <p className="text-sm text-amber-600 font-medium mb-3">{interestLimitMessage}</p>
                                                )}
                                                <div className="space-y-3">
                                                    {INTERESTS.map((interest) => {
                                                        const Icon = interest.icon
                                                        const isSelected = selectedInterests.includes(interest.id)
                                                        return (
                                                            <button
                                                                key={interest.id}
                                                                type="button"
                                                                onClick={() => isEditingPrefs && handleInterestToggle(interest.id)}
                                                                disabled={!isEditingPrefs}
                                                                className={cn(
                                                                    "w-full p-4 rounded-lg border-2 transition-all text-left",
                                                                    isEditingPrefs && "hover:shadow-md cursor-pointer",
                                                                    !isEditingPrefs && "cursor-default",
                                                                    isSelected
                                                                        ? `${interest.bgColor} ${interest.borderColor} border-2 shadow-sm`
                                                                        : "bg-slate-50 border-slate-200"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <Icon className={cn("h-6 w-6", isSelected ? interest.color : "text-slate-600")} />
                                                                    <span className="font-medium">{interest.label}</span>
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Volunteer preference & Availability */}
                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-base font-bold mb-4 block tracking-tight">
                                                How do you prefer to Volunteer?
                                            </Label>
                                            {isEditingPrefs ? (
                                                <Card className="bg-slate-50 border-slate-200">
                                                    <CardContent className="p-4">
                                                        <RadioGroup
                                                            value={volunteerPreference}
                                                            onValueChange={setVolunteerPreference}
                                                            className="space-y-3"
                                                        >
                                                            {VOLUNTEER_OPTIONS.map((opt) => (
                                                                <div key={opt.id} className="flex items-center space-x-2">
                                                                    <RadioGroupItem value={opt.id} id={`vol-${opt.id}`} />
                                                                    <Label htmlFor={`vol-${opt.id}`} className="font-normal cursor-pointer">
                                                                        {opt.label}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <p className="font-medium text-foreground py-2">
                                                    {VOLUNTEER_OPTIONS.find((o) => o.id === volunteerPreference)?.label || "—"}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-base font-bold mb-4 block tracking-tight">
                                                When are you available?
                                            </Label>
                                            {isEditingPrefs ? (
                                                <Card className="bg-slate-50 border-slate-200">
                                                    <CardContent className="p-4">
                                                        <RadioGroup
                                                            value={availability}
                                                            onValueChange={setAvailability}
                                                            className="space-y-3"
                                                        >
                                                            {AVAILABILITY_OPTIONS.map((opt) => (
                                                                <div key={opt.id} className="flex items-center space-x-2">
                                                                    <RadioGroupItem value={opt.id} id={`avail-${opt.id}`} />
                                                                    <Label htmlFor={`avail-${opt.id}`} className="font-normal cursor-pointer">
                                                                        {opt.label}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <p className="font-medium text-foreground py-2">
                                                    {AVAILABILITY_OPTIONS.find((o) => o.id === availability)?.label || "—"}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
