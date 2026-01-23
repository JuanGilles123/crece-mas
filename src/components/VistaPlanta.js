// 🍽️ Vista de Planta Interactiva para Mesas
import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Users, Edit2, Trash2, RotateCcw } from 'lucide-react';
import { getMesaEstadoColor } from '../utils/mesasUtils';
import './VistaPlanta.css';

const VistaPlanta = ({ 
  mesas, 
  onEditar, 
  onEliminar, 
  onCambiarEstado, 
  actualizarMesa,
  organizationId,
  onResize
}) => {
  const [mesaArrastrando, setMesaArrastrando] = useState(null);
  const [zoom, setZoom] = useState(1);
  const plantaRef = useRef(null);

  // Leyenda de estados
  const estadosLeyenda = [
    { estado: 'disponible', label: 'Disponible', color: getMesaEstadoColor('disponible') },
    { estado: 'ocupada', label: 'Ocupada', color: getMesaEstadoColor('ocupada') },
    { estado: 'reservada', label: 'Reservada', color: getMesaEstadoColor('reservada') },
    { estado: 'mantenimiento', label: 'Mantenimiento', color: getMesaEstadoColor('mantenimiento') }
  ];

  const handleDragStart = (mesa) => {
    setMesaArrastrando(mesa.id);
  };

  const handleDragEnd = useCallback(async (mesa, event, info) => {
    setMesaArrastrando(null);
    
    if (!plantaRef.current || !organizationId) return;

    // Obtener el contenedor de contenido que tiene el scale
    const contentElement = event.target.closest('.vista-planta-content');
    if (!contentElement) return;

    // Obtener las posiciones de los contenedores
    const plantaRect = plantaRef.current.getBoundingClientRect();
    const contentRect = contentElement.getBoundingClientRect();
    
    // Obtener la posición del elemento después del drag
    const elementRect = event.target.getBoundingClientRect();
    
    // Calcular posición relativa al contenedor de contenido (antes del zoom)
    // La posición del elemento menos la posición del contenedor escalado, dividido por zoom
    const x = (elementRect.left - contentRect.left) / zoom;
    const y = (elementRect.top - contentRect.top) / zoom;

    // Limitar dentro del área de la planta (sin zoom)
    const maxX = (plantaRect.width / zoom) - 80;
    const maxY = (plantaRect.height / zoom) - 80;
    
    const xFinal = Math.max(0, Math.min(x, maxX));
    const yFinal = Math.max(0, Math.min(y, maxY));

    try {
      await actualizarMesa.mutateAsync({
        id: mesa.id,
        organizationId,
        posicion_x: Math.round(xFinal),
        posicion_y: Math.round(yFinal)
      });
    } catch (error) {
      console.error('Error actualizando posición:', error);
    }
  }, [zoom, actualizarMesa, organizationId]);

  const getSiguienteEstado = (estadoActual) => {
    const estados = ['disponible', 'ocupada', 'reservada', 'mantenimiento'];
    const indiceActual = estados.indexOf(estadoActual);
    return estados[(indiceActual + 1) % estados.length];
  };


  return (
    <div className="vista-planta-container">

      {/* Leyenda */}
      <div className="vista-planta-leyenda">
        <h3>Estados</h3>
        <div className="leyenda-items">
          {estadosLeyenda.map((item) => (
            <div key={item.estado} className="leyenda-item">
              <div 
                className="leyenda-color" 
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Planta */}
      <div 
        className="vista-planta-area"
        ref={plantaRef}
      >
        <div 
          className="vista-planta-content"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {mesas.map((mesa) => {
            const x = mesa.posicion_x || 0;
            const y = mesa.posicion_y || 0;
            const estadoColor = getMesaEstadoColor(mesa.estado);
            const esRedonda = mesa.forma === 'redonda' || !mesa.forma;

            return (
              <MesaPlanta
                key={mesa.id}
                mesa={mesa}
                x={x}
                y={y}
                estadoColor={estadoColor}
                esRedonda={esRedonda}
                zoom={zoom}
                plantaRef={plantaRef}
                onDragStart={() => handleDragStart(mesa)}
                onDragEnd={(e, info) => handleDragEnd(mesa, e, info)}
                onResize={(ancho, alto) => {
                  if (onResize) {
                    onResize(mesa, ancho, alto);
                  }
                }}
                onEditar={onEditar}
                onEliminar={onEliminar}
                onCambiarEstado={() => onCambiarEstado(mesa, getSiguienteEstado(mesa.estado))}
                isDragging={mesaArrastrando === mesa.id}
              />
            );
          })}
        </div>
      </div>

      {/* Controles de Zoom */}
      <div className="vista-planta-controls">
        <button 
          className="zoom-btn"
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
        >
          −
        </button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <button 
          className="zoom-btn"
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
        >
          +
        </button>
      </div>
    </div>
  );
};

// Componente de Mesa en la Planta
const MesaPlanta = ({ 
  mesa, 
  x, 
  y, 
  estadoColor, 
  esRedonda, 
  zoom,
  plantaRef,
  onDragStart, 
  onDragEnd, 
  onResize,
  onEditar, 
  onEliminar,
  onCambiarEstado,
  isDragging 
}) => {
  const [mostrandoMenu, setMostrandoMenu] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'se', 'sw', 'ne', 'nw'
  
  // Usar valores controlados de Framer Motion para el drag
  const xMotion = useMotionValue(x);
  const yMotion = useMotionValue(y);
  
  // Dimensiones actuales
  const ancho = mesa.ancho || 80;
  const alto = mesa.alto || 80;
  const widthMotion = useMotionValue(ancho);
  const heightMotion = useMotionValue(alto);

  // Actualizar valores cuando cambian las props (después de guardar)
  React.useEffect(() => {
    xMotion.set(x);
    yMotion.set(y);
    widthMotion.set(ancho);
    heightMotion.set(alto);
  }, [x, y, ancho, alto, xMotion, yMotion, widthMotion, heightMotion]);

  // Determinar si se puede redimensionar (barras y cuadradas)
  const puedeRedimensionar = !esRedonda && (mesa.tipo === 'barra' || mesa.forma === 'cuadrada');

  const handleResizeStart = (e, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
  };

  const handleResize = useCallback((e) => {
    if (!isResizing || !plantaRef.current || !onResize) return;

    const contentElement = e.target.closest('.vista-planta-content');
    if (!contentElement) return;

    const contentRect = contentElement.getBoundingClientRect();
    const mouseX = (e.clientX - contentRect.left) / zoom;
    const mouseY = (e.clientY - contentRect.top) / zoom;

    const currentX = xMotion.get();
    const currentY = yMotion.get();
    const currentWidth = widthMotion.get();
    const currentHeight = heightMotion.get();

    let newWidth = currentWidth;
    let newHeight = currentHeight;
    let newX = currentX;
    let newY = currentY;

    switch (resizeHandle) {
      case 'se': // Sudeste (esquina inferior derecha)
        newWidth = Math.max(60, mouseX - currentX);
        newHeight = Math.max(60, mouseY - currentY);
        break;
      case 'sw': // Sudoeste (esquina inferior izquierda)
        newWidth = Math.max(60, currentX + currentWidth - mouseX);
        newHeight = Math.max(60, mouseY - currentY);
        newX = mouseX;
        break;
      case 'ne': // Noreste (esquina superior derecha)
        newWidth = Math.max(60, mouseX - currentX);
        newHeight = Math.max(60, currentY + currentHeight - mouseY);
        newY = mouseY;
        break;
      case 'nw': // Noroeste (esquina superior izquierda)
        newWidth = Math.max(60, currentX + currentWidth - mouseX);
        newHeight = Math.max(60, currentY + currentHeight - mouseY);
        newX = mouseX;
        newY = mouseY;
        break;
      default:
        // No hacer nada si el handle no es válido
        break;
    }

    widthMotion.set(newWidth);
    heightMotion.set(newHeight);
    if (newX !== currentX) xMotion.set(newX);
    if (newY !== currentY) yMotion.set(newY);
  }, [isResizing, resizeHandle, zoom, plantaRef, xMotion, yMotion, widthMotion, heightMotion, onResize]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;
    
    const finalWidth = Math.round(widthMotion.get());
    const finalHeight = Math.round(heightMotion.get());
    
    onResize(mesa.id, finalWidth, finalHeight);
    setIsResizing(false);
    setResizeHandle(null);
  }, [isResizing, widthMotion, heightMotion, onResize, mesa.id]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  return (
    <motion.div
      className={`mesa-planta ${esRedonda ? 'redonda' : 'cuadrada'} ${isDragging ? 'dragging' : ''} ${puedeRedimensionar ? 'resizable' : ''}`}
      style={{
        x: xMotion,
        y: yMotion,
        width: widthMotion,
        height: heightMotion,
        borderColor: estadoColor,
        backgroundColor: `${estadoColor}15`,
        position: 'absolute'
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={isResizing ? false : undefined}
      onDragStart={(e, info) => {
        if (!isResizing) {
          onDragStart();
        }
      }}
      onDragEnd={(e, info) => {
        if (!isResizing) {
          onDragEnd(e, info);
        }
      }}
      whileDrag={{ scale: 1.1, zIndex: 1000, cursor: isResizing ? 'nwse-resize' : 'grabbing' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div 
        className="mesa-planta-indicator"
        style={{ backgroundColor: estadoColor }}
      />
      
      <div className="mesa-planta-content">
        <div className="mesa-planta-numero">{mesa.numero}</div>
        <div className="mesa-planta-capacidad">
          <Users size={12} />
          {mesa.capacidad}
        </div>
      </div>

      {/* Handles de redimensionamiento para barras y cuadradas */}
      {puedeRedimensionar && (
        <>
          <div 
            className="resize-handle resize-handle-se"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{ cursor: 'nwse-resize' }}
          />
          <div 
            className="resize-handle resize-handle-sw"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            style={{ cursor: 'nesw-resize' }}
          />
          <div 
            className="resize-handle resize-handle-ne"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            style={{ cursor: 'nesw-resize' }}
          />
          <div 
            className="resize-handle resize-handle-nw"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            style={{ cursor: 'nwse-resize' }}
          />
        </>
      )}

      <div className="mesa-planta-menu">
        <button
          className="mesa-planta-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setMostrandoMenu(!mostrandoMenu);
          }}
        >
          ⋮
        </button>
        
        {mostrandoMenu && (
          <div className="mesa-planta-menu-dropdown">
            <button onClick={() => { onEditar(mesa); setMostrandoMenu(false); }}>
              <Edit2 size={14} />
              Editar
            </button>
            <button onClick={() => { onCambiarEstado(); setMostrandoMenu(false); }}>
              <RotateCcw size={14} />
              Cambiar Estado
            </button>
            <button 
              className="danger"
              onClick={() => { onEliminar(mesa); setMostrandoMenu(false); }}
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VistaPlanta;

