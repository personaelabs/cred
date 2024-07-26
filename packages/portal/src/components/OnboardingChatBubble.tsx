import { motion } from 'framer-motion';

interface OnboardingChatBubbleProps {
  text: string;
}

const OnboardingChatBubble = (props: OnboardingChatBubbleProps) => {
  const { text } = props;
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }} // Start off-screen to the left
      animate={{ opacity: 1, x: 0 }} // Fade in and move to the right
      transition={{ duration: 0.8 }} // Adjust the duration as needed
      className="max-w-[70%] select-none text-md px-4 py-2 bg-primary text-[#000000] text-opacity-80 rounded-lg shadow-md text-left inline  whitespace-pre-wrap"
    >
      {text}
    </motion.div>
  );
};

export default OnboardingChatBubble;
