import { fetchWithAuth } from "@/lib/auth";
import { SearchResult, MemberResult, CourseResult } from "@/types/search";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Searches for courses based on a query string
 * @param query Search query
 * @returns Array of matching courses
 */
export const searchCourses = async (query: string): Promise<CourseResult[]> => {
  try {
    if (!query.trim()) {
      return [];
    }

    const response = await fetchWithAuth(
      `${API_URL}/api/courses/search/?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Error searching courses: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Course search error:", error);
    return [];
  }
};

/**
 * Searches for members based on a query string
 * Only available to teachers
 * @param query Search query
 * @returns Array of matching members
 */
export const searchMembers = async (query: string): Promise<MemberResult[]> => {
  try {
    if (!query.trim()) {
      return [];
    }

    const response = await fetchWithAuth(
      `${API_URL}/api/members/search/?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Error searching members: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Member search error:", error);
    return [];
  }
};

/**
 * Performs a global search across members (if user is a teacher) and courses
 * @param query Search query
 * @param userRole User's role (determines if member search is included)
 * @returns Combined search results
 */
export const performGlobalSearch = async (
  query: string,
  userRole: string | null
): Promise<SearchResult> => {
  try {
    if (!query.trim()) {
      return { members: [], courses: [] };
    }

    // Always search courses
    const coursesPromise = searchCourses(query);

    // Only search members if user is a teacher
    if (userRole === "teacher") {
      const [members, courses] = await Promise.all([
        searchMembers(query),
        coursesPromise
      ]);

      return {
        members,
        courses
      };
    } else {
      // For non-teachers, only return course results
      const courses = await coursesPromise;
      return {
        members: [],
        courses
      };
    }
  } catch (error) {
    console.error("Global search error:", error);
    return { members: [], courses: [] };
  }
};
