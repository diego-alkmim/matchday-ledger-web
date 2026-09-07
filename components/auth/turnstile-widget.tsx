"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type TurnstileOptions = {
  sitekey: string;
  theme: "dark";
  size: "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (element: HTMLElement, options: TurnstileOptions) => string;
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
  onTokenChange: (token: string) => void;
  onError: () => void;
};

export function TurnstileWidget({
  siteKey,
  resetKey,
  onTokenChange,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
    onErrorRef.current = onError;
  }, [onError, onTokenChange]);

  const renderWidget = () => {
    const turnstile = window.turnstile;
    if (!turnstile || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible",
      callback: (token) => onTokenChangeRef.current(token),
      "expired-callback": () => onTokenChangeRef.current(""),
      "error-callback": () => {
        onTokenChangeRef.current("");
        onErrorRef.current();
      },
    });
  };

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
}
