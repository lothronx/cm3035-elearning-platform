/**
 * Utility functions for handling API responses
 */
import { Member } from "@/types/member";
import { ChatSession } from "@/types/message";

/**
 * Interface for API response member with snake_case properties
 */
export interface ApiMember {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  photo: string;
  status: string;
  courses?: Array<{ id: number; name: string }>;
}

/**
 * Maps an API member (with snake_case properties) to our application Member interface (with camelCase properties)
 */
export function mapApiMemberToMember(apiMember: ApiMember): Member {
  return {
    id: apiMember.id,
    username: apiMember.username,
    firstName: apiMember.first_name,
    lastName: apiMember.last_name,
    role: apiMember.role,
    photo: apiMember.photo,
    status: apiMember.status,
    courses: apiMember.courses || [],
  };
}

/**
 * Maps an array of API members to an array of application Members
 */
export function mapApiMembersToMembers(apiMembers: ApiMember[]): Member[] {
  return apiMembers.map(mapApiMemberToMember);
}
