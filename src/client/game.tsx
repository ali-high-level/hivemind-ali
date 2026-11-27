import './index.css';

import { StrictMode, useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { useHive } from './hooks/useHive';
import { Mark } from './components/Mark';
import { SpectrumSlider } from './components/SpectrumSlider';
import { Result } from './components/Result';

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="hv">
    <header className="hv-head">
      <div className="hv-brand">
        <Mark />
        HIVEMIND
      </div>
      <span className="hv-date">
        {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    </header>
    <main className="hv-main">{children}</main>
  </div>
);

export const App = () => {
  const { state, error, submitting, submit } = useHive();
  const [step, setStep] = useState<'opinion' | 'predict'>('opinion');
  const [opinion, setOpinion] = useState(50);
  const [prediction, setPrediction] = useState(50);

  if (!state) {
    return (
      <Shell>
        <p className="hv-msg">{error ?? 'Gathering the hive…'}</p>
      </Shell>
    );
  }

  if (state.myGuess) {
    return (
      <Shell>
        <Result state={state} />
      </Shell>
    );
  }

  const { spectrum } = state;

  if (step === 'opinion') {
    return (
      <Shell>
        <div>
          <p className="hv-kicker">1 of 2 · Your take</p>
          <h1 className="hv-q">{spectrum.title}</h1>
        {spectrum.by && <p className="hv-by">Spectrum by u/{spectrum.by}</p>}
          <p className="hv-sub">Drag to where you stand. Next, you will predict the crowd.</p>
        </div>
        <SpectrumSlider
          value={opinion}
          onChange={setOpinion}
          left={spectrum.left}
          right={spectrum.right}
          label="Your opinion"
        />
        <div className="hv-actions">
          <button className="hv-btn" onClick={() => setStep('predict')}>
            Lock in my take
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div>
        <p className="hv-kicker">2 of 2 · Read the crowd</p>
        <h1 className="hv-q">{spectrum.title}</h1>
        {spectrum.by && <p className="hv-by">Spectrum by u/{spectrum.by}</p>}
        <p className="hv-sub">Now guess: where will everyone else land, on average?</p>
      </div>
      <SpectrumSlider
        value={prediction}
        onChange={setPrediction}
        left={spectrum.left}
        right={spectrum.right}
        label="Your guess for the crowd average"
        ghost={opinion}
      />
      {error && <p className="hv-err">{error}</p>}
      <div className="hv-actions">
        <button className="hv-btn ghost" onClick={() => setStep('opinion')} disabled={submitting}>
          Back
        </button>
        <button
          className="hv-btn"
          onClick={() => void submit({ opinion, prediction })}
          disabled={submitting}
        >
          {submitting ? 'Counting…' : 'Reveal the hive'}
        </button>
      </div>
    </Shell>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
