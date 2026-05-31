'use client';

import React from 'react';

// Polyfill React.useEffectEvent for environments that don't support it or have it locked behind experimental flags
if (typeof (React as any).useEffectEvent === 'undefined') {
  const useSafeLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

  ;(React as any).useEffectEvent = function <T extends Function>(callback: T): T {
    const ref = React.useRef<T>(callback);

    useSafeLayoutEffect(() => {
      ref.current = callback;
    });

    return React.useCallback(function (this: any, ...args: any[]) {
      return ref.current.apply(this, args);
    }, []) as any;
  };
}

export function ReactPolyfill() {
  return null;
}
