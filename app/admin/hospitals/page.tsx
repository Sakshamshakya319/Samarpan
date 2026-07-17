import { getDatabase } from "@/lib/db/mongodb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building2, Search, MapPin, Activity, FileSpreadsheet } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminHospitalsPage({
  searchParams
}: {
  searchParams: { q?: string; page?: string }
}) {
  const db = await getDatabase()
  const hospitalsCollection = db.collection("hospitals")
  
  const query = searchParams.q || ""
  const page = parseInt(searchParams.page || "1", 10)
  const limit = 20
  const skip = (page - 1) * limit

  let filter = {}
  if (query) {
    const regex = new RegExp(query, 'i')
    filter = {
      $or: [
        { hospitalName: { $regex: regex } },
        { city: { $regex: regex } },
        { district: { $regex: regex } }
      ]
    }
  }

  const [hospitals, totalCount, stats] = await Promise.all([
    hospitalsCollection.find(filter).skip(skip).limit(limit).toArray(),
    hospitalsCollection.countDocuments(filter),
    hospitalsCollection.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray()
  ])

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Directory</h1>
          <p className="text-muted-foreground mt-1">Manage verified government hospitals for the SOS system.</p>
        </div>
        <Button className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Import CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verified Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Cities by Hospital Count</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {stats.map((s: any) => (
                <div key={s._id} className="text-sm bg-muted px-3 py-1 rounded-full">
                  <span className="font-semibold">{s._id}:</span> {s.count}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                name="q" 
                defaultValue={query}
                placeholder="Search by name, city, or district..." 
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Hospital Name</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">District</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {hospitals.map((h: any) => (
                  <tr key={h._id.toString()} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{h.hospitalName}</td>
                    <td className="px-4 py-3">{h.city}</td>
                    <td className="px-4 py-3">{h.district}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
                {hospitals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No hospitals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1}>
                  <a href={`?q=${query}&page=${page - 1}`}>Previous</a>
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages}>
                  <a href={`?q=${query}&page=${page + 1}`}>Next</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
