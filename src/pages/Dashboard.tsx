import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MapPin, Camera, Mic, LogOut, Calendar, CheckCircle2 } from "lucide-react";
import AttendanceCamera from "@/components/AttendanceCamera";
import AttendanceRecords from "@/components/AttendanceRecords";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [locationValid, setLocationValid] = useState(false);
  const [currentStep, setCurrentStep] = useState<"location" | "camera" | "voice" | "complete">("location");
  const [showCamera, setShowCamera] = useState(false);

  // College coordinates (example: set your college location)
  const COLLEGE_LAT = 28.6139; // Example: Delhi
  const COLLEGE_LON = 77.2090;
  const ALLOWED_RADIUS_METERS = 100;

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch student data
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error || !student) {
      toast.error("Failed to load student data");
      navigate("/auth");
      return;
    }

    setStudentData(student);
    setLoading(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkLocation = async () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          COLLEGE_LAT,
          COLLEGE_LON
        );

        if (distance <= ALLOWED_RADIUS_METERS) {
          setLocationValid(true);
          setCurrentStep("camera");
          setShowCamera(true);
          toast.success("Location verified! You are inside campus.");
        } else {
          toast.error(`You must be inside the college campus to mark attendance. (Distance: ${Math.round(distance)}m)`);
        }
        setLoading(false);
      },
      (error) => {
        toast.error("Unable to get your location. Please enable location services.");
        setLoading(false);
      }
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleAttendanceMarked = () => {
    setCurrentStep("complete");
    setShowCamera(false);
    toast.success("Attendance marked successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Welcome, {studentData?.name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  Roll Number: {studentData?.roll_number}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Attendance Process */}
        {!showCamera && currentStep !== "complete" && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Mark Attendance</CardTitle>
              <CardDescription>
                Follow the verification steps to mark your attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Location */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className={`p-3 rounded-full ${locationValid ? 'bg-success' : 'bg-primary'}`}>
                  <MapPin className={`h-6 w-6 ${locationValid ? 'text-success-foreground' : 'text-primary-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Step 1: Verify Location</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Confirm you are inside the college campus
                  </p>
                  {!locationValid && (
                    <Button onClick={checkLocation} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking location...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Verify Location
                        </>
                      )}
                    </Button>
                  )}
                  {locationValid && (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Location Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Face Recognition */}
              <div className={`flex items-start gap-4 p-4 rounded-lg ${locationValid ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
                <div className="p-3 rounded-full bg-primary">
                  <Camera className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Step 2: Face Recognition</h3>
                  <p className="text-sm text-muted-foreground">
                    Camera will activate after location verification
                  </p>
                </div>
              </div>

              {/* Step 3: Voice Verification */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/20 opacity-50">
                <div className="p-3 rounded-full bg-primary">
                  <Mic className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Step 3: Voice Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Speak your name for voice confirmation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Interface */}
        {showCamera && (
          <AttendanceCamera 
            studentData={studentData}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}

        {/* Success Message */}
        {currentStep === "complete" && (
          <Card className="border-2 border-success">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-success rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-success-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-success">Attendance Marked!</h3>
                <p className="text-muted-foreground">
                  Your attendance has been successfully recorded for today.
                </p>
                <Button onClick={() => setCurrentStep("location")} variant="outline">
                  Mark Another Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Records */}
        <AttendanceRecords studentId={studentData?.id} />
      </div>
    </div>
  );
};

export default Dashboard;
