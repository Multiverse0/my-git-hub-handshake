import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';
import { Loader2, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface RepairResult {
  member_id: string;
  member_email: string;
  auth_user_id: string | null;
  linked: boolean;
}

export function MemberDataRepair() {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResults, setRepairResults] = useState<RepairResult[]>([]);
  const { toast } = useToast();

  const runDataRepair = async () => {
    setIsRepairing(true);
    setRepairResults([]);

    try {
      // Run the repair function
      const { data, error } = await supabase
        .rpc('repair_unlinked_members');

      if (error) {
        throw error;
      }

      setRepairResults(data || []);

      const linkedCount = data?.filter((result: RepairResult) => result.linked).length || 0;
      const unlinkedCount = data?.length - linkedCount || 0;

      toast({
        title: "Data Repair Complete",
        description: `Repaired ${linkedCount} member records. ${unlinkedCount} members still need manual attention.`,
        variant: linkedCount > 0 ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Error running data repair:', error);
      toast({
        title: "Repair Failed",
        description: "Could not complete data repair. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Member Data Repair Tool</h3>
      </div>
      
      <p className="text-muted-foreground mb-4">
        This tool helps repair member records that may not be properly linked to their authentication accounts. 
        Run this if users are getting "Profile Setup Required" errors after being approved.
      </p>

      <Button 
        onClick={runDataRepair} 
        disabled={isRepairing}
        className="mb-4"
      >
        {isRepairing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Repairing...
          </>
        ) : (
          'Run Data Repair'
        )}
      </Button>

      {repairResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Repair Results:</h4>
          {repairResults.map((result, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-2 p-2 rounded border ${
                result.linked ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
              }`}
            >
              {result.linked ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              )}
              <span className="text-sm">
                {result.member_email}: {result.linked ? 'Successfully linked' : 'No matching auth user found'}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}