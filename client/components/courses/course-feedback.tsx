"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/user-context";
import {
  Feedback,
  fetchCourseFeedback,
  createCourseFeedback,
  deleteCourseFeedback,
} from "@/utils/course-feedback-utils";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CourseFeedbackProps {
  courseId: string;
  isEnrolledStudents: boolean;
}

export function CourseFeedback({ courseId, isEnrolledStudents }: CourseFeedbackProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
  const { user } = useUser();

  useEffect(() => {
    loadFeedback();
  }, [courseId]);

  const loadFeedback = async () => {
    try {
      const data = await fetchCourseFeedback(courseId);
      setFeedback(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load feedback");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);

    try {
      await createCourseFeedback(courseId, comment);
      setComment("");
      loadFeedback();
      toast.success("Feedback submitted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (feedbackId: number) => {
    setFeedbackToDelete(feedbackId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      await deleteCourseFeedback(courseId, feedbackToDelete);
      loadFeedback();
      toast.success("Feedback deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete feedback");
    } finally {
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardHeader className="px-8">
        <CardTitle className="text-2xl font-bold text-secondary">Student Feedback</CardTitle>
      </CardHeader>
      <CardContent className="px-8">
        {isEnrolledStudents && (
          <form onSubmit={handleSubmit} className="mb-6">
            <Textarea
              placeholder="Share your feedback about this course…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-2 resize-none"
            />
            <Button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="hover:bg-primary/90">
              Post Feedback
            </Button>
          </form>
        )}

        {feedback.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No feedback available for this course yet.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {getInitials(item.student.first_name, item.student.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">
                        {item.student.first_name} {item.student.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Posted on {format(new Date(item.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  {user?.id === item.student.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(item.id)}
                      className="h-8 w-8 hover:bg-background hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-4 pl-14">
                  <p className="text-sm">{item.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Feedback</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this feedback? This action cannot be undone.
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
      </CardContent>
    </Card>
  );
}
