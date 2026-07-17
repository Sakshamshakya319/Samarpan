import { getDatabase } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Droplet, Clock, Share2, AlertCircle, Navigation, Lock } from "lucide-react"
import { cookies } from "next/headers"
import { HospitalMapClient } from "@/components/features/hospital-map-client"
import { AcceptRequestAction } from "@/components/features/accept-request-action"

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const db = await getDatabase()
  let request
  try {
    request = await db.collection("bloodRequests").findOne({ _id: new ObjectId(resolvedParams.id) })
  } catch (err) {
    return notFound()
  }

  if (!request) {
    return notFound()
  }

  const cookieStore = await cookies()
  const isLoggedIn = cookieStore.has("token") || cookieStore.has("adminToken")

  const { hospital } = request

  return (
    <main className="min-h-screen bg-background w-full">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h1 className="font-bold text-lg">Emergency Blood Request</h1>
          <p className="text-sm">This is an active SOS request needing immediate response.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-2xl">
                {request.bloodGroup}
              </div>
              <div>
                <h3 className="font-bold text-lg">{request.requesterName}</h3>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Droplet className="w-4 h-4" /> {request.quantity} Unit(s) {request.bloodComponent}
                </p>
              </div>
            </div>

            {request.requesterPhone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-muted p-2 rounded-full"><Phone className="w-4 h-4" /></div>
                {isLoggedIn ? (
                  <span className="font-medium">{request.requesterPhone}</span>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground italic">
                    <Lock className="w-4 h-4" />
                    <span>Login to view contact</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hospital Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hospital ? (
              <>
                <div>
                  <h3 className="font-bold text-lg">{hospital.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    {hospital.address}, {hospital.city}, {hospital.district}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {hospital.googleUrl && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={hospital.googleUrl} target="_blank" rel="noreferrer">
                        <Navigation className="w-4 h-4 mr-2" /> Google Maps
                      </a>
                    </Button>
                  )}
                  {hospital.osmUrl && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={hospital.osmUrl} target="_blank" rel="noreferrer">
                        <MapPin className="w-4 h-4 mr-2" /> OpenStreetMap
                      </a>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">
                <p>{request.hospitalLocation || request.city}</p>
                <p className="text-xs mt-2 italic">Legacy request. Full hospital map details not available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AcceptRequestAction 
        requestId={resolvedParams.id} 
        bloodGroup={request.bloodGroup} 
        hospitalName={hospital?.name || request.hospitalLocation} 
      />

      {hospital && (
        <Card>
          <CardHeader>
            <CardTitle>Location Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full relative z-0">
              <HospitalMapClient hospital={hospital} />
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </main>
  )
}
