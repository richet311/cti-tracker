"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function useConfirmSignOut(callbackUrl = "/") {
  const [confirming, setConfirming] = useState(false);

  return {
    confirming,
    request: () => setConfirming(true),
    cancel:  () => setConfirming(false),
    confirm: () => signOut({ callbackUrl }),
  };
}
