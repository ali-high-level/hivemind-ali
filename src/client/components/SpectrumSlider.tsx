import type { CSSProperties } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
  left: string;
  right: string;
  label: string;
  ghost?: number;
};

const THUMB = 34;

const describe = (v: number, left: string, right: string) => {
  if (v <= 15) return left;
  if (v >= 85) return right;
  if (v < 42) return `Leaning: ${left}`;
  if (v > 58) return `Leaning: ${right}`;
  return 'Right in the middle';
};

export const SpectrumSlider = ({ value, onChange, left, right, label, ghost }: Props) => (
  <div className="hv-slider">
    <div className="hv-readout" aria-live="polite">
      <b>{value}</b>
      <span>{describe(value, left, right)}</span>
    </div>
    <div className="hv-rail">
      {ghost !== undefined && (
        <span
          className="hv-ghost"
          style={{ left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${ghost / 100})` }}
        >
          you
        </span>
      )}
      <input
        className="hv-range"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${value}%` } as CSSProperties}
      />
    </div>
    <div className="hv-ends">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  </div>
);
