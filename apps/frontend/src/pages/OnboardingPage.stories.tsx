import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OnboardingPage from './OnboardingPage';

function Providers({ children }: { children: React.ReactNode }) {
    // Pre-seed cache with null so useUserConfig returns immediately with no config
    // and the page renders the form instead of redirecting
    const queryClient = new QueryClient();
    queryClient.setQueryData(['userConfig'], null);
    return (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    );
}

const meta: Meta<typeof OnboardingPage> = {
    title: 'Pages/Onboarding',
    component: OnboardingPage,
    decorators: [
        (Story) => (
            <Providers>
                <Story />
            </Providers>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof OnboardingPage>;

export const Step1Biometrics: Story = {
    args: { initialStep: 1 },
};

export const Step2Goal: Story = {
    args: { initialStep: 2 },
};

export const Step3Targets: Story = {
    args: { initialStep: 3 },
};
