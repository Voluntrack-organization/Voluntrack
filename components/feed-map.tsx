"use client"

import { useState } from "react"
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps"
import { Calendar, MapPin, Clock } from "lucide-react"

interface OpportunityMarker {
  id: string
  title: string
  organization: string
  date: string
  location: string
  hours: number
  lat: number
  lng: number
}

const OPPORTUNITIES: OpportunityMarker[] = [
  {
    id: "opp-1",
    title: "Food Bank Sorting Shift",
    organization: "Daily Bread Food Bank",
    date: "Mar 22, 2026",
    location: "191 New Toronto St, Toronto",
    hours: 4,
    lat: 43.6467,
    lng: -79.3717,
  },
  {
    id: "opp-2",
    title: "Parkland Restoration",
    organization: "TRCA",
    date: "Mar 29, 2026",
    location: "Black Creek Pioneer Village",
    hours: 5,
    lat: 43.7745,
    lng: -79.51,
  },
  {
    id: "opp-3",
    title: "Senior Companion Program",
    organization: "Rexdale Community Hub",
    date: "Apr 5, 2026",
    location: "21 Panorama Ct, Toronto",
    hours: 3,
    lat: 43.728,
    lng: -79.589,
  },
  {
    id: "opp-4",
    title: "Youth Coding Workshop Assistant",
    organization: "Regent Park Community Centre",
    date: "Apr 12, 2026",
    location: "585 Dundas St E, Toronto",
    hours: 3,
    lat: 43.6584,
    lng: -79.3603,
  },
  {
    id: "opp-5",
    title: "Animal Shelter Helper",
    organization: "Toronto Humane Society",
    date: "Apr 19, 2026",
    location: "11 River St, Toronto",
    hours: 4,
    lat: 43.6548,
    lng: -79.3553,
  },
  {
    id: "opp-6",
    title: "Shoreline Cleanup Crew",
    organization: "Lake Ontario Waterkeeper",
    date: "Apr 26, 2026",
    location: "Cherry Beach, Toronto",
    hours: 3,
    lat: 43.6629,
    lng: -79.3119,
  },
]

export function FeedMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = OPPORTUNITIES.find((o) => o.id === selectedId) ?? null

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm h-[400px] w-full mb-6">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={{ lat: 43.7, lng: -79.42 }}
          defaultZoom={11}
          mapId="voluntrack-feed-map"
          gestureHandling="cooperative"
          className="w-full h-full"
        >
          {OPPORTUNITIES.map((opp) => (
            <AdvancedMarker
              key={opp.id}
              position={{ lat: opp.lat, lng: opp.lng }}
              onClick={() => setSelectedId(opp.id === selectedId ? null : opp.id)}
            />
          ))}
          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelectedId(null)}
            >
              <div className="p-1 max-w-[220px] space-y-1">
                <p className="font-semibold text-sm">{selected.title}</p>
                <p className="text-xs text-muted-foreground">{selected.organization}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {selected.date}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {selected.location}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {selected.hours} hours
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  )
}
