import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';
import './CambiarContrasena.css';

const CambiarContrasena = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validations, setValidations] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    passwordsMatch: false
  });

  const validatePassword = (password, confirmPassword) => {
    setValidations({
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
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
      toast.error('Por favor completa todos los requisitos');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast.success('✅ Contraseña actualizada exitosamente');
      setFormData({ newPassword: '', confirmPassword: '' });
      setValidations({
        minLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
        passwordsMatch: false
      });
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
    <div className="cambiar-contrasena">
      <div className="info-box">
        <AlertCircle size={20} />
        <p>Por seguridad, te recomendamos usar una contraseña segura y cambiarla regularmente.</p>
      </div>
      <form onSubmit={handleSubmit} className="contrasena-form">
        <div className="form-group">
          <label htmlFor="newPassword">
            <Lock size={18} />
            Nueva Contraseña
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Ingresa tu nueva contraseña"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">
            <Lock size={18} />
            Confirmar Contraseña
          </label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirma tu nueva contraseña"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="validations-list">
          <h4>Requisitos de la contraseña:</h4>
          <ValidationItem isValid={validations.minLength} text="Mínimo 8 caracteres" />
          <ValidationItem isValid={validations.hasLowercase} text="Al menos una letra minúscula" />
          <ValidationItem isValid={validations.hasUppercase} text="Al menos una letra mayúscula" />
          <ValidationItem isValid={validations.hasNumber} text="Al menos un número" />
          <ValidationItem isValid={validations.passwordsMatch} text="Las contraseñas coinciden" />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !isFormValid()}
        >
          {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
        </button>
      </form>
    </div>
  );
};

export default CambiarContrasena;
