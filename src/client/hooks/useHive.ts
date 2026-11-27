import { useCallback, useEffect, useState } from 'react';
import type { GuessRequest, StateResponse } from '../../shared/api';

const readError = async (res: Response) => {
  try {
    const j = (await res.json()) as { message?: string };
    return j.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
};

export const useHive = () => {
  const [state, setState] = useState<StateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error(await readError(res));
      setState((await res.json()) as StateResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async (guess: GuessRequest) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guess),
      });
      if (!res.ok) throw new Error(await readError(res));
      setState((await res.json()) as StateResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { state, error, submitting, submit };
};
