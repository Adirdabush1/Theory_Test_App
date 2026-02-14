import * as React from "react";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import useLatestCallback from "use-latest-callback";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import * as SafeAreaContext from "react-native-safe-area-context";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";

const SafeAreaListener = SafeAreaContext.SafeAreaListener;
const FrameContext = /*#__PURE__*/ React.createContext(undefined);

export function useFrameSize(selector, throttle) {
  const context = React.useContext(FrameContext);

  if (context == null) {
    throw new Error("useFrameSize must be used within a FrameSizeProvider");
  }

  const value = useSyncExternalStoreWithSelector(
    throttle ? context.subscribeThrottled : context.subscribe,
    context.getCurrent,
    context.getCurrent,
    selector
  );

  return value;
}

export function FrameSizeProvider({ initialFrame, children }) {
  const context = React.useContext(FrameContext);

  if (context != null) {
    return children;
  }

  return /*#__PURE__*/ _jsx(FrameSizeProviderInner, {
    initialFrame: initialFrame,
    children: children,
  });
}

function FrameSizeProviderInner({ initialFrame, children }) {
  const frameRef = React.useRef({
    width: initialFrame.width,
    height: initialFrame.height,
  });

  const listeners = React.useRef(new Set());
  const getCurrent = useLatestCallback(() => frameRef.current);

  const subscribe = useLatestCallback((listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  });

  const subscribeThrottled = useLatestCallback((listener) => {
    const delay = 100;
    let timer;
    let updated = false;
    let waiting = false;

    const throttledListener = () => {
      clearTimeout(timer);
      updated = true;
      if (waiting) {
        timer = setTimeout(() => {
          if (updated) {
            updated = false;
            listener();
          }
        }, delay);
      } else {
        waiting = true;
        setTimeout(() => {
          waiting = false;
        }, delay);

        updated = false;
        listener();
      }
    };

    const unsubscribe = subscribe(throttledListener);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  });

  const context = React.useMemo(
    () => ({
      getCurrent,
      subscribe,
      subscribeThrottled,
    }),
    [subscribe, subscribeThrottled, getCurrent]
  );

  const onChange = useLatestCallback((frame) => {
    if (
      frameRef.current.height === frame.height &&
      frameRef.current.width === frame.width
    ) {
      return;
    }

    frameRef.current = {
      width: frame.width,
      height: frame.height,
    };

    listeners.current.forEach((listener) => listener());
  });

  return /*#__PURE__*/ _jsxs(_Fragment, {
    children: [
      Platform.OS === "web" ? (
        /*#__PURE__*/ _jsx(FrameSizeListenerWeb, {
          onChange: onChange,
        })
      ) : typeof SafeAreaListener === "undefined" ? (
        /*#__PURE__*/ _jsx(FrameSizeListenerNativeFallback, {
          onChange: onChange,
        })
      ) : (
        /*#__PURE__*/ _jsx(SafeAreaListener, {
          onChange: ({ frame }) => onChange(frame),
          style: StyleSheet.absoluteFill,
        })
      ),
      /*#__PURE__*/ _jsx(FrameContext.Provider, {
        value: context,
        children: children,
      }),
    ],
  });
}

function FrameSizeListenerWeb({ onChange }) {
  const elementRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!elementRef.current) {
      return;
    }

    const rect = elementRef.current.getBoundingClientRect();
    onChange({
      width: rect.width,
      height: rect.height,
    });

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry?.contentRect) {
          onChange({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      observer.observe(elementRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [onChange]);

  return /*#__PURE__*/ _jsx("div", {
    ref: elementRef,
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      pointerEvents: "none",
      visibility: "hidden",
    },
  });
}

function FrameSizeListenerNativeFallback({ onChange }) {
  const frame = useSafeAreaFrame();

  React.useEffect(() => {
    onChange({
      width: frame.width,
      height: frame.height,
    });
  }, [frame.width, frame.height, onChange]);

  return null;
}
