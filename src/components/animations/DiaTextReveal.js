import React from 'react';
import { motion } from 'framer-motion';

export const DiaTextReveal = ({ text, children, className = "", once = false, gradient, repeat = false, repeatDelay = 3 }) => {
  const defaultGradient = `linear-gradient(
    to right, 
    #1ad61a 0%, 
    #1ad61a 35%, 
    #ce1126 45%, 
    #003893 50%, 
    #fcd116 55%, 
    #1ad61a 65%, 
    #1ad61a 100%
  )`;

  const viewportOptions = React.useMemo(() => ({ once, amount: 0.1 }), [once]);

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOptions}
      variants={React.useMemo(() => ({
        hidden: { backgroundPosition: "100% 50%" },
        visible: { 
          backgroundPosition: "0% 50%",
          transition: { 
            duration: 1.5, 
            ease: "easeOut", 
            delay: 0.8,
            ...(repeat && {
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: repeatDelay
            })
          }
        }
      }), [repeat, repeatDelay])}
      style={{
        background: gradient || defaultGradient,
        backgroundSize: "300% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        display: "inline-block",
        paddingRight: "0.1em", // prevent clipping of last character
      }}
    >
      {text || children}
    </motion.span>
  );
};
