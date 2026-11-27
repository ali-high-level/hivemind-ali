import { useState } from 'react';

export const JoinButton = () => {
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const join = async () => {
    setStatus('busy');
    try {
      const res = await fetch('/api/subscribe', { method: 'POST' });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const label =
    status === 'done'
      ? 'Joined'
      : status === 'error'
        ? 'Could not join, try again'
        : 'Join this community for the daily hive';

  return (
    <button
      className="hv-btn ghost hv-join"
      onClick={() => void join()}
      disabled={status === 'busy' || status === 'done'}
    >
      {label}
    </button>
  );
};
