"use client";

import * as React from "react";
import { CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { MemberResult } from "@/types/search";

interface SearchMemberItemProps {
  member: MemberResult;
  onSelect: (memberId: number) => void;
}

/**
 * Renders a single member search result
 */
export function SearchMemberItem({ member, onSelect }: SearchMemberItemProps) {
  const handleSelect = React.useCallback(() => {
    onSelect(member.id);
  }, [member.id, onSelect]);

  return (
    <div>
      <CommandItem
        value={`member-${member.id}-${member.first_name} ${member.last_name}`}
        onSelect={handleSelect}
        className="flex items-center justify-between cursor-pointer">
        <div className="flex-1">
          <p className="font-medium">
            {member.first_name} {member.last_name}
          </p>
          <p className="text-sm text-muted-foreground">@{member.username}</p>
        </div>
        <Badge variant={member.role === "teacher" ? "default" : "secondary"}>{member.role}</Badge>
      </CommandItem>
    </div>
  );
}
