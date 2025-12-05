"use client";

import { Moon, Sun, Brain, User, LogOut, Settings, UserCircle, Coins, Menu as MenuIcon, X } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { Menu, MenuItem, HoveredLink } from "@/components/ui/navbar-menu";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { CreditBalance } from "@/components/credits/credit-balance";

export function Navbar() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [active, setActive] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useUser();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(userMenuRef, () => setIsUserMenuOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme ?? theme ?? "light";

  const handleToggleTheme = () => {
    // Dark mode is enforced - toggle disabled
    return;
  };

  const handleSignOut = async () => {
    await user?.signOut();
    router.push("/");
    setIsUserMenuOpen(false);
  };

  return (
    <div className="fixed top-4 md:top-10 inset-x-0 max-w-5xl mx-auto z-[100] px-4">
      <Menu setActive={setActive}>
        {/* Logo - Always visible */}
        <div className="flex items-center gap-2 px-2 cursor-pointer" onClick={() => router.push("/")}>
          <Brain className="w-5 h-5 text-[#4A044E]" />
          <span className="font-bold font-mono text-[#4A044E] text-sm md:text-lg">AI Product Evaluator</span>
        </div>

        {/* Desktop Navigation Links - Hidden on mobile */}
        <a
          href="/#features"
          className="hidden md:block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity cursor-pointer"
        >
          Features
        </a>

        <a
          href="/about"
          className="hidden md:block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity cursor-pointer"
        >
          About
        </a>

        <a
          href="/prompts"
          className="hidden md:block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity cursor-pointer"
        >
          Prompts
        </a>

        <a
          href="/pricing"
          className="hidden md:block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity cursor-pointer"
        >
          Pricing
        </a>

        {/* Credit Balance (only show when logged in) - Hidden on mobile */}
        {user && <div className="hidden md:block"><CreditBalance showLabel={false} /></div>}

        {/* Auth Buttons / User Menu - Hidden on mobile */}
        {user ? (
          <div className="hidden md:block relative" ref={userMenuRef}>
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
          <div className="hidden md:flex items-center gap-2">
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

        {/* Theme Toggle - Hidden on mobile */}
        <button
          onClick={handleToggleTheme}
          className={cn(
            "hidden md:flex w-8 h-8 rounded-full items-center justify-center",
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

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#4A044E]/10 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-[#4A044E]" />
          ) : (
            <MenuIcon className="w-5 h-5 text-[#4A044E]" />
          )}
        </button>
      </Menu>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-xl bg-[#DFCDE3] border border-[#4A044E]/20 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-3">
            {/* Navigation Links */}
            <a
              href="/#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity py-2"
            >
              Features
            </a>
            <a
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity py-2"
            >
              About
            </a>
            <a
              href="/prompts"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity py-2"
            >
              Prompts
            </a>
            <a
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#4A044E] hover:opacity-70 transition-opacity py-2"
            >
              Pricing
            </a>

            {/* Divider */}
            <div className="border-t border-[#4A044E]/20 my-2"></div>

            {/* Credit Balance for logged in users */}
            {user && (
              <div className="py-2">
                <CreditBalance showLabel={true} />
              </div>
            )}

            {/* Auth Section */}
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-[#4A044E]/10 flex items-center justify-center text-[#4A044E] text-sm font-semibold">
                    {user.displayName?.[0]?.toUpperCase() || user.primaryEmail?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#4A044E]">{user.displayName || "User"}</p>
                    <p className="text-xs text-[#4A044E]/60">{user.primaryEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    router.push("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#4A044E] hover:bg-[#4A044E]/10 rounded-lg transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    router.push("/handler/account-settings");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#4A044E] hover:bg-[#4A044E]/10 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <a
                  href="/handler/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-center text-white bg-black rounded-lg transition-opacity"
                >
                  Log In
                </a>
                <a
                  href="/handler/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md"
                >
                  Sign Up
                </a>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#4A044E]">Theme</span>
              <button
                onClick={handleToggleTheme}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "hover:bg-[#4A044E]/10 transition-colors"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
