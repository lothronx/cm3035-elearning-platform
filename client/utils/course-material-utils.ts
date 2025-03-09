import { fetchWithAuth } from "@/lib/auth";

export interface CourseMaterial {
  id: number;
  title: string;
  file: string;
  uploaded_at: string;
}

export const fetchCourseMaterials = async (courseId: string): Promise<CourseMaterial[]> => {
  const response = await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/materials/`
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("permission_denied");
    }
    throw new Error(`Failed to fetch course materials: ${response.statusText}`);
  }

  return response.json();
};

export const uploadCourseMaterial = async (courseId: string, formData: FormData) => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/materials/`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to upload material");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to upload material");
  }
};

export const deleteCourseMaterial = async (courseId: string, materialId: number) => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/materials/${materialId}/`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete material");
    }

  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to delete material");
  }
};
