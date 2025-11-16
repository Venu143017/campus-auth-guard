import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Loader2 } from "lucide-react";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  rollNumber: z.string()
    .trim()
    .min(1, "Roll number is required")
    .max(50, "Roll number must be less than 50 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Roll number can only contain letters, numbers, and hyphens"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
});

const signupSchema = z.object({
  rollNumber: z.string()
    .trim()
    .min(1, "Roll number is required")
    .max(50, "Roll number must be less than 50 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Roll number can only contain letters, numbers, and hyphens"),
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
});

type LoginFormErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>;
type SignupFormErrors = Partial<Record<keyof z.infer<typeof signupSchema>, string>>;

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ rollNumber: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    rollNumber: "", 
    name: "", 
    email: "", 
    password: "" 
  });
  const [loginErrors, setLoginErrors] = useState<LoginFormErrors>({});
  const [signupErrors, setSignupErrors] = useState<SignupFormErrors>({});

  // Rate limiting check
  const checkRateLimit = async (identifier: string): Promise<boolean> => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('login_attempts')
      .select('success')
      .eq('identifier', identifier)
      .gte('attempt_time', fifteenMinutesAgo)
      .order('attempt_time', { ascending: false });

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow attempt if check fails
    }

    // Count failed attempts in last 15 minutes
    const failedAttempts = data?.filter(attempt => !attempt.success).length || 0;
    
    if (failedAttempts >= 5) {
      toast.error("Too many failed login attempts. Please try again in 15 minutes.");
      return false;
    }

    return true;
  };

  // Log login attempt
  const logLoginAttempt = async (identifier: string, success: boolean) => {
    await supabase
      .from('login_attempts')
      .insert({
        identifier,
        success,
        attempt_time: new Date().toISOString()
      });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    // Validate input
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      const errors: LoginFormErrors = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof LoginFormErrors] = err.message;
        }
      });
      setLoginErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);

    try {
      // Check rate limit
      const canAttempt = await checkRateLimit(loginData.rollNumber);
      if (!canAttempt) {
        setLoading(false);
        return;
      }

      // For login, we need to get the email associated with the roll number
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('email')
        .eq('roll_number', loginData.rollNumber)
        .maybeSingle();

      if (studentError || !studentData) {
        await logLoginAttempt(loginData.rollNumber, false);
        toast.error("Invalid roll number or password");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: studentData.email,
        password: loginData.password,
      });

      if (error) {
        await logLoginAttempt(loginData.rollNumber, false);
        toast.error("Invalid roll number or password"); // Generic message for security
      } else {
        await logLoginAttempt(loginData.rollNumber, true);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      await logLoginAttempt(loginData.rollNumber, false);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});

    // Validate input
    const validation = signupSchema.safeParse(signupData);
    if (!validation.success) {
      const errors: SignupFormErrors = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof SignupFormErrors] = err.message;
        }
      });
      setSignupErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            roll_number: signupData.rollNumber,
            name: signupData.name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email or roll number is already registered");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Account created successfully! Please log in.");
        // Switch to login tab
        const loginTab = document.querySelector('[value="login"]') as HTMLButtonElement;
        loginTab?.click();
      }
    } catch (error: any) {
      toast.error("An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary rounded-full">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Smart Attendance</CardTitle>
          <CardDescription className="text-base">
            Face Recognition-Based Attendance System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-roll">Roll Number</Label>
                  <Input
                    id="login-roll"
                    placeholder="Enter your roll number"
                    value={loginData.rollNumber}
                    onChange={(e) => {
                      setLoginData({ ...loginData, rollNumber: e.target.value });
                      setLoginErrors({ ...loginErrors, rollNumber: undefined });
                    }}
                    required
                    className={loginErrors.rollNumber ? "border-destructive" : ""}
                  />
                  {loginErrors.rollNumber && (
                    <p className="text-sm text-destructive mt-1">{loginErrors.rollNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginData({ ...loginData, password: e.target.value });
                      setLoginErrors({ ...loginErrors, password: undefined });
                    }}
                    required
                    className={loginErrors.password ? "border-destructive" : ""}
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive mt-1">{loginErrors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-roll">Roll Number</Label>
                  <Input
                    id="signup-roll"
                    placeholder="Enter roll number"
                    value={signupData.rollNumber}
                    onChange={(e) => {
                      setSignupData({ ...signupData, rollNumber: e.target.value });
                      setSignupErrors({ ...signupErrors, rollNumber: undefined });
                    }}
                    required
                    className={signupErrors.rollNumber ? "border-destructive" : ""}
                  />
                  {signupErrors.rollNumber && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.rollNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="Enter your full name"
                    value={signupData.name}
                    onChange={(e) => {
                      setSignupData({ ...signupData, name: e.target.value });
                      setSignupErrors({ ...signupErrors, name: undefined });
                    }}
                    required
                    className={signupErrors.name ? "border-destructive" : ""}
                  />
                  {signupErrors.name && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => {
                      setSignupData({ ...signupData, email: e.target.value });
                      setSignupErrors({ ...signupErrors, email: undefined });
                    }}
                    required
                    className={signupErrors.email ? "border-destructive" : ""}
                  />
                  {signupErrors.email && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Min 8 chars, uppercase, lowercase, number"
                    value={signupData.password}
                    onChange={(e) => {
                      setSignupData({ ...signupData, password: e.target.value });
                      setSignupErrors({ ...signupErrors, password: undefined });
                    }}
                    required
                    className={signupErrors.password ? "border-destructive" : ""}
                  />
                  {signupErrors.password && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
