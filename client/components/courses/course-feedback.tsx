"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Mock data and types - replace with your actual data fetching
interface CourseFeedbackProps {
  courseId: string;
}

interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  comment: string;
  createdAt: Date;
}

interface User {
  id: string;
  role: "teacher" | "student";
  name: string;
}

// Mock functions - replace with your actual API calls
const fetchFeedback = async (courseId: string): Promise<Feedback[]> => {
  // Simulate API call
  return [
    {
      id: "feedback-1",
      studentId: "student-1",
      studentName: "Alex Johnson",
      comment: "Great course! I learned a lot about modern web development techniques.",
      createdAt: new Date("2023-03-15"),
    },
    {
      id: "feedback-2",
      studentId: "student-2",
      studentName: "Jamie Smith",
      comment: "The course materials were well-organized and easy to follow. Would recommend!",
      createdAt: new Date("2023-03-20"),
    },
  ];
};

const fetchCurrentUser = async (): Promise<User> => {
  // Simulate API call
  return {
    id: "student-1", // Change ID to match a feedback item to test delete functionality
    role: "student", // Change to "teacher" to see teacher view
    name: "Alex Johnson",
  };
};

const addFeedback = async (courseId: string, userId: string, comment: string) => {
  console.log(`Adding feedback for course ${courseId} from user ${userId}: ${comment}`);
  // Implement your API call
};

const deleteFeedback = async (feedbackId: string) => {
  console.log(`Deleting feedback ${feedbackId}`);
  // Implement your API call
};

export default function CourseFeedback({ courseId }: CourseFeedbackProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  // Fetch feedback and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [feedbackData, userData] = await Promise.all([
          fetchFeedback(courseId),
          fetchCurrentUser(),
        ]);
        setFeedback(feedbackData);
        setUser(userData);
      } catch (error) {
        console.error("Failed to load course feedback:", error);
        toast.error("Failed to load course feedback");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId]);

  const handleSubmitFeedback = async () => {
    if (!user || !newComment.trim()) return;

    try {
      await addFeedback(courseId, user.id, newComment);

      // Simulate adding the new feedback to the list
      const newFeedbackItem: Feedback = {
        id: `feedback-${Date.now()}`,
        studentId: user.id,
        studentName: user.name,
        comment: newComment,
        createdAt: new Date(),
      };

      setFeedback([...feedback, newFeedbackItem]);
      setNewComment("");

      toast.success("Feedback submitted successfully");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    setFeedbackToDelete(feedbackId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      await deleteFeedback(feedbackToDelete);
      setFeedback(feedback.filter((f) => f.id !== feedbackToDelete));
      toast.success("Feedback deleted successfully");
    } catch (error) {
      toast.error("Failed to delete feedback");
    } finally {
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const canDeleteFeedback = (feedbackItem: Feedback) => {
    if (!user) return false;
    return user.id === feedbackItem.studentId;
  };

  if (loading || !user) {
    return (
      <div className="h-[300px] flex items-center justify-center">Loading course feedback...</div>
    );
  }

  const isStudent = user.role === "student";

  return (
    <Card className="border-none shadow-none  bg-background-light px-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl text-secondary">Student Feedback</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {feedback.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No feedback available for this course yet.
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-background-light rounded-lg border-dashed border-2 border-background">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(item.studentName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{item.studentName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(item.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  {canDeleteFeedback(item) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFeedback(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete feedback</span>
                    </Button>
                  )}
                </div>
                <p className="mt-3 text-sm">{item.comment}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {isStudent && (
        <>
          <CardFooter className="flex flex-col items-start px-0">
            <h4 className="font-medium mb-2 text-sm px-2">Leave Your Feedback</h4>
            <Textarea
              placeholder="Share your thoughts about this course..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] w-full mb-3"
            />
            <Button onClick={handleSubmitFeedback} disabled={!newComment.trim()} size="sm">
              Submit Feedback
            </Button>
          </CardFooter>
        </>
      )}

      {/* Delete Feedback Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your feedback? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFeedback}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
