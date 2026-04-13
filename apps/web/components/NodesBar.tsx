"use client";

import React, { useState } from "react";
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
import { ModeToggle } from "./modeToggle";

export default function NodesBar(props: { children?: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
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
        "mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-full",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <LogoIcon />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center items-start">
            <SidebarLink
              link={{ label: "Toggle theme", icon: <ModeToggle /> }}
            />
            <SignedOut>
              <div className="flex justify-center items-center outline rounded-md p-2">
                <SignInButton />
              </div>
            </SignedOut>
            <SignedIn>
              <SidebarLink
                link={{
                  label:
                    isSignedIn && isLoaded
                      ? `${user?.firstName as string} ${user.lastName as string}`
                      : "",
                  icon: <UserButton />,
                }}
              />
            </SignedIn>
          </div>
        </SidebarBody>
      </Sidebar>
      {props.children}
    </div>
  );
}

export const LogoIcon = () => {
  return (
    <a
      href="/workspace"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <span className="font-[var(--font-display)] text-[16px] dark:text-white text-[#282828]">
        g8g
      </span>
    </a>
  );
};
