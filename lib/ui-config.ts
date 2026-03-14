import {
  Leaf,
  GraduationCap,
  Stethoscope,
  Dog,
  Palette,
  Heart,
  CheckCircle,
  Clock3,
  CheckCircle2,
  XCircle,
  Star,
} from "lucide-react"

// ============================================================================
// 🎨 CENTRALIZED COLOR CONFIGURATION
// ============================================================================
//
// This is the SINGLE SOURCE OF TRUTH for all color mappings used across the app.
// All pages (Dashboard, Applications, Opportunities, Org pages, etc.) import
// from this file. Do NOT define colors locally in page components.
//
// TO ADD A NEW CATEGORY:
//   Add a new entry to `categoryColors` below with all required fields.
//
// TO ADD A NEW STATUS:
//   Add a new entry to `statusColors` below with all required fields.
//
// TO ADD A NEW COMMITMENT LEVEL:
//   Add a new entry to `commitmentColors` below with all required fields.
//
// ============================================================================

// Category Colors Map
export const categoryColors: { [key: string]: { bg: string; text: string; border: string; gradient: string; icon: typeof Leaf; heroGradient: string; cardBg: string; leftColor: string } } = {
  "Environment": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", gradient: "from-green-500/15 to-emerald-600/15", heroGradient: "from-green-900/90 via-green-800/60 to-transparent", icon: Leaf, cardBg: "bg-green-50 border-green-200", leftColor: "#10b981" },
  "Community Outreach": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", gradient: "from-orange-500/15 to-amber-600/15", heroGradient: "from-orange-900/90 via-orange-800/60 to-transparent", icon: Heart, cardBg: "bg-orange-50 border-orange-200", leftColor: "#f97316" },
  "Education": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", gradient: "from-blue-500/15 to-indigo-600/15", heroGradient: "from-blue-900/90 via-blue-800/60 to-transparent", icon: GraduationCap, cardBg: "bg-blue-50 border-blue-200", leftColor: "#3b82f6" },
  "Healthcare": { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300", gradient: "from-pink-500/15 to-rose-600/15", heroGradient: "from-pink-900/90 via-pink-800/60 to-transparent", icon: Stethoscope, cardBg: "bg-pink-50 border-pink-200", leftColor: "#ec4899" },
  "Animal Welfare": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", gradient: "from-amber-500/15 to-yellow-600/15", heroGradient: "from-amber-900/90 via-amber-800/60 to-transparent", icon: Dog, cardBg: "bg-amber-50 border-amber-200", leftColor: "#f59e0b" },
  "Arts & Culture": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", gradient: "from-purple-500/15 to-violet-600/15", heroGradient: "from-purple-900/90 via-purple-800/60 to-transparent", icon: Palette, cardBg: "bg-purple-50 border-purple-200", leftColor: "#a855f7" },
  "Senior Care": { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300", gradient: "from-rose-500/15 to-pink-600/15", heroGradient: "from-rose-900/90 via-rose-800/60 to-transparent", icon: Heart, cardBg: "bg-rose-50 border-rose-200", leftColor: "#f43f5e" },
  "Mental Health": { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300", gradient: "from-pink-500/15 to-rose-600/15", heroGradient: "from-pink-900/90 via-pink-800/60 to-transparent", icon: Heart, cardBg: "bg-pink-50 border-pink-200", leftColor: "#ec4899" },
}

// Fallback for missing category coloring
export const defaultCategoryColor = categoryColors["Environment"]

// Commitment level colors
export const commitmentColors: { [key: string]: { bg: string; text: string } } = {
  "One-time": { bg: "bg-green-100", text: "text-green-700" },
  "Weekly": { bg: "bg-blue-100", text: "text-blue-700" },
  "Monthly": { bg: "bg-purple-100", text: "text-purple-700" },
}

// Status Colors
export const statusColors: { [key: string]: { bg: string; text: string; border: string; icon: typeof CheckCircle; label: string } } = {
  approved: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", icon: CheckCircle, label: "Approved" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", icon: Clock3, label: "Pending" },
  completed: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300", icon: CheckCircle2, label: "Completed" },
  denied: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", icon: XCircle, label: "Declined" },
  rejected: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", icon: XCircle, label: "Declined" }, // alias
  saved: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", icon: Star, label: "Saved" },
}
