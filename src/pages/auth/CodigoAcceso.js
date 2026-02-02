import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './CodigoAcceso.css';

const buildAccessKey = (userId, orgId) => `access_code_verified:${orgId}:${userId}`;

const generarCodigo = (digits = 6) => {
  let codigo = '';
  for (let i = 0; i < digits; i++) {
    codigo += Math.floor(Math.random() * 10).toString();
  }
  return codigo;
};

const CodigoAcceso = () => {
  const { user, userProfile, organization, loading, refreshProfile } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [savingOwnerCode, setSavingOwnerCode] = useState(false);
  const [savingMemberCode, setSavingMemberCode] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [memberHasNoCode, setMemberHasNoCode] = useState(false);
  const navigate = useNavigate();

  const orgId = organization?.id;
  const userId = user?.id;
  const isOwner = userProfile?.role === 'owner' || (organization?.owner_id && organization?.owner_id === userId);

  useEffect(() => {
    if (!loading && userId && orgId) {
      const key = buildAccessKey(userId, orgId);
      if (localStorage.getItem(key) === 'true') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, userId, orgId, navigate]);

  useEffect(() => {
    const loadMember = async () => {
      if (loading || !userId || !orgId || isOwner) {
        return;
      }
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('id, employee_code')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) {
        console.error('Error cargando código de empleado:', memberError);
        return;
      }

      if (member?.id) {
        setMemberId(member.id);
        setMemberHasNoCode(!member.employee_code);
      }
    };

    loadMember();
  }, [loading, userId, orgId, isOwner]);

  const handleGuardarOwnerCode = async () => {
    if (!orgId) return;
    setSavingOwnerCode(true);
    setError('');
    const nuevoCodigo = codigo.trim() || generarCodigo(6);
    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ owner_access_code: nuevoCodigo })
        .eq('id', orgId);
      if (updateError) {
        throw updateError;
      }
      await refreshProfile();
      setCodigo(nuevoCodigo);
    } catch (err) {
      console.error('Error guardando código del dueño:', err);
      setError('No se pudo guardar el código del dueño.');
    } finally {
      setSavingOwnerCode(false);
    }
  };

  const handleGuardarMemberCode = async () => {
    if (!memberId) return;
    setSavingMemberCode(true);
    setError('');
    const nuevoCodigo = codigo.trim() || generarCodigo(6);
    try {
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ employee_code: nuevoCodigo })
        .eq('id', memberId);
      if (updateError) {
        throw updateError;
      }
      setCodigo(nuevoCodigo);
      setMemberHasNoCode(false);
      localStorage.setItem(buildAccessKey(userId, orgId), 'true');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error guardando código del empleado:', err);
      setError('No se pudo guardar tu código. Intenta nuevamente.');
    } finally {
      setSavingMemberCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId || !orgId) {
      setError('No se encontró organización o usuario.');
      return;
    }

    const codeValue = codigo.trim();
    if (!codeValue) {
      setError('Ingresa el código de acceso.');
      return;
    }

    if (isOwner) {
      if (!organization?.owner_access_code) {
        setError('Configura primero el código del dueño.');
        return;
      }
      if (codeValue !== organization.owner_access_code) {
        setError('Código incorrecto.');
        return;
      }
    } else {
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('employee_code')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) {
        console.error('Error validando código:', memberError);
        setError('No se pudo validar el código. Intenta nuevamente.');
        return;
      }

      if (!member?.employee_code) {
        setError('Primero debes crear tu código de acceso.');
        return;
      }

      if (codeValue !== member.employee_code) {
        setError('Código incorrecto.');
        return;
      }
    }

    localStorage.setItem(buildAccessKey(userId, orgId), 'true');
    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="codigo-acceso-container">
        <div className="codigo-acceso-card">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="codigo-acceso-container">
      <div className="codigo-acceso-card">
        <div className="codigo-acceso-header">
          <ShieldCheck size={28} />
          <h2>Verificación de Acceso</h2>
        </div>
        <p className="codigo-acceso-subtitle">
          Ingresa el código para habilitar el acceso según tus permisos.
        </p>

        {isOwner && !organization?.owner_access_code && (
          <div className="codigo-acceso-owner-setup">
            <p>Primero debes crear el código del dueño.</p>
            <div className="codigo-acceso-input-group">
              <input
                type="text"
                className="codigo-acceso-input"
                placeholder="Ej: 123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              <button
                type="button"
                className="codigo-acceso-btn secundario"
                onClick={() => setCodigo(generarCodigo(6))}
                disabled={savingOwnerCode}
              >
                Generar
              </button>
              <button
                type="button"
                className="codigo-acceso-btn"
                onClick={handleGuardarOwnerCode}
                disabled={savingOwnerCode}
              >
                Guardar
              </button>
            </div>
            {error && <div className="codigo-acceso-error">{error}</div>}
          </div>
        )}

        {!isOwner && memberHasNoCode && (
          <div className="codigo-acceso-owner-setup">
            <p>Primero debes crear tu código de acceso.</p>
            <div className="codigo-acceso-input-group">
              <input
                type="text"
                className="codigo-acceso-input"
                placeholder="Ej: 123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              <button
                type="button"
                className="codigo-acceso-btn secundario"
                onClick={() => setCodigo(generarCodigo(6))}
                disabled={savingMemberCode}
              >
                Generar
              </button>
              <button
                type="button"
                className="codigo-acceso-btn"
                onClick={handleGuardarMemberCode}
                disabled={savingMemberCode}
              >
                Guardar
              </button>
            </div>
            {error && <div className="codigo-acceso-error">{error}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="codigo-acceso-label">
            <Key size={16} />
            Código de acceso
          </label>
          <input
            type="text"
            className="codigo-acceso-input"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ingresa tu código"
          />
          {error && <div className="codigo-acceso-error">{error}</div>}
          <button type="submit" className="codigo-acceso-btn">
            Verificar
          </button>
        </form>
      </div>
    </div>
  );
};

export default CodigoAcceso;
