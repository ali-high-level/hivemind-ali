import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { StateResponse } from '../../shared/api';
import { JoinButton } from './Join';
import { Tomorrow } from './Tomorrow';

const useCountUp = (target: number, ms = 900) => {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduce]);

  return reduce ? target : value;
};

const tierFor = (score: number) => {
  if (score >= 90) return 'Mind reader';
  if (score >= 75) return 'In sync';
  if (score >= 55) return 'Close call';
  if (score >= 35) return 'Off the mark';
  return 'Different wavelength';
};

const leaning = (mean: number, left: string, right: string) => {
  if (mean >= 58) return `leaning “${right}”`;
  if (mean <= 42) return `leaning “${left}”`;
  return 'split right down the middle';
};

export const Result = ({ state }: { state: StateResponse }) => {
  const { spectrum, buckets, total, mean, myGuess, score, streak, yesterday, history } = state;
  const shownScore = useCountUp(score ?? 0);
  if (!myGuess || mean === null) return null;

  const max = Math.max(1, ...buckets);
  const myBucket = Math.min(buckets.length - 1, Math.floor(myGuess.opinion / 5));
  const diff = Math.round(myGuess.opinion - mean);

  let insight = `You sit ${Math.abs(diff)} points toward “${diff > 0 ? spectrum.right : spectrum.left}” compared with the hive.`;
  if (total <= 1) insight = 'You are the first in the hive today. Come back later and watch the crowd form.';
  else if (Math.abs(diff) < 5) insight = 'You are right in the middle of the hive.';

  let rank: string | null = null;
  if (total >= 3) {
    const below = buckets.slice(0, myBucket).reduce((a, b) => a + b, 0);
    const above = buckets.slice(myBucket + 1).reduce((a, b) => a + b, 0);
    rank =
      myGuess.opinion >= 50
        ? `You lean further toward “${spectrum.right}” than ${Math.round((below / total) * 100)}% of the hive.`
        : `You lean further toward “${spectrum.left}” than ${Math.round((above / total) * 100)}% of the hive.`;
  }

  return (
    <>
      <div>
        <p className="hv-kicker">
          The hive speaks · {total} {total === 1 ? 'player' : 'players'}
        </p>
        <h1 className="hv-q">{spectrum.title}</h1>
        {spectrum.by && <p className="hv-by">Spectrum by u/{spectrum.by}</p>}
      </div>

      <div className="hv-score">
        <b>{shownScore}</b>
        <span>
          <i className="hv-tier">{tierFor(score ?? 0)}</i>
          crowd-reading score
          <em>Live: moves as more players join</em>
        </span>
      </div>

      <div>
        <div className="hv-chart">
          {buckets.map((n, i) => (
            <div
              key={i}
              className={`hv-bar${i === myBucket ? ' mine' : ''}`}
              style={{ '--h': `${Math.max((n / max) * 100, n > 0 ? 8 : 2)}%`, '--i': i } as CSSProperties}
            />
          ))}
          <span className="hv-line crowd" style={{ left: `${mean}%` }} />
          <span className="hv-line you" style={{ left: `${myGuess.opinion}%` }} />
          <span className="hv-line guess" style={{ left: `${myGuess.prediction}%` }} />
        </div>
        <div className="hv-ends">
          <span>{spectrum.left}</span>
          <span>{spectrum.right}</span>
        </div>
        <div className="hv-legend">
          <span><i className="crowd" />Crowd {Math.round(mean)}</span>
          <span><i className="you" />You {myGuess.opinion}</span>
          <span><i className="guess" />Your guess {myGuess.prediction}</span>
        </div>
      </div>

      <p className="hv-insight">{insight}</p>
      {rank && <p className="hv-rank">{rank}</p>}

      {history.length > 1 && (
        <div className="hv-hist">
          <p className="hv-kicker">Your last {history.length} games</p>
          <div className="hv-hist-bars">
            {history.map((h) => (
              <div className="hv-hist-col" key={h.n}>
                <div
                  className="hv-hist-bar"
                  style={{ '--h': `${Math.max(h.score ?? 0, 4)}%` } as CSSProperties}
                />
                <span>{h.score ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {yesterday && (
        <div className="hv-yday">
          <p className="hv-kicker">Yesterday's hive</p>
          <p className="hv-yq">{yesterday.title}</p>
          <p className="hv-ya">
            {yesterday.total} {yesterday.total === 1 ? 'player' : 'players'} landed at{' '}
            <b>{Math.round(yesterday.mean)}</b>, {leaning(yesterday.mean, yesterday.left, yesterday.right)}.
          </p>
          <div className="hv-ytrack">
            <span className="hv-ydot" style={{ left: `${yesterday.mean}%` }} />
          </div>
        </div>
      )}

      <Tomorrow state={state} />

      <JoinButton />

      <div className="hv-chips">
        <span className="hv-chip">
          <b>{streak.current}</b> day streak
        </span>
        <span className="hv-chip">Best {streak.best}</span>
        
      </div>
    </>
  );
};
