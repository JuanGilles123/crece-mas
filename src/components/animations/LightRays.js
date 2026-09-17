import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const LightRays = ({
  count = 15, 
  color = "rgba(59, 130, 246, 0.4)", // Azul tecnológico suave (evita chocar con el verde de Colombia)
  blur = 40, // Suficiente blur para ser suave pero mantener forma de rayo
  opacity = 0.5, // Mucho menos intenso
  speed = 10,
  className = ""
}) => {
  const rays = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      width: Math.random() * 150 + 80, // Más delgados para que no se fusionen en una sola niebla
      left: Math.random() * 140 - 20, // Expansión total de -20% a 120% para mejor distribución
      rotation: (Math.random() - 0.5) * 60, // Ángulos un poco más controlados
      duration: Math.random() * 10 + speed, 
      delay: Math.random() * -speed,
      baseOpacity: Math.random() * opacity + 0.15, // Más sutil
    }));
  }, [count, speed, opacity]);

  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ 
        filter: `blur(${blur}px)`
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full">
        {rays.map((ray) => (
          <motion.div
            key={ray.id}
            initial={{ 
              opacity: 0,
              scaleY: 0.8,
              rotate: ray.rotation,
              x: '-50%'
            }}
            animate={{ 
              opacity: [0, ray.baseOpacity, 0],
              scaleY: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: ray.duration,
              delay: ray.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: '-50vh', // Mover el inicio MUY por encima de la pantalla para ocultar el corte
              left: `${ray.left}%`,
              width: `${ray.width}px`,
              height: '250vh', // Hacerlos mucho más largos
              // Gradiente muy suave para que parezcan luz difusa
              background: `linear-gradient(to bottom, transparent 0%, ${color} 40%, transparent 100%)`,
              transformOrigin: 'top center',
              zIndex: 0
            }}
          />
        ))}
      </div>
    </div>
  );
};
