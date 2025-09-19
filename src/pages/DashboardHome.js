import React from 'react';
import { motion } from 'framer-motion';
import './DashboardHome.css';
import obrero from '../assets/obrero.png';

const DashboardHome = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: 0.8
      }
    }
  };

  const imageVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotate: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200,
        delay: 0.3
      }
    }
  };

  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.5
      }
    }
  };

  return (
    <motion.div 
      className="dashboard-home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="dashboard-card"
        variants={cardVariants}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <motion.h2 variants={textVariants}>Dashboard</motion.h2>
        <motion.img 
          src={obrero} 
          alt="Dashboard en construcción" 
          className="dashboard-img"
          variants={imageVariants}
          whileHover={{ 
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.3 }
          }}
        />
        <motion.h3 variants={textVariants}>Dashboard en Construcción</motion.h3>
        <motion.p variants={textVariants}>Pronto verá aquí tus métricas clave.</motion.p>
      </motion.div>
    </motion.div>
  );
};

export default DashboardHome;
