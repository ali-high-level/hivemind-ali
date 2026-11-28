import { reddit } from '@devvit/web/server';
import type { Spectrum } from '../../shared/api';

type Parsed = { title: string; left: string; right: string };

const splitParts = (text: string): string[] | null => {
  if (text.includes('|')) {
    const parts = text.split('|').map((s) => s.trim());
    return parts.length === 3 ? parts : null;
  }
  const m = /^(.+?):\s*(.+?)\s+vs\.?\s+(.+)$/i.exec(text);
  if (!m) return null;
  return [m[1] ?? '', m[2] ?? '', m[3] ?? ''].map((s) => s.trim());
};

export const parseProposal = (raw: string): Parsed | null => {
  const text = raw.trim();
  if (!text || text.includes('\n')) return null;
  const lower = text.toLowerCase();
  if (lower.includes('http') || lower.includes('www.') || lower.includes('u/') || lower.includes('r/')) {
    return null;
  }
  const parts = splitParts(text);
  if (!parts) return null;
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
  "**Write tomorrow's question!**",
  '',
  "Open the game and tap Suggest yours on the result screen. Or reply here with ONE line like this:",
  '',
  '`Question: Left side vs Right side`',
  '',
  'Example: `Morning showers: Ice cold vs Scalding hot`',
  '',
  'The top-voted valid reply becomes the next Hivemind, with your username credited.',
].join('\n');
