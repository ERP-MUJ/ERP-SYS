"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UserIcon, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@workspace/ui/components/theme-toggle";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("qac");
  const [showPassword, setShowPassword] = React.useState(false);
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      role: activeTab,
      redirect: false,
    });

    if (res?.error) {
      toast.error("Invalid email or password");
    } else {
      // Redirect based on role
      const roleRoutes = {
        qac: "/qc",
        hod: "/hod",
        faculty: "/faculty",
      };
      const redirectPath =
        roleRoutes[activeTab as keyof typeof roleRoutes] || "/";
      router.push(redirectPath);
      toast.success("Logged in successfully");
    }
    setIsLoading(false);
  }

  const handleRoleChange = (role: string) => {
    setActiveTab(role);
    form.reset();
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setVideoLoaded(false);
    console.error("Video failed to load");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Video Section */}
      <div className="relative w-full md:w-2/3 bg-gradient-to-br from-blue-900 to-purple-900">
        {/* Fallback background when video fails */}
        {videoError && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
            style={{
              backgroundImage: "url('/poster.jpeg')",
            }}
          />
        )}

        {/* Video element */}
        {!videoError && (
          <video
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              videoLoaded ? "opacity-80" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/poster.jpeg"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onCanPlay={handleVideoLoad}
          >
            <source src="/mujvideo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        {/* Loading indicator */}
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
          <div className="bg-black/40 p-6 rounded-lg backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-center mb-2">
              Manipal University Jaipur
            </h1>
            <p className="text-center max-w-md">
              Welcome to the official portal. Please login with your
              credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div
        className="w-full md:w-1/2 flex items-center justify-center p-8 relative overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Basic Cursor Following Gradient */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none transition-all duration-300 ease-out"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
              rgba(255, 165, 0, 0.15) 0%, 
              rgba(255, 140, 0, 0.1) 25%, 
              rgba(255, 69, 0, 0.05) 50%, 
              transparent 100%)`,
          }}
        />

        {/* Dark mode gradient overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-300 ease-out dark:opacity-40"
          style={{
            background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, 
              rgba(0, 0, 0, 0.1) 0%, 
              rgba(255, 140, 0, 0.15) 30%, 
              rgba(255, 69, 0, 0.1) 60%, 
              transparent 100%)`,
          }}
        />

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-background/80 border-orange-200/20 dark:border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Login to Portal
            </CardTitle>
            <CardDescription className="text-center">
              Select your role and and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="qc"
              value={activeTab}
              onValueChange={handleRoleChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="qac">QAC</TabsTrigger>
                <TabsTrigger value="hod">HOD</TabsTrigger>
                <TabsTrigger value="faculty">Faculty</TabsTrigger>
              </TabsList>

              {/* QAC, HOD, Faculty Login (all use same form) */}
              <TabsContent value="qac">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 mt-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>QAC Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="qac@admin.com"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                tabIndex={-1}
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="hod">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 mt-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>HOD Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="hod@admin.com"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                tabIndex={-1}
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="faculty">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 mt-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Faculty Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="faculty@admin.com"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                tabIndex={-1}
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Forgot your password?{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Reset it here
              </a>
            </div>
            <div className="text-sm text-center text-muted-foreground">
              Having trouble?{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Contact support
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
