import type { CSSProperties } from 'react';
import type { StateResponse } from '../../shared/api';

const leaning = (mean: number, left: string, right: string) => {
  if (mean >= 58) return `leaning “${right}”`;
  if (mean <= 42) return `leaning “${left}”`;
  return 'split right down the middle';
};

export const Result = ({ state }: { state: StateResponse }) => {
  const { spectrum, buckets, total, mean, myGuess, score, streak, yesterday } = state;
  if (!myGuess || mean === null) return null;

  const max = Math.max(1, ...buckets);
  const myBucket = Math.min(buckets.length - 1, Math.floor(myGuess.opinion / 5));
  const diff = Math.round(myGuess.opinion - mean);

  let insight = `You sit ${Math.abs(diff)} points toward “${diff > 0 ? spectrum.right : spectrum.left}” compared with the hive.`;
  if (total <= 1) insight = 'You are the first in the hive today. Come back later and watch the crowd form.';
  else if (Math.abs(diff) < 5) insight = 'You are right in the middle of the hive.';

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
        <b>{score}</b>
        <span>
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

      <div className="hv-chips">
        <span className="hv-chip">
          <b>{streak.current}</b> day streak
        </span>
        <span className="hv-chip">Best {streak.best}</span>
        <span className="hv-chip muted">Tomorrow is yours: reply on this post with Title | Left | Right</span>
      </div>
    </>
  );
};
