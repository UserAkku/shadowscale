import { useState } from "react";

export function useClipboard(timeout = 2000) {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = async (text: string) => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), timeout);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return { hasCopied, copy };
}
