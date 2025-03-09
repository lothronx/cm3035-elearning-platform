/**
 * Interface representing a course in the system
 */
export interface Course {
  id: number;
  name: string;
}

/**
 * Interface representing a member in the system
 */
export interface Member {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  photo: string;
  status: string;
  courses?: Course[];
}
