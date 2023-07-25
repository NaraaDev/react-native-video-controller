import {useRef} from 'react';
import type {RippleRef} from './Ripple';

export const useRefs = () => {
  const rippleLeft = useRef<RippleRef>(null);
  const rippleRight = useRef<RippleRef>(null);

  return {rippleLeft, rippleRight};
};
export const bin = (value: boolean): 0 | 1 => {
  'worklet';
  return value ? 1 : 0;
};
export const secondToTime = (seconds: number): string => {
  const hour = Math.floor(seconds / 3600);
  const residualFromHour = seconds % 3600;
  const minute = `${Math.floor(residualFromHour / 60)}`.padStart(2, '0');
  const second = `${Math.floor(residualFromHour % 60)}`.padStart(2, '0');
  let output = `${minute}:${second}`;
  hour && (output = `${hour}:${output}`);
  return output;
};
