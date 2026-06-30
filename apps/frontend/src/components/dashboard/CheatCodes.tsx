import { useCheatCodes } from '@/api/useCheatCodes';

export function CheatCodes() {
    const { data: cheatCodes, isLoading } = useCheatCodes();

    return (
        <section
            aria-label="Cheat Codes — active coaching strategies"
            className="pb-3 border-b-2 border-brand-gold"
        >
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-brand-gold">
                ⚡ CHEAT CODES
            </p>
            <ul className="space-y-1 font-mono text-sm">
                {isLoading ? (
                    <li className="h-4 w-48 animate-pulse rounded bg-muted" aria-hidden="true" />
                ) : !cheatCodes || cheatCodes.length === 0 ? (
                    <li className="text-muted-foreground">
                        No Cheat Codes yet — add them in Settings.
                    </li>
                ) : (
                    cheatCodes.map((code) => <li key={code.id}>{code.text}</li>)
                )}
            </ul>
        </section>
    );
}
