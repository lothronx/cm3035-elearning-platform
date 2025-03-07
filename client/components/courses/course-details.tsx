"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Edit, AlertTriangle, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mock data and types - replace with your actual data fetching
interface CourseDetailsProps {
  courseId: string
}

interface Course {
  id: string
  title: string
  description: string
  teacher: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

interface User {
  id: string
  role: "teacher" | "student"
  enrolledCourses: string[]
  completedCourses: string[]
}

// Mock functions - replace with your actual API calls
const fetchCourse = async (id: string): Promise<Course> => {
  // Simulate API call
  return {
    id,
    title: "Advanced Web Development",
    description: "Learn modern web development techniques including React, Next.js, and more.",
    teacher: {
      id: "teacher-1",
      name: "Professor Smith",
    },
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-06-20"),
    isActive: true,
  }
}

const fetchCurrentUser = async (): Promise<User> => {
  // Simulate API call
  return {
    id: "user-1",
    role: "student", // Change to "teacher" to see teacher view
    enrolledCourses: ["course-1"],
    completedCourses: [],
  }
}

const enrollInCourse = async (courseId: string, userId: string) => {
  console.log(`Enrolling user ${userId} in course ${courseId}`)
  // Implement your API call
}

const completeCourse = async (courseId: string, userId: string) => {
  console.log(`Marking course ${courseId} as completed for user ${userId}`)
  // Implement your API call
}

const deactivateCourse = async (courseId: string) => {
  console.log(`Deactivating course ${courseId}`)
  // Implement your API call
}

export default function CourseDetails({ courseId }: CourseDetailsProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const router = useRouter()

  // Fetch course and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [courseData, userData] = await Promise.all([fetchCourse(courseId), fetchCurrentUser()])
        setCourse(courseData)
        setUser(userData)
      } catch (error) {
        console.error("Failed to load course details:", error)
        toast.error("Failed to load course details")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId])

  const handleEnroll = async () => {
    if (!user) return
    try {
      await enrollInCourse(courseId, user.id)
      setUser({
        ...user,
        enrolledCourses: [...user.enrolledCourses, courseId],
      })
      toast.success("You have successfully enrolled in this course")
    } catch (error) {
      toast.error("Failed to enroll in course")
    }
  }

  const handleComplete = async () => {
    if (!user) return
    try {
      await completeCourse(courseId, user.id)
      setUser({
        ...user,
        completedCourses: [...user.completedCourses, courseId],
      })
      toast.success("Course marked as completed")
    } catch (error) {
      toast.error("Failed to mark course as completed")
    }
  }

  const handleDeactivate = async () => {
    try {
      await deactivateCourse(courseId)
      setCourse(course ? { ...course, isActive: false } : null)
      toast.success("Course has been deactivated")
      setDeactivateDialogOpen(false)
    } catch (error) {
      toast.error("Failed to deactivate course")
    }
  }

  const handleEdit = () => {
    router.push(`/courses/${courseId}/edit`)
  }

  if (loading || !course || !user) {
    return <div className="h-[200px] flex items-center justify-center">Loading course details...</div>
  }

  const isTeacher = user.role === "teacher"
  const isEnrolled = user.enrolledCourses.includes(courseId)
  const isCompleted = user.completedCourses.includes(courseId)

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardHeader className="px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl font-bold text-secondary">{course.title}</CardTitle>
              {!course.isActive && (
                <Badge variant="destructive" className="ml-2">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Taught by {course.teacher.name}</p>
          </div>
          <div className="flex items-center gap-2 self-start">
            {isTeacher ? (
              <>
                <Button variant="outline" onClick={handleEdit} size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={!course.isActive}>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Deactivate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Deactivate Course</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to deactivate this course? Students will no longer be
                        able to enroll.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeactivate}>
                        Deactivate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <Button onClick={handleEnroll} disabled={isEnrolled || !course.isActive} size="sm">
                  {isEnrolled ? "Enrolled" : "Enroll"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleComplete}
                  disabled={!isEnrolled || isCompleted || !course.isActive}
                  size="sm">
                  {isCompleted ? "Completed" : "Mark Complete"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-8">
        <div className="space-y-4">
          <p className="text-muted-foreground">{course.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Created: {format(course.createdAt, "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>Updated: {format(course.updatedAt, "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

