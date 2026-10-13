import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const LoadingContext = createContext({
  isLoading: false,
  activeCount: 0,
  showLoading: () => {},
  hideLoading: () => {},
});

// Global state for fetch interceptor
let activeRequests = 0;
const listeners = new Set();
let interceptorInstalled = false;

function notifyListeners() {
  const loading = activeRequests > 0;
  listeners.forEach((listener) => {
    try {
      listener(loading, activeRequests);
    } catch (e) {
      console.error("Error in loading listener:", e);
    }
  });
}

// Global fetch interceptor
function installFetchInterceptor() {
  if (interceptorInstalled || typeof window === "undefined" || !window.fetch) {
    return;
  }
  interceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (...args) {
    // Check if caller requested to skip loading animation
    const options = args[1] || {};
    const skip =
      options.skipLoading ||
      (options.headers &&
        (options.headers["X-Skip-Loading"] ||
          options.headers["x-skip-loading"]));

    if (!skip) {
      activeRequests++;
      notifyListeners();
    }

    try {
      const response = await originalFetch(...args);
      return response;
    } finally {
      if (!skip) {
        activeRequests = Math.max(0, activeRequests - 1);
        notifyListeners();
      }
    }
  };
}

// Auto install interceptor
installFetchInterceptor();

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(activeRequests > 0);
  const [activeCount, setActiveCount] = useState(activeRequests);
  const minTimerRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    // Listener that guarantees smooth transition and minimum visible display (250ms)
    // so fast requests don't produce an unpleasant flash
    const handleFetchState = (loading, count) => {
      setActiveCount(count);

      if (loading) {
        if (minTimerRef.current) {
          clearTimeout(minTimerRef.current);
          minTimerRef.current = null;
        }
        startTimeRef.current = Date.now();
        setIsLoading(true);
      } else {
        const elapsed = Date.now() - startTimeRef.current;
        const minDuration = 280; // ensure user perceives the loading feedback
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
          minTimerRef.current = setTimeout(() => {
            setIsLoading(false);
            minTimerRef.current = null;
          }, remaining);
        } else {
          setIsLoading(false);
        }
      }
    };

    listeners.add(handleFetchState);

    return () => {
      listeners.delete(handleFetchState);
      if (minTimerRef.current) {
        clearTimeout(minTimerRef.current);
      }
    };
  }, []);

  const showLoading = () => {
    activeRequests++;
    notifyListeners();
  };

  const hideLoading = () => {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyListeners();
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        activeCount,
        showLoading,
        hideLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}

export default LoadingContext;
