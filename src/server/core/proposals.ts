import { reddit } from '@devvit/web/server';
import type { Spectrum } from '../../shared/api';

export const parseProposal = (raw: string) => {
  const text = raw.trim();
  if (!text || text.includes('\n')) return null;
  const lower = text.toLowerCase();
  if (lower.includes('http') || lower.includes('www.') || lower.includes('u/') || lower.includes('r/')) {
    return null;
  }
  const parts = text.split('|').map((s) => s.trim());
  if (parts.length !== 3) return null;
  const [title, left, right] = parts;
  if (!title || !left || !right) return null;
  if (title.length < 4 || title.length > 60) return null;
  if (left.length < 2 || left.length > 28) return null;
  if (right.length < 2 || right.length > 28) return null;
  if (left.toLowerCase() === right.toLowerCase()) return null;
  return { title, left, right };
};

const asPostId = (id: string) =>
  (id.startsWith('t3_') ? id : 't3_' + id) as `t3_${string}`;

export const findProposal = async (previousPostId: string): Promise<Spectrum | null> => {
  const listing = reddit.getComments({
    postId: asPostId(previousPostId),
    sort: 'top',
    limit: 50,
    pageSize: 50,
  });
  const comments = await listing.all();
  const ranked = [...comments].sort((a, b) => b.score - a.score);
  for (const comment of ranked) {
    const parsed = parseProposal(comment.body);
    if (parsed) {
      return { id: `user-${comment.id}`, ...parsed, by: comment.authorName };
    }
  }
  return null;
};

export const HOWTO_COMMENT = [
  "**Write tomorrow's spectrum!**",
  '',
  'Reply to this post with ONE line in this exact format:',
  '',
  '`Title | Left end | Right end`',
  '',
  'Example: `Morning showers | Ice cold | Scalding hot`',
  '',
  'The top-voted valid reply becomes the next Hivemind, with your username credited.',
].join('\n');
