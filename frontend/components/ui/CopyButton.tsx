"use client";

import { useClipboard } from "@/hooks/useClipboard";
import { Button, ButtonProps } from "./Button";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps extends ButtonProps {
  text: string;
}

export function CopyButton({ text, ...props }: CopyButtonProps) {
  const { hasCopied, copy } = useClipboard();

  return (
    <Button onClick={() => copy(text)} {...props} className={`gap-2 ${props.className || ""}`}>
      {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {hasCopied ? "Copied!" : "Copy"}
    </Button>
  );
}
