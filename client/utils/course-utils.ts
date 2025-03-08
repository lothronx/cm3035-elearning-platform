import { fetchWithAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_enrolled: boolean | null;
  is_completed: boolean | null;
}

export const handleActivationToggle = async (courseId: string) => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/toggle_activation/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update course status");
    }

    const result = await response.json();
    toast.success(result.message);
    return result;
  } catch (error) {
    throw error;
  }
};

export const handleEdit = async (
  courseId: string,
  data: { title: string; description: string }
) => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update course");
    }

    const result = await response.json();
    toast.success("Course updated successfully");
    return result;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to update course");
  }
};

export const fetchCourse = async (courseId: string): Promise<Course> => {
  const response = await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("permission_denied");
    }
    if (response.status === 404) {
      throw new Error("course_not_found");
    }
    throw new Error(`Failed to fetch course: ${response.statusText}`);
  }

  return response.json();
};
