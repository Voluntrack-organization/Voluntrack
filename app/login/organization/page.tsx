import { LoginForm } from "@/components/login-form"
import { Navigation } from "@/components/navigation"

export default function OrganizationLoginPage() {
    return (
        <div className="min-h-svh bg-background flex flex-col">
            <Navigation />
            <div className="flex-1 p-6 md:p-10 pt-24 md:pt-32">
            <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">

                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-8">
                    <header>
                        <h1 className="text-4xl md:text-5xl font-bold text-sky-900 leading-tight">
                            Welcome to
                        </h1>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                            <span className="text-primary">Volun</span>
                            <span className="text-orange-500">Track</span>
                            <span className="text-primary"> Ontario</span>
                        </h2>
                        <p className="mt-4 text-sm text-sky-800 font-medium">
                            Post opportunities, connect with eager volunteers, and verify completed hours
                        </p>
                    </header>

                    <div className="w-full max-w-md">
                        <LoginForm redirectTo="/org/dashboard" />
                    </div>
                </div>

                {/* RIGHT COLUMN: Aligned to start at the Login Card */}
                <div className="hidden lg:flex lg:mt-[200px]">
                    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-white/50">
                        <img
                            src="/volunteers.jpg"
                            alt="Volunteers"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                </div>
            </div>
        </div>
    )
}
