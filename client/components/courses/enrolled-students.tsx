"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { UserX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock data and types - replace with your actual data fetching
interface EnrolledStudentsProps {
  courseId: string
  isCourseTeacher: boolean
  isEnrolledStudents: boolean
}

interface Student {
  id: string
  name: string
  email: string
  enrolledDate: Date
}

interface User {
  id: string
  role: "teacher" | "student"
}

// Mock functions - replace with your actual API calls
const fetchEnrolledStudents = async (courseId: string, isCourseTeacher: boolean, isEnrolledStudents: boolean): Promise<Student[]> => {
  // Simulate API call
  return [
    {
      id: "student-1",
      name: "Alex Johnson",
      email: "alex@example.com",
      enrolledDate: new Date("2023-02-01"),
    },
    {
      id: "student-2",
      name: "Jamie Smith",
      email: "jamie@example.com",
      enrolledDate: new Date("2023-02-03"),
    },
    {
      id: "student-3",
      name: "Taylor Brown",
      email: "taylor@example.com",
      enrolledDate: new Date("2023-02-05"),
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

const removeStudentsFromCourse = async (courseId: string, studentIds: string[]) => {
  console.log(`Removing students ${studentIds.join(", ")} from course ${courseId}`)
  // Implement your API call
}

export default function EnrolledStudents({ courseId }: EnrolledStudentsProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)

  // Fetch students and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, userData] = await Promise.all([fetchEnrolledStudents(courseId), fetchCurrentUser()])
        setStudents(studentsData)
        setUser(userData)
      } catch (error) {
        console.error("Failed to load enrolled students:", error)
        toast.error("Failed to load enrolled students")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId])

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleRemoveStudents = async () => {
    if (selectedStudents.length === 0) return

    try {
      await removeStudentsFromCourse(courseId, selectedStudents)
      setStudents(students.filter((student) => !selectedStudents.includes(student.id)))
      setSelectedStudents([])
      toast.success(`${selectedStudents.length} student(s) removed from the course`)
    } catch (error) {
      toast.error("Failed to remove students")
    } finally {
      setRemoveDialogOpen(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  if (loading || !user) {
    return <div className="h-[300px] flex items-center justify-center">Loading enrolled students...</div>
  }

  const isTeacher = user.role === "teacher"

  if (!isTeacher && students.length === 0) {
    return null // Hide this section for students if no one is enrolled
  }

  return (
    <Card className="border-none shadow-none px-8 bg-background-light">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
        <CardTitle className="text-xl text-secondary">Enrolled Students ({students.length})</CardTitle>
        {isTeacher && selectedStudents.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setRemoveDialogOpen(true)}>
            <UserX className="mr-2 h-4 w-4" />
            Remove Selected
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-0">
        {students.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No students enrolled in this course yet.
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-3">
                  {isTeacher && (
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                      aria-label={`Select ${student.name}`}
                    />
                  )}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/members/${student.id}`} className="font-medium hover:underline">
                      {student.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Remove Students Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Students</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedStudents.length} student
              {selectedStudents.length !== 1 ? "s" : ""} from this course? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveStudents}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

