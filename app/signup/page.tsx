import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
    return (
        <div className="min-h-svh bg-background p-6 md:p-10">
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
                        <p className="mt-4 text-lg text-sky-800 font-medium">
                            Find Opportunities. Track hours. Make an impact
                        </p>
                    </header>

                    <div className="w-full max-w-md">
                        <SignupForm />
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="hidden lg:flex flex-col gap-4 lg:mt-[152px]">
                    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-white/50">
                        <img
                            src="/images/volunteers-food-bank.jpg"
                            alt="Food bank"
                            className="w-full h-40 object-cover"
                        />
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-white/50">
                        <img
                            src="/images/volunteers-tutoring.jpg"
                            alt="Tutoring"
                            className="w-full h-40 object-cover"
                        />
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-white/50">
                        <img
                            src="/images/volunteers-healthcare.jpg"
                            alt="Healthcare"
                            className="w-full h-40 object-cover"
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
