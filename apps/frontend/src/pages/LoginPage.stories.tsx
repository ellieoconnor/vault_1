import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './LoginPage';

function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    );
}

const meta: Meta<typeof LoginPage> = {
    title: 'Pages/Login',
    component: LoginPage,
    decorators: [
        (Story) => (
            <Providers>
                <Story />
            </Providers>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {};
