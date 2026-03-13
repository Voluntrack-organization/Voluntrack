"use client"

import Link from "next/link"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { FeedMap } from "@/components/feed-map"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, Clock, Sparkles, ChevronRight } from "lucide-react"

export default function FeedPage() {
  const achievementPosts: Array<{
    id: string
    name: string
    hours: number
    timeAgo: string
    cheers: number
    avatarInitials: string
  }> = []
  const activityPosts: Array<{
    id: string
    name: string
    timeAgo: string
    text: string
    image: string | null
    imageAlt: string | null
  }> = []
  const featuredOpportunities: Array<{
    id: string
    title: string
    organization: string
    hours: number
    date: string
    location: string
    description: string
    spotsLeft: number
    totalSpots: number
  }> = []
  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <main className="pt-24 pb-16">
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-1">
              Feed
            </h1>
            <p className="text-muted-foreground">
              Volunteer activity and updates from your community
            </p>
          </div>

          <FeedMap />

          {/* Achievement posts */}
          {achievementPosts.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No achievements to show yet.</p>
          )}
          {achievementPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="p-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {post.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{post.name}</span>
                      <span className="text-muted-foreground text-sm">+</span>
                      <span className="text-muted-foreground text-sm">{post.timeAgo}</span>
                    </div>
                    <p className="text-sm text-foreground mb-3">
                      completed <strong>{post.hours} hours</strong> of volunteering!
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <Avatar key={i} className="h-5 w-5 border-2 border-background">
                            <AvatarFallback className="bg-muted text-muted-foreground text-[10px]" />
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        +{post.cheers} others cheered
                      </span>
                    </div>
                  </div>
                  <div className="relative flex flex-col items-center shrink-0">
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-amber-200 to-amber-400 flex items-center justify-center border-4 border-amber-300 shadow-md">
                      <span className="text-2xl font-bold text-amber-900">{post.hours}</span>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-3 bg-primary rounded-t-full" />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-primary border-primary hover:bg-primary/10 gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Cheer! <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Activity posts */}
          {activityPosts.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No activity to show yet.</p>
          )}
          {activityPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {post.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{post.name}</span>
                  <span className="text-muted-foreground text-sm">{post.timeAgo}</span>
                </div>
                <div className="flex gap-4">
                  <p className="text-sm text-foreground flex-1 [&_strong]:font-semibold">
                    {post.text.split("**").map((part, i) =>
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </p>
                  {post.image && (
                    <div className="relative w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={post.image}
                        alt={post.imageAlt || ""}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Featured opportunity cards */}
          {featuredOpportunities.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No featured opportunities right now.</p>
          )}
          {featuredOpportunities.map((opp) => (
            <Card key={opp.id} className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="absolute top-0 left-0 z-10 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-br-md">
                    Featured
                  </div>
                  <div className="p-4 pt-8">
                    <h2 className="text-lg font-bold text-primary mb-1">{opp.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      by {opp.organization}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {opp.hours} hours
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {opp.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {opp.location}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-4 line-clamp-3">
                      {opp.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href="/opportunities">
                        <Button size="sm" className="rounded-full">
                          Apply Now
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" className="rounded-full">
                        Details
                      </Button>
                      <span className="text-sm font-medium text-foreground">
                        {opp.spotsLeft} spots remaining
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}
