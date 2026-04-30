import {
    useCheatCodes,
    useCreateCheatCode,
    useDeleteCheatCode,
    useUpdateCheatCode,
} from '@/api/useCheatCodes';
import { useState } from 'react';

const MAX_CODES = 3;
const MAX_LENGTH = 200;

export function CheatCodeForm() {
    const { data: codes = [], isPending, isError } = useCheatCodes();
    const createCode = useCreateCheatCode();
    const updateCode = useUpdateCheatCode();
    const deleteCode = useDeleteCheatCode();

    const [newText, setNewText] = useState('');
    const [newError, setNewError] = useState('');
    const [editTexts, setEditTexts] = useState<Record<string, string>>({});
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    const atMax = codes.length >= MAX_CODES;

    function handleAdd() {
        if (!newText.trim()) {
            setNewError('Cheat Code cannot be blank');
            return;
        }
        setNewError('');
        createCode.mutate(newText.trim(), {
            onSuccess: () => setNewText(''),
            onError: () => setNewError('Could not save. Please try again.'),
        });
    }

    function handleSave(id: string) {
        const text = editTexts[id] ?? codes.find((c) => c.id === id)?.text ?? '';
        if (!text.trim()) {
            setEditErrors((prev) => ({ ...prev, [id]: 'Cheat Code cannot be blank' }));
            return;
        }
        setEditErrors((prev) => ({ ...prev, [id]: '' }));
        updateCode.mutate(
            { id, text: text.trim() },
            {
                onSuccess: () =>
                    setEditTexts((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                    }),
                onError: () =>
                    setEditErrors((prev) => ({
                        ...prev,
                        [id]: 'Could not save. Please try again.',
                    })),
            }
        );
    }

    function handleDelete(id: string) {
        setDeletingIds((prev) => new Set(prev).add(id));
        deleteCode.mutate(id, {
            onSuccess: () =>
                setEditTexts((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                }),
            onError: () => {
                setDeletingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
                setEditErrors((prev) => ({ ...prev, [id]: 'Could not delete. Please try again.' }));
            },
        });
    }

    if (isPending) return <div>Loading...</div>;

    if (isError)
        return <div role="alert">Could not load Cheat Codes. Please refresh the page.</div>;

    return (
        <section aria-label="Cheat Codes">
            <h2>Cheat Codes</h2>
            <p>Short coaching reminders — up to 3, always visible on your dashboard.</p>

            <ul>
                {codes.map((code) => {
                    const editText = editTexts[code.id] ?? code.text;
                    const editError = editErrors[code.id] ?? '';
                    const isDeleting = deletingIds.has(code.id);
                    return (
                        <li key={code.id}>
                            <input
                                type="text"
                                value={editText}
                                maxLength={MAX_LENGTH}
                                style={{ fontSize: '16px' }}
                                aria-label={`Edit Cheat Code: ${editText}`}
                                onChange={(e) =>
                                    setEditTexts((prev) => ({ ...prev, [code.id]: e.target.value }))
                                }
                            />
                            {editError && <span role="alert">{editError}</span>}
                            <button
                                type="button"
                                onClick={() => handleSave(code.id)}
                                disabled={updateCode.isPending}
                                style={{ minHeight: '44px', minWidth: '44px' }}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(code.id)}
                                disabled={isDeleting}
                                style={{ minHeight: '44px', minWidth: '44px' }}
                                aria-label={`Delete Cheat Code: ${code.text}`}
                            >
                                Delete
                            </button>
                        </li>
                    );
                })}
            </ul>

            {atMax ? (
                <p role="status">Maximum 3 Cheat Codes</p>
            ) : (
                <div>
                    <input
                        type="text"
                        value={newText}
                        maxLength={MAX_LENGTH}
                        placeholder="Enter a Cheat Code..."
                        style={{ fontSize: '16px' }}
                        aria-label="New Cheat Code"
                        onChange={(e) => setNewText(e.target.value)}
                    />
                    {newError && <span role="alert">{newError}</span>}
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={createCode.isPending}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                        Add
                    </button>
                </div>
            )}
        </section>
    );
}
