"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

type TurnstileOptions = {
  sitekey: string;
  theme: "dark";
  size: "flexible";
  execution: "execute";
  appearance: "execute";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (element: HTMLElement, options: TurnstileOptions) => string;
  execute: (widgetId?: string) => void;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  resetKey: number;
  onSuccess: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
  onReady: () => void;
};

export type TurnstileWidgetHandle = {
  execute: () => boolean;
};

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget(
  { siteKey, resetKey, onSuccess, onExpired, onError, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const onSuccessRef = useRef(onSuccess);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onExpiredRef.current = onExpired;
    onErrorRef.current = onError;
  }, [onError, onExpired, onSuccess]);

  const renderWidget = () => {
    const turnstile = window.turnstile;
    if (!turnstile || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible",
      execution: "execute",
      appearance: "execute",
      callback: (token) => onSuccessRef.current(token),
      "expired-callback": () => onExpiredRef.current(),
      "error-callback": () => {
        onErrorRef.current();
      },
    });
    onReady();
  };

  useImperativeHandle(
    ref,
    () => ({
      execute: () => {
        if (!widgetIdRef.current || !window.turnstile) return false;

        window.turnstile.execute(widgetIdRef.current);
        return true;
      },
    }),
    [],
  );

  useEffect(() => {
    if (window.turnstile) renderWidget();

    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
        onError={() => onErrorRef.current()}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
});
