"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CourseMaterial,
  fetchCourseMaterials,
  uploadCourseMaterial,
  deleteCourseMaterial,
} from "@/utils/course-material-utils";

interface CourseMaterialsProps {
  courseId: string;
  isCourseTeacher: boolean;
}

export default function CourseMaterials({ courseId, isCourseTeacher }: CourseMaterialsProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  const loadMaterials = async () => {
    try {
      const data = await fetchCourseMaterials(courseId);
      setMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setIsSubmitting(true);
      setError(undefined);
      await uploadCourseMaterial(courseId, formData);
      await loadMaterials();
      setUploadDialogOpen(false);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;

    try {
      setIsSubmitting(true);
      setError(undefined);
      await deleteCourseMaterial(courseId, selectedMaterial.id);
      await loadMaterials();
      setDeleteDialogOpen(false);
      setSelectedMaterial(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-6 overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardHeader className="px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-secondary">Course Materials</CardTitle>
          {isCourseTeacher && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleUpload}>
                  <DialogHeader>
                    <DialogTitle>Upload Course Material</DialogTitle>
                    <DialogDescription>Upload a file as course material.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" placeholder="Enter material title" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="file">File</Label>
                      <Input id="file" name="file" type="file" required />
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadDialogOpen(false)}
                      disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Uploading..." : "Upload"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-8">
        <ScrollArea className="h-[400px] pr-4">
          {materials.length === 0 ? (
            <p className="text-center text-muted-foreground">No materials available</p>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5" />
                    <div>
                      <h4 className="font-medium">{material.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Uploaded on {format(new Date(material.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="hover:bg-background hover:text-foreground">
                      <a href={material.file} target="_blank" rel="noopener noreferrer">
                        Download
                      </a>
                    </Button>
                    {isCourseTeacher && (
                      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-destructive/90 hover:text-destructive-foreground"
                            onClick={() => setSelectedMaterial(material)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Material</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this material? This action cannot be
                              undone.
                            </DialogDescription>
                          </DialogHeader>
                          {error && <p className="text-sm text-destructive">{error}</p>}
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteDialogOpen(false)}
                              disabled={isSubmitting}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDelete}
                              disabled={isSubmitting}>
                              {isSubmitting ? "Deleting..." : "Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
