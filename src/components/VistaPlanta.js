// 🍽️ Vista de Planta Interactiva para Mesas
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Edit2, Trash2, RotateCcw } from 'lucide-react';
import { getMesaEstadoColor } from '../utils/mesasUtils';
import './VistaPlanta.css';

const VistaPlanta = ({ 
  mesas, 
  onEditar, 
  onEliminar, 
  onCambiarEstado, 
  actualizarMesa,
  organizationId
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

    const rect = plantaRef.current.getBoundingClientRect();
    // Calcular posición relativa al contenedor escalado usando info.point
    const x = (info.point.x - rect.left) / zoom;
    const y = (info.point.y - rect.top) / zoom;

    // Limitar dentro del área de la planta
    const maxX = rect.width / zoom - 80;
    const maxY = rect.height / zoom - 80;
    
    const nuevaX = Math.max(0, Math.min(x, maxX));
    const nuevaY = Math.max(0, Math.min(y, maxY));

    try {
      await actualizarMesa.mutateAsync({
        id: mesa.id,
        organizationId,
        posicion_x: Math.round(nuevaX),
        posicion_y: Math.round(nuevaY)
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
      <div className="vista-planta-area" ref={plantaRef}>
        <div 
          className="vista-planta-content"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {mesas.map((mesa) => {
            const x = mesa.posicion_x || Math.random() * 400;
            const y = mesa.posicion_y || Math.random() * 300;
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
                onDragStart={() => handleDragStart(mesa)}
                onDragEnd={(e, info) => handleDragEnd(mesa, e, info)}
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
  onDragStart, 
  onDragEnd, 
  onEditar, 
  onEliminar,
  onCambiarEstado,
  isDragging 
}) => {
  const [mostrandoMenu, setMostrandoMenu] = useState(false);

  return (
    <motion.div
      className={`mesa-planta ${esRedonda ? 'redonda' : 'cuadrada'} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        borderColor: estadoColor,
        backgroundColor: `${estadoColor}15`
      }}
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.1, zIndex: 1000 }}
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

