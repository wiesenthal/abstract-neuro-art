import { useState, useRef } from 'react';

/**
 * A combination of useState and useRef, to allow for stable state handling inside handlers and other async functions.
 * @param {*} initialValue 
 * @returns [getState, setState]
 */
export function useSync(initialValue) {
  const [_state, _setState] = useState(initialValue);
  const stateRef = useRef(initialValue);

  const setState = (data) => {
    let newValue;

    if (typeof data === 'function') {
      newValue = data(stateRef.current);
    } else {
      newValue = data;
    }

    stateRef.current = newValue;

    _setState(newValue);
  }

  const getState = () => stateRef.current;

  return [getState, setState];
}