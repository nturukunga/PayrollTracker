import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Database, Download, DownloadCloud, Loader2, Server, XCircle } from "lucide-react";

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupWizard({ isOpen, onClose }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [dbConfig, setDbConfig] = useState({
    host: "127.0.0.1",
    port: "3306",
    database: "payrollsystem",
    username: "root",
    password: "",
  });
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [setupStatus, setSetupStatus] = useState<"idle" | "setting-up" | "success" | "error">("idle");
  const { toast } = useToast();

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      setTestStatus("testing");
      try {
        const response = await apiRequest('POST', '/api/setup/test-connection', dbConfig);
        const data = await response.json();
        if (data.success) {
          setTestStatus("success");
          return data;
        } else {
          setTestStatus("error");
          throw new Error(data.message || "Connection test failed");
        }
      } catch (error) {
        setTestStatus("error");
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not connect to the database",
        variant: "destructive",
      });
    },
  });

  const initDatabaseMutation = useMutation({
    mutationFn: async () => {
      setSetupStatus("setting-up");
      try {
        const response = await apiRequest('POST', '/api/setup/init-db');
        const data = await response.json();
        if (data.success) {
          setSetupStatus("success");
          return data;
        } else {
          setSetupStatus("error");
          throw new Error(data.message || "Database initialization failed");
        }
      } catch (error) {
        setSetupStatus("error");
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Database initialized successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Initialization failed",
        description: error instanceof Error ? error.message : "Could not initialize database",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDbConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const handleDatabaseSetup = () => {
    initDatabaseMutation.mutate();
  };

  const handleDownloadSQL = async () => {
    try {
      const response = await fetch('/api/setup/sql-export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'payroll_setup.sql';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "SQL file downloaded",
        description: "Import this SQL file into your XAMPP MySQL database",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download SQL file",
        variant: "destructive",
      });
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Database Connection Setup</DialogTitle>
              <DialogDescription>
                Configure your XAMPP MySQL database connection
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Database Host</Label>
                  <Input
                    id="host"
                    name="host"
                    value={dbConfig.host}
                    onChange={handleInputChange}
                    placeholder="127.0.0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    name="port"
                    value={dbConfig.port}
                    onChange={handleInputChange}
                    placeholder="3306"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="database">Database Name</Label>
                <Input
                  id="database"
                  name="database"
                  value={dbConfig.database}
                  onChange={handleInputChange}
                  placeholder="payrollsystem"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={dbConfig.username}
                  onChange={handleInputChange}
                  placeholder="root"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={dbConfig.password}
                  onChange={handleInputChange}
                  placeholder="Leave empty if not set"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending}
                className="flex items-center"
              >
                {testStatus === "testing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : testStatus === "success" ? (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                ) : testStatus === "error" ? (
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                ) : (
                  <Server className="mr-2 h-4 w-4" />
                )}
                {testStatus === "testing" ? "Testing Connection..." : "Test Connection"}
              </Button>
              
              {testStatus === "success" && (
                <p className="text-sm text-green-600">Connection successful! You can proceed to the next step.</p>
              )}
              
              {testStatus === "error" && (
                <p className="text-sm text-red-600">Connection failed. Please check your database settings.</p>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={testStatus !== "success"}
              >
                Next Step
              </Button>
            </DialogFooter>
          </>
        );
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Database Initialization</DialogTitle>
              <DialogDescription>
                Set up the database schema for your payroll system
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              <p className="text-sm text-muted-foreground">
                You have two options to set up your database:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Option 1: Automatic Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Let the system create and initialize the database automatically.
                    </p>
                    <Button
                      onClick={handleDatabaseSetup}
                      disabled={setupStatus === "setting-up" || setupStatus === "success"}
                      className="w-full"
                    >
                      {setupStatus === "setting-up" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting Up...
                        </>
                      ) : setupStatus === "success" ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Initialized
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Initialize Database
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Option 2: Manual Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download the SQL script and import it into your MySQL database manually.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadSQL}
                      className="w-full"
                    >
                      <DownloadCloud className="mr-2 h-4 w-4" />
                      Download SQL Script
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {setupStatus === "success" && (
                <div className="p-4 bg-green-50 text-green-800 rounded-md">
                  <h3 className="flex items-center text-sm font-semibold">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Database Initialized Successfully
                  </h3>
                  <p className="text-xs mt-1">
                    Your database has been set up with the required tables and default data.
                  </p>
                </div>
              )}
              
              {setupStatus === "error" && (
                <div className="p-4 bg-red-50 text-red-800 rounded-md">
                  <h3 className="flex items-center text-sm font-semibold">
                    <XCircle className="mr-2 h-4 w-4" />
                    Database Initialization Failed
                  </h3>
                  <p className="text-xs mt-1">
                    There was an error initializing the database. Please try the manual option.
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={onClose}
                variant={setupStatus === "success" ? "default" : "outline"}
              >
                {setupStatus === "success" ? "Finish" : "Close"}
              </Button>
            </DialogFooter>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        {getStepContent()}
      </DialogContent>
    </Dialog>
  );
}
