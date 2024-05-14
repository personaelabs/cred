'use client';
const Scrollable = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full overflow-auto">
      <div className="h-full">{children}</div>
      <div className="h-[1px]"></div>
    </div>
  );
};

export default Scrollable;
