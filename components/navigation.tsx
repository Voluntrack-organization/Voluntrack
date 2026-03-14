"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Menu, X, ChevronDown, User, LogOut, UserCircle, Info } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"

interface NavigationProps {
  forceWhite?: boolean;
}

export function Navigation({ forceWhite = false }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, userProfile, loading, logout } = useAuth()
  const router = useRouter()
  const notificationCount = 0

  const pathname = usePathname()
  // Detect if user is in org view
  const isOrgView = pathname?.startsWith("/org")
  // Use the actual user object for authenticaton state
  const isLoggedIn = !!user
  // Check if we're on a login/signup page
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup")
  // Use actual Firebase auth state instead of pathname-based heuristic
  const isAuthenticated = !loading && !!user

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${forceWhite ? 'bg-white shadow-md border-b border-gray-100' : 'bg-gradient-to-b from-black/80 via-black/50 to-transparent backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={isOrgView ? "/org/dashboard" : "/"} className="flex items-center group">
            <span className={`font-logo text-2xl md:text-3xl font-bold tracking-tight transition-colors duration-300 ${forceWhite ? 'text-gray-900' : 'text-white'}`}>
              <span className="text-primary">Volun</span>
              <span className="text-orange-500">Track</span>
              <span className="text-primary"> Ontario</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {isAuthenticated && !isOrgView && (
              <>
                <Link
                  href="/opportunities"
                  className={`text-sm tracking-wider uppercase transition-all duration-300 font-medium ${pathname === "/opportunities"
                    ? (forceWhite ? "text-rose-600 font-bold" : "text-white font-semibold")
                    : (forceWhite ? 'text-slate-800 hover:text-rose-600 font-semibold' : 'text-white/70 hover:text-white')
                  }`}
                >
                  Opportunities
                </Link>
                <Link
                  href="/dashboard"
                  className={`text-sm tracking-wider uppercase transition-all duration-300 font-medium ${pathname === "/dashboard"
                    ? (forceWhite ? "text-rose-600 font-bold" : "text-white font-semibold")
                    : (forceWhite ? 'text-gray-600 hover:text-rose-600' : 'text-white/70 hover:text-white')
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/feed"
                  className={`text-sm tracking-wider uppercase transition-all duration-300 font-medium ${pathname === "/feed"
                    ? (forceWhite ? "text-rose-600 font-bold" : "text-white font-semibold")
                    : (forceWhite ? 'text-slate-800 hover:text-rose-600 font-semibold' : 'text-white/70 hover:text-white')
                  }`}
                >
                  Feed
                </Link>
              </>
            )}
            {isAuthenticated && isOrgView && (
              <>
                <Link
                  href="/org/dashboard"
                  className={`text-sm tracking-wider uppercase transition-all duration-300 ${pathname?.startsWith("/org/dashboard") 
                    ? (forceWhite ? "text-rose-600 font-bold" : "text-white font-semibold") 
                    : (forceWhite ? "text-gray-600 hover:text-rose-600" : "text-white/70 hover:text-white")
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/org/opportunities"
                  className={`text-sm tracking-wider uppercase transition-all duration-300 ${pathname?.startsWith("/org/opportunities") 
                    ? (forceWhite ? "text-rose-600 font-bold" : "text-white font-semibold") 
                    : (forceWhite ? "text-gray-600 hover:text-rose-600" : "text-white/70 hover:text-white")
                  }`}
                >
                  Opportunities
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Button variant="ghost" size="icon" className={`relative hidden sm:flex transition-colors duration-300 ${forceWhite ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {notificationCount}
                  </span>
                )}
              </Button>
            )}

            {/* Authentication vs Profile */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity outline-none">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${forceWhite ? 'bg-gray-100 border-gray-200' : 'bg-white/10 border-white/20'}`}>
                      <User className={`h-5 w-5 transition-colors duration-300 ${forceWhite ? 'text-gray-600' : 'text-white/80'}`} />
                    </div>
                    {loading ? (
                      <span className={`text-sm font-medium transition-colors duration-300 ${forceWhite ? 'text-gray-400' : 'text-white/60'}`}>Loading...</span>
                    ) : (
                      <span className={`text-sm font-medium transition-colors duration-300 ${forceWhite ? 'text-gray-900' : 'text-white'}`}>
                        {userProfile?.firstName || "User"}
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-colors duration-300 ${forceWhite ? 'text-gray-400' : 'text-white/60'}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[150]">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                      <UserCircle className="h-4 w-4" />
                      My account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={isOrgView ? "/org/about" : "/about"} className="flex items-center gap-2 cursor-pointer">
                      <Info className="h-4 w-4" />
                      About
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={async () => {
                      await logout()
                      router.push("/")
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isAuthPage ? (
              /* Auth Buttons - only show if not on an auth page */
              <div className="hidden sm:flex items-center gap-4">
                <Link href="/login">
                  <Button
                    variant={pathname?.startsWith("/login") ? "default" : "outline"}
                    className={`rounded-full px-6 tracking-wide uppercase text-xs ${pathname?.startsWith("/login")
                      ? "bg-primary text-primary-foreground"
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      }`}
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="outline"
                    className="rounded-full px-6 tracking-wide uppercase text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Sign up
                  </Button>
                </Link>
              </div>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden transition-colors duration-300 ${forceWhite ? 'text-slate-900 border-gray-200 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/90 backdrop-blur-xl">
          <div className="px-4 py-6 space-y-4">
            {isAuthenticated && !isOrgView && (
              <>
                <Link
                  href="/opportunities"
                  className="block text-base tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Opportunities
                </Link>
                <Link
                  href="/dashboard"
                  className="block text-base tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/feed"
                  className="block text-base tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Feed
                </Link>
              </>
            )}
            {isAuthenticated && isOrgView && (
              <>
                <Link
                  href="/org/dashboard"
                  className="block text-base tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/org/opportunities"
                  className="block text-base tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Opportunities
                </Link>
              </>
            )}
            <div className="pt-4 border-t border-border flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    className="block text-base tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My account
                  </Link>

                  <button
                    className="block text-base tracking-wider uppercase text-destructive font-medium transition-colors text-left w-full"
                    onClick={async () => {
                      setMobileMenuOpen(false)
                      await logout()
                      router.push("/")
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-base tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-base tracking-wider uppercase text-primary font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
