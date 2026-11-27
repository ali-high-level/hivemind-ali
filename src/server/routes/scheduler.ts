import { Hono } from 'hono';
import { createPost } from '../core/post';

export const scheduler = new Hono();

scheduler.post('/daily-post', async (c) => {
  try {
    const post = await createPost();
    console.log(`Daily post created: ${post.id}`);
    return c.json({ status: 'ok' }, 200);
  } catch (error) {
    console.error(`Daily post failed: ${error}`);
    return c.json({ status: 'error', message: String(error) }, 500);
  }
});
