"use client";

import { Moon, Sun, Brain, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Menu, MenuItem, HoveredLink } from "@/components/ui/navbar-menu";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [active, setActive] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme ?? theme ?? "light";

  const handleToggleTheme = () => {
    if (!mounted) return;
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await user?.signOut();
    router.push("/");
  };

  return (
    <div className="fixed top-10 inset-x-0 max-w-5xl mx-auto z-50 px-4">
      <Menu setActive={setActive}>
        <div className="flex items-center gap-2 px-2">
          <Brain className="w-5 h-5 text-[#4A044E]" />
          <span className="font-bold font-mono text-[#4A044E] text-lg">AI Product Evaluator</span>
        </div>

        <MenuItem setActive={setActive} active={active} item="Features">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="#features">AI Analysis</HoveredLink>
            <HoveredLink href="#features">Buying Intent</HoveredLink>
            <HoveredLink href="#features">Multi-Factor Scoring</HoveredLink>
            <HoveredLink href="#features">Recommendations</HoveredLink>
          </div>
        </MenuItem>

        <MenuItem setActive={setActive} active={active} item="About">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="https://arxiv.org/abs/2508.02630" target="_blank">Research Paper</HoveredLink>
            <HoveredLink href="#how-it-works">How It Works</HoveredLink>
          </div>
        </MenuItem>

        {/* Auth Buttons / User Menu */}
        {user ? (
          <MenuItem setActive={setActive} active={active} item={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4A044E]/10 flex items-center justify-center text-[#4A044E] text-sm font-semibold">
                {user.displayName?.[0]?.toUpperCase() || user.primaryEmail?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-[#4A044E]">{user.displayName || "Account"}</span>
            </div>
          }>
            <div className="flex flex-col space-y-4 text-sm w-48">
              <div className="px-3 py-2 border-b border-black/10 dark:border-white/10">
                <p className="font-semibold text-black dark:text-white">{user.displayName || "User"}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{user.primaryEmail}</p>
              </div>
              <HoveredLink href="/profile">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </div>
              </HoveredLink>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-left text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </MenuItem>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href="/handler/sign-in"
              className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:opacity-90 rounded-lg transition-opacity"
            >
              Log In
            </a>
            <a
              href="/handler/sign-up"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Sign Up
            </a>
          </div>
        )}

        <button
          onClick={handleToggleTheme}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "hover:bg-neutral-100 dark:hover:bg-neutral-200 transition-colors"
          )}
          aria-label="Toggle theme"
        >
          {!mounted ? (
            <span className="w-4 h-4" />
          ) : currentTheme === "dark" ? (
            <Sun className="w-4 h-4 text-[#4A044E]" />
          ) : (
            <Moon className="w-4 h-4 text-[#4A044E]" />
          )}
        </button>
      </Menu>
    </div>
  );
}
