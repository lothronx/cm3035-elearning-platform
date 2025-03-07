import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  status: string;
  photo: string;
  role: string;
}

interface MemberCardProps {
  member: Member;
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <Link href={`/members/${member.id}`} className="block ">
      <Card className="h-full transition-all duration-300 bg-background-light hover:shadow-md justify-between">
        <CardContent className="flex-grow flex flex-col items-center text-center">
          <img
            src={member.photo || "/blank.png"}
            alt={`${member.first_name} ${member.last_name}`}
            className="w-24 h-24 rounded-full object-cover m-4"
          />
          <Badge variant={member.role === "teacher" ? "default" : "secondary"}>{member.role}</Badge>
          <h3 className="text-xl font-semibold text-secondary pt-2">
            {member.first_name} {member.last_name}
          </h3>
          <div className="flex gap-2 mb-4">
            <p className="text-muted-foreground">@{member.username}</p>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 text-center">{member.status}</p>
        </CardContent>
        <CardFooter className="pb-4">
          <Button className="w-full bg-primary text-primary-foreground" variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat with me
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
