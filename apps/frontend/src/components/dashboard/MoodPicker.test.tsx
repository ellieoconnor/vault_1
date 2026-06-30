import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MoodPicker } from './MoodPicker';
import { MOOD_OPTIONS } from '@/lib/zoneConstants';

describe('MoodPicker', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all 7 mood buttons when open', () => {
        render(<MoodPicker open={true} onClose={onClose} />);
        const moodButtons = screen.getAllByRole('button', { name: /^Mood:/ });
        expect(moodButtons).toHaveLength(MOOD_OPTIONS.length);
    });

    it('does not render mood buttons when closed', () => {
        render(<MoodPicker open={false} onClose={onClose} />);
        expect(screen.queryAllByRole('button', { name: /^Mood:/ })).toHaveLength(0);
    });

    it('calls onClose with the selected mood value when a mood button is clicked', () => {
        render(<MoodPicker open={true} onClose={onClose} />);
        const solidButton = screen.getByRole('button', { name: 'Mood: Solid' });
        fireEvent.click(solidButton);
        expect(onClose).toHaveBeenCalledWith('solid');
    });

    it('calls onClose with null when the Sheet is dismissed via the close button', () => {
        render(<MoodPicker open={true} onClose={onClose} />);
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledWith(null);
    });

    it('each mood button has an aria-label containing the mood label', () => {
        render(<MoodPicker open={true} onClose={onClose} />);
        for (const option of MOOD_OPTIONS) {
            expect(screen.getByRole('button', { name: `Mood: ${option.label}` })).toBeDefined();
        }
    });

    it('shows the countdown text when open', () => {
        render(<MoodPicker open={true} onClose={onClose} />);
        expect(screen.getByText(/Closes in \d+s/)).toBeDefined();
    });

    it('shows the "How are you feeling?" title when open', () => {
        render(<MoodPicker open={true} onClose={onClose} />);
        expect(screen.getByText('How are you feeling?')).toBeDefined();
    });

    describe('auto-dismiss timer', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('calls onClose with null after 20 seconds', () => {
            render(<MoodPicker open={true} onClose={onClose} />);
            act(() => vi.advanceTimersByTime(20_000));
            expect(onClose).toHaveBeenCalledWith(null);
        });

        it('countdown decrements each second and never goes below 0', () => {
            render(<MoodPicker open={true} onClose={onClose} />);
            expect(screen.getByText(/Closes in 20s/)).toBeDefined();
            act(() => vi.advanceTimersByTime(3_000));
            expect(screen.getByText(/Closes in 17s/)).toBeDefined();
            act(() => vi.advanceTimersByTime(18_000));
            expect(screen.getByText(/Closes in 0s/)).toBeDefined();
        });
    });
});
