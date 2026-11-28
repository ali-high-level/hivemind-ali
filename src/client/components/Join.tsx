import { context, navigateTo } from '@devvit/web/client';

export const JoinButton = () => {
  const sub = context.subredditName ?? 'hivemind_ali_dev';
  return (
    <button
      className="hv-btn ghost hv-join"
      onClick={() => navigateTo(`https://www.reddit.com/r/${sub}`)}
    >
      Join r/{sub} for the daily hive
    </button>
  );
};

export const SuggestButton = () => {
  const id = context.postId?.replace(/^t3_/, '');
  if (!id) return null;
  return (
    <button
      className="hv-btn ghost hv-join"
      onClick={() => navigateTo(`https://www.reddit.com/comments/${id}`)}
    >
      Suggest tomorrow’s spectrum
    </button>
  );
};
