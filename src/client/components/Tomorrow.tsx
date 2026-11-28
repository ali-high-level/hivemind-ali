import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { StateResponse, Suggestion, SuggestionsResponse } from '../../shared/api';

const SPLIT = /\s+(?:or|vs\.?|v\/s|ya)\s+/i;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const toSides = (text: string) => {
  const parts = text
    .trim()
    .split(SPLIT)
    .map((p) => p.trim().replace(/[?!.]+$/, ''));
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (!a || !b) return null;
  return { title: `${cap(a)} or ${b}?`, left: cap(a), right: cap(b) };
};

export const Tomorrow = ({ state }: { state: StateResponse }) => {
  const [items, setItems] = useState<Suggestion[]>(state.suggestions);
  const [canSuggest, setCanSuggest] = useState(state.canSuggest);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (path: string, body: object): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let message = 'Something went wrong';
        try {
          const j = (await res.json()) as { message?: string };
          message = j.message ?? message;
        } catch {
          /* keep the default message */
        }
        setError(message);
        return false;
      }
      const data = (await res.json()) as SuggestionsResponse;
      setItems(data.suggestions);
      setCanSuggest(data.canSuggest);
      return true;
    } catch {
      setError('Network problem, please try again');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sides = toSides(choice);
    if (!sides) {
      setError('Write exactly two choices with "or" between them, like: Tea or coffee');
      return;
    }
    void send('/api/suggest', sides).then((ok) => {
      if (ok) {
        setOpen(false);
        setChoice('');
      }
    });
  };

  return (
    <div className="hv-tom">
      <p className="hv-kicker">Tomorrow’s question</p>
      <p className="hv-tom-sub">Vote for the next spectrum, or suggest your own.</p>

      {items.length === 0 && !open && (
        <p className="hv-tom-empty">No suggestions yet. Be the first!</p>
      )}

      <ul className="hv-tom-list">
        {items.map((s) => (
          <li className="hv-tom-item" key={s.id}>
            <div className="hv-tom-text">
              <b>{s.title}</b>
              <span>
                {s.left} ↔ {s.right} · by {s.by}
              </span>
            </div>
            <button
              className={`hv-vote${s.voted ? ' on' : ''}`}
              disabled={busy || s.voted}
              onClick={() => void send('/api/vote', { id: s.id })}
              aria-label={`Vote for ${s.title}`}
            >
              ▲ {s.votes}
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <form className="hv-tom-form" onSubmit={onSubmit}>
          <label>
            Two choices, with “or” between them
            <input
              ref={inputRef}
              value={choice}
              maxLength={60}
              placeholder="e.g. Tea or coffee"
              onChange={(e) => setChoice(e.target.value)}
            />
          </label>
          <div className="hv-actions">
            <button type="button" className="hv-btn ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="hv-btn" disabled={busy}>
              {busy ? 'Sending…' : 'Send suggestion'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="hv-err">{error}</p>}

      {!open && canSuggest && (
        <button className="hv-btn ghost hv-join" onClick={() => setOpen(true)}>
          Suggest yours
        </button>
      )}
      {!open && !canSuggest && items.some((s) => s.mine) && (
        <p className="hv-tom-empty">Your suggestion is in. Ask friends to vote for it!</p>
      )}
    </div>
  );
};
