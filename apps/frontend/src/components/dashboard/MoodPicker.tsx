import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MOOD_OPTIONS, type MoodValue } from '@/lib/zoneConstants';

interface MoodPickerProps {
    open: boolean;
    onClose: (mood: MoodValue | null) => void;
}

const TIMEOUT_SECONDS = 20;

export function MoodPicker({ open, onClose }: MoodPickerProps) {
    const [countdown, setCountdown] = useState(TIMEOUT_SECONDS);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => onClose(null), TIMEOUT_SECONDS * 1000);
        const tick = setInterval(() => setCountdown((n) => Math.max(0, n - 1)), 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(tick);
            setCountdown(TIMEOUT_SECONDS);
        };
    }, [open, onClose]);

    return (
        <Sheet
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose(null);
            }}
        >
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
                <SheetHeader className="mb-4">
                    <SheetTitle className="font-mono text-center text-brand-gold">
                        How are you feeling?
                    </SheetTitle>
                    <p className="text-center text-xs text-muted-foreground">
                        Closes in {countdown}s — or just tap one
                    </p>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-3">
                    {MOOD_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onClose(option.value)}
                            aria-label={`Mood: ${option.label}`}
                            className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-input bg-transparent text-sm font-medium hover:border-brand-gold hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <span aria-hidden="true">{option.emoji}</span>
                            {option.label}
                        </button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}
