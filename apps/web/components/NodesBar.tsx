"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import { IconBrandTabler, IconUserBolt } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Sun, Moon, LogIn } from "lucide-react";
import { motion } from "motion/react";

export default function NodesBar(props: { children?: React.ReactNode }) {
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Workspace",
      href: "/workspace",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-neutral-50 md:flex-row dark:bg-[#171717]",
        "h-full",
      )}
    >
      <Sidebar open={open} setOpenAction={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center items-start gap-3 w-full border-t border-neutral-200 dark:border-neutral-800/80 pt-4">
            <ThemeToggle open={open} />
            <UserProfile open={open} />
          </div>
        </SidebarBody>
      </Sidebar>
      {props.children}
    </div>
  );
}

export const Logo = () => {
  return (
    <a
      href="/workspace"
      className="relative z-20 flex items-center space-x-2.5 py-1.5 text-sm font-normal text-black"
    >
      <div className="h-6 w-7 bg-neutral-900 dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 flex items-center justify-center shadow-sm">
        <span className="text-[11px] font-bold text-white dark:text-neutral-900 select-none">
          8
        </span>
      </div>
      <span className="font-[var(--font-display)] text-lg tracking-wider dark:text-white text-neutral-800 transition-colors">
        g8g
      </span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="/workspace"
      className="relative z-20 flex items-center py-1.5 text-sm font-normal text-black"
    >
      <div className="h-6 w-7 bg-neutral-900 dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 flex items-center justify-center shadow-sm">
        <span className="text-[11px] font-bold text-white dark:text-neutral-900 select-none">
          8
        </span>
      </div>
    </a>
  );
};

const ThemeToggle = ({ open }: { open: boolean }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-neutral-700 dark:text-neutral-200">
        <div className="h-5 w-5 flex items-center justify-center" />
        {open && <span className="text-xs font-medium">Toggle Theme</span>}
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-3 px-2 py-2 w-full rounded-lg hover:bg-neutral-250/50 dark:hover:bg-neutral-850/50 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-200 select-none"
    >
      <div className="h-5 w-5 flex items-center justify-center transition-transform hover:rotate-12 duration-200">
        {isDark ? (
          <Sun className="h-4.5 w-4.5 text-amber-500" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-indigo-600" />
        )}
      </div>
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="text-xs font-medium whitespace-nowrap overflow-hidden inline-block"
      >
        {isDark ? "Light Mode" : "Dark Mode"}
      </motion.span>
    </div>
  );
};

const UserProfile = ({ open }: { open: boolean }) => {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3 px-2 py-2 w-full rounded-lg">
        <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        {open && (
          <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <SignedOut>
        <div className="py-1">
          <SignInButton mode="modal">
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-sm">
              <LogIn className="h-3.5 w-3.5" />
              {open && <span>Sign In</span>}
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-3 px-1.5 py-1 w-full rounded-lg text-neutral-700 dark:text-neutral-200">
          <div className="flex-shrink-0">
            <UserButton />
          </div>
          <motion.div
            animate={{
              display: open ? "flex" : "none",
              opacity: open ? 1 : 0,
            }}
            className="flex-col min-w-0 flex-1 whitespace-nowrap overflow-hidden inline-flex"
          >
            <span className="text-xs font-semibold truncate leading-none whitespace-nowrap">
              {user?.fullName || `${user?.firstName} ${user?.lastName}`}
            </span>
            <span className="text-[9px] text-neutral-400 dark:text-neutral-500 truncate mt-1 whitespace-nowrap">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </motion.div>
        </div>
      </SignedIn>
    </div>
  );
};
