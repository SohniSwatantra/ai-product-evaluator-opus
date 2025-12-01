"use client";

import { Moon, Sun, Brain, User, LogOut, Settings, UserCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { Menu, MenuItem, HoveredLink } from "@/components/ui/navbar-menu";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useOutsideClick } from "@/hooks/use-outside-click";

export function Navbar() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [active, setActive] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = useUser();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(userMenuRef, () => setIsUserMenuOpen(false));

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
    setIsUserMenuOpen(false);
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
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#4A044E]/10 flex items-center justify-center text-[#4A044E] text-sm font-semibold">
                {user.displayName?.[0]?.toUpperCase() || user.primaryEmail?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-[#4A044E]">{user.displayName || "Account"}</span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-4 w-64 rounded-xl bg-[#111111] border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-white/10">
                  <p className="font-medium text-white">{user.displayName || "User"}</p>
                  <p className="text-xs text-neutral-400 mt-1">{user.primaryEmail}</p>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      router.push("/handler/account-settings");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
