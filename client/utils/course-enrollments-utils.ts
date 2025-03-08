import { fetchWithAuth } from "@/lib/auth";
import { toast } from "sonner";

export interface CourseEnrollment {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
  };
  enrolled_at: string;
  is_completed: boolean;
  completed_at: string | null;
}

export const fetchCourseEnrollments = async (courseId: string): Promise<CourseEnrollment[]> => {
  const response = await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/enrollments/`
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("permission_denied");
    }
    throw new Error(`Failed to fetch course enrollments: ${response.statusText}`);
  }

  return response.json();
};

export const deleteEnrollments = async (courseId: string, studentIds: number[]) => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/enrollments/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student_ids: studentIds }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to remove enrollments");
    }

    const result = await response.json();
    toast.success(`Successfully removed ${result.deleted_count} student(s)`);
    return result;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to remove enrollments");
  }
};
