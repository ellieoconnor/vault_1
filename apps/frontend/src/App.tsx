import { BrowserRouter, Route, Routes } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import { AuthGuard } from './components/shared/AuthGuard';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                        <AuthGuard>
                            <DashboardPage />
                        </AuthGuard>
                    }
                />
                <Route
                    path="/onboarding"
                    element={
                        <AuthGuard>
                            <OnboardingPage />
                        </AuthGuard>
                    }
                />

                {/* Placeholders for future epics */}
                <Route
                    path="/week"
                    element={
                        <AuthGuard>
                            <div>Weekly Plan — coming soon</div>
                        </AuthGuard>
                    }
                />
                <Route
                    path="/goals"
                    element={
                        <AuthGuard>
                            <div>Goals — coming soon</div>
                        </AuthGuard>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <AuthGuard>
                            <SettingsPage />
                        </AuthGuard>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
