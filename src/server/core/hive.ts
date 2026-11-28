import { redis } from '@devvit/web/server';
import type { MyGuess, Spectrum, StateResponse, Yesterday } from '../../shared/api';
import { hashIndex, spectrumAt } from './spectra';

export const BUCKETS = 20;

const key = {
  spectrum: (postId: string) => `hive:${postId}:spectrum`,
  number: (postId: string) => `hive:${postId}:number`,
  guesses: (postId: string) => `hive:${postId}:guesses`,
  buckets: (postId: string) => `hive:${postId}:buckets`,
  stats: (postId: string) => `hive:${postId}:stats`,
  streak: (userId: string) => `hive:user:${userId}:streak`,
  byNumber: 'hive:byNumber',
  history: (userId: string) => `hive:user:${userId}:history`,
  custom: (postId: string) => `hive:${postId}:custom`,
};

export const reserveSpectrum = async () => {
  const number = await redis.incrBy('hive:counter', 1);
  const index = number - 1;
  return { index, number, spectrum: spectrumAt(index) };
};

export const postIdByNumber = async (number: number) =>
  redis.hGet(key.byNumber, String(number));

export const bindSpectrum = async (
  postId: string,
  index: number,
  number: number,
  custom?: Spectrum
) => {
  if (custom) await redis.set(key.custom(postId), JSON.stringify(custom));
  await redis.set(key.spectrum(postId), String(index));
  await redis.set(key.number(postId), String(number));
  await redis.hSet(key.byNumber, { [String(number)]: postId });
};

const spectrumFor = async (postId: string): Promise<Spectrum> => {
  const customRaw = await redis.get(key.custom(postId));
  if (customRaw) {
    try {
      return JSON.parse(customRaw) as Spectrum;
    } catch {
      /* fall through to the built-in spectrum */
    }
  }
  const raw = await redis.get(key.spectrum(postId));
  const parsed = Number(raw ?? NaN);
  return spectrumAt(Number.isFinite(parsed) ? parsed : hashIndex(postId));
};

const scoreFor = (prediction: number, mean: number) =>
  Math.max(0, Math.round(100 - Math.abs(prediction - mean) * 2));

const dayString = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

const bumpStreak = async (userId: string) => {
  const s = await redis.hGetAll(key.streak(userId));
  const today = dayString();
  if (s.last === today) return;
  const previous = Number(s.count ?? 0);
  const current = s.last === dayString(-1) ? previous + 1 : 1;
  const best = Math.max(Number(s.best ?? 0), current);
  await redis.hSet(key.streak(userId), {
    count: String(current),
    best: String(best),
    last: today,
  });
};

const historyFor = async (userId: string) => {
  const raw = await redis.hGetAll(key.history(userId));
  const items: { postId: string; n: number; p: number }[] = [];
  for (const [postId, value] of Object.entries(raw)) {
    try {
      const j = JSON.parse(value) as { n: number; p: number };
      items.push({ postId, n: j.n, p: j.p });
    } catch {
      /* skip unreadable entries */
    }
  }
  items.sort((a, b) => b.n - a.n);
  const out = await Promise.all(
    items.slice(0, 7).map(async (it) => {
      const stats = await redis.hGetAll(key.stats(it.postId));
      const count = Number(stats.n ?? 0);
      const score = count > 0 ? scoreFor(it.p, Number(stats.sum ?? 0) / count) : null;
      return { n: it.n, score };
    })
  );
  return out.reverse();
};

const yesterdayFor = async (postId: string): Promise<Yesterday | null> => {
  const raw = await redis.get(key.number(postId));
  const num = Number(raw ?? NaN);
  if (!Number.isFinite(num) || num < 2) return null;

  const prevId = await redis.hGet(key.byNumber, String(num - 1));
  if (!prevId) return null;

  const [spectrum, stats] = await Promise.all([
    spectrumFor(prevId),
    redis.hGetAll(key.stats(prevId)),
  ]);
  const n = Number(stats.n ?? 0);
  if (n === 0) return null;

  return {
    title: spectrum.title,
    left: spectrum.left,
    right: spectrum.right,
    mean: Number(stats.sum ?? 0) / n,
    total: n,
  };
};

export const loadState = async (
  postId: string,
  userId: string | undefined,
  username: string
): Promise<Omit<StateResponse, 'suggestions' | 'canSuggest'>> => {
  const [spectrum, bucketHash, stats, rawGuess, streakHash, yesterday] = await Promise.all([
    spectrumFor(postId),
    redis.hGetAll(key.buckets(postId)),
    redis.hGetAll(key.stats(postId)),
    userId ? redis.hGet(key.guesses(postId), userId) : Promise.resolve(undefined),
    userId ? redis.hGetAll(key.streak(userId)) : Promise.resolve({} as Record<string, string>),
    yesterdayFor(postId),
  ]);

  const history = userId ? await historyFor(userId) : [];

  const buckets = Array.from({ length: BUCKETS }, (_, i) => Number(bucketHash[String(i)] ?? 0));
  const total = Number(stats.n ?? 0);
  const sum = Number(stats.sum ?? 0);
  const mean = total > 0 ? sum / total : null;

  let myGuess: MyGuess | null = null;
  if (rawGuess) {
    try {
      const p = JSON.parse(rawGuess) as { o: number; p: number };
      myGuess = { opinion: p.o, prediction: p.p };
    } catch {
      myGuess = null;
    }
  }

  return {
    type: 'state',
    postId,
    username,
    spectrum,
    buckets,
    total,
    mean,
    myGuess,
    score: myGuess && mean !== null ? scoreFor(myGuess.prediction, mean) : null,
    streak: {
      current: Number(streakHash.count ?? 0),
      best: Number(streakHash.best ?? 0),
    },
    yesterday,
    history,
  };
};

export const submitGuess = async (
  postId: string,
  userId: string,
  opinion: number,
  prediction: number
) => {
  const existing = await redis.hGet(key.guesses(postId), userId);
  if (existing) return;

  await redis.hSet(key.guesses(postId), {
    [userId]: JSON.stringify({ o: opinion, p: prediction }),
  });
  const bucket = Math.min(BUCKETS - 1, Math.floor(opinion / (100 / BUCKETS)));
  await Promise.all([
    redis.hIncrBy(key.buckets(postId), String(bucket), 1),
    redis.hIncrBy(key.stats(postId), 'n', 1),
    redis.hIncrBy(key.stats(postId), 'sum', opinion),
  ]);
  await bumpStreak(userId);
  const numberRaw = await redis.get(key.number(postId));
  const postNumber = Number(numberRaw ?? NaN);
  if (Number.isFinite(postNumber)) {
    await redis.hSet(key.history(userId), {
      [postId]: JSON.stringify({ n: postNumber, p: prediction }),
    });
  }
};
