'use client';
import Link from 'next/link';

const Header = () => {
  return (
    <div className="h-[110px] w-[100vw] flex flex-row justify-end items-center gap-2 px-[100px]">
      <Link
        href="https://personae-labs.notion.site/Creddd-9cdf710a1cf84a388d8a45bf14ecfd20"
        target="_blank"
      >
        About
      </Link>
    </div>
  );
};

export default Header;
