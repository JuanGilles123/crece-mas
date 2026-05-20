import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Settings, Building2, LogOut, Edit3, Save, X, Lock, Sliders, Bell, CreditCard, BarChart3, Crown, Sparkles, Shield, Key, Printer, Link, Copy, ExternalLink, Store, Palette, Instagram, Facebook, Phone, MessageSquare, Upload, Trash2, Image } from 'lucide-react';
import { Eye, EyeOff, Mail, ShieldCheck, Tag, Columns, Smartphone, Tablet, Monitor, Search, ShoppingCart } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { supabase } from '../../services/api/supabaseClient';
import { useUpdateEmployeeCredentials } from '../../hooks/useTeam';
import EditarCodigoEmpleadoModal from '../../components/EditarCodigoEmpleadoModal';
import PreferenciasAplicacion from '../../components/PreferenciasAplicacion';
import ConfiguracionImpresora from '../../components/ConfiguracionImpresora';
import { compressProductImage, compressPromoImage } from '../../services/storage/imageCompression';
import './Perfil.css';

const Perfil = () => {
  const { user, organization, hasRole, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isVIP, planName, hasFeature } = useSubscription();
  const [activeTab, setActiveTab] = useState('datos');
  const [activeConfigSection, setActiveConfigSection] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [mostrarStockBajo, setMostrarStockBajo] = useState(true);
  const [umbralStockBajo, setUmbralStockBajo] = useState('10');
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    const targetTab = location.state?.activeTab;
    if (targetTab) {
      setActiveTab(targetTab);
      setActiveConfigSection(null);
    }
  }, [location.state?.activeTab]);

  useEffect(() => {
    const metadata = user?.user_metadata || {};
    const mostrar = metadata.mostrarStockBajo !== false;
    const umbral = Number(metadata.umbralStockBajo);
    setMostrarStockBajo(mostrar);
    setUmbralStockBajo(Number.isFinite(umbral) && umbral > 0 ? String(umbral) : '10');
  }, [user]);

  const validatePassword = (password) => {
    if (!password || password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe tener al menos una letra mayúscula.';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe tener al menos una letra minúscula.';
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe tener al menos un número.';
    }
    return '';
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const error = validatePassword(newPassword);
    if (error) {
      toast.error(error);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      toast.success('Contraseña actualizada correctamente.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error actualizando contraseña:', err);
      toast.error('No se pudo actualizar la contraseña.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast.error('No se encontró el correo del usuario.');
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      toast.success('Te enviamos un correo para restablecer la contraseña.');
    } catch (err) {
      console.error('Error enviando correo:', err);
      toast.error('No se pudo enviar el correo de recuperación.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignOutOthers = async () => {
    setSigningOutOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      toast.success('Sesiones en otros dispositivos cerradas.');
    } catch (err) {
      console.error('Error cerrando otras sesiones:', err);
      toast.error('No se pudieron cerrar otras sesiones.');
    } finally {
      setSigningOutOthers(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    const umbral = Number(umbralStockBajo);
    if (!Number.isFinite(umbral) || umbral <= 0) {
      toast.error('Ingresa un umbral válido mayor a 0.');
      return;
    }
    setSavingNotifications(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          mostrarStockBajo,
          umbralStockBajo: umbral
        }
      });
      if (error) throw error;
      toast.success('Preferencias de notificaciones actualizadas.');
    } catch (err) {
      console.error('Error guardando notificaciones:', err);
      toast.error('No se pudieron guardar las notificaciones.');
    } finally {
      setSavingNotifications(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(user?.user_metadata?.full_name || '');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [editandoNombreNegocio, setEditandoNombreNegocio] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState(organization?.name || '');
  const [guardandoNombreNegocio, setGuardandoNombreNegocio] = useState(false);
  const [editandoSlug, setEditandoSlug] = useState(false);
  const [slugNegocio, setSlugNegocio] = useState(organization?.slug || '');
  const [guardandoSlug, setGuardandoSlug] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [editandoCodigo, setEditandoCodigo] = useState(false);
  const updateEmployeeCredentials = useUpdateEmployeeCredentials();

  const isSuperAdmin = user?.email === 'juanjosegilarbelaez@gmail.com';
  const hasDeveloperAccess = isVIP || isSuperAdmin || user?.user_metadata?.is_developer || userProfile?.role === 'developer';

  // Cargar datos del empleado si es empleado
  React.useEffect(() => {
    const cargarDatosEmpleado = async () => {
      if (!user?.id || !organization?.id) return;

      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .eq('is_employee', true)
          .maybeSingle();

        if (!error && data) {
          setEmployeeData(data);
        }
      } catch (error) {
        console.error('Error cargando datos de empleado:', error);
      }
    };

    cargarDatosEmpleado();
  }, [user?.id, organization?.id]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Usar signOut con scope local en lugar de global
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
        // Forzar limpieza local si falla el logout en servidor
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar limpieza local en caso de error
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleEditarNombre = () => {
    setEditandoNombre(true);
    setNombreCompleto(user?.user_metadata?.full_name || '');
  };

  const handleCancelarEdicion = () => {
    setEditandoNombre(false);
    setNombreCompleto(user?.user_metadata?.full_name || '');
  };

  const handleGuardarNombre = async () => {
    if (!nombreCompleto.trim()) {
      alert('Por favor ingresa un nombre válido');
      return;
    }

    setGuardandoNombre(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nombreCompleto.trim() }
      });

      if (error) {
        console.error('Error actualizando nombre:', error);
        alert('Error al actualizar el nombre. Intenta de nuevo.');
      } else {
        alert('Nombre actualizado exitosamente');
        setEditandoNombre(false);
        // El usuario se actualizará automáticamente por el listener de auth
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el nombre. Intenta de nuevo.');
    } finally {
      setGuardandoNombre(false);
    }
  };

  const handleEditarNombreNegocio = () => {
    setEditandoNombreNegocio(true);
    setNombreNegocio(organization?.name || '');
  };

  const handleCancelarEdicionNombreNegocio = () => {
    setEditandoNombreNegocio(false);
    setNombreNegocio(organization?.name || '');
  };

  const handleGuardarNombreNegocio = async () => {
    if (!nombreNegocio.trim()) {
      alert('Por favor ingresa un nombre de negocio válido');
      return;
    }

    if (!organization?.id) {
      alert('No se pudo identificar la organización');
      return;
    }

    setGuardandoNombreNegocio(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: nombreNegocio.trim() })
        .eq('id', organization.id);

      if (error) {
        console.error('Error actualizando nombre del negocio:', error);
        alert('Error al actualizar el nombre del negocio. Intenta de nuevo.');
      } else {
        alert('Nombre del negocio actualizado exitosamente');
        setEditandoNombreNegocio(false);
        // Actualizar el perfil en el contexto de manera reactiva (sin recargar la página)
        refreshProfile();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el nombre del negocio. Intenta de nuevo.');
    } finally {
      setGuardandoNombreNegocio(false);
    }
  };

  const handleEditarSlug = () => {
    setEditandoSlug(true);
    setSlugNegocio(organization?.slug || '');
  };

  const handleCancelarEdicionSlug = () => {
    setEditandoSlug(false);
    setSlugNegocio(organization?.slug || '');
  };

  const handleGuardarSlug = async () => {
    const formatSlug = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newSlug = formatSlug(slugNegocio);
    
    if (!newSlug) {
      toast.error('Por favor ingresa un enlace válido. Usa solo letras y números.');
      return;
    }

    if (!organization?.id) {
      toast.error('No se pudo identificar la organización');
      return;
    }

    setGuardandoSlug(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ slug: newSlug })
        .eq('id', organization.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Este enlace ya está en uso por otro negocio. Intenta con otro diferente.');
        } else {
          console.error('Error actualizando enlace:', error);
          toast.error('Error al actualizar el enlace. Intenta de nuevo.');
        }
      } else {
        toast.success('Enlace de tu catálogo actualizado exitosamente');
        setEditandoSlug(false);
        // Actualizar el perfil en el contexto de manera reactiva (sin recargar la página)
        refreshProfile();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el enlace. Intenta de nuevo.');
    } finally {
      setGuardandoSlug(false);
    }
  };

  // --- ESTADOS Y MANEJADORES PARA TIENDA VIRTUAL ---
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url || '');
  const [colorTema, setColorTema] = useState('#4f46e5');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('¡Hola! Bienvenidos a nuestra tienda virtual.');
  const [guardandoCatalogoConfig, setGuardandoCatalogoConfig] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'mobile', 'tablet', 'pc'

  // Nuevos estados para promociones y diseño
  const [layoutCategorias, setLayoutCategorias] = useState('top');
  const [promociones, setPromociones] = useState([]);
  const [subiendoPromocion, setSubiendoPromocion] = useState(false);
  const [nuevoTituloPromo, setNuevoTituloPromo] = useState('');
  const [nuevoEnlaceFiltro, setNuevoEnlaceFiltro] = useState('');
  const promocionInputRef = useRef(null);

  // Estados de Colores Configurables
  const [colorFondo, setColorFondo] = useState('#f9fafb');
  const [colorBotones, setColorBotones] = useState('#4f46e5');
  const [colorTextoBotones, setColorTextoBotones] = useState('#ffffff');
  const [colorHeader, setColorHeader] = useState('#ffffff');
  const [colorTextoHeader, setColorTextoHeader] = useState('#111827');
  const [fuentePrincipal, setFuentePrincipal] = useState('Inter');

  const handleTriggerPromoUpload = () => {
    promocionInputRef.current?.click();
  };

  const handlePromoFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSubiendoPromocion(true);
      try {
        const orgId = organization?.id;
        if (!orgId) throw new Error('No se pudo identificar la organización');

        const nuevasPromos = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const imgComprimida = await compressPromoImage(file);
          const timestamp = Date.now() + i;
          const extension = imgComprimida.name.split('.').pop() || 'png';
          const nombreArchivo = `${orgId}/promociones/promo_${timestamp}.${extension}`;

          const { error: errorUpload } = await supabase.storage
            .from('productos')
            .upload(nombreArchivo, imgComprimida);

          if (errorUpload) {
            toast.error(`Error al subir ${file.name}`);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from('productos')
            .getPublicUrl(nombreArchivo);

          nuevasPromos.push({
            id: timestamp,
            imagen_url: publicUrlData.publicUrl,
            titulo: nuevoTituloPromo || '',
            enlace_filtro: nuevoEnlaceFiltro || ''
          });
        }

        if (nuevasPromos.length > 0) {
          setPromociones(prev => [...prev, ...nuevasPromos]);
          setNuevoTituloPromo('');
          setNuevoEnlaceFiltro('');
          toast.success(`¡Se cargaron ${nuevasPromos.length} imágenes de promoción!`);
        }
      } catch (error) {
        console.error('Error al subir promociones:', error);
        toast.error(error?.message || 'Error al subir las promociones');
      } finally {
        setSubiendoPromocion(false);
        e.target.value = '';
      }
    }
  };

  const handleEliminarPromocion = (id) => {
    setPromociones(prev => prev.filter(p => p.id !== id));
    toast.success('Promoción eliminada de la lista');
  };

  // Refs y estados para la carga de Logo
  const logoInputRef = useRef(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mostrarUrlLogo, setMostrarUrlLogo] = useState(false);

  const handleTriggerLogoUpload = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSubiendoLogo(true);
      try {
        const logoComprimido = await compressProductImage(file);
        const orgId = organization?.id;
        if (!orgId) {
          throw new Error('No se pudo identificar la organización');
        }

        const timestamp = Date.now();
        const extension = logoComprimido.name.split('.').pop() || 'png';
        const nombreArchivo = `${orgId}/logos/logo_${timestamp}.${extension}`;

        const { error: errorUpload } = await supabase.storage
          .from('productos')
          .upload(nombreArchivo, logoComprimido);

        if (errorUpload) throw errorUpload;

        const { data: publicUrlData } = supabase.storage
          .from('productos')
          .getPublicUrl(nombreArchivo);

        setLogoUrl(publicUrlData.publicUrl);
        toast.success('¡Logo cargado exitosamente!');
      } catch (error) {
        console.error('Error al subir logo:', error);
        toast.error(error?.message || 'Error al subir el logo. Intenta de nuevo.');
      } finally {
        setSubiendoLogo(false);
      }
    }
  };

  useEffect(() => {
    if (organization) {
      setLogoUrl(organization.logo_url || '');
      const config = organization.catalogo_config || {};
      setColorTema(config.color_tema || '#4f46e5');
      setWhatsapp(config.whatsapp || '');
      setInstagram(config.instagram || '');
      setFacebook(config.facebook || '');
      setMensajeBienvenida(config.mensaje_bienvenida || '¡Hola! Bienvenidos a nuestra tienda virtual.');
      setLayoutCategorias(config.layout_categorias || 'top');
      setPromociones(config.promociones || []);
      
      // Cargar Colores Personalizados
      setColorFondo(config.color_fondo || '#f9fafb');
      setColorBotones(config.color_botones || config.color_tema || '#4f46e5');
      setColorTextoBotones(config.color_texto_botones || '#ffffff');
      setColorHeader(config.color_header || '#ffffff');
      setColorTextoHeader(config.color_texto_header || '#111827');
      setFuentePrincipal(config.fuente_principal || 'Inter');
    }
  }, [organization]);

  // Efecto para cargar dinámicamente la tipografía seleccionada para la vista previa en tiempo real
  useEffect(() => {
    if (fuentePrincipal) {
      const fontId = 'preview-google-font';
      let linkEl = document.getElementById(fontId);
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = fontId;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      const encoded = encodeURIComponent(fuentePrincipal);
      linkEl.href = `https://fonts.googleapis.com/css2?family=${encoded.replace(/%20/g, '+')}:wght@400;500;600;700;800&display=swap`;
    }
  }, [fuentePrincipal]);

  const handleGuardarConfigCatalogo = async () => {
    if (!organization?.id) {
      toast.error('No se pudo identificar la organización');
      return;
    }

    setGuardandoCatalogoConfig(true);
    try {
      // Si el usuario escribió una leyenda o un enlace en el campo superior pero no ha sido asociada (UX fix)
      let promosActualizadas = [...promociones];
      if ((nuevoTituloPromo.trim() || nuevoEnlaceFiltro.trim()) && promosActualizadas.length > 0) {
        const ultimoIndex = promosActualizadas.length - 1;
        if (!promosActualizadas[ultimoIndex].titulo && !promosActualizadas[ultimoIndex].enlace_filtro) {
          promosActualizadas[ultimoIndex] = {
            ...promosActualizadas[ultimoIndex],
            titulo: nuevoTituloPromo.trim(),
            enlace_filtro: nuevoEnlaceFiltro.trim()
          };
          setPromociones(promosActualizadas);
          setNuevoTituloPromo('');
          setNuevoEnlaceFiltro('');
        }
      }

      const configJson = {
        color_tema: colorTema,
        whatsapp: whatsapp,
        instagram: instagram,
        facebook: facebook,
        mensaje_bienvenida: mensajeBienvenida,
        layout_categorias: layoutCategorias,
        promociones: promosActualizadas,
        color_fondo: colorFondo,
        color_botones: colorBotones,
        color_texto_botones: colorTextoBotones,
        color_header: colorHeader,
        color_texto_header: colorTextoHeader,
        fuente_principal: fuentePrincipal
      };

      const { error } = await supabase
        .from('organizations')
        .update({ 
          logo_url: logoUrl,
          catalogo_config: configJson
        })
        .eq('id', organization.id);

      if (error) {
        console.error('Error actualizando configuración de catálogo:', error);
        toast.error('Error al guardar la configuración.');
      } else {
        toast.success('Configuración de catálogo guardada exitosamente');
        // Actualizar el perfil en el contexto de manera reactiva (sin recargar la página)
        refreshProfile();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la configuración.');
    } finally {
      setGuardandoCatalogoConfig(false);
    }
  };

  const tabs = [
    { id: 'datos', label: 'Datos Personales', icon: User },
    { id: 'catalogo', label: 'Tienda Virtual', icon: Store },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="perfil-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="perfil-header" variants={itemVariants}>
        <div className="perfil-user-info">
          <motion.div 
            className="perfil-avatar"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <User className="perfil-avatar-icon" />
          </motion.div>
          <div className="perfil-user-details">
            <motion.h1 
              className="perfil-user-name"
              variants={itemVariants}
            >
              {user?.user_metadata?.full_name || user?.email || 'Usuario'}
            </motion.h1>
            <motion.p 
              className="perfil-user-email"
              variants={itemVariants}
            >
              {user?.email}
            </motion.p>
            <motion.p 
              className="perfil-user-role"
              variants={itemVariants}
            >
              Administrador
            </motion.p>
          </div>
        </div>
        <motion.button 
          className="perfil-logout-btn"
          onClick={handleLogout}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          variants={itemVariants}
        >
          <LogOut className="perfil-logout-icon" />
          {loading ? 'Cerrando...' : 'Cerrar Sesión'}
        </motion.button>
      </motion.div>

      <div className="perfil-content">
        <div className="perfil-sidebar">
          <nav className="perfil-nav">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  className={`perfil-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="perfil-nav-icon" />
                  {tab.label}
                </motion.button>
              );
            })}
          </nav>
        </div>

        <motion.div 
          className="perfil-main"
          variants={itemVariants}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'datos' && (
              <motion.div
                key="datos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
            <div className="perfil-section">
              <h2 className="perfil-section-title">Datos Personales</h2>
              
              {/* Banner de Suscripción de la Organización */}
              {!isVIP && (
                <motion.div 
                  className={`org-subscription-banner ${(planName || 'gratis').toLowerCase()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="banner-icon">
                    {(planName === 'Gratis' || !planName) ? (
                      <Building2 size={24} />
                    ) : (
                      <Crown size={24} />
                    )}
                  </div>
                  <div className="banner-content">
                    <h4>Plan de tu Organización</h4>
                    <p>
                      {(planName === 'Gratis' || !planName)
                        ? 'Tu organización está en el plan gratuito. Actualiza para desbloquear más funciones.'
                        : `Tu organización tiene acceso completo con el plan ${planName}. ¡Disfruta de todas las funciones!`
                      }
                    </p>
                  </div>
                  <button 
                    className="banner-btn"
                    onClick={() => navigate('/dashboard/suscripcion')}
                  >
                    Ver Plan
                  </button>
                </motion.div>
              )}

              {/* Banner VIP */}
              {isVIP && (
                <motion.div 
                  className="org-subscription-banner vip"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="banner-icon vip-icon">
                    <Sparkles size={24} />
                  </div>
                  <div className="banner-content">
                    <h4>🌟 VIP Developer Access</h4>
                    <p>
                      Tienes acceso ilimitado a todas las funciones de la plataforma como desarrollador VIP.
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="perfil-datos-grid">
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Nombre del Negocio</label>
                  {editandoNombreNegocio ? (
                    <div className="perfil-edit-form">
                      <input
                        type="text"
                        value={nombreNegocio}
                        onChange={(e) => setNombreNegocio(e.target.value)}
                        className="perfil-edit-input"
                        placeholder="Ingresa el nombre de tu negocio"
                        disabled={guardandoNombreNegocio}
                      />
                      <div className="perfil-edit-actions">
                        <button
                          className="perfil-edit-btn perfil-edit-save"
                          onClick={handleGuardarNombreNegocio}
                          disabled={guardandoNombreNegocio}
                        >
                          <Save size={16} />
                          {guardandoNombreNegocio ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          className="perfil-edit-btn perfil-edit-cancel"
                          onClick={handleCancelarEdicionNombreNegocio}
                          disabled={guardandoNombreNegocio}
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="perfil-dato-display">
                      <p className="perfil-dato-value">
                        {organization?.name || 'No especificado'}
                      </p>
                      <button
                        className="perfil-edit-btn perfil-edit-start"
                        onClick={handleEditarNombreNegocio}
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                    </div>
                  )}
                </div>


                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Nombre Completo</label>
                  {editandoNombre ? (
                    <div className="perfil-edit-form">
                      <input
                        type="text"
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                        className="perfil-edit-input"
                        placeholder="Ingresa tu nombre completo"
                        disabled={guardandoNombre}
                      />
                      <div className="perfil-edit-actions">
                        <button
                          className="perfil-edit-btn perfil-edit-save"
                          onClick={handleGuardarNombre}
                          disabled={guardandoNombre}
                        >
                          <Save size={16} />
                          {guardandoNombre ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          className="perfil-edit-btn perfil-edit-cancel"
                          onClick={handleCancelarEdicion}
                          disabled={guardandoNombre}
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="perfil-dato-display">
                      <p className="perfil-dato-value">
                        {user?.user_metadata?.full_name || 'No especificado'}
                      </p>
                      <button
                        className="perfil-edit-btn perfil-edit-start"
                        onClick={handleEditarNombre}
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                    </div>
                  )}
                </div>
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Email</label>
                  <p className="perfil-dato-value">{user?.email}</p>
                </div>
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">ID de Usuario</label>
                  <p className="perfil-dato-value">{user?.id}</p>
                </div>
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Fecha de Registro</label>
                  <p className="perfil-dato-value">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-CO') : 'No disponible'}
                  </p>
                </div>
                {employeeData && (
                  <div className="perfil-dato-item">
                    <label className="perfil-dato-label">
                      <Key size={16} style={{ marginRight: '0.5rem' }} />
                      Usuario de Empleado
                    </label>
                    <div className="perfil-dato-display">
                      <p className="perfil-dato-value" style={{ fontFamily: 'Courier New, monospace' }}>
                        {employeeData.employee_username || employeeData.employee_code || 'Sin usuario'}
                      </p>
                      <button
                        className="perfil-edit-btn perfil-edit-start"
                        onClick={() => setEditandoCodigo(true)}
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'catalogo' && (
            <motion.div
              key="catalogo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="perfil-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="perfil-section-title" style={{ margin: 0 }}>Diseño y Datos de tu Tienda Virtual</h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Personaliza el aspecto visual y la información de contacto de tu catálogo público.
                    </p>
                  </div>
                  {organization?.slug && (
                    <button
                      className="btn-action"
                      style={{ background: '#02A5E0', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      onClick={() => window.open(`/tienda/${organization.slug}`, '_blank')}
                    >
                      <ExternalLink size={16} /> Ver Catálogo
                    </button>
                  )}
                </div>

                <div className="perfil-catalogo-layout" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: previewDevice === 'pc' ? '1fr 500px' : previewDevice === 'tablet' ? '1fr 380px' : '1fr 320px', 
                  gap: '2rem',
                  transition: 'grid-template-columns 0.3s ease'
                }}>
                  
                  {/* Formulario de Configuración */}
                  <div className="perfil-catalogo-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Tarjeta: Enlace del Catálogo Público */}
                    <div className="perfil-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link size={18} style={{ color: 'var(--catalogo-theme-color, #4f46e5)' }} /> Enlace de tu Catálogo Público
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        Comparte este enlace con tus clientes para que puedan ver tus productos disponibles y hacer pedidos desde su celular.
                      </p>
                      
                      {editandoSlug ? (
                        <div className="perfil-edit-form" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', paddingRight: '0.5rem', overflow: 'hidden' }}>
                            <span style={{ padding: '0.5rem 0.75rem', color: '#6b7280', borderRight: '1px solid #d1d5db', background: '#e5e7eb', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                              {window.location.origin}/tienda/
                            </span>
                            <input
                              type="text"
                              value={slugNegocio}
                              onChange={(e) => setSlugNegocio(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              style={{ border: 'none', padding: '0.5rem 0.75rem', flex: 1, outline: 'none', background: 'transparent', fontSize: '1rem', color: '#111827' }}
                              placeholder="tu-negocio"
                              disabled={guardandoSlug}
                            />
                          </div>
                          <div className="perfil-edit-actions" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="perfil-edit-btn perfil-edit-save"
                              onClick={handleGuardarSlug}
                              disabled={guardandoSlug}
                              style={{ background: '#02A5E0', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Save size={16} />
                              {guardandoSlug ? 'Guardando...' : 'Guardar Enlace'}
                            </button>
                            <button
                              className="perfil-edit-btn perfil-edit-cancel"
                              onClick={handleCancelarEdicionSlug}
                              disabled={guardandoSlug}
                              style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <X size={16} />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="perfil-dato-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px dashed #cbd5e1', width: '100%' }}>
                          {organization?.slug ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '1rem', color: '#02A5E0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {window.location.origin}/tienda/{organization.slug}
                                </div>
                                <button
                                  className="btn-action"
                                  style={{ background: '#111827', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/tienda/${organization.slug}`);
                                    toast.success('¡Enlace copiado al portapapeles!');
                                  }}
                                >
                                  <Copy size={16} /> Copiar
                                </button>
                                <button
                                  className="btn-action"
                                  style={{ background: '#e2e8f0', color: '#111827', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => window.open(`/tienda/${organization.slug}`, '_blank')}
                                >
                                  <ExternalLink size={16} /> Visitar
                                </button>
                              </div>
                              <button
                                className="perfil-edit-btn perfil-edit-start"
                                onClick={handleEditarSlug}
                                style={{ alignSelf: 'flex-start', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#02A5E0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                              >
                                <Edit3 size={16} />
                                Cambiar nombre del enlace
                              </button>
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                              <p style={{ color: '#d97706', fontWeight: '500', fontSize: '0.9rem', margin: 0 }}>
                                ⚠️ Aún no has configurado tu enlace de catálogo.
                              </p>
                              <button
                                className="perfil-edit-btn perfil-edit-start"
                                onClick={handleEditarSlug}
                                style={{ background: '#02A5E0', color: 'white', border: 'none', alignSelf: 'flex-start', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 600 }}
                              >
                                <Link size={16} />
                                Crear Enlace Ahora
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tarjeta: Estética */}
                    <div className="perfil-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Palette size={18} style={{ color: '#4f46e5' }} /> Estética de la Tienda
                      </h3>
                      
                      {/* Logo */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Logo del Negocio
                        </label>
                        
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Botón de Cargar Archivo */}
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              type="button"
                              onClick={handleTriggerLogoUpload}
                              disabled={subiendoLogo}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1rem',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                                transition: 'all 0.2s',
                              }}
                            >
                              <Upload size={16} />
                              {subiendoLogo ? 'Subiendo logo...' : 'Subir desde dispositivo'}
                            </button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileChange}
                              ref={logoInputRef}
                              style={{ display: 'none' }}
                            />
                          </div>

                          {/* Previsualización del Logo cargado */}
                          {logoUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <img
                                src={logoUrl}
                                alt="Logo Previsualización"
                                style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Logo activo</span>
                                <button
                                  type="button"
                                  onClick={() => setLogoUrl('')}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', padding: 0, textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  Eliminar logo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Sin logo seleccionado</span>
                          )}
                        </div>

                        {/* Input de URL alternativo */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }} onClick={() => setMostrarUrlLogo(!mostrarUrlLogo)}>
                            {mostrarUrlLogo ? 'Ocultar campo de dirección URL' : '✍️ ¿Prefieres ingresar una dirección URL web? Haz click aquí'}
                          </span>
                          {mostrarUrlLogo && (
                            <input
                              type="text"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="https://ejemplo.com/logo.png"
                              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', marginTop: '0.25rem' }}
                            />
                          )}
                        </div>

                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                          Sube una imagen cuadrada (PNG, JPG o WebP) para que tu tienda luzca excelente.
                        </p>
                      </div>

                      {/* Color del Tema */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#475569' }}>Color Principal de Marca</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {[
                            { name: 'Azul Cobalto', value: '#02A5E0' },
                            { name: 'Esmeralda Premium', value: '#059669' },
                            { name: 'Púrpura Imperial', value: '#7c3aed' },
                            { name: 'Rosa Coral', value: '#db2777' },
                            { name: 'Naranja Sunset', value: '#ea580c' },
                            { name: 'Negro Luxury', value: '#111827' },
                            { name: 'Indigo Original', value: '#4f46e5' },
                            { name: 'Rojo Ruby', value: '#e11d48' },
                          ].map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                setColorTema(color.value);
                                setColorBotones(color.value);
                              }}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: color.value,
                                border: colorTema === color.value ? '3px solid #1e293b' : '1px solid #cbd5e1',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                transform: colorTema === color.value ? 'scale(1.1)' : 'scale(1)'
                              }}
                              title={color.name}
                            />
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              border: '2px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colorTema,
                              position: 'relative',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <input
                                type="color"
                                value={colorTema}
                                onChange={(e) => {
                                  setColorTema(e.target.value);
                                  setColorBotones(e.target.value);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  left: '-4px',
                                  width: '40px',
                                  height: '40px',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  opacity: 0
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#475569', fontFamily: 'monospace', fontWeight: '600' }}>{colorTema}</span>
                          </div>
                        </div>

                        {/* Colores Personalizados Avanzados */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Palette size={14} style={{ color: '#64748b' }} /> Color de Fondo
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colorFondo,
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }}>
                                <input
                                  type="color"
                                  value={colorFondo}
                                  onChange={(e) => setColorFondo(e.target.value)}
                                  style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    left: '-4px',
                                    width: '36px',
                                    height: '36px',
                                    border: 'none',
                                    padding: 0,
                                    margin: 0,
                                    cursor: 'pointer',
                                    opacity: 0
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>{colorFondo}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>🔲 Color de Botones</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colorBotones,
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }}>
                                <input
                                  type="color"
                                  value={colorBotones}
                                  onChange={(e) => {
                                    setColorBotones(e.target.value);
                                    setColorTema(e.target.value);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    left: '-4px',
                                    width: '36px',
                                    height: '36px',
                                    border: 'none',
                                    padding: 0,
                                    margin: 0,
                                    cursor: 'pointer',
                                    opacity: 0
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>{colorBotones}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>🔤 Texto de Botones</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colorTextoBotones,
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }}>
                                <input
                                  type="color"
                                  value={colorTextoBotones}
                                  onChange={(e) => setColorTextoBotones(e.target.value)}
                                  style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    left: '-4px',
                                    width: '36px',
                                    height: '36px',
                                    border: 'none',
                                    padding: 0,
                                    margin: 0,
                                    cursor: 'pointer',
                                    opacity: 0
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>{colorTextoBotones}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Tag size={14} style={{ color: '#64748b' }} /> Fondo del Encabezado
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colorHeader,
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }}>
                                <input
                                  type="color"
                                  value={colorHeader}
                                  onChange={(e) => setColorHeader(e.target.value)}
                                  style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    left: '-4px',
                                    width: '36px',
                                    height: '36px',
                                    border: 'none',
                                    padding: 0,
                                    margin: 0,
                                    cursor: 'pointer',
                                    opacity: 0
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>{colorHeader}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>✏️ Texto del Encabezado</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1.5px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colorTextoHeader,
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }}>
                                <input
                                  type="color"
                                  value={colorTextoHeader}
                                  onChange={(e) => setColorTextoHeader(e.target.value)}
                                  style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    left: '-4px',
                                    width: '36px',
                                    height: '36px',
                                    border: 'none',
                                    padding: 0,
                                    margin: 0,
                                    cursor: 'pointer',
                                    opacity: 0
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>{colorTextoHeader}</span>
                            </div>
                          </div>
                        </div>

                        {/* Tipografía */}
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.6rem' }}>🔡 Tipografía de la Tienda</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                            {[
                              { nombre: 'Inter', label: 'Inter (Moderna)' },
                              { nombre: 'Poppins', label: 'Poppins (Elegante)' },
                              { nombre: 'Montserrat', label: 'Montserrat (Bold)' },
                              { nombre: 'Lato', label: 'Lato (Limpia)' },
                              { nombre: 'Playfair Display', label: 'Playfair (Lujo)' },
                              { nombre: 'Nunito', label: 'Nunito (Amigable)' },
                              { nombre: 'Raleway', label: 'Raleway (Fashion)' },
                              { nombre: 'Roboto', label: 'Roboto (Tech)' },
                            ].map((fuente) => (
                              <button
                                key={fuente.nombre}
                                type="button"
                                onClick={() => setFuentePrincipal(fuente.nombre)}
                                style={{
                                  padding: '0.5rem 0.6rem',
                                  border: fuentePrincipal === fuente.nombre ? `2px solid ${colorBotones}` : '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  background: fuentePrincipal === fuente.nombre ? `${colorBotones}15` : '#ffffff',
                                  cursor: 'pointer',
                                  fontSize: '0.78rem',
                                  fontWeight: fuentePrincipal === fuente.nombre ? '700' : '500',
                                  color: fuentePrincipal === fuente.nombre ? colorBotones : '#475569',
                                  fontFamily: fuente.nombre,
                                  transition: 'all 0.15s',
                                  textAlign: 'left',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {fuente.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Diseño de Categorías */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#475569' }}>Diseño de Categorías (Pestañas)</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => setLayoutCategorias('top')}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: layoutCategorias === 'top' ? colorTema : '#ffffff',
                              color: layoutCategorias === 'top' ? '#ffffff' : '#475569',
                              border: layoutCategorias === 'top' ? '1px solid transparent' : '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.25rem',
                              boxShadow: layoutCategorias === 'top' ? `0 4px 6px -1px ${colorTema}33` : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                               <Sliders size={16} /> Superior Deslizable
                             </span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 'normal' }}>Píldoras horizontales en el encabezado</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLayoutCategorias('side')}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: layoutCategorias === 'side' ? colorTema : '#ffffff',
                              color: layoutCategorias === 'side' ? '#ffffff' : '#475569',
                              border: layoutCategorias === 'side' ? '1px solid transparent' : '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.25rem',
                              boxShadow: layoutCategorias === 'side' ? `0 4px 6px -1px ${colorTema}33` : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                               <Columns size={16} /> Lateral Izquierdo
                             </span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 'normal' }}>Menú lateral profesional (en PC)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta: Banners y Promociones */}
                    <div className="perfil-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Image size={18} style={{ color: '#ec4899' }} /> Banners y Promociones Destacadas
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                        Sube imágenes promocionales (ofertas, lanzamientos, anuncios) para mostrar un carrete deslizante interactivo en la parte superior de tu tienda.
                      </p>

                      {/* Cargador de Promociones */}
                      <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Título o Leyenda de la Promoción (Opcional)</label>
                            <input
                              type="text"
                              value={nuevoTituloPromo}
                              onChange={(e) => setNuevoTituloPromo(e.target.value)}
                              placeholder="Ej: ¡25% en Correctores Bloomshell!"
                              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Búsqueda/Filtro al hacer clic (Opcional)</label>
                            <input
                              type="text"
                              value={nuevoEnlaceFiltro}
                              onChange={(e) => setNuevoEnlaceFiltro(e.target.value)}
                              placeholder="Ej: corrector bloomshell"
                              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                            />
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={handleTriggerPromoUpload}
                            disabled={subiendoPromocion}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.6rem 1rem',
                              background: colorBotones,
                              color: colorTextoBotones,
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: `0 4px 6px -1px ${colorBotones}33`
                            }}
                          >
                            <Upload size={16} />
                            {subiendoPromocion ? 'Subiendo imagen...' : 'Subir Banner de Promoción'}
                          </button>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePromoFileChange}
                            ref={promocionInputRef}
                            style={{ display: 'none' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Recomendado: Imágenes horizontales de aspecto 16:9 o rectangular.</span>
                      </div>

                      {/* Lista de Promociones Activas */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#475569' }}>Promociones Activas ({promociones.length})</label>
                        {promociones.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            Aún no has agregado banners de promociones.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            {promociones.map((promo, index) => (
                              <div key={promo.id || index} style={{ position: 'relative', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <img
                                  src={promo.imagen_url}
                                  alt={promo.titulo}
                                  style={{ width: '100%', height: '100px', objectFit: 'cover', background: '#f1f5f9' }}
                                />
                                <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {/* Título overlay */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b' }}>📝 Título en Imagen</span>
                                    <input
                                      type="text"
                                      value={promo.titulo || ''}
                                      onChange={(e) => {
                                        const nuevoValor = e.target.value;
                                        setPromociones(prev => prev.map(p => p.id === promo.id ? { ...p, titulo: nuevoValor } : p));
                                      }}
                                      placeholder="Ej: ¡25% en Correctores!"
                                      style={{
                                        fontSize: '0.75rem',
                                        padding: '0.3rem 0.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        width: '100%',
                                        outline: 'none',
                                        color: '#334155'
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Criterio de búsqueda */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b' }}>🔗 Criterio de Búsqueda</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <input
                                        type="text"
                                        value={promo.enlace_filtro || ''}
                                        onChange={(e) => {
                                          const nuevoValor = e.target.value;
                                          setPromociones(prev => prev.map(p => p.id === promo.id ? { ...p, enlace_filtro: nuevoValor } : p));
                                        }}
                                        placeholder="Ej: corrector bloomshell"
                                        style={{
                                          fontSize: '0.75rem',
                                          padding: '0.3rem 0.5rem',
                                          border: '1px solid #e2e8f0',
                                          borderRadius: '6px',
                                          width: '100%',
                                          outline: 'none',
                                          color: '#334155'
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleEliminarPromocion(promo.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                                        title="Eliminar promoción"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tarjeta: Mensaje de Bienvenida */}
                    <div className="perfil-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={18} style={{ color: '#10b981' }} /> Banner y Mensaje de Bienvenida
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#475569' }}>Mensaje Informativo de Portada</label>
                        <textarea
                          rows={2}
                          value={mensajeBienvenida}
                          onChange={(e) => setMensajeBienvenida(e.target.value)}
                          placeholder="Ej: ¡Bienvenidos a nuestro catálogo! Agrega productos al carrito y envíanos tu pedido directamente por WhatsApp."
                          style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    {/* Tarjeta: Contacto y Redes */}
                    <div className="perfil-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={18} style={{ color: '#f59e0b' }} /> Contacto y Redes Sociales
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>WhatsApp para Pedidos</label>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', paddingLeft: '0.75rem', overflow: 'hidden' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem', marginRight: '0.25rem' }}>+</span>
                            <input
                              type="tel"
                              value={whatsapp}
                              onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="573001234567"
                              style={{ border: 'none', outline: 'none', padding: '0.6rem 0.5rem', width: '100%', fontSize: '0.95rem' }}
                            />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Código de país + número, sin espacios.</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Instagram (Usuario)</label>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', paddingLeft: '0.75rem', overflow: 'hidden' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem', marginRight: '0.25rem' }}>@</span>
                            <input
                              type="text"
                              value={instagram}
                              onChange={(e) => setInstagram(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                              placeholder="mi_negocio"
                              style={{ border: 'none', outline: 'none', padding: '0.6rem 0.5rem', width: '100%', fontSize: '0.95rem' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Página de Facebook (URL)</label>
                        <input
                          type="text"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          placeholder="https://facebook.com/mi.negocio"
                          style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                        />
                      </div>
                    </div>

                    {/* Botón de guardar */}
                    <button
                      className="perfil-edit-btn perfil-edit-save"
                      onClick={handleGuardarConfigCatalogo}
                      disabled={guardandoCatalogoConfig}
                      style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', alignSelf: 'flex-start', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Save size={18} />
                      {guardandoCatalogoConfig ? 'Guardando...' : 'Guardar Todo'}
                    </button>

                  </div>

                  {/* Vista Previa Multidispositivo */}
                  <div className="perfil-catalogo-preview" style={{ 
                    position: 'sticky', 
                    top: '2rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', width: '100%', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: 0, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Sparkles size={16} style={{ color: 'var(--catalogo-theme-color, #4f46e5)' }} /> Vista Previa Interactiva
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, textAlign: 'center' }}>
                        Visualiza los cambios en tiempo real en diferentes pantallas.
                      </p>
                    </div>

                    {/* Selector de Dispositivo */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '0.35rem', 
                      background: '#e2e8f0', 
                      padding: '0.3rem', 
                      borderRadius: '10px', 
                      width: 'fit-content'
                    }}>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.85rem',
                          background: previewDevice === 'mobile' ? '#ffffff' : 'transparent',
                          color: previewDevice === 'mobile' ? 'var(--catalogo-theme-color, #4f46e5)' : '#475569',
                          border: 'none',
                          borderRadius: '7px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: previewDevice === 'mobile' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Smartphone size={14} /> Móvil
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.85rem',
                          background: previewDevice === 'tablet' ? '#ffffff' : 'transparent',
                          color: previewDevice === 'tablet' ? 'var(--catalogo-theme-color, #4f46e5)' : '#475569',
                          border: 'none',
                          borderRadius: '7px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: previewDevice === 'tablet' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Tablet size={14} /> Tablet
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('pc')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.85rem',
                          background: previewDevice === 'pc' ? '#ffffff' : 'transparent',
                          color: previewDevice === 'pc' ? 'var(--catalogo-theme-color, #4f46e5)' : '#475569',
                          border: 'none',
                          borderRadius: '7px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: previewDevice === 'pc' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Monitor size={14} /> PC
                      </button>
                    </div>
                    
                    {/* Dispositivo de simulación */}
                    <div style={{ 
                      width: previewDevice === 'pc' ? '100%' : previewDevice === 'tablet' ? '330px' : '270px',
                      maxWidth: '100%',
                      height: '520px', 
                      background: colorFondo, 
                      border: previewDevice === 'pc' ? '1px solid #cbd5e1' : previewDevice === 'tablet' ? '12px solid #0f172a' : '10px solid #0f172a', 
                      borderRadius: previewDevice === 'pc' ? '12px' : previewDevice === 'tablet' ? '28px' : '36px', 
                      margin: '0 auto', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      
                      {/* Notch / Cámara para Móvil y Tablet */}
                      {previewDevice === 'mobile' && (
                        <div style={{ width: '100px', height: '16px', background: '#0f172a', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }} />
                      )}
                      {previewDevice === 'tablet' && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0f172a', position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }} />
                      )}

                      {/* Browser Top Bar for PC Mockup */}
                      {previewDevice === 'pc' && (
                        <div style={{
                          background: '#f1f5f9',
                          borderBottom: '1px solid #cbd5e1',
                          padding: '0.4rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          flexShrink: 0
                        }}>
                          {/* Ventanas */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                          </div>
                          {/* Dirección URL */}
                          <div style={{
                            flex: 1,
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '5px',
                            fontSize: '0.62rem',
                            color: '#64748b',
                            padding: '0.12rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            <Lock size={9} style={{ color: '#10b981' }} />
                            crecemas.com/tienda/{organization?.slug || 'mi-negocio'}
                          </div>
                        </div>
                      )}
                      
                      {/* Contenedor interno del catálogo simulado */}
                      <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        overflowY: 'auto', 
                        paddingTop: previewDevice === 'pc' ? '0' : previewDevice === 'tablet' ? '0.35rem' : '1.15rem', 
                        fontFamily: `'${fuentePrincipal}', Inter, sans-serif` 
                      }}>
                        
                        {/* Cabecera de la tienda simulada */}
                        <div style={{ 
                          background: colorHeader, 
                          padding: previewDevice === 'pc' ? '0.75rem 1rem' : '0.55rem 0.75rem', 
                          borderBottom: `2px solid ${colorBotones}`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          gap: '0.5rem', 
                          position: 'sticky', 
                          top: 0, 
                          zIndex: 10 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt="Logo Negocio"
                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${colorBotones}`, flexShrink: 0 }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${colorBotones}`, flexShrink: 0 }}>
                                <Store size={14} style={{ color: colorBotones }} />
                              </div>
                            )}
                            <h4 style={{ 
                              fontSize: previewDevice === 'pc' ? '0.88rem' : '0.8rem', 
                              fontWeight: 'bold', 
                              color: colorTextoHeader, 
                              margin: 0, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              maxWidth: previewDevice === 'pc' ? '180px' : '110px'
                            }}>
                              {organization?.name || 'Mi Tienda Virtual'}
                            </h4>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {previewDevice === 'pc' && (
                              <div style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '5px',
                                padding: '0.12rem 0.35rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                width: '90px'
                              }}>
                                <Search size={9} style={{ color: '#94a3b8' }} />
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>Buscar...</span>
                              </div>
                            )}
                            <div style={{ position: 'relative', color: colorBotones, display: 'flex', alignItems: 'center' }}>
                              <ShoppingCart size={15} />
                              <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: colorBotones,
                                color: colorTextoBotones,
                                fontSize: '0.45rem',
                                borderRadius: '50%',
                                width: '9px',
                                height: '9px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}>2</span>
                            </div>
                          </div>
                        </div>

                        {/* Carrete de Promociones simulado */}
                        {promociones.length > 0 && (
                          <div style={{ position: 'relative', width: '100%', height: previewDevice === 'pc' ? '110px' : '85px', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                              <img
                                src={promociones[0].imagen_url}
                                alt="Promo Previa"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              {promociones[0].titulo && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 100%)',
                                  padding: '0.35rem 0.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '1px'
                                }}>
                                  <span style={{ fontSize: '0.45rem', fontWeight: '800', backgroundColor: colorBotones, color: colorTextoBotones, alignSelf: 'flex-start', padding: '0.05rem 0.2rem', borderRadius: '3px', textTransform: 'uppercase' }}>Destacado</span>
                                  <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{promociones[0].titulo}</span>
                                </div>
                              )}
                            </div>
                            {promociones.length > 1 && (
                              <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px', zIndex: 5 }}>
                                {promociones.map((_, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      width: '4px',
                                      height: '4px',
                                      borderRadius: '50%',
                                      backgroundColor: idx === 0 ? colorBotones : 'rgba(255,255,255,0.6)'
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Banner de Bienvenida simulado */}
                        {mensajeBienvenida && (
                          <div style={{ 
                            background: '#ffffff', 
                            margin: '0.5rem', 
                            padding: previewDevice === 'pc' ? '0.75rem 1.25rem' : '0.5rem 0.6rem', 
                            borderRadius: '8px', 
                            borderLeft: `3px solid ${colorBotones}`, 
                            fontSize: previewDevice === 'pc' ? '0.85rem' : '0.68rem', 
                            fontWeight: previewDevice === 'pc' ? '600' : 'normal',
                            color: '#334155', 
                            lineHeight: '1.35', 
                            boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: previewDevice === 'pc' ? '0.4rem' : '0.25rem'
                          }}>
                            <Sparkles size={previewDevice === 'pc' ? 14 : 11} style={{ color: colorBotones, flexShrink: 0 }} />
                            <span style={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              display: '-webkit-box', 
                              WebkitLineClamp: 2, 
                              WebkitBoxOrient: 'vertical',
                              textAlign: 'center'
                            }}>
                              {mensajeBienvenida}
                            </span>
                          </div>
                        )}

                        {/* Categorías y Listado de Productos Simulado */}
                        {layoutCategorias === 'side' && previewDevice !== 'mobile' ? (
                          /* Diseño Lateral Izquierdo (solo Tablet y PC) */
                          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderTop: '1px solid #f1f5f9' }}>
                            {/* Menú lateral */}
                            <div style={{
                              width: previewDevice === 'pc' ? '105px' : '85px',
                              borderRight: '1px solid #e2e8f0',
                              background: '#ffffff',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                              padding: '0.4rem 0.2rem',
                              overflowY: 'auto',
                              flexShrink: 0
                            }}>
                              <span style={{ fontSize: '0.6rem', fontWeight: '700', color: colorBotones, background: `${colorBotones}15`, padding: '0.25rem 0.4rem', borderRadius: '5px', cursor: 'default' }}>
                                Todos
                              </span>
                              {['Labiales', 'Polvos', 'Correctores', 'Skincare'].map((cat) => (
                                <span key={cat} style={{ fontSize: '0.6rem', color: '#64748b', padding: '0.25rem 0.4rem', borderRadius: '5px', cursor: 'default', fontWeight: '500' }}>
                                  {cat}
                                </span>
                              ))}
                            </div>
                            
                            {/* Grilla productos derecha */}
                            <div style={{ flex: 1, padding: '0.4rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                {[1, 2, 3, 4].map((i) => (
                                  <div key={i} style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                                    <div style={{ width: '100%', height: '50px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>Producto {i}</span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {i === 1 ? 'Base Matte' : i === 2 ? 'Labial Velvet' : i === 3 ? 'Polvo Traslúcido' : 'Rubor Compacto'}
                                    </span>
                                    <span style={{ fontSize: '0.6rem', color: colorBotones, fontWeight: 'bold' }}>
                                      $22.000
                                    </span>
                                    <button type="button" style={{ width: '100%', background: colorBotones, color: colorTextoBotones, border: 'none', borderRadius: '4px', fontSize: '0.55rem', padding: '0.2rem', fontWeight: 600, cursor: 'default', marginTop: '0.15rem' }}>
                                      Agregar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Diseño Superior Deslizable (o móvil default) */
                          <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            {/* Píldoras horizontal */}
                            <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.15rem', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: '700', background: colorBotones, color: colorTextoBotones, padding: '0.25rem 0.5rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                Todos
                              </span>
                              {['Labiales', 'Polvos', 'Correctores', 'Skincare'].map((cat) => (
                                <span key={cat} style={{ fontSize: '0.62rem', background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.25rem 0.5rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                  {cat}
                                </span>
                              ))}
                            </div>

                            {/* Grilla de Productos */}
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: previewDevice === 'pc' ? '1fr 1fr 1fr' : '1fr 1fr', 
                              gap: '0.4rem' 
                            }}>
                              {[1, 2, 3, 4, 5, 6].slice(0, previewDevice === 'pc' ? 6 : 4).map((i) => (
                                <div key={i} style={{ background: '#ffffff', borderRadius: '7px', border: '1px solid #e2e8f0', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                                  <div style={{ width: '100%', height: previewDevice === 'pc' ? '60px' : '70px', background: '#f1f5f9', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Producto {i}</span>
                                  </div>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {i === 1 ? 'Brillo Mágico' : i === 2 ? 'Polvo Matte' : i === 3 ? 'Corrector Bloom' : i === 4 ? 'Rubor Cremoso' : i === 5 ? 'Sérum Glow' : 'Fijador Makeup'}
                                  </span>
                                  <span style={{ fontSize: '0.62rem', color: colorBotones, fontWeight: 'bold' }}>
                                    $25.000
                                  </span>
                                  <button type="button" style={{ width: '100%', background: colorBotones, color: colorTextoBotones, border: 'none', borderRadius: '4px', fontSize: '0.58rem', padding: '0.22rem', fontWeight: 600, marginTop: '0.2rem', cursor: 'default' }}>
                                    Agregar
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Barra inferior simulada de contacto y redes */}
                        <div style={{ 
                          background: '#ffffff', 
                          borderTop: '1px solid #e2e8f0', 
                          padding: '0.55rem 0.45rem', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          gap: '0.4rem',
                          flexShrink: 0,
                          position: 'sticky',
                          bottom: 0,
                          zIndex: 10,
                          marginTop: 'auto',
                          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)'
                        }}>
                          {/* Redes sociales */}
                          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'center' }}>
                            {whatsapp && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: '#16a34a', cursor: 'default' }}>
                                <Phone size={11} />
                                <span style={{ fontSize: '0.58rem', fontWeight: 'bold' }}>Pedido</span>
                              </div>
                            )}
                            {instagram && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: '#db2777', cursor: 'default' }}>
                                <Instagram size={11} />
                                <span style={{ fontSize: '0.58rem', fontWeight: 'bold' }}>Instagram</span>
                              </div>
                            )}
                            {facebook && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: '#02A5E0', cursor: 'default' }}>
                                <Facebook size={11} />
                                <span style={{ fontSize: '0.58rem', fontWeight: 'bold' }}>Facebook</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Separador e invitación de CrecePlus */}
                          <div style={{ width: '85%', height: '1px', background: '#f1f5f9', margin: '0.2rem 0' }} />
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.15rem',
                            textAlign: 'center'
                          }}>
                            <span style={{ fontSize: '0.52rem', color: '#64748b' }}>¿Quieres controlar tu inventario y ventas?</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.15rem',
                              background: 'rgba(79, 70, 229, 0.06)',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(79, 70, 229, 0.1)'
                            }}>
                              <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#4f46e5' }}>crecemas.co</span>
                              <ExternalLink size={7} style={{ color: '#4f46e5' }} />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'configuracion' && (
            <motion.div
              key="configuracion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="perfil-section">
              <h2 className="perfil-section-title">Configuración General</h2>
              
              {/* Vista por defecto - Grid de opciones */}
              {!activeConfigSection && (
                <div className="perfil-config-grid">
                  <div className="perfil-config-item">
                    <h3>Modo Oscuro</h3>
                    <p>Cambiar entre tema claro y oscuro</p>
                    <ThemeToggle size="medium" showLabel={true} />
                  </div>
                  
                  {/* Mi Suscripción - Todos los usuarios */}
                  <motion.div 
                    className="perfil-config-item clickable suscripcion-item"
                    onClick={() => navigate('/dashboard/suscripcion')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <CreditCard size={24} />
                      {isVIP && <Sparkles size={16} className="vip-sparkle" />}
                    </div>
                    <h3>
                      Mi Suscripción
                      {isVIP && <Crown size={18} className="vip-crown" />}
                    </h3>
                    <p>
                      {isVIP 
                        ? '✨ VIP Developer - Acceso Ilimitado'
                        : `Plan ${planName} - Gestionar suscripción`
                      }
                    </p>
                  </motion.div>

                  {/* Equipo - Solo owner/admin con feature */}
                  {hasRole('owner', 'admin') && hasFeature('teamManagement') && (
                    <motion.div
                      className="perfil-config-item clickable"
                      onClick={() => navigate('/dashboard/equipo')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="config-icon-wrapper">
                        <Shield size={24} />
                      </div>
                      <h3>Equipo</h3>
                      <p>Gestionar roles y miembros del equipo</p>
                    </motion.div>
                  )}

                  {/* Platform Analytics - Solo VIP o Super Admin */}
                  {hasDeveloperAccess && (
                    <motion.div 
                      className="perfil-config-item clickable analytics-item"
                      onClick={() => navigate('/dashboard/analytics')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="config-icon-wrapper">
                        <BarChart3 size={24} />
                        <Crown size={16} className="admin-crown" />
                      </div>
                      <h3>
                        Platform Analytics
                        <Shield size={18} className="admin-badge" />
                      </h3>
                      <p>📊 Métricas y análisis de la plataforma</p>
                    </motion.div>
                  )}

                  {/* Panel de Administración VIP */}
                  {hasDeveloperAccess && (
                    <motion.div 
                      className="perfil-config-item clickable vip-admin-item"
                      onClick={() => navigate('/vip-admin')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="config-icon-wrapper">
                        <Crown size={24} />
                        <Sparkles size={16} className="vip-sparkle-admin" />
                      </div>
                      <h3>
                        Panel VIP
                        <Crown size={18} className="vip-crown-admin" />
                      </h3>
                      <p>👑 Gestionar suscripciones de organizaciones</p>
                    </motion.div>
                  )}
                  
                  {/* Configuración de Facturación */}
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => navigate('/dashboard/configuracion-facturacion')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Building2 size={24} />
                    </div>
                    <h3>Configuración de Facturación</h3>
                    <p>Configurar datos de facturación y tipo de negocio</p>
                  </motion.div>
                  
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('preferencias')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Sliders size={24} />
                    </div>
                    <h3>Preferencias de la Aplicación</h3>
                    <p>Configuraciones generales del sistema</p>
                  </motion.div>
                  
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('notificaciones')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Bell size={24} />
                    </div>
                    <h3>Notificaciones</h3>
                    <p>Configurar alertas y notificaciones</p>
                  </motion.div>

                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('impresora')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Printer size={24} />
                    </div>
                    <h3>Impresora</h3>
                    <p>Configurar impresora predeterminada</p>
                  </motion.div>
                  
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('seguridad')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Lock size={24} />
                    </div>
                    <h3>Seguridad</h3>
                    <p>Cambiar contraseña y configuraciones de seguridad</p>
                  </motion.div>
                </div>
              )}

              {/* Vistas de cada sección */}
              {activeConfigSection === 'preferencias' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <PreferenciasAplicacion />
                </motion.div>
              )}

              {activeConfigSection === 'notificaciones' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <div className="notifications-section">
                    <div className="notifications-card">
                      <div className="notifications-card-header">
                        <div className="notifications-card-icon">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h3>Alertas de inventario</h3>
                          <p>Configura cuándo deseas recibir alertas de stock.</p>
                        </div>
                      </div>

                      <form className="notifications-form" onSubmit={handleSaveNotifications}>
                        <label className="notifications-toggle">
                          <input
                            type="checkbox"
                            checked={mostrarStockBajo}
                            onChange={(e) => setMostrarStockBajo(e.target.checked)}
                          />
                          <span>Mostrar alertas de stock bajo y sin stock</span>
                        </label>

                        <div className="notifications-field">
                          <label>Umbral de stock bajo</label>
                          <input
                            type="number"
                            min="1"
                            className="perfil-edit-input"
                            value={umbralStockBajo}
                            onChange={(e) => setUmbralStockBajo(e.target.value)}
                          />
                          <small>Se considera stock bajo cuando el inventario es menor o igual a este valor.</small>
                        </div>

                        <div className="notifications-actions">
                          <button
                            type="submit"
                            className="security-btn security-btn-primary"
                            disabled={savingNotifications}
                          >
                            {savingNotifications ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeConfigSection === 'impresora' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <ConfiguracionImpresora />
                </motion.div>
              )}

              {activeConfigSection === 'seguridad' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <div className="security-section">
                    <div className="security-card">
                      <div className="security-card-header">
                        <div className="security-card-icon">
                          <Lock size={20} />
                        </div>
                        <div>
                          <h3>Cambiar contraseña</h3>
                          <p>Protege tu cuenta con una contraseña segura.</p>
                        </div>
                      </div>

                      <form className="security-form" onSubmit={handleUpdatePassword}>
                        <div className="security-field">
                          <label>Nueva contraseña</label>
                          <div className="security-input-row">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              className="perfil-edit-input"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Mínimo 8 caracteres"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="security-toggle"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="security-field">
                          <label>Confirmar contraseña</label>
                          <div className="security-input-row">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              className="perfil-edit-input"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Repite la contraseña"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="security-toggle"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="security-hint">
                          Debe incluir mayúsculas, minúsculas y números.
                        </div>

                        <div className="security-actions">
                          <button
                            type="submit"
                            className="security-btn security-btn-primary"
                            disabled={updatingPassword}
                          >
                            {updatingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="security-card">
                      <div className="security-card-header">
                        <div className="security-card-icon">
                          <Mail size={20} />
                        </div>
                        <div>
                          <h3>Recuperación de cuenta</h3>
                          <p>Envía un enlace de restablecimiento al correo.</p>
                        </div>
                      </div>
                      <div className="security-meta">
                        <span className="security-meta-label">Correo</span>
                        <span className="security-meta-value">{user?.email || 'No disponible'}</span>
                      </div>
                      <div className="security-actions">
                        <button
                          type="button"
                          className="security-btn security-btn-secondary"
                          onClick={handleSendResetEmail}
                          disabled={sendingReset}
                        >
                          {sendingReset ? 'Enviando...' : 'Enviar enlace de recuperación'}
                        </button>
                      </div>
                    </div>

                    <div className="security-card">
                      <div className="security-card-header">
                        <div className="security-card-icon">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3>Sesiones activas</h3>
                          <p>Cierra sesiones abiertas en otros dispositivos.</p>
                        </div>
                      </div>
                      <div className="security-actions">
                        <button
                          type="button"
                          className="security-btn security-btn-ghost"
                          onClick={handleSignOutOthers}
                          disabled={signingOutOthers}
                        >
                          {signingOutOthers ? 'Cerrando...' : 'Cerrar otras sesiones'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </div>

      {editandoCodigo && employeeData && (
        <EditarCodigoEmpleadoModal
          open={editandoCodigo}
          onClose={() => setEditandoCodigo(false)}
          onGuardar={async ({ username, accessCode, password }) => {
            await updateEmployeeCredentials.mutateAsync({
              memberId: employeeData.id,
              username,
              accessCode,
              password,
              organizationId: organization?.id
            });
            setEmployeeData({
              ...employeeData,
              employee_username: username,
              employee_code: accessCode
            });
            setEditandoCodigo(false);
          }}
          usuarioActual={employeeData.employee_username || employeeData.employee_code}
          codigoActual={employeeData.employee_code}
          nombreEmpleado={employeeData.employee_name || user?.user_metadata?.full_name}
          cargando={updateEmployeeCredentials.isLoading}
        />
      )}
    </motion.div>
  );
};

export default Perfil;
