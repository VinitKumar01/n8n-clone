"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/modeToggle";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex justify-between items-center w-full">
      <div className="flex justify-start items-center">
        <Link href="/" className="flex px-4 py-2 text-2xl">
          <div className="bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-2xl font-bold text-transparent sm:text-2xl">
            n8n
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-4 px-4 py-2 h-14">
        <ModeToggle />
        <SignedOut>
          <div className="flex justify-center items-center outline rounded-md p-2">
            <SignInButton />
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
