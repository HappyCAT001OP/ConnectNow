import { SignedIn, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

import MobileNav from './MobileNav';

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between w-full bg-black px-6 py-4 lg:px-10 h-16 min-h-16">
      <Link href="/" className="flex items-center gap-1">
        <Image
        src="/icons/logo.jpg"
          width={32}
          height={32}
          alt="ConnectNow logo"
          className="max-sm:size-10"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          ConnectNow
        </p>
      </Link>
      <div className="flex items-center gap-5">
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
