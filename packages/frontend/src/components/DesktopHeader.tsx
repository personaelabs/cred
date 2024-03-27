'use client';
import Link from 'next/link';

const DesktopHeader = () => {
  return (
    <div className="hidden md:flex h-[80px] w-[100vw] flex-row justify-between items-center gap-8 px-[20px] md:px-[100px]">
      <div>
        <Link href="/account">Add creddd</Link>
      </div>
      <div className="flex flex-row gap-8">
        <Link href="/explore">Explore</Link>
        <Link
          href="https://personae-labs.notion.site/Creddd-9cdf710a1cf84a388d8a45bf14ecfd20"
          target="_blank"
        >
          About
        </Link>
      </div>
    </div>
  );
};

export default DesktopHeader;
