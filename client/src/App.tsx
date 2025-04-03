import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import Payroll from "@/pages/payroll";
import Attendance from "@/pages/attendance";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/login";

// Auth hook
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} path="/" />} />
      <Route path="/employees" component={() => <ProtectedRoute component={Employees} path="/employees" />} />
      <Route path="/employees/:id" component={({ id }) => <ProtectedRoute component={EmployeeDetail} path={`/employees/${id}`} id={id} />} />
      <Route path="/payroll" component={() => <ProtectedRoute component={Payroll} path="/payroll" />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={Attendance} path="/attendance" />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} path="/reports" />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} path="/settings" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
