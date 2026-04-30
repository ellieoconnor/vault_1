import { Navigate } from 'react-router-dom';
import { useAuth } from '../../api/useAuth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, isError } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // Prevents redirect flash while session check is pending
    }

    if (isError) {
        return <div>Something went wrong. Please refresh the page.</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
