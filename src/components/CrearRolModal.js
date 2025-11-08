import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Check, Shield, User, Star, Briefcase, Target, Key, Award, Users } from 'lucide-react';
import { MODULES } from '../constants/permissions';
import toast from 'react-hot-toast';
import './CrearRolModal.css';

// Iconos disponibles para roles personalizados
const ICON_OPTIONS = [
  { value: 'User', label: 'Usuario', Icon: User },
  { value: 'Star', label: 'Estrella', Icon: Star },
  { value: 'Shield', label: 'Escudo', Icon: Shield },
  { value: 'Briefcase', label: 'Maletín', Icon: Briefcase },
  { value: 'Target', label: 'Objetivo', Icon: Target },
  { value: 'Key', label: 'Llave', Icon: Key },
  { value: 'Award', label: 'Premio', Icon: Award },
  { value: 'Users', label: 'Equipo', Icon: Users },
];

const CrearRolModal = ({ open, onClose, onGuardar, roleToEdit, loading }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [icon, setIcon] = useState('User');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Si estamos editando, cargar datos del rol
  useEffect(() => {
    if (roleToEdit) {
      setNombre(roleToEdit.name || '');
      setDescripcion(roleToEdit.description || '');
      setColor(roleToEdit.color || '#6B7280');
      setIcon(roleToEdit.icon || 'User');
      setSelectedPermissions(roleToEdit.permissions || []);
    } else {
      // Limpiar formulario
      setNombre('');
      setDescripcion('');
      setColor('#6B7280');
      setIcon('User');
      setSelectedPermissions([]);
    }
  }, [roleToEdit, open]);

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(p => p !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleToggleModule = (module) => {
    const modulePermissions = Object.values(module.permissions).map(p => p.id);
    const allSelected = modulePermissions.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      // Deseleccionar todos los permisos del módulo
      setSelectedPermissions(prev => prev.filter(p => !modulePermissions.includes(p)));
    } else {
      // Seleccionar todos los permisos del módulo
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        modulePermissions.forEach(p => {
          if (!newPerms.includes(p)) {
            newPerms.push(p);
          }
        });
        return newPerms;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('Ingresa un nombre para el rol');
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error('Selecciona al menos un permiso');
      return;
    }

    onGuardar({
      id: roleToEdit?.id,
      name: nombre.trim(),
      description: descripcion.trim(),
      color,
      icon,
      permissions: selectedPermissions,
    });
  };

  const coloresPreset = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#8B5CF6', label: 'Morado' },
    { value: '#F59E0B', label: 'Amarillo' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Gris' },
  ];

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="crear-rol-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h2>
            <Shield size={24} />
            {roleToEdit ? 'Editar Rol Personalizado' : 'Crear Rol Personalizado'}
          </h2>
          <button className="btn-close" onClick={onClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Información básica */}
          <div className="form-section">
            <h3>
              <Shield size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
              Información Básica
            </h3>
            
            <div className="form-group">
              <label>Nombre del Rol *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Vendedor Senior, Supervisor de Turno..."
                required
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe las responsabilidades de este rol..."
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {coloresPreset.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-option ${color === c.value ? 'active' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Ícono</label>
                <div className="icon-picker">
                  {ICON_OPTIONS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      className={`icon-option ${icon === value ? 'active' : ''}`}
                      onClick={() => setIcon(value)}
                      title={label}
                    >
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vista previa */}
            <div className="rol-preview">
              <span className="preview-label">Vista Previa:</span>
              <div className="role-badge-preview" style={{ backgroundColor: color }}>
                {(() => {
                  const selectedIcon = ICON_OPTIONS.find(i => i.value === icon);
                  const IconComponent = selectedIcon?.Icon || User;
                  return <IconComponent size={16} />;
                })()}
                <span>{nombre || 'Nombre del Rol'}</span>
              </div>
            </div>
          </div>

          {/* Permisos */}
          <div className="form-section">
            <h3>
              <Shield size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
              Permisos del Rol
            </h3>
            <p className="section-description">
              Selecciona qué puede hacer este rol en el sistema
            </p>

            <div className="permissions-grid">
              {Object.values(MODULES).map((module) => {
                const modulePermissions = Object.values(module.permissions);
                const selectedCount = modulePermissions.filter(p =>
                  selectedPermissions.includes(p.id)
                ).length;
                const allSelected = selectedCount === modulePermissions.length;
                const someSelected = selectedCount > 0 && !allSelected;
                const ModuleIcon = module.IconComponent;

                return (
                  <div key={module.id} className="permission-module">
                    <div className="module-header">
                      <button
                        type="button"
                        className="module-toggle"
                        onClick={() => handleToggleModule(module)}
                      >
                        <div className={`module-checkbox ${allSelected ? 'checked' : ''} ${someSelected ? 'indeterminate' : ''}`}>
                          {allSelected && <Check size={14} />}
                          {someSelected && <div className="indeterminate-bar" />}
                        </div>
                        <span className="module-icon">
                          <ModuleIcon size={16} />
                        </span>
                        <span className="module-name">{module.label}</span>
                        <span className="module-count">({selectedCount}/{modulePermissions.length})</span>
                      </button>
                    </div>

                    <div className="permission-list">
                      {modulePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="permission-item"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handleTogglePermission(permission.id)}
                          />
                          <div className="permission-info">
                            <div className="permission-label">{permission.label}</div>
                            <div className="permission-description">{permission.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen */}
          <div className="permissions-summary">
            <strong>Permisos seleccionados:</strong> {selectedPermissions.length} de {Object.values(MODULES).reduce((acc, m) => acc + Object.keys(m.permissions).length, 0)}
          </div>

          {/* Acciones */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={18} />
              {loading ? 'Guardando...' : roleToEdit ? 'Guardar Cambios' : 'Crear Rol'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CrearRolModal;
