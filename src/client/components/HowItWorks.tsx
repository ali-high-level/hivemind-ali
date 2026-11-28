import { Mark } from './Mark';

const steps = [
  { n: '1', title: 'Share your take', body: 'Slide to where you stand on today’s question.' },
  { n: '2', title: 'Read the crowd', body: 'Guess where everyone else will land, on average.' },
  {
    n: '3',
    title: 'See the hive',
    body: 'The closer your guess, the higher your score. Come back daily to build a streak.',
  },
];

export const HowItWorks = ({ onDone }: { onDone: () => void }) => (
  <div className="hv-how">
    <div>
      <p className="hv-kicker">Welcome to the hive</p>
      <h1 className="hv-q">How Hivemind works</h1>
    </div>
    <ol className="hv-steps">
      {steps.map((s) => (
        <li className="hv-step" key={s.n}>
          <span className="hv-step-n">{s.n}</span>
          <div>
            <b>{s.title}</b>
            <span>{s.body}</span>
          </div>
        </li>
      ))}
    </ol>
    <div className="hv-actions">
      <button className="hv-btn" onClick={onDone}>
        <span className="hv-how-mark">
          <Mark />
        </span>
        Got it, let’s play
      </button>
    </div>
  </div>
);
