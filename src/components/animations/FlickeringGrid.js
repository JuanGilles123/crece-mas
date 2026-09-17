import React, { useEffect, useRef, useState, useMemo } from 'react';

const hexToRgb = (hex) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
};

const FlickeringGrid = ({
  squareSize = 4,
  gridGap = 6,
  colors = ['#014abb', '#1ad61a'], // Blue and Green from logo
  maxOpacity = 0.5,
  flickerChance = 0.1,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Pre-calculate RGB strings
  const colorPool = useMemo(() => colors.map(hexToRgb), [colors]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    
    // Scale for high DPI displays (Retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const cols = Math.floor(dimensions.width / (squareSize + gridGap));
    const rows = Math.floor(dimensions.height / (squareSize + gridGap));

    // Initialize grid opacities and colors
    const grid = Array(cols * rows).fill(0).map(() => ({
      opacity: Math.random() * maxOpacity,
      colorIndex: Math.floor(Math.random() * colorPool.length)
    }));

    let animationFrameId;

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      for (let i = 0; i < grid.length; i++) {
        // Randomly flicker opacity
        if (Math.random() < flickerChance) {
          grid[i].opacity = Math.random() * maxOpacity;
        }

        const x = (i % cols) * (squareSize + gridGap);
        const y = Math.floor(i / cols) * (squareSize + gridGap);

        const colorStr = colorPool[grid[i].colorIndex];
        ctx.fillStyle = `rgba(${colorStr}, ${grid[i].opacity})`;
        ctx.fillRect(x, y, squareSize, squareSize);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, squareSize, gridGap, maxOpacity, flickerChance]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
};

export default FlickeringGrid;
