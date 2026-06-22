"use client";

import { useState, useRef, useCallback } from "react";
import { WS_COLLECT_URL, getToken } from "@/lib/api";
import type { FeedMessage } from "@/lib/api";

let msgCounter = 0;

export function useWebSocket(onComplete: () => void) {
  const [collecting, setCollecting]   = useState(false);
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([]);
  const [elapsed, setElapsed]         = useState(0);
  const wsRef    = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const startCollection = useCallback((limit: number = 20) => {
    if (collecting || wsRef.current) return;
    setCollecting(true);
    setFeedMessages([]);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    const token = getToken() ?? "";
    const ws = new WebSocket(`${WS_COLLECT_URL}?token=${encodeURIComponent(token)}&limit=${limit}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg  = JSON.parse(e.data) as Omit<FeedMessage, "id" | "timestamp">;
      const full: FeedMessage = { ...msg, id: String(++msgCounter), timestamp: Date.now() };
      setFeedMessages((prev) => [full, ...prev].slice(0, 2000));
      if (msg.type === "complete") {
        stopTimer();
        setCollecting(false);
        wsRef.current = null;
        onComplete();
      }
    };

    ws.onerror = () => {
      stopTimer();
      setCollecting(false);
      wsRef.current = null;
      setFeedMessages((prev) => [
        {
          id: String(++msgCounter),
          type: "status",
          source: "system",
          message: "WebSocket error: is the backend running on port 8000?",
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    };

    ws.onclose = () => {
      stopTimer();
      setCollecting(false);
      wsRef.current = null;
    };
  }, [collecting, onComplete]);

  return { collecting, feedMessages, elapsed, startCollection };
}
