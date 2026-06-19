"use client";

import { useState, useRef, useCallback } from "react";
import { WS_COLLECT_URL } from "@/lib/api";
import type { FeedMessage } from "@/lib/api";

let msgCounter = 0;

export function useWebSocket(onComplete: () => void) {
  const [collecting, setCollecting] = useState(false);
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const startCollection = useCallback(() => {
    if (collecting || wsRef.current) return;
    setCollecting(true);
    setFeedMessages([]);

    const ws = new WebSocket(WS_COLLECT_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as Omit<FeedMessage, "id" | "timestamp">;
      const full: FeedMessage = { ...msg, id: String(++msgCounter), timestamp: Date.now() };
      setFeedMessages((prev) => [full, ...prev].slice(0, 120));
      if (msg.type === "complete") {
        setCollecting(false);
        wsRef.current = null;
        onComplete();
      }
    };

    ws.onerror = () => {
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
      setCollecting(false);
      wsRef.current = null;
    };
  }, [collecting, onComplete]);

  return { collecting, feedMessages, startCollection };
}
