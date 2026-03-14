import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"

export default function RoleSelectionPage() {
  return (
    <div className="min-h-svh bg-background">
      <Navigation />

      <div className="pt-32 pb-12 px-6 md:px-10 flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto w-full space-y-12">

          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="text-primary">Volun</span>
              <span className="text-orange-500">Track</span>
              <span className="text-primary"> Ontario</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Select your role below to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Students Card */}
            <Link href="/login/student" className="group h-full block">
              <Card className="h-full overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 shadow-md transform hover:scale-[1.02] hover:ring-2 hover:ring-sky-500/20">
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 z-10" />
                  <img
                    src="/student-with-laptop-searching-for-volunteer-opport.jpg"
                    alt="Student working on laptop"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-8 pb-4 flex-grow bg-white relative z-20 group-hover:bg-sky-50/30 transition-colors">
                  <h2 className="text-2xl font-bold text-sky-900 mb-3 group-hover:text-primary transition-colors tracking-tight">Students</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Discover opportunities, track your hours, and build skills for your future
                  </p>
                </CardContent>
                <CardFooter className="p-8 pt-0 bg-white group-hover:bg-sky-50/30 transition-colors">
                  <Button asChild className="w-full text-base py-6 transition-all duration-300 group-hover:bg-sky-700 group-hover:shadow-lg" size="lg">
                    <div>Log In as Student</div>
                  </Button>
                </CardFooter>
              </Card>
            </Link>

            {/* Volunteer Organizations Card */}
            <Link href="/login/organization" className="group h-full block">
              <Card className="h-full overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 shadow-md transform hover:scale-[1.02] hover:ring-2 hover:ring-sky-500/20">
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 z-10" />
                  <img
                    src="/volunteer-organization-team-working-together-commu.jpg"
                    alt="Volunteer Organization"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-8 pb-4 flex-grow bg-white relative z-20 group-hover:bg-sky-50/30 transition-colors">
                  <h2 className="text-2xl font-bold text-sky-900 mb-3 group-hover:text-primary transition-colors tracking-tight">Volunteer Organizations</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Post opportunities, connect with eager volunteers, and verify completed hours
                  </p>
                </CardContent>
                <CardFooter className="p-8 pt-0 bg-white group-hover:bg-sky-50/30 transition-colors">
                  <Button asChild className="w-full text-base py-6 transition-all duration-300 group-hover:bg-sky-700 group-hover:shadow-lg" size="lg">
                    <div>Manage Opportunities</div>
                  </Button>
                </CardFooter>
              </Card>
            </Link>

          </div>

          {/* Sign up prompt */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-base md:text-lg">
            <span className="text-foreground font-medium">Don&apos;t have an account?</span>
            <Button asChild size="lg" variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}