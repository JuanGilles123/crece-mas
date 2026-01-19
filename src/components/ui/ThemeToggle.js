import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ size = 'medium', showLabel = false }) => {
  const { isDarkMode, toggleTheme, isTransitioning } = useTheme();

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'theme-toggle-small';
      case 'large': return 'theme-toggle-large';
      default: return 'theme-toggle-medium';
    }
  };

  const iconVariants = {
    initial: { 
      scale: 0.8, 
      rotate: -180,
      opacity: 0 
    },
    animate: { 
      scale: 1, 
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      scale: 0.8, 
      rotate: 180,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: isDarkMode 
        ? "0 0 20px rgba(255, 255, 255, 0.3)" 
        : "0 0 20px rgba(0, 0, 0, 0.3)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 15
      }
    }
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        isDarkMode 
          ? "0 0 5px rgba(255, 255, 255, 0.2)" 
          : "0 0 5px rgba(0, 0, 0, 0.2)",
        isDarkMode 
          ? "0 0 20px rgba(255, 255, 255, 0.4)" 
          : "0 0 20px rgba(0, 0, 0, 0.4)",
        isDarkMode 
          ? "0 0 5px rgba(255, 255, 255, 0.2)" 
          : "0 0 5px rgba(0, 0, 0, 0.2)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`theme-toggle-container ${getSizeClass()}`}>
      <motion.button
        className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
        onClick={toggleTheme}
        disabled={isTransitioning}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        animate={isTransitioning ? "animate" : ""}
      >
        {/* Efecto de glow animado */}
        <motion.div 
          className="theme-toggle-glow"
          variants={glowVariants}
          animate="animate"
        />
        
        {/* Contenedor del icono con overflow hidden para la animación */}
        <div className="theme-toggle-icon-container">
          <AnimatePresence mode="wait">
            {isDarkMode ? (
              <motion.div
                key="moon"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="theme-toggle-icon"
              >
                <Moon size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="theme-toggle-icon"
              >
                <Sun size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Efecto de partículas durante la transición */}
        {isTransitioning && (
          <div className="theme-toggle-particles">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="theme-toggle-particle"
                initial={{ 
                  scale: 0, 
                  opacity: 1,
                  x: 0,
                  y: 0
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [1, 0.8, 0],
                  x: Math.cos(i * 45 * Math.PI / 180) * 30,
                  y: Math.sin(i * 45 * Math.PI / 180) * 30,
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </motion.button>

      {showLabel && (
        <motion.span 
          className="theme-toggle-label"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
        </motion.span>
      )}
    </div>
  );
};

export default ThemeToggle;
