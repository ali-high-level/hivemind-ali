import { reddit } from '@devvit/web/server';
import type { Spectrum } from '../../shared/api';
import { bindSpectrum, postIdByNumber, reserveSpectrum } from './hive';
import { HOWTO_COMMENT, findProposal } from './proposals';
import { topSuggestion } from './suggestions';

export const createPost = async () => {
  const { index, number, spectrum: fallback } = await reserveSpectrum();

  let chosen: Spectrum | null = null;
  if (number > 1) {
    try {
      const prevId = await postIdByNumber(number - 1);
      if (prevId) {
        chosen = await topSuggestion(prevId);
        if (!chosen) chosen = await findProposal(prevId);
      }
    } catch (error) {
      console.error(`Could not read suggestions: ${error}`);
    }
  }

  const spectrum = chosen ?? fallback;
  const post = await reddit.submitCustomPost({
    title: `Hivemind #${number}: ${spectrum.title}`,
  });
  await bindSpectrum(post.id, index, number, chosen ?? undefined);

  try {
    await reddit.submitComment({ id: post.id, text: HOWTO_COMMENT });
  } catch (error) {
    console.error(`Could not post how-to comment: ${error}`);
  }

  return post;
};
