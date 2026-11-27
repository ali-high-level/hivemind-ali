import { reddit } from '@devvit/web/server';
import { bindSpectrum, reserveSpectrum } from './hive';

export const createPost = async () => {
  const { index, number, spectrum } = await reserveSpectrum();
  const post = await reddit.submitCustomPost({
    title: `Hivemind #${number}: ${spectrum.title}`,
  });
  await bindSpectrum(post.id, index);
  return post;
};
