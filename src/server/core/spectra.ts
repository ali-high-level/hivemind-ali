import type { Spectrum } from '../../shared/api';

const FIRST: Spectrum = {
  id: 'pineapple-pizza',
  title: 'Pineapple on pizza',
  left: 'Crime against food',
  right: 'Culinary genius',
};

export const SPECTRA: Spectrum[] = [
  FIRST,
  { id: 'hot-dog', title: 'Is a hot dog a sandwich?', left: 'Absolutely not', right: 'Obviously yes' },
  { id: 'chronotype', title: 'Your natural body clock', left: 'Dawn patrol', right: 'Full night owl' },
  { id: 'spoilers', title: 'Movie spoilers', left: 'Ruin everything', right: 'Do not matter at all' },
  { id: 'cilantro', title: 'Cilantro', left: 'Tastes like soap', right: 'Tastes like heaven' },
  { id: 'thermostat', title: 'Ideal room temperature', left: 'Arctic', right: 'Sauna' },
  { id: 'voice-notes', title: 'Voice notes', left: 'Send me text', right: 'Voice note forever' },
  { id: 'weekend', title: 'The perfect weekend', left: 'Stay in', right: 'Out all day' },
  { id: 'pickles', title: 'Pickles on a burger', left: 'Remove them', right: 'Extra pickles' },
  { id: 'spicy', title: 'Spicy food', left: 'Mild only', right: 'Make it hurt' },
  { id: 'breakfast', title: 'Breakfast team', left: 'Pancakes', right: 'Waffles' },
  { id: 'tabs-spaces', title: 'Indentation', left: 'Tabs', right: 'Spaces' },
  { id: 'planning', title: 'Planning a trip', left: 'Minute-by-minute', right: 'Wing it' },
  { id: 'silence', title: 'Background noise while working', left: 'Total silence', right: 'Chaos is fine' },
  { id: 'gift', title: 'Gift giving', left: 'Practical only', right: 'Sentimental always' },
];

export const SPECTRA_COUNT = SPECTRA.length;

export const spectrumAt = (index: number): Spectrum => {
  const i = ((index % SPECTRA_COUNT) + SPECTRA_COUNT) % SPECTRA_COUNT;
  return SPECTRA[i] ?? FIRST;
};

export const hashIndex = (text: string): number => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};
