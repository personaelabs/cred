'use client';
import { MotionProps, motion } from 'framer-motion';

const ClickableBox = (
  props: React.HTMLAttributes<HTMLDivElement> & MotionProps
) => {
  const { children } = props;
  return (
    <motion.div
      whileTap={{
        scale: 0.95,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ClickableBox;
