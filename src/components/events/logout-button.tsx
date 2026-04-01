"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const result = await logout();
    if (result.success) {
      router.push("/login");
    } else {
      toast.error(result.error ?? "Failed to logout");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
    >
      <LogOutIcon data-icon="inline-start" />
      Logout
    </Button>
  );
}
