import { useLogout } from "../api/useAuth";

export default function DashboardPage() {
  const logout = useLogout();

  return (
    <div>
      <h1>Dashboard</h1>
      {/* ... existing content ... */}
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        type="button"
      >
        {logout.isPending ? "Logging out..." : "Log Out"}
      </button>
    </div>
  );
}
