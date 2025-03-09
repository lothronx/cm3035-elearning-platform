import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatButton } from "@/components/members/chat-button";
import { Member } from "@/types/member";

interface MemberCardProps {
  member: Member;
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <Card className="h-full transition-all duration-300 bg-background-light hover:shadow-md hover:bg-primary/10 justify-between">
      <Link href={`/members/${member.id}`} className="block ">
        <CardContent className="flex-grow flex flex-col items-center text-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden m-4">
            <Image
              src={member.photo || "/blank.png"}
              alt={`${member.firstName} ${member.lastName}`}
              width={96}
              height={96}
              className="object-cover"
            />
          </div>
          <Badge variant={member.role == "teacher" ? "default" : "secondary"}>{member.role}</Badge>
          <h3 className="text-xl font-semibold text-secondary pt-2">
            {member.firstName} {member.lastName}
          </h3>
          <div className="flex gap-2 mb-4">
            <p className="text-muted-foreground">@{member.username}</p>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 text-center">{member.status}</p>
        </CardContent>
      </Link>
      <CardFooter className="pb-4">
        <ChatButton userId={member.id} username={`${member.firstName} ${member.lastName}`} />
      </CardFooter>
    </Card>
  );
}
