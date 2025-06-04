/**
 * Memory Leak Prevention Utilities
 *
 * This module provides utilities to detect, prevent, and fix memory leaks
 * in React Native applications, particularly focusing on:
 * - Unhandled promises and async operations
 * - Event listeners and subscriptions
 * - Timers (setTimeout, setInterval)
 * - Animated values cleanup
 * - Component state updates after unmount
 */

import React, {useEffect, useRef, useCallback} from 'react';

type TimerId = ReturnType<typeof setTimeout>;

class MemoryLeakTracker {
  private static instance: MemoryLeakTracker;
  private timers: Set<TimerId> = new Set();
  private listeners: Set<() => void> = new Set();
  private promises: Set<Promise<any>> = new Set();
  private components: Map<string, number> = new Map();

  static getInstance(): MemoryLeakTracker {
    if (!MemoryLeakTracker.instance) {
      MemoryLeakTracker.instance = new MemoryLeakTracker();
    }
    return MemoryLeakTracker.instance;
  }

  trackTimer(timerId: TimerId): void {
    if (__DEV__) {
      this.timers.add(timerId);
    }
  }

  untrackTimer(timerId: TimerId): void {
    if (__DEV__) {
      this.timers.delete(timerId);
    }
  }

  trackListener(cleanup: () => void): void {
    if (__DEV__) {
      this.listeners.add(cleanup);
    }
  }

  untrackListener(cleanup: () => void): void {
    if (__DEV__) {
      this.listeners.delete(cleanup);
    }
  }

  trackPromise(promise: Promise<any>): void {
    if (__DEV__) {
      this.promises.add(promise);
      promise.finally(() => {
        this.promises.delete(promise);
      });
    }
  }

  trackComponent(componentName: string): void {
    if (__DEV__) {
      const count = this.components.get(componentName) || 0;
      this.components.set(componentName, count + 1);
    }
  }

  untrackComponent(componentName: string): void {
    if (__DEV__) {
      const count = this.components.get(componentName) || 0;
      this.components.set(componentName, Math.max(0, count - 1));
    }
  }

  getStats() {
    if (__DEV__) {
      return {
        activeTimers: this.timers.size,
        activeListeners: this.listeners.size,
        activePromises: this.promises.size,
        componentCounts: Object.fromEntries(this.components),
      };
    }
    return null;
  }

  clearAll(): void {
    if (__DEV__) {
      this.timers.forEach(timerId => {
        clearTimeout(timerId);
        clearInterval(timerId);
      });
      this.timers.clear();

      this.listeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error cleaning up listener:', error);
        }
      });
      this.listeners.clear();

      this.promises.clear();
      this.components.clear();
    }
  }
}

const tracker = MemoryLeakTracker.getInstance();

export const useSafeTimeout = () => {
  const timeoutsRef = useRef<Set<TimerId>>(new Set());

  const safeSetTimeout = useCallback(
    (callback: () => void, delay: number): TimerId => {
      const timerId = setTimeout(() => {
        timeoutsRef.current.delete(timerId);
        tracker.untrackTimer(timerId);
        callback();
      }, delay);

      timeoutsRef.current.add(timerId);
      tracker.trackTimer(timerId);
      return timerId;
    },
    [],
  );

  const clearSafeTimeout = useCallback((timerId: TimerId) => {
    if (timeoutsRef.current.has(timerId)) {
      clearTimeout(timerId);
      timeoutsRef.current.delete(timerId);
      tracker.untrackTimer(timerId);
    }
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timerId => {
        clearTimeout(timerId);
        tracker.untrackTimer(timerId);
      });
      timeoutsRef.current.clear();
    };
  }, []);

  return {safeSetTimeout, clearSafeTimeout};
};

export const useSafeInterval = () => {
  const intervalsRef = useRef<Set<TimerId>>(new Set());

  const safeSetInterval = useCallback(
    (callback: () => void, delay: number): TimerId => {
      const intervalId = setInterval(callback, delay);
      intervalsRef.current.add(intervalId);
      tracker.trackTimer(intervalId);
      return intervalId;
    },
    [],
  );

  const clearSafeInterval = useCallback((intervalId: TimerId) => {
    if (intervalsRef.current.has(intervalId)) {
      clearInterval(intervalId);
      intervalsRef.current.delete(intervalId);
      tracker.untrackTimer(intervalId);
    }
  }, []);

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(intervalId => {
        clearInterval(intervalId);
        tracker.untrackTimer(intervalId);
      });
      intervalsRef.current.clear();
    };
  }, []);

  return {safeSetInterval, clearSafeInterval};
};

export const useSafeAsync = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeAsync = useCallback(
    <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
      const promise = asyncFn()
        .then(result => {
          if (isMountedRef.current) {
            return result;
          }
          return null;
        })
        .catch(error => {
          if (isMountedRef.current) {
            throw error;
          }
          return null;
        });

      tracker.trackPromise(promise);
      return promise;
    },
    [],
  );

  return {safeAsync, isMounted: () => isMountedRef.current};
};

export const useComponentTracker = (componentName: string) => {
  useEffect(() => {
    tracker.trackComponent(componentName);
    return () => {
      tracker.untrackComponent(componentName);
    };
  }, [componentName]);
};

export const useSafeEventListener = () => {
  const listenersRef = useRef<Set<() => void>>(new Set());

  const addListener = useCallback(
    <T extends any[]>(
      addListenerFn: (...args: T) => () => void,
      ...args: T
    ) => {
      const removeListener = addListenerFn(...args);
      listenersRef.current.add(removeListener);
      tracker.trackListener(removeListener);
      return removeListener;
    },
    [],
  );

  const removeListener = useCallback((cleanup: () => void) => {
    if (listenersRef.current.has(cleanup)) {
      cleanup();
      listenersRef.current.delete(cleanup);
      tracker.untrackListener(cleanup);
    }
  }, []);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach(cleanup => {
        try {
          cleanup();
          tracker.untrackListener(cleanup);
        } catch (error) {
          console.warn('Error cleaning up listener:', error);
        }
      });
      listenersRef.current.clear();
    };
  }, []);

  return {addListener, removeListener};
};

export const useSafeState = <T>(initialState: T) => {
  const [state, setState] = React.useState<T>(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState: T | ((prevState: T) => T)) => {
    if (isMountedRef.current) {
      setState(newState);
    }
  }, []);

  return [state, safeSetState] as const;
};

export const useMemoryMonitor = (componentName: string) => {
  useEffect(() => {
    if (__DEV__) {
      const startTime = Date.now();
      console.log(`[Memory] ${componentName} mounted`);

      return () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`[Memory] ${componentName} unmounted after ${duration}ms`);

        const stats = tracker.getStats();
        if (stats) {
          console.log(`[Memory] Current stats:`, stats);
        }
      };
    }
  }, [componentName]);
};

export const cleanupAllMemoryLeaks = () => {
  tracker.clearAll();
};

export const getMemoryStats = () => {
  return tracker.getStats();
};

export default {
  useSafeTimeout,
  useSafeInterval,
  useSafeAsync,
  useComponentTracker,
  useSafeEventListener,
  useSafeState,
  useMemoryMonitor,
  cleanupAllMemoryLeaks,
  getMemoryStats,
};
