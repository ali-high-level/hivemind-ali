import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useHive } from './hooks/useHive';
import { Mark } from './components/Mark';

export const Splash = () => {
  const { state, error } = useHive();
  const played = state?.myGuess ? state : null;

  return (
    <div className="hv hv-splash">
      <header className="hv-head">
        <div className="hv-brand">
          <Mark />
          HIVEMIND
        </div>
        <span className="hv-date">Daily</span>
      </header>

      <div>
        <p className="hv-kicker">Today's spectrum</p>
        <h1 className="hv-q">{state ? state.spectrum.title : error ? 'Tap to play' : '…'}</h1>
        <div className="hv-preview" />
        {state && (
          <div className="hv-ends">
            <span>{state.spectrum.left}</span>
            <span>{state.spectrum.right}</span>
          </div>
        )}
        {played && (
          <p className="hv-stats">
            Score <b>{played.score}</b> · Streak <b>{played.streak.current}</b> ·{' '}
            {played.total} {played.total === 1 ? 'player' : 'players'}
          </p>
        )}
      </div>

      <button className="hv-btn" onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}>
        {played ? 'See the hive' : 'Place your take'}
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
