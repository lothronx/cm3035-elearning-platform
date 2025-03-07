import type React from "react";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";

// Define validation schema with Zod
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(255, "First name should not exceed 255 characters")
      .regex(/^[a-zA-Z]+$/, "First name should contain only letters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(255, "Last name should not exceed 255 characters")
      .regex(/^[a-zA-Z]+$/, "Last name should contain only letters"),
    username: z
      .string()
      .min(6, "Username must have at least 6 characters")
      .max(255, "Username should not exceed 255 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and _"),
    password: z
      .string()
      .min(8, "Password must have at least 8 characters")
      .max(255, "Password should not exceed 255 characters")
      .refine(
        (password) => {
          // Check if password contains at least 2 of: letters, numbers, special characters
          const hasLetter = /[a-zA-Z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          const hasSpecial = /[^a-zA-Z0-9]/.test(password);

          return [hasLetter, hasNumber, hasSpecial].filter(Boolean).length >= 2;
        },
        {
          message: "Password must contain at least 2 of: letters, numbers, and special characters",
        }
      ),
    confirmPassword: z.string(),
    role: z.enum(["student", "teacher"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  server?: string;
};

export function RegisterForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const validateForm = () => {
    try {
      registerSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormErrors;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Process validation errors from the backend
        if (response.status === 400) {
          // Map backend field names to frontend field names
          const fieldMapping: Record<string, keyof FormErrors> = {
            username: "username",
            password: "password",
            first_name: "firstName",
            last_name: "lastName",
            role: "role",
            error: "server",
          };

          const newErrors: FormErrors = {};

          // Process each error field from the backend
          Object.entries(data).forEach(([field, message]) => {
            const frontendField = fieldMapping[field] || (field as keyof FormErrors);
            newErrors[frontendField] = message as string;
          });

          setErrors(newErrors);

          // Show toast for the first error
          const firstError = Object.values(newErrors)[0];
          if (firstError) {
            toast.error(firstError);
          }
        } else {
          // Generic error
          setErrors({ server: "Registration failed. Please try again." });
          toast.error("Registration failed");
        }
        return;
      }

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "student",
      });

      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setErrors({ server: "An unexpected error occurred. Please try again." });
      toast.error("Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-background-light">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>Create an account to start learning</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.server && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errors.server}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="johndoe123"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "border-destructive" : ""}
            />
            {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>I am a</Label>
            <RadioGroup
              value={formData.role}
              onValueChange={handleRadioChange}
              className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher">Teacher</Label>
              </div>
            </RadioGroup>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
