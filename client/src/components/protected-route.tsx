import { useAuth } from "@/hooks/use-auth";
import { useLocation, Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ path, component: Component, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to={`/auth?redirect=${encodeURIComponent(location)}`} />;
        }

        if (adminOnly && user.role !== "admin") {
          return <Redirect to="/" />;
        }

        return <Component />;
      }}
    </Route>
  );
};