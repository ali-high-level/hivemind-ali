import { reddit } from '@devvit/web/server';
import { bindSpectrum, postIdByNumber, reserveSpectrum } from './hive';
import { HOWTO_COMMENT, findProposal } from './proposals';

export const createPost = async () => {
  const { index, number, spectrum: fallback } = await reserveSpectrum();

  let proposal = null;
  if (number > 1) {
    try {
      const prevId = await postIdByNumber(number - 1);
      if (prevId) proposal = await findProposal(prevId);
    } catch (error) {
      console.error(`Could not read proposals: ${error}`);
    }
  }

  const spectrum = proposal ?? fallback;
  const post = await reddit.submitCustomPost({
    title: `Hivemind #${number}: ${spectrum.title}`,
  });
  await bindSpectrum(post.id, index, number, proposal ?? undefined);

  try {
    await reddit.submitComment({ id: post.id, text: HOWTO_COMMENT });
  } catch (error) {
    console.error(`Could not post how-to comment: ${error}`);
  }

  return post;
};
