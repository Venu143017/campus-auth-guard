import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Camera, MapPin, Mic, CheckCircle2, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
    setChecking(false);
  };

  if (checking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-primary rounded-full shadow-xl">
              <GraduationCap className="h-20 w-20 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Smart Attendance System
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Revolutionizing campus attendance with AI-powered face recognition, 
            voice verification, and GPS validation
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center space-y-4 p-6 rounded-xl bg-background border-2 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <MapPin className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold">GPS Verification</h3>
              <p className="text-muted-foreground">
                Ensures students are physically present on campus before marking attendance
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4 p-6 rounded-xl bg-background border-2 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <Camera className="h-12 w-12 text-secondary" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold">Face Recognition</h3>
              <p className="text-muted-foreground">
                AI-powered facial detection and recognition for secure identity verification
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4 p-6 rounded-xl bg-background border-2 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="p-4 bg-accent/10 rounded-full">
                  <Mic className="h-12 w-12 text-accent" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold">Voice Verification</h3>
              <p className="text-muted-foreground">
                Additional layer of security using voice recognition technology
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose Smart Attendance?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Multi-factor authentication ensures attendance accuracy"
              },
              {
                icon: CheckCircle2,
                title: "Easy to Use",
                description: "Simple 3-step process for students"
              },
              {
                icon: Camera,
                title: "Real-time Verification",
                description: "Instant attendance confirmation"
              },
              {
                icon: GraduationCap,
                title: "Digital Records",
                description: "Complete attendance history at your fingertips"
              }
            ].map((benefit, index) => (
              <div 
                key={index}
                className="flex gap-4 p-6 rounded-xl bg-card border hover:border-primary transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Transform Attendance?
          </h2>
          <p className="text-xl opacity-90">
            Join thousands of students using Smart Attendance System
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 mt-6"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Smart Attendance System. Built for EdTech Hackathon.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
