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
import { toast } from "sonner";
import { FeedbackCard } from "@/components/courses/feedback-card";
import { FeedbackDeleteDialog } from "@/components/courses/feedback-delete-dialog";

interface CourseFeedbackProps {
  courseId: string;
  isEnrolledStudents: boolean;
}

export function CourseFeedback({ courseId, isEnrolledStudents }: CourseFeedbackProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      await deleteCourseFeedback(courseId, feedbackToDelete);
      loadFeedback();
      toast.success("Feedback deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete feedback");
    } finally {
      setFeedbackToDelete(null);
    }
  };

  const handleDeleteClick = (feedbackId: number) => {
    setFeedbackToDelete(feedbackId);
  };

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      {/* title */}
      <CardHeader className="px-8">
        <CardTitle className="text-2xl font-bold text-secondary">Student Feedback</CardTitle>
      </CardHeader>

      {/* input */}
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

        {/* feedback cards */}
        {feedback.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No feedback available for this course yet.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                userId={user?.id}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* delete dialog */}
      <FeedbackDeleteDialog
        deleteDialogOpen={!!feedbackToDelete}
        setDeleteDialogOpen={(open) => setFeedbackToDelete(open ? feedbackToDelete : null)}
        confirmDeleteFeedback={handleDeleteFeedback}
      />
    </Card>
  );
}
