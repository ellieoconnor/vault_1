import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CheatCode } from '@/api/useCheatCodes';
import { CheatCodes } from './CheatCodes';

function withQueryData(cheatCodes: CheatCode[]) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['cheatCodes'], cheatCodes);
    return (Story: React.ComponentType) => (
        <QueryClientProvider client={queryClient}>
            <Story />
        </QueryClientProvider>
    );
}

const meta: Meta<typeof CheatCodes> = {
    title: 'Components/Dashboard/CheatCodes',
    component: CheatCodes,
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof CheatCodes>;

export const WithCheatCodes: Story = {
    name: 'With cheat codes (3 entries)',
    decorators: [
        withQueryData([
            {
                id: '1',
                userId: 'u1',
                text: 'Eat protein first — it fills you up before you get to the bread',
                sortOrder: 0,
                createdAt: '',
                updatedAt: '',
            },
            {
                id: '2',
                userId: 'u1',
                text: 'Walk 10 mins after dinner — counts toward steps and helps digestion',
                sortOrder: 1,
                createdAt: '',
                updatedAt: '',
            },
            {
                id: '3',
                userId: 'u1',
                text: "Log before you eat — just do it anyway, even if it's late",
                sortOrder: 2,
                createdAt: '',
                updatedAt: '',
            },
        ]),
    ],
};

export const Empty: Story = {
    name: 'No cheat codes yet (placeholder)',
    decorators: [withQueryData([])],
};

export const OneEntry: Story = {
    name: 'Single cheat code',
    decorators: [
        withQueryData([
            {
                id: '1',
                userId: 'u1',
                text: 'Eat protein first',
                sortOrder: 0,
                createdAt: '',
                updatedAt: '',
            },
        ]),
    ],
};
