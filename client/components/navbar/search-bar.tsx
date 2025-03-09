"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SearchMemberItem } from "./search-member-item";
import { SearchCourseItem } from "./search-course-item";
import { SearchResult } from "@/types/search";
import { performGlobalSearch } from "@/utils/search-api";

/**
 * SearchBar component provides global search functionality
 * @param {Object} props - Component props
 * @param {string} props.userRole - User role
 */
export function SearchBar({ userRole }: { userRole: string | null }) {
  // Get the router instance
  const router = useRouter();

  // State management for search query and results
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [results, setResults] = React.useState<SearchResult>({
    members: [],
    courses: [],
  });
  const [isLoading, setIsLoading] = React.useState(false);

  /**
   * Execute search with the given query
   */
  const executeSearch = React.useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults({ members: [], courses: [] });
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await performGlobalSearch(query, userRole);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
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
      executeSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, executeSearch]);

  /**
   * Navigate to member profile
   */
  const navigateToMember = (memberId: number) => {
    router.push(`/members/${memberId}`);
    setOpen(false);
  };

  /**
   * Navigate to course page
   */
  const navigateToCourse = (courseId: number) => {
    router.push(`/courses/${courseId}`);
    setOpen(false);
  };

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
          {/* Search Input */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search here..."
              value={value}
              onValueChange={setValue}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{isLoading ? "Searching..." : "No results found."}</CommandEmpty>

              {/* Members */}
              {userRole === "teacher" && results.members.length > 0 && (
                <CommandGroup heading="Members">
                  {results.members.map((member) => (
                    <SearchMemberItem key={`member-${member.id}`} member={member} onSelect={navigateToMember} />
                  ))}
                </CommandGroup>
              )}

              {/* Courses */}
              {results.courses.length > 0 && (
                <CommandGroup heading="Courses">
                  {results.courses.map((course) => (
                    <SearchCourseItem key={`course-${course.id}`} course={course} onSelect={navigateToCourse} />
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
