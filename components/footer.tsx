import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-logo text-2xl font-bold tracking-tight">
                <span className="text-primary">Volun</span>
                <span className="text-orange-500">Track</span>
                <span className="text-primary"> Ontario</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Connecting Ontario students with meaningful volunteer opportunities. Track hours, discover experiences,
              and make a difference in your community.
            </p>
          </div>



          {/* About */}
          <div>
            <h3 className="text-sm font-medium tracking-wider uppercase mb-4">About</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/about#sustainability"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <span className="font-logo font-bold text-primary">Volun</span>
            <span className="font-logo font-bold text-orange-500">Track</span>{" "}
            <span className="font-logo font-bold text-primary">Ontario</span>. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
