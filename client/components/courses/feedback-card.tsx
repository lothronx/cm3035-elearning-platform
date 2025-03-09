"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface FeedbackItem {
  id: number;
  comment: string;
  created_at: string;
  student: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface FeedbackCardProps {
  item: FeedbackItem;
  userId?: number;
  onDelete: (id: number) => void;
}

export function FeedbackCard({ item, userId, onDelete }: FeedbackCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {getInitials(item.student.first_name, item.student.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">
              {item.student.first_name} {item.student.last_name}
            </h4>
            <p className="text-sm text-muted-foreground">
              Posted on {format(new Date(item.created_at), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        {userId === item.student.id && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="h-8 w-8 hover:bg-background hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-4 pl-14">
        <p className="text-sm">{item.comment}</p>
      </div>
    </div>
  );
}
