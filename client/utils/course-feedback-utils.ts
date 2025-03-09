import { fetchWithAuth } from "@/lib/auth";

export interface FeedbackStudent {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Feedback {
  id: number;
  student: FeedbackStudent;
  comment: string;
  created_at: string;
}

export const fetchCourseFeedback = async (courseId: string): Promise<Feedback[]> => {
  const response = await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/feedback/`
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("permission_denied");
    }
    throw new Error(`Failed to fetch course feedback: ${response.statusText}`);
  }

  return response.json();
};

export const createCourseFeedback = async (courseId: string, comment: string) => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/feedback/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to post feedback");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to post feedback");
  }
};

export const deleteCourseFeedback = async (courseId: string, feedbackId: number) => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/feedback/${feedbackId}/`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete feedback");
    }

  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to delete feedback");
  }
};
