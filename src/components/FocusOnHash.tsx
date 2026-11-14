"use client";

import { useEffect } from "react";

/**
 * After a server action redirects to `…#section-id`, move keyboard and
 * screen-reader focus to that section so the result is announced instead of
 * silently re-rendering with focus back at the top of the document.
 * Render it with a per-request `key` so it re-runs after every action.
 */
export function FocusOnHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus();
  }, []);
  return null;
}
