// 🍽️ Componente para gestionar mesas
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2, Users, Circle, RotateCcw, Grid, List, Square, Circle as CircleIcon } from 'lucide-react';
import { useMesas, useCrearMesa, useActualizarMesa, useEliminarMesa } from '../hooks/useMesas';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { canUseMesas, getMesaEstadoColor } from '../utils/mesasUtils';
import VistaPlanta from './VistaPlanta';
import toast from 'react-hot-toast';
import './GestionMesas.css';

// Modal para crear/editar mesa
const MesaModal = ({ open, onClose, mesa, onSave }) => {
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState('4');
  const [estado, setEstado] = useState('disponible');
  const [forma, setForma] = useState('redonda');

  React.useEffect(() => {
    if (mesa) {
      setNumero(mesa.numero || '');
      setCapacidad(mesa.capacidad?.toString() || '4');
      setEstado(mesa.estado || 'disponible');
      setForma(mesa.forma || 'redonda');
    } else {
      setNumero('');
      setCapacidad('4');
      setEstado('disponible');
      setForma('redonda');
    }
  }, [mesa, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numero.trim()) {
      toast.error('El número de mesa es requerido');
      return;
    }
    if (parseInt(capacidad) < 1) {
      toast.error('La capacidad debe ser al menos 1');
      return;
    }
    onSave({
      numero: numero.trim(),
      capacidad: parseInt(capacidad),
      estado,
      forma
    });
  };

  if (!open) return null;

  return (
    <div className="mesa-modal-overlay" onClick={onClose}>
      <motion.div
        className="mesa-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mesa-modal-header">
          <h2>{mesa ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
          <button className="mesa-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mesa-modal-form">
          <div className="mesa-form-group">
            <label>Número de Mesa *</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej: Mesa 1, Mesa 2..."
              required
              autoFocus
            />
          </div>

          <div className="mesa-form-group">
            <label>Capacidad (personas) *</label>
            <input
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              min="1"
              max="20"
              required
            />
          </div>

          <div className="mesa-form-group">
            <label>Forma de la Mesa</label>
            <div className="mesa-forma-selector">
              <button
                type="button"
                className={`mesa-forma-btn ${forma === 'redonda' ? 'active' : ''}`}
                onClick={() => setForma('redonda')}
              >
                <CircleIcon size={20} />
                <span>Redonda</span>
              </button>
              <button
                type="button"
                className={`mesa-forma-btn ${forma === 'cuadrada' ? 'active' : ''}`}
                onClick={() => setForma('cuadrada')}
              >
                <Square size={20} />
                <span>Cuadrada</span>
              </button>
            </div>
          </div>

          <div className="mesa-form-group">
            <label>Estado Inicial</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="disponible">Disponible</option>
              <option value="ocupada">Ocupada</option>
              <option value="reservada">Reservada</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>

          <div className="mesa-modal-actions">
            <button type="button" className="mesa-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="mesa-btn-primary">
              {mesa ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const GestionMesas = () => {
  const { organization } = useAuth();
  const { hasFeature } = useSubscription();
  const { data: mesas = [], isLoading } = useMesas(organization?.id);
  const crearMesa = useCrearMesa();
  const actualizarMesa = useActualizarMesa();
  const eliminarMesa = useEliminarMesa();

  const [modalOpen, setModalOpen] = useState(false);
  const [mesaEditando, setMesaEditando] = useState(null);
  const [mesaEliminando, setMesaEliminando] = useState(null);
  const [vistaModo, setVistaModo] = useState('planta'); // 'planta' o 'lista'

  // Verificar si puede usar mesas
  const acceso = canUseMesas(organization, hasFeature);

  if (!acceso.canUse) {
    return (
      <div className="gestion-mesas">
        <div className="mesas-disabled">
          <Circle size={48} />
          <h3>Mesas no disponibles</h3>
          <p>{acceso.reason}</p>
        </div>
      </div>
    );
  }

  const handleCrear = () => {
    setMesaEditando(null);
    setModalOpen(true);
  };

  const handleEditar = (mesa) => {
    setMesaEditando(mesa);
    setModalOpen(true);
  };

  const handleGuardar = async (datos) => {
    try {
      if (mesaEditando) {
        await actualizarMesa.mutateAsync({
          id: mesaEditando.id,
          organizationId: organization.id,
          ...datos
        });
      } else {
        await crearMesa.mutateAsync({
          organizationId: organization.id,
          ...datos
        });
      }
      setModalOpen(false);
      setMesaEditando(null);
    } catch (error) {
      console.error('Error guardando mesa:', error);
    }
  };

  const handleEliminar = async () => {
    if (!mesaEliminando) return;
    try {
      await eliminarMesa.mutateAsync({
        id: mesaEliminando.id,
        organizationId: organization.id
      });
      setMesaEliminando(null);
    } catch (error) {
      console.error('Error eliminando mesa:', error);
    }
  };

  const handleCambiarEstado = async (mesa, nuevoEstado) => {
    try {
      await actualizarMesa.mutateAsync({
        id: mesa.id,
        organizationId: organization.id,
        estado: nuevoEstado
      });
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const getSiguienteEstado = (estadoActual) => {
    const estados = ['disponible', 'ocupada', 'reservada', 'mantenimiento'];
    const indiceActual = estados.indexOf(estadoActual);
    return estados[(indiceActual + 1) % estados.length];
  };

  // Agrupar mesas por estado
  const mesasPorEstado = {
    disponible: mesas.filter(m => m.estado === 'disponible'),
    ocupada: mesas.filter(m => m.estado === 'ocupada'),
    reservada: mesas.filter(m => m.estado === 'reservada'),
    mantenimiento: mesas.filter(m => m.estado === 'mantenimiento')
  };

  const estadosOrden = ['disponible', 'ocupada', 'reservada', 'mantenimiento'];
  const estadoLabels = {
    disponible: 'Disponibles',
    ocupada: 'Ocupadas',
    reservada: 'Reservadas',
    mantenimiento: 'Mantenimiento'
  };

  return (
    <div className="gestion-mesas">
      <div className="mesas-header">
        <div className="mesas-header-content">
          <Circle size={24} />
          <h2>Gestión de Mesas</h2>
        </div>
        <div className="mesas-header-actions">
          {mesas.length > 0 && (
            <div className="mesas-vista-toggle">
              <button
                className={`vista-toggle-btn ${vistaModo === 'planta' ? 'active' : ''}`}
                onClick={() => setVistaModo('planta')}
                title="Vista de Planta"
              >
                <Grid size={18} />
              </button>
              <button
                className={`vista-toggle-btn ${vistaModo === 'lista' ? 'active' : ''}`}
                onClick={() => setVistaModo('lista')}
                title="Vista de Lista"
              >
                <List size={18} />
              </button>
            </div>
          )}
          <button className="mesa-btn-primary" onClick={handleCrear}>
            <Plus size={18} />
            Nueva Mesa
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mesas-loading">
          <p>Cargando mesas...</p>
        </div>
      ) : mesas.length === 0 ? (
        <div className="mesas-empty">
          <Circle size={48} />
          <h3>No hay mesas creadas</h3>
          <p>Crea tu primera mesa para empezar a usarla en los pedidos</p>
          <button className="mesa-btn-primary" onClick={handleCrear}>
            <Plus size={18} />
            Crear Primera Mesa
          </button>
        </div>
      ) : vistaModo === 'planta' ? (
        <VistaPlanta
          mesas={mesas}
          onEditar={handleEditar}
          onEliminar={setMesaEliminando}
          onCambiarEstado={handleCambiarEstado}
          actualizarMesa={actualizarMesa}
          organizationId={organization.id}
        />
      ) : (
        <div className="mesas-container">
          {estadosOrden.map((estado) => {
            const mesasEstado = mesasPorEstado[estado];
            if (mesasEstado.length === 0) return null;

            return (
              <motion.div
                key={estado}
                className="mesas-estado-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: estadosOrden.indexOf(estado) * 0.1 }}
              >
                <div className="mesas-estado-header">
                  <div className="mesas-estado-indicator" style={{ backgroundColor: getMesaEstadoColor(estado) }} />
                  <h3>{estadoLabels[estado]}</h3>
                  <span className="mesas-count">{mesasEstado.length}</span>
                </div>
                <div className="mesas-grid">
                  {mesasEstado.map((mesa) => (
                    <motion.div
                      key={mesa.id}
                      className="mesa-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        borderColor: getMesaEstadoColor(mesa.estado),
                        borderLeftWidth: '4px'
                      }}
                    >
                      <div className="mesa-card-header">
                        <div className="mesa-card-title">
                          <h3>{mesa.numero}</h3>
                          <div
                            className="mesa-estado-badge"
                            style={{ backgroundColor: getMesaEstadoColor(mesa.estado) }}
                          >
                            <Circle size={8} fill="white" />
                            <span>{mesa.estado}</span>
                          </div>
                        </div>
                        <div className="mesa-card-actions">
                          <button
                            className="mesa-btn-icon"
                            onClick={() => handleEditar(mesa)}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="mesa-btn-icon mesa-btn-danger"
                            onClick={() => setMesaEliminando(mesa)}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mesa-card-body">
                        <div className="mesa-info">
                          <Users size={16} />
                          <span>{mesa.capacidad} {mesa.capacidad === 1 ? 'persona' : 'personas'}</span>
                        </div>
                        <button
                          className="mesa-btn-cambiar-estado"
                          onClick={() => handleCambiarEstado(mesa, getSiguienteEstado(mesa.estado))}
                          title={`Cambiar a ${getSiguienteEstado(mesa.estado)}`}
                        >
                          <RotateCcw size={14} />
                          Cambiar Estado
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <MesaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setMesaEditando(null);
        }}
        mesa={mesaEditando}
        onSave={handleGuardar}
      />

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {mesaEliminando && (
          <motion.div
            className="mesa-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMesaEliminando(null)}
          >
            <motion.div
              className="mesa-modal mesa-modal-confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>¿Eliminar mesa?</h3>
              <p>Estás a punto de eliminar "{mesaEliminando.numero}". Esta acción no se puede deshacer.</p>
              <div className="mesa-modal-actions">
                <button
                  className="mesa-btn-secondary"
                  onClick={() => setMesaEliminando(null)}
                >
                  Cancelar
                </button>
                <button
                  className="mesa-btn-danger"
                  onClick={handleEliminar}
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionMesas;

