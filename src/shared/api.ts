export type Spectrum = {
  id: string;
  title: string;
  left: string;
  right: string;
  by?: string;
};

export type MyGuess = {
  opinion: number;
  prediction: number;
};

export type Yesterday = {
  title: string;
  left: string;
  right: string;
  mean: number;
  total: number;
};

export type Suggestion = {
  id: string;
  title: string;
  left: string;
  right: string;
  by: string;
  votes: number;
  voted: boolean;
  mine: boolean;
};

export type StateResponse = {
  type: 'state';
  postId: string;
  username: string;
  spectrum: Spectrum;
  buckets: number[];
  total: number;
  mean: number | null;
  myGuess: MyGuess | null;
  score: number | null;
  streak: { current: number; best: number };
  yesterday: Yesterday | null;
  history: { n: number; score: number | null }[];
  suggestions: Suggestion[];
  canSuggest: boolean;
};

export type GuessRequest = {
  opinion: number;
  prediction: number;
};

export type SuggestionsResponse = {
  suggestions: Suggestion[];
  canSuggest: boolean;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};
