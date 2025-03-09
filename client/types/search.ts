/**
 * Types for search functionality in the application
 */

export type MemberResult = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
};

export type CourseResult = {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
};

export type SearchResult = {
  members: MemberResult[];
  courses: CourseResult[];
};
