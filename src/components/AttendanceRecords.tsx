import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecordsProps {
  studentId: string;
}

const AttendanceRecords = ({ studentId }: AttendanceRecordsProps) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('attendance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attendance History
        </CardTitle>
        <CardDescription>
          Your recent attendance records
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading records...
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records yet
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-full ${
                  record.verification_status === 'passed' 
                    ? 'bg-success/10' 
                    : 'bg-destructive/10'
                }`}>
                  {record.verification_status === 'passed' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {format(new Date(record.marked_at), 'PPP')}
                    </span>
                    <Badge variant={record.verification_status === 'passed' ? 'default' : 'destructive'}>
                      {record.verification_status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(record.marked_at), 'p')}
                  </div>
                  {record.gps_latitude && record.gps_longitude && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {record.gps_latitude.toFixed(4)}, {record.gps_longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {record.verification_method && (
                    <div className="text-xs text-muted-foreground">
                      Method: {record.verification_method.replace('_', ' + ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceRecords;
