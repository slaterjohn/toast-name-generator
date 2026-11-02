"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCryptoRandom,
  createEngine,
  getDefaultCorpus,
  HISTORY_WINDOW,
  NameSession,
  type GeneratedName,
} from "@/lib/names";
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
} from "@/lib/storage/session-store";

export type NameState =
  | { status: "loading" }
  | { status: "ready"; name: GeneratedName; sequence: number; runningLow: boolean }
  | { status: "exhausted"; last: GeneratedName | null };

/** Ignore a second press arriving within this many milliseconds. */
const DOUBLE_PRESS_MS = 150;

/**
 * Owns the generation session for this tab. Generates exactly one name on
 * mount (guarded so React Strict Mode's double effect does not produce two)
 * and persists history to sessionStorage after every generation.
 */
export function useNameSession() {
  const sessionRef = useRef<NameSession | null>(null);
  const lastPressRef = useRef(Number.NEGATIVE_INFINITY);
  const sequenceRef = useRef(0);
  const [state, setState] = useState<NameState>({ status: "loading" });

  const generate = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const before = session.emittedCount;
    const result = session.generate();
    saveSessionSnapshot(session.snapshot());
    if (result.status === "ok") {
      sequenceRef.current += 1;
      setState({
        status: "ready",
        name: result.name,
        sequence: sequenceRef.current,
        runningLow: result.windowUsed < Math.min(HISTORY_WINDOW, before),
      });
    } else {
      setState({ status: "exhausted", last: session.current });
    }
  }, []);

  useEffect(() => {
    if (sessionRef.current) return;
    const engine = createEngine(getDefaultCorpus());
    sessionRef.current = NameSession.restore(engine, createCryptoRandom(), loadSessionSnapshot());
    generate();
  }, [generate]);

  const regenerate = useCallback(() => {
    const now = performance.now();
    if (now - lastPressRef.current < DOUBLE_PRESS_MS) return;
    lastPressRef.current = now;
    generate();
  }, [generate]);

  /** Forget this tab's history and start again (used after exhaustion). */
  const reset = useCallback(() => {
    clearSessionSnapshot();
    const engine = createEngine(getDefaultCorpus());
    sessionRef.current = new NameSession(engine, createCryptoRandom());
    generate();
  }, [generate]);

  return { state, regenerate, reset };
}
