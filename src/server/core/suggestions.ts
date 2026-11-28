import { redis } from '@devvit/web/server';
import type { Spectrum, Suggestion, SuggestionsResponse } from '../../shared/api';

const MAX_PER_POST = 40;
const SHOWN = 5;
const BLOCKED = /https?:|www\.|(^|\s)[ur]\/\w/i;

const key = {
  items: (postId: string) => `hive:${postId}:sugg`,
  votes: (postId: string) => `hive:${postId}:sugg-votes`,
  voters: (postId: string) => `hive:${postId}:sugg-voters`,
  authors: (postId: string) => `hive:${postId}:sugg-authors`,
};

type Stored = {
  id: string;
  title: string;
  left: string;
  right: string;
  by: string;
  at: number;
};

const tidy = (s: string) => s.trim().replace(/\s+/g, ' ');

export const cleanSuggestion = (title: string, left: string, right: string) => {
  const t = tidy(title);
  const l = tidy(left);
  const r = tidy(right);
  if (BLOCKED.test(t) || BLOCKED.test(l) || BLOCKED.test(r)) return null;
  if (t.length < 4 || t.length > 60) return null;
  if (l.length < 2 || l.length > 28) return null;
  if (r.length < 2 || r.length > 28) return null;
  if (l.toLowerCase() === r.toLowerCase()) return null;
  return { title: t, left: l, right: r };
};

export const listSuggestions = async (
  postId: string,
  userId?: string
): Promise<SuggestionsResponse> => {
  const [items, votes, voters, myId] = await Promise.all([
    redis.hGetAll(key.items(postId)),
    redis.hGetAll(key.votes(postId)),
    userId ? redis.hGetAll(key.voters(postId)) : Promise.resolve({} as Record<string, string>),
    userId ? redis.hGet(key.authors(postId), userId) : Promise.resolve(undefined),
  ]);

  const rows: { at: number; sug: Suggestion }[] = [];
  for (const raw of Object.values(items)) {
    try {
      const s = JSON.parse(raw) as Stored;
      rows.push({
        at: s.at,
        sug: {
          id: s.id,
          title: s.title,
          left: s.left,
          right: s.right,
          by: s.by,
          votes: Number(votes[s.id] ?? 0),
          voted: userId ? voters[`${userId}:${s.id}`] === '1' : false,
          mine: myId === s.id,
        },
      });
    } catch {
      /* skip unreadable entries */
    }
  }
  rows.sort((a, b) => b.sug.votes - a.sug.votes || a.at - b.at);

  return {
    suggestions: rows.slice(0, SHOWN).map((r) => r.sug),
    canSuggest: userId ? !myId : false,
  };
};

export const submitSuggestion = async (
  postId: string,
  userId: string,
  username: string,
  input: { title: string; left: string; right: string }
): Promise<'ok' | 'already' | 'full'> => {
  if (await redis.hGet(key.authors(postId), userId)) return 'already';
  const existing = await redis.hGetAll(key.items(postId));
  if (Object.keys(existing).length >= MAX_PER_POST) return 'full';

  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const stored: Stored = { id, ...input, by: username, at: Date.now() };

  await redis.hSet(key.items(postId), { [id]: JSON.stringify(stored) });
  await redis.hSet(key.authors(postId), { [userId]: id });
  await redis.hSet(key.votes(postId), { [id]: '1' });
  await redis.hSet(key.voters(postId), { [`${userId}:${id}`]: '1' });
  return 'ok';
};

export const voteSuggestion = async (
  postId: string,
  userId: string,
  id: string
): Promise<'ok' | 'already' | 'missing'> => {
  if (!(await redis.hGet(key.items(postId), id))) return 'missing';
  const field = `${userId}:${id}`;
  if (await redis.hGet(key.voters(postId), field)) return 'already';
  await redis.hSet(key.voters(postId), { [field]: '1' });
  await redis.hIncrBy(key.votes(postId), id, 1);
  return 'ok';
};

export const topSuggestion = async (postId: string): Promise<Spectrum | null> => {
  const { suggestions } = await listSuggestions(postId);
  const top = suggestions[0];
  if (!top) return null;
  return { id: `sugg-${top.id}`, title: top.title, left: top.left, right: top.right, by: top.by };
};
