'use client';
/**
 * A component that wraps its children in a container that's 1px larger than parent.
 * This allows scrolling even when the children don't overflow the parent.
 * This makes the screen closer to a native mobile screen.
 */
const Scrollable = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full overflow-auto">
      <div className="h-full">{children}</div>
      <div className="h-[1px]"></div>
    </div>
  );
};

export default Scrollable;
