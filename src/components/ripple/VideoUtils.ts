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
