import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type { ErrorResponse, GuessRequest, StateResponse } from '../../shared/api';
import { loadState, submitGuess } from '../core/hive';

export const api = new Hono();

const fail = (message: string) => ({ status: 'error', message }) satisfies ErrorResponse;

const clampInt = (v: unknown): number | null => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.min(100, Math.max(0, Math.round(v)));
};

api.get('/state', async (c) => {
  const { postId, userId } = context;
  if (!postId) return c.json(fail('postId missing from context'), 400);
  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    return c.json<StateResponse>(await loadState(postId, userId, username));
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
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    return c.json<StateResponse>(await loadState(postId, userId, username));
  } catch (error) {
    console.error(`guess error for ${postId}:`, error);
    return c.json(fail('Could not save your guess'), 500);
  }
});

api.post('/subscribe', async (c) => {
  try {
    await reddit.subscribeToCurrentSubreddit();
    return c.json({ status: 'ok' });
  } catch (error) {
    console.error(`subscribe error: ${error}`);
    return c.json(fail('Could not join the community'), 500);
  }
});
