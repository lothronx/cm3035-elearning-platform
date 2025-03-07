"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Download, Trash2, Plus, FileText, Image, File } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Mock data and types - replace with your actual data fetching
interface CourseMaterialsProps {
  courseId: string
}

interface Material {
  id: string
  title: string
  type: "pdf" | "image" | "other"
  url: string
  uploadedAt: Date
}

interface User {
  id: string
  role: "teacher" | "student"
}

// Mock functions - replace with your actual API calls
const fetchMaterials = async (courseId: string): Promise<Material[]> => {
  // Simulate API call
  return [
    {
      id: "material-1",
      title: "Course Syllabus",
      type: "pdf",
      url: "/materials/syllabus.pdf",
      uploadedAt: new Date("2023-01-20"),
    },
    {
      id: "material-2",
      title: "Week 1 Slides",
      type: "pdf",
      url: "/materials/week1.pdf",
      uploadedAt: new Date("2023-01-25"),
    },
    {
      id: "material-3",
      title: "Project Example",
      type: "image",
      url: "/materials/example.jpg",
      uploadedAt: new Date("2023-02-05"),
    },
  ]
}

const fetchCurrentUser = async (): Promise<User> => {
  // Simulate API call
  return {
    id: "user-1",
    role: "student", // Change to "teacher" to see teacher view
  }
}

const deleteMaterial = async (materialId: string) => {
  console.log(`Deleting material ${materialId}`)
  // Implement your API call
}

const addMaterial = async (courseId: string, material: { title: string; file: File }) => {
  console.log(`Adding material ${material.title} to course ${courseId}`)
  // Implement your API call
}

export default function CourseMaterials({ courseId }: CourseMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ title: "", file: null as File | null })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null)

  // Fetch materials and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [materialsData, userData] = await Promise.all([fetchMaterials(courseId), fetchCurrentUser()])
        setMaterials(materialsData)
        setUser(userData)
      } catch (error) {
        console.error("Failed to load course materials:", error)
        toast.error("Failed to load course materials")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId])

  const handleDelete = async (materialId: string) => {
    setMaterialToDelete(materialId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!materialToDelete) return

    try {
      await deleteMaterial(materialToDelete)
      setMaterials(materials.filter((m) => m.id !== materialToDelete))
      toast.success("Material deleted successfully")
    } catch (error) {
      toast.error("Failed to delete material")
    } finally {
      setDeleteDialogOpen(false)
      setMaterialToDelete(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewMaterial({ ...newMaterial, file: e.target.files[0] })
    }
  }

  const handleAddMaterial = async () => {
    if (!newMaterial.title || !newMaterial.file) {
      toast.error("Please provide both title and file")
      return
    }

    try {
      await addMaterial(courseId, newMaterial)

      // Simulate adding the new material to the list
      const fileType = newMaterial.file.type.includes("pdf")
        ? "pdf"
        : newMaterial.file.type.includes("image")
          ? "image"
          : "other"

      const newMaterialObj: Material = {
        id: `material-${Date.now()}`,
        title: newMaterial.title,
        type: fileType as "pdf" | "image" | "other",
        url: URL.createObjectURL(newMaterial.file),
        uploadedAt: new Date(),
      }

      setMaterials([...materials, newMaterialObj])
      setNewMaterial({ title: "", file: null })
      setAddDialogOpen(false)

      toast.success("Material added successfully")
    } catch (error) {
      toast.error("Failed to add material")
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "image":
        return <Image className="h-5 w-5 text-blue-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading || !user) {
    return <div className="h-[300px] flex items-center justify-center">Loading course materials...</div>
  }

  const isTeacher = user.role === "teacher"

  return (
    <Card className="border-none shadow-none px-8 bg-background-light">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
        <CardTitle className="text-xl text-secondary">Course Materials</CardTitle>
        {isTeacher && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
                <DialogDescription>Upload a new resource for students</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    placeholder="Enter material title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="file">File</Label>
                  <Input id="file" type="file" onChange={handleFileChange} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMaterial}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="px-0">
        {materials.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No materials available for this course yet.</div>
        ) : (
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(material.type)}
                  <div>
                    <h4 className="font-medium">{material.title}</h4>
                    <p className="text-xs text-muted-foreground">{format(material.uploadedAt, "MMM d, yyyy")}</p>
                  </div>
                </div>
                <div>
                  {isTeacher ? (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(material.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={material.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Material</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

