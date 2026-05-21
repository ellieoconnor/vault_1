import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheatCodes } from './CheatCodes';
import { useCheatCodes, type CheatCode } from '@/api/useCheatCodes';

vi.mock('@/api/useCheatCodes', () => ({
    useCheatCodes: vi.fn(),
}));

const mockUseCheatCodes = vi.mocked(useCheatCodes);

const sampleCodes: CheatCode[] = [
    { id: '1', userId: 'u1', text: 'Eat protein first', sortOrder: 0, createdAt: '', updatedAt: '' },
    {
        id: '2',
        userId: 'u1',
        text: 'Walk 10 mins after meals',
        sortOrder: 1,
        createdAt: '',
        updatedAt: '',
    },
];

describe('CheatCodes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing while loading', () => {
        mockUseCheatCodes.mockReturnValue({
            data: undefined,
            isLoading: true,
        } as ReturnType<typeof useCheatCodes>);
        const { container } = render(<CheatCodes />);
        expect(container.firstChild).toBeNull();
    });

    it('renders placeholder when cheat codes array is empty', () => {
        mockUseCheatCodes.mockReturnValue({
            data: [],
            isLoading: false,
        } as ReturnType<typeof useCheatCodes>);
        render(<CheatCodes />);
        expect(screen.getByText('No Cheat Codes yet — add them in Settings.')).toBeDefined();
    });

    it('renders cheat code entries as list items', () => {
        mockUseCheatCodes.mockReturnValue({
            data: sampleCodes,
            isLoading: false,
        } as ReturnType<typeof useCheatCodes>);
        render(<CheatCodes />);
        expect(screen.getByText('Eat protein first')).toBeDefined();
        expect(screen.getByText('Walk 10 mins after meals')).toBeDefined();
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('has correct aria-label on the container', () => {
        mockUseCheatCodes.mockReturnValue({
            data: [],
            isLoading: false,
        } as ReturnType<typeof useCheatCodes>);
        render(<CheatCodes />);
        expect(
            screen.getByRole('region', { name: 'Cheat Codes — active coaching strategies' })
        ).toBeDefined();
    });

    it('renders the CHEAT CODES eyebrow label', () => {
        mockUseCheatCodes.mockReturnValue({
            data: [],
            isLoading: false,
        } as ReturnType<typeof useCheatCodes>);
        render(<CheatCodes />);
        expect(screen.getByText(/CHEAT CODES/)).toBeDefined();
    });

    it('renders without crashing (smoke test)', () => {
        mockUseCheatCodes.mockReturnValue({
            data: sampleCodes,
            isLoading: false,
        } as ReturnType<typeof useCheatCodes>);
        expect(() => render(<CheatCodes />)).not.toThrow();
    });
});
