"use client"

import { Navigation } from "@/components/navigation"
import { Search, ClipboardCheck, Users, Zap, Heart, GraduationCap, ChevronDown, Sparkles, Building2, BookOpen } from "lucide-react"
import { motion, useScroll, useTransform, Variants } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"

export default function OrgAboutPage() {
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const staggerChildren: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden" ref={containerRef}>
      <Navigation />

      <main className="flex-1">
        {/* Dynamic Hero Section */}
        <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
          <motion.div 
            style={{ y, opacity }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-800/80 z-10" />
            <Image
              src="/student-volunteers-outdoor-park-clear-sky.jpg"
              alt="Student volunteers making a difference"
              fill
              className="object-cover object-center"
              priority
            />
          </motion.div>

          <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center mt-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6 inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-white/90 text-sm font-medium tracking-wide">Connecting students with meaningful opportunities</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-5xl sm:text-7xl md:text-8xl font-black text-white mb-6 tracking-tighter"
            >
              About <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-blue-600">Volun</span><span className="bg-clip-text text-transparent bg-gradient-to-br from-orange-400 to-orange-600">Track</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg sm:text-xl md:text-2xl text-slate-300 leading-relaxed font-light max-w-2xl"
            >
              The premier platform designed to easily track, verify, and discover community service across Ontario.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ opacity: { delay: 1, duration: 1 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
            className="absolute bottom-12 z-20 text-white/50 flex flex-col items-center gap-2"
          >
            <span className="text-xs tracking-widest uppercase font-semibold">Discover More</span>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </section>

        {/* Story Section - Floating Cards */}
        <section className="py-32 relative px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
            className="text-center mb-16"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-6 shadow-sm">
              <BookOpen className="w-8 h-8" />
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">Our <span className="text-slate-400">Mission</span></motion.h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerChildren}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { 
                text: "VolunTrack Ontario was created to solve a common challenge: connecting students with volunteer opportunities while making it easy to track and verify their community service hours. We believe every student deserves access to meaningful volunteer experiences that build skills, create connections, and make a real difference."
              },
              { 
                text: "Our platform bridges the gap between eager student volunteers, schools that need to track volunteer hours, and organizations looking for dedicated helpers. By centralizing the entire volunteer journey from discovery to hour verification, we make volunteering simpler and more impactful for everyone involved."
              },
              { 
                text: "Whether you're a student looking to fulfill your 40-hour graduation requirement, a guidance counsellor managing applications, or an organization seeking volunteers, VolunTrack Ontario is here to help you make a difference in your community through streamlined, transparent processes."
              }
            ].map((card, i) => (
              <motion.div 
                key={i} 
                variants={fadeIn}
                whileHover={{ y: -10 }}
                className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100/60 leading-relaxed text-slate-600 font-medium relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-orange-50 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <p className="relative z-10">{card.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Who We Serve - Split Layout */}
        <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-[size:30px_30px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/0 to-slate-900 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerChildren}
              className="text-center mb-20"
            >
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">Who We Serve</motion.h2>
              <motion.p variants={fadeIn} className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                Empowering the vital connection between dedicated students and impactful community organizations.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Students Card */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                className="p-10 lg:p-14 bg-gradient-to-br from-blue-950/80 to-slate-900/80 border border-blue-900/50 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-8 border border-blue-500/30">
                  <GraduationCap className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold mb-6 tracking-tight">Students</h3>
                <p className="text-slate-300 leading-relaxed mb-8 text-lg font-light">
                  Discover volunteer opportunities, apply directly through the platform, and securely track your hours toward graduation requirements.
                </p>
                <ul className="space-y-4 text-slate-400 font-medium">
                  {["Browse opportunities by category and location", "Apply with one click and track status", "Track hours and earn achievement badges", "Submit your own external experiences"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Organizations Card */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                className="p-10 lg:p-14 bg-gradient-to-br from-orange-950/80 to-slate-900/80 border border-orange-900/50 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-8 border border-orange-500/30">
                  <Building2 className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold mb-6 tracking-tight">Organizations</h3>
                <p className="text-slate-300 leading-relaxed mb-8 text-lg font-light">
                  Post volunteer opportunities, seamlessly connect with motivated students, and automatically confirm completed service hours.
                </p>
                <ul className="space-y-4 text-slate-400 font-medium">
                  {["Post opportunities and manage capacity completely free", "Reach thousands of eager students", "Manage volunteer applications instantly", "Verify and digitally sign off on hours"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid - Glassmorphism */}
        <section className="py-32 max-w-7xl mx-auto px-6 lg:px-8 relative" id="features">
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">Platform <span className="text-slate-400">Features</span></motion.h2>
            <motion.p variants={fadeIn} className="text-xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
              Everything you need to discover, track, and digitally verify volunteer hours with stunning ease.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          >
            {[
              { 
                icon: Search, 
                title: "Centralized Discovery", 
                desc: "One platform to find all volunteer opportunities across Ontario with no more scattered searches or outdated listings.",
                color: "bg-indigo-100 text-indigo-600",
                shadow: "shadow-indigo-200/50"
              },
              { 
                icon: ClipboardCheck, 
                title: "Integrated Validation", 
                desc: "A digitized verification system that replaces manual logging with secure, automated approval workflows.",
                color: "bg-emerald-100 text-emerald-600",
                shadow: "shadow-emerald-200/50"
              },
              { 
                icon: Users, 
                title: "Connected Community", 
                desc: "A collaborative interface designed to bridge communication gaps between students, schools, and partners in real-time.",
                color: "bg-rose-100 text-rose-600",
                shadow: "shadow-rose-200/50"
              },
              { 
                icon: Zap, 
                title: "Gamified Milestones", 
                desc: "Visualize your progress toward graduation requirements with automated reporting and celebrate every hour you give back.",
                color: "bg-amber-100 text-amber-600",
                shadow: "shadow-amber-200/50"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={fadeIn}
                whileHover={{ y: -8, scale: 1.01 }}
                className="p-8 lg:p-10 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:bg-white transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-8 shadow-lg ${feature.shadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
    </div>
  )
}
