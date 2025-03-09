import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import Link from "next/link";

interface Enrollment {
  id: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
  };
  enrolled_at: string;
  is_completed: boolean;
  completed_at?: string;
}

interface EnrollmentCardProps {
  enrollment: Enrollment;
  isCourseTeacher: boolean;
  selectedStudents: string[];
  handleSelectStudent: (studentId: string) => void;
}

export function EnrollmentCard({
  enrollment,
  isCourseTeacher,
  selectedStudents,
  handleSelectStudent,
}: EnrollmentCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div
      key={enrollment.id}
      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
      <div className="flex items-center space-x-4">
        {isCourseTeacher && (
          <Checkbox
            checked={selectedStudents.includes(enrollment.student.id)}
            onCheckedChange={() => handleSelectStudent(enrollment.student.id)}
          />
        )}
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {getInitials(enrollment.student.first_name, enrollment.student.last_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Link href={`/members/${enrollment.student.id}`} className="font-medium hover:underline">
            {enrollment.student.first_name} {enrollment.student.last_name}
          </Link>
          {enrollment.completed_at ? (
            <p className="text-sm text-secondary">
              Completed on {format(new Date(enrollment.completed_at), "MMM d, yyyy")}
            </p>
          ) : (
            <p className="text-sm text-primary">
              Enrolled on {format(new Date(enrollment.enrolled_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
