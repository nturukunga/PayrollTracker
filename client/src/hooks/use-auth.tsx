import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ['/api/users/current'],
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await res.json();
      
      queryClient.setQueryData(['/api/users/current'], userData);
      navigate('/');
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest('POST', '/api/auth/logout');
      
      queryClient.setQueryData(['/api/users/current'], null);
      queryClient.clear();
      
      navigate('/login');
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "Something went wrong, please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(isUserLoading);
  }, [isUserLoading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
