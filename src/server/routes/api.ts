import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type {
  ErrorResponse,
  GuessRequest,
  StateResponse,
  SuggestionsResponse,
} from '../../shared/api';
import { loadState, submitGuess } from '../core/hive';
import {
  cleanSuggestion,
  listSuggestions,
  submitSuggestion,
  voteSuggestion,
} from '../core/suggestions';

export const api = new Hono();

const fail = (message: string) => ({ status: 'error', message }) satisfies ErrorResponse;

const clampInt = (v: unknown): number | null => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.min(100, Math.max(0, Math.round(v)));
};

const buildState = async (postId: string, userId: string | undefined): Promise<StateResponse> => {
  const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
  const [base, sugg] = await Promise.all([
    loadState(postId, userId, username),
    listSuggestions(postId, userId),
  ]);
  return { ...base, suggestions: sugg.suggestions, canSuggest: sugg.canSuggest };
};

api.get('/state', async (c) => {
  const { postId, userId } = context;
  if (!postId) return c.json(fail('postId missing from context'), 400);
  try {
    return c.json<StateResponse>(await buildState(postId, userId));
  } catch (error) {
    console.error(`state error for ${postId}:`, error);
    return c.json(fail('Could not load the hive'), 500);
  }
});

api.post('/guess', async (c) => {
  const { postId, userId } = context;
  if (!postId) return c.json(fail('postId missing from context'), 400);
  if (!userId) return c.json(fail('Log in to play'), 401);

  let body: Partial<GuessRequest>;
  try {
    body = await c.req.json<Partial<GuessRequest>>();
  } catch {
    return c.json(fail('Invalid request'), 400);
  }
  const opinion = clampInt(body.opinion);
  const prediction = clampInt(body.prediction);
  if (opinion === null || prediction === null) {
    return c.json(fail('Both values must be numbers 0-100'), 400);
  }

  try {
    await submitGuess(postId, userId, opinion, prediction);
    return c.json<StateResponse>(await buildState(postId, userId));
  } catch (error) {
    console.error(`guess error for ${postId}:`, error);
    return c.json(fail('Could not save your guess'), 500);
  }
});

api.post('/suggest', async (c) => {
  const { postId, userId } = context;
  if (!postId) return c.json(fail('postId missing from context'), 400);
  if (!userId) return c.json(fail('Log in to suggest a question'), 401);

  let body: Partial<{ title: string; left: string; right: string }>;
  try {
    body = await c.req.json<Partial<{ title: string; left: string; right: string }>>();
  } catch {
    return c.json(fail('Invalid request'), 400);
  }
  const clean = cleanSuggestion(
    typeof body.title === 'string' ? body.title : '',
    typeof body.left === 'string' ? body.left : '',
    typeof body.right === 'string' ? body.right : ''
  );
  if (!clean) {
    return c.json(
      fail('Question needs 4-60 letters, each side 2-28 letters, different sides, and no links.'),
      400
    );
  }

  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    const result = await submitSuggestion(postId, userId, username, clean);
    if (result === 'already') return c.json(fail('You already suggested one for tomorrow.'), 409);
    if (result === 'full') return c.json(fail('Tomorrow has plenty of suggestions. Vote instead!'), 409);
    return c.json<SuggestionsResponse>(await listSuggestions(postId, userId));
  } catch (error) {
    console.error(`suggest error for ${postId}:`, error);
    return c.json(fail('Could not save your suggestion'), 500);
  }
});

api.post('/vote', async (c) => {
  const { postId, userId } = context;
  if (!postId) return c.json(fail('postId missing from context'), 400);
  if (!userId) return c.json(fail('Log in to vote'), 401);

  let body: Partial<{ id: string }>;
  try {
    body = await c.req.json<Partial<{ id: string }>>();
  } catch {
    return c.json(fail('Invalid request'), 400);
  }
  if (typeof body.id !== 'string' || body.id.length === 0 || body.id.length > 40) {
    return c.json(fail('Invalid suggestion'), 400);
  }

  try {
    const result = await voteSuggestion(postId, userId, body.id);
    if (result === 'missing') return c.json(fail('That suggestion no longer exists'), 404);
    if (result === 'already') return c.json(fail('You already voted for this one'), 409);
    return c.json<SuggestionsResponse>(await listSuggestions(postId, userId));
  } catch (error) {
    console.error(`vote error for ${postId}:`, error);
    return c.json(fail('Could not save your vote'), 500);
  }
});
