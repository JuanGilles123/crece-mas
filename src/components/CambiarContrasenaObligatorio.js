import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './CambiarContrasenaObligatorio.css';

const CambiarContrasenaObligatorio = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validations, setValidations] = useState({
    minLength: false,
    passwordsMatch: false
  });
  const navigate = useNavigate();

  const validatePassword = (password, confirmPassword) => {
    setValidations({
      minLength: password.length >= 4,
      passwordsMatch: password === confirmPassword && password.length > 0
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    validatePassword(newFormData.newPassword, newFormData.confirmPassword);
  };

  const isFormValid = () => {
    return Object.values(validations).every(v => v === true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error('Por favor completa todos los requisitos de la contraseña');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
        data: {
          needs_password_change: false // Marcar que ya cambió la contraseña
        }
      });

      if (error) throw error;

      toast.success('✅ Contraseña actualizada exitosamente');
      
      // Redirigir al dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }) => (
    <div className={`validation-item ${isValid ? 'valid' : 'invalid'}`}>
      {isValid ? <Check size={16} /> : <X size={16} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="cambiar-contrasena-obligatorio-container">
      <motion.div
        className="cambiar-contrasena-obligatorio-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="cambiar-contrasena-obligatorio-header">
          <div className="cambiar-contrasena-obligatorio-icon">
            <AlertCircle size={48} />
          </div>
          <h2>Cambio de Contraseña Requerido</h2>
          <p>
            Por seguridad, debes cambiar tu contraseña antes de continuar.
            Esta es tu primera vez iniciando sesión.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cambiar-contrasena-obligatorio-form">
          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              Nueva Contraseña *
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Ingresa tu nueva contraseña"
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              Confirmar Nueva Contraseña *
            </label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirma tu nueva contraseña"
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="eye-button"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="validations-container">
            <h4>Requisitos de la contraseña:</h4>
            <ValidationItem isValid={validations.minLength} text="Mínimo 4 caracteres" />
            <ValidationItem isValid={validations.passwordsMatch} text="Las contraseñas coinciden" />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!isFormValid() || loading}
          >
            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CambiarContrasenaObligatorio;
