"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface Admin {
  _id: string
  email: string
  name: string
  role: string
  permissions: string[]
  status: string
  createdAt: string
}

interface Permission {
  id: string
  key: string
  label: string
}

interface PermissionGroup {
  id: string
  name: string
  permissions: string[]
}

interface AdminAdminManagerProps {
  token: string
}

export function AdminAdminManager({ token }: AdminAdminManagerProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [error, setError] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    permissions: [] as string[],
    isNgoAccount: false,
  })

  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchAdmins()
    fetchPermissions()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(data.accounts)
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err)
      toast.error("Failed to load admin accounts")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/admin/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions)
        setPermissionGroups(data.groups)
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err)
    }
  }

  const handleOpenDialog = () => {
    setIsEditMode(false)
    setEditingAdmin(null)
    setFormData({ email: "", password: "", name: "", permissions: [], isNgoAccount: false })
    setError("")
    setIsDialogOpen(true)
  }

  const handleEditAdmin = (admin: Admin) => {
    setIsEditMode(true)
    setEditingAdmin(admin)
    setFormData({
      email: admin.email,
      password: "",
      name: admin.name,
      permissions: admin.permissions,
      isNgoAccount: admin.permissions?.includes("manage_event_donation_blood_labels") || false,
    })
    setError("")
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsCreating(true)

    try {
      if (isEditMode && editingAdmin) {
        // Update admin
        const response = await fetch(
          `/api/admin/accounts/${editingAdmin._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              permissions: formData.permissions,
              ...(formData.password && { password: formData.password }),
            }),
          },
        )

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to update admin")
          return
        }

        toast.success("Admin account updated successfully")
        fetchAdmins()
      } else {
        // Create new admin
        const response = await fetch("/api/admin/accounts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to create admin")
          return
        }

        toast.success("Admin account created successfully")
        fetchAdmins()
      }

      setIsDialogOpen(false)
    } catch (err) {
      console.error("Error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin account?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/accounts/${adminId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success("Admin account deleted successfully")
        fetchAdmins()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete admin")
      }
    } catch (err) {
      console.error("Error:", err)
      toast.error("An error occurred while deleting admin")
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }))
  }

  const handleNgoAccountToggle = (isNgo: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isNgoAccount: isNgo,
      permissions: isNgo
        ? [...new Set([...prev.permissions, "manage_event_donation_blood_labels"])]
        : prev.permissions.filter((p) => p !== "manage_event_donation_blood_labels"),
    }))
  }

  const handleGroupToggle = (group: PermissionGroup) => {
    const allSelected = group.permissions.every((p) =>
      formData.permissions.includes(p),
    )

    if (allSelected) {
      // Remove all permissions in this group
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter(
          (p) => !group.permissions.includes(p),
        ),
      }))
    } else {
      // Add all permissions in this group
      setFormData((prev) => ({
        ...prev,
        permissions: [
          ...new Set([...prev.permissions, ...group.permissions]),
        ],
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage admin accounts with specific permissions
          </p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Admin
        </Button>
      </div>

      {/* Admins Table */}
      <Card>
        {admins.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No admin accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                        {admin.role === "superadmin"
                          ? "Super Admin"
                          : "Admin"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.status === "active"
                            ? "bg-green-500/10 text-green-700"
                            : "bg-red-500/10 text-red-700"
                        }`}
                      >
                        {admin.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {admin.role === "superadmin" ? (
                        <span className="text-xs text-muted-foreground">
                          All
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {admin.permissions?.length || 0} permissions
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {admin.role !== "superadmin" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAdmin(admin)}
                              className="gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin._id)}
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Admin Account" : "Create New Admin Account"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update admin account details and permissions"
                : "Create a new admin account and assign permissions"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Admin Details</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  disabled={isCreating || isEditMode}
                />
                {isEditMode && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Password {isEditMode && "(leave empty to keep current)"}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required={!isEditMode}
                    disabled={isCreating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* NGO Account */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ngo-account"
                  checked={formData.isNgoAccount}
                  onCheckedChange={(checked) => handleNgoAccountToggle(checked as boolean)}
                  disabled={isCreating}
                />
                <label
                  htmlFor="ngo-account"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  NGO Account
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                NGO accounts can only manage event donation blood labels. This will automatically assign the required permission.
              </p>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Select Features/Permissions</h3>
                <p className="text-xs text-muted-foreground">
                  Choose which features this admin can access and manage
                </p>
              </div>

              {/* Permission Groups */}
              <div className="space-y-3">
                {permissionGroups.map((group) => {
                  const groupPermissions = group.permissions.filter((p) =>
                    permissions.find((perm) => perm.id === p),
                  )
                  const allSelected = groupPermissions.every((p) =>
                    formData.permissions.includes(p),
                  )

                  return (
                    <div key={group.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => handleGroupToggle(group)}
                          disabled={isCreating}
                        />
                        <label className="font-medium text-sm cursor-pointer">
                          {group.name}
                        </label>
                      </div>

                      {/* Individual Permissions */}
                      <div className="pl-6 space-y-2">
                        {groupPermissions.map((permId) => {
                          const perm = permissions.find(
                            (p) => p.id === permId,
                          )
                          return (
                            <div
                              key={permId}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={formData.permissions.includes(permId)}
                                onCheckedChange={() =>
                                  handlePermissionToggle(permId)
                                }
                                disabled={isCreating}
                              />
                              <label className="text-sm cursor-pointer">
                                {perm?.label}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Admin"
                ) : (
                  "Create Admin"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}