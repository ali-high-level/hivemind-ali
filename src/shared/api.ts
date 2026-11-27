export type Spectrum = {
  id: string;
  title: string;
  left: string;
  right: string;
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
};

export type GuessRequest = {
  opinion: number;
  prediction: number;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};
