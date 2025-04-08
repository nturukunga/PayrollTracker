import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import Payroll from "@/pages/payroll";
import Attendance from "@/pages/attendance";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import ContactSupport from "@/pages/contact-support";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

interface EmployeeDetailProps {
  id: string;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/employees" component={Employees} />
      <Route path="/employees/:id">
        {(params) => {
          const EmployeeDetailComponent = () => <EmployeeDetail id={params.id} />;
          return <ProtectedRoute path={`/employees/${params.id}`} component={EmployeeDetailComponent} />;
        }}
      </Route>
      <ProtectedRoute path="/payroll" component={Payroll} />
      <ProtectedRoute path="/attendance" component={Attendance} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/contact-support" component={ContactSupport} />
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
