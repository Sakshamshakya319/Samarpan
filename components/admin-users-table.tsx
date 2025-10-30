"use client"

import { useState, useEffect } from "react"
import { useAppSelector } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2 } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  bloodGroup: string
  location: string
  phone: string
  createdAt: string
  lastDonationDate?: string
  hasDisease?: boolean
  diseaseDescription?: string
}

interface AdminUsersTableProps {
  token: string
}

export function AdminUsersTable({ token }: AdminUsersTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (token) {
      fetchUsers(token)
    } else {
      setIsLoading(false)
      setError("No authentication token found")
    }
  }, [token])

  const fetchUsers = async (authToken: string) => {
    try {
      setIsLoading(true)
      setError("")
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalUsers(data.totalUsers || 0)
      } else if (response.status === 401) {
        setError("Unauthorized - Invalid or expired token")
        localStorage.removeItem("adminToken")
        localStorage.removeItem("adminEmail")
      } else {
        setError("Failed to load users")
      }
    } catch (err) {
      setError("Error loading users")
      console.error("Fetch users error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!token || !confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setUsers(users.filter((u) => u._id !== userId))
      } else {
        setError("Failed to delete user")
      }
    } catch (err) {
      setError("Error deleting user")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
        <CardDescription>View and manage all registered users • Total: {totalUsers}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{error}</div>}

        <div className="mb-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Email</th>
                  <th className="text-left py-2 px-2">Blood Group</th>
                  <th className="text-left py-2 px-2">Location</th>
                  <th className="text-left py-2 px-2">Phone</th>
                  <th className="text-left py-2 px-2">Last Donation</th>
                  <th className="text-left py-2 px-2">Has Disease</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-2 px-2">{user.name}</td>
                    <td className="py-2 px-2">{user.email}</td>
                    <td className="py-2 px-2">{user.bloodGroup || "-"}</td>
                    <td className="py-2 px-2">{user.location || "-"}</td>
                    <td className="py-2 px-2">{user.phone || "-"}</td>
                    <td className="py-2 px-2 text-sm">{user.lastDonationDate || "-"}</td>
                    <td className="py-2 px-2 text-sm">
                      <span className={user.hasDisease ? "text-orange-600 font-medium" : "text-green-600"}>
                        {user.hasDisease ? "Yes" : "No"}
                      </span>
                      {user.hasDisease && user.diseaseDescription && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1" title={user.diseaseDescription}>
                          {user.diseaseDescription}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => handleDelete(user._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
