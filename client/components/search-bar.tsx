"use client";

import * as React from "react";
import { fetchWithAuth } from "@/lib/auth";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchResult = {
  members: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
  }>;
  courses: Array<{
    id: number;
    title: string;
    description: string;
    is_active: boolean;
  }>;
};

export function SearchBar({ userRole }: { userRole: string | null }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [results, setResults] = React.useState<SearchResult>({
    members: [],
    courses: [],
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSearch = React.useCallback(
    async (search: string) => {
      if (!search.trim()) {
        setResults({ members: [], courses: [] });
        return;
      }

      setIsLoading(true);

      try {
        // Always search courses
        const coursesPromise = fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/courses/search/?q=${encodeURIComponent(search)}`
        );

        // Only search members if user is a teacher
        let membersData = [];
        let coursesData = [];

        if (userRole === "teacher") {
          const [membersResponse, coursesResponse] = await Promise.all([
            fetchWithAuth(
              `${process.env.NEXT_PUBLIC_API_URL}/api/members/search/?q=${encodeURIComponent(
                search
              )}`
            ),
            coursesPromise,
          ]);

          if (!membersResponse.ok || !coursesResponse.ok) {
            throw new Error("Search failed");
          }

          [membersData, coursesData] = await Promise.all([
            membersResponse.json(),
            coursesResponse.json(),
          ]);
        } else {
          const coursesResponse = await coursesPromise;
          if (!coursesResponse.ok) {
            throw new Error("Search failed");
          }
          coursesData = await coursesResponse.json();
        }

        setResults({
          members: membersData,
          courses: coursesData,
        });
      } catch (err) {
        console.error("Search error:", err);
        setResults({ members: [], courses: [] });
      } finally {
        setIsLoading(false);
      }
    },
    [userRole]
  );

  // Handle input changes with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, handleSearch]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary">
            <Search className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search here..."
              value={value}
              onValueChange={setValue}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{isLoading ? "Searching..." : "No results found."}</CommandEmpty>
              {userRole === "teacher" && results.members.length > 0 && (
                <CommandGroup heading="Members">
                  {results.members.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`member-${member.id}-${member.first_name} ${member.last_name}`}
                      onSelect={() => {
                        router.push(`/members/${member.id}`);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">@{member.username}</p>
                      </div>
                      <Badge variant={member.role === "teacher" ? "default" : "secondary"}>
                        {member.role}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.courses.length > 0 && (
                <CommandGroup heading="Courses">
                  {results.courses.map((course) => (
                    <CommandItem
                      key={course.id}
                      value={`course-${course.id}-${course.title}`}
                      onSelect={() => {
                        router.push(`/courses/${course.id}`);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                      </div>
                      {!course.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
