"use client";

import { useState, useEffect } from "react";
import { Coins, Loader2 } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { cn } from "@/lib/utils";

interface CreditBalanceProps {
  className?: string;
  showLabel?: boolean;
  onBalanceChange?: (balance: number) => void;
}

export function CreditBalance({ className, showLabel = true, onBalanceChange }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useUser();

  useEffect(() => {
    if (user) {
      fetchBalance();
    } else {
      setLoading(false);
      setBalance(null);
    }
  }, [user]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/credits");
      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        onBalanceChange?.(data.balance);
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Coins className="w-4 h-4 text-amber-500" />
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
      ) : (
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {showLabel && "Credits: "}
          <span className="font-bold text-amber-600 dark:text-amber-400">{balance ?? 0}</span>
        </span>
      )}
    </div>
  );
}

// Hook to use credit balance
export function useCreditBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useUser();

  const fetchBalance = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/user/credits");
      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return { balance, loading, error, refetch: fetchBalance };
}
