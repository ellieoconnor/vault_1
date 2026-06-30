import { useLogout } from '../api/useAuth';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
    const logout = useLogout();

    return (
        <div>
            <h1>Dashboard</h1>
            {/* ... existing content ... */}
            <Link to="/settings">Settings</Link>
            <button onClick={() => logout.mutate()} disabled={logout.isPending} type="button">
                {logout.isPending ? 'Logging out...' : 'Log Out'}
            </button>
        </div>
    );
}
