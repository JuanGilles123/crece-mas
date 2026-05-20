import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import {
  TrendingUp,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Globe,
  Package,
  DollarSign,
  CreditCard,
  Calculator,
  ShoppingCart,
  Phone,
  Menu,
  X,
  MessageCircle,
  Mail,
  Send
} from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // States for interactive mockup simulations
  const [activeMockup, setActiveMockup] = useState('pos');
  const [posPaymentMethod, setPosPaymentMethod] = useState('efectivo');
  const [posCashReceived, setPosCashReceived] = useState(60000);
  const posTotal = 54500;
  const [invFilter, setInvFilter] = useState('all');
  const [dashPeriod, setDashPeriod] = useState('hoy');

  const [catalogTheme, setCatalogTheme] = useState('rosa');
  const catalogThemes = {
    rosa: { bg: '#fdf2f8', header: '#fce7f3', accent: '#fbcfe8', text: '#831843', btnText: '#000000' },
    azul: { bg: '#FFFFFF', header: '#E6F0FF', accent: '#bfdbfe', text: '#2E2E2E', btnText: '#000000' },
    verde: { bg: '#f0fdf4', header: '#dcfce7', accent: '#bbf7d0', text: '#14532d', btnText: '#000000' },
    oscuro: { bg: '#1f2937', header: '#111827', accent: '#374151', text: '#f9fafb', btnText: '#ffffff' }
  };
  const activeThemeObj = catalogThemes[catalogTheme];
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  // Mobile Nav menu toggle state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', department: 'soporte', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  // Scroll effect to shrink navbar
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <ShoppingCart size={28} />,
      title: "Punto de Venta Completo",
      description: "Caja registradora rápida e intuitiva. Acepta múltiples métodos de pago (efectivo con vueltas automáticas, tarjetas, transferencias y pagos mixtos) en segundos."
    },
    {
      icon: <Package size={28} />,
      title: "Inventario Inteligente",
      description: "Control absoluto de stock. Alertas de stock bajo en tiempo real, control de fechas de vencimiento con notificaciones automáticas y compresión automática de imágenes de productos."
    },
    {
      icon: <BarChart3 size={28} />,
      title: "Dashboard e Indicadores",
      description: "Visualiza la salud financiera de tu negocio al instante. Ventas del día, productos más vendidos, y reportes analíticos con gráficos interactivos."
    },
    {
      icon: <Calculator size={28} />,
      title: "Cierre de Caja Profesional",
      description: "Conciliación automática y reportes de cierre de caja impecables. Evita pérdidas cruzando tus métodos de pago con el efectivo en caja."
    },
    {
      icon: <Users size={28} />,
      title: "Equipo y Permisos de Roles",
      description: "Invita a tus cajeros, administradores o socios por correo electrónico. Asigna roles específicos y limita accesos para máxima seguridad."
    },
    {
      icon: <Globe size={28} />,
      title: "Tienda Online Integrada",
      description: "Vende por internet sin esfuerzo. Tu inventario físico se sincroniza en tiempo real con tu propia página web o tienda online para recibir pedidos por WhatsApp."
    }
  ];

  const benefits = [
    "Interfaz ultra moderna y fácil de aprender",
    "Funciona 100% en la nube desde cualquier dispositivo",
    "Actualizaciones automáticas y gratuitas de por vida",
    "Respaldo en tiempo real y seguridad bancaria de datos",
    "Búsqueda instantánea de productos con scroll infinito",
    "Importación y exportación masiva en segundos vía CSV"
  ];

  const stats = [
    { number: "10,000+", label: "Ventas Registradas" },
    { number: "99.9%", label: "Tiempo de Actividad" },
    { number: "Ilimitado", label: "Versión Gratuita Base" },
    { number: "24/7", label: "Acceso Seguro Nube" }
  ];

  // simulated products for inventory mockup filter
  const simulatedProducts = [
    { name: "Café Especial de Origen 500g", code: "PROD-001", stock: 45, minStock: 10, status: "En Stock", price: 18500, label: "Café" },
    { name: "Leche Entera Premium 1L", code: "PROD-024", stock: 3, minStock: 8, status: "Bajo Stock", price: 4200, label: "Lácteo", alert: "Vence pronto" },
    { name: "Pan de Centeno Tajado", code: "PROD-045", stock: 0, minStock: 5, status: "Agotado", price: 3800, label: "Panadería" },
    { name: "Queso Semicurado 250g", code: "PROD-088", stock: 15, minStock: 5, status: "En Stock", price: 9200, label: "Lácteo" },
    { name: "Aceite de Oliva Extra 500ml", code: "PROD-102", stock: 2, minStock: 5, status: "Bajo Stock", price: 24900, label: "Abarrotes" }
  ];

  const filteredProducts = simulatedProducts.filter(p => {
    if (invFilter === 'low') return p.status === 'Bajo Stock';
    if (invFilter === 'out') return p.status === 'Agotado';
    return true;
  });

  // pricing format helper
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    setContactSuccess('');
    try {
      const { error: fnError } = await supabase.functions.invoke('send-contact', { body: contactForm });
      if (fnError) throw fnError;
      setContactSuccess('¡Mensaje enviado! Te responderemos en menos de 24 horas.');
      setContactForm({ name: '', email: '', department: 'soporte', message: '' });
    } catch (err) {
      setContactError('Error al enviar. Intenta de nuevo o escríbenos por WhatsApp.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className={styles.container}>

      {/* Floating WhatsApp Widget */}
      <div className={styles.whatsappFloat}>
        <a
          href="https://wa.me/573046422366?text=Hola!%20Vengo%20de%20la%20landing%20page%20de%20Crece%2B%20y%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20el%20sistema%20de%20gesti%C3%B3n."
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappLink}
        >
          <span className={styles.whatsappTooltip}>💬 ¿Preguntas? ¡Hablemos por WhatsApp!</span>
          <div className={styles.whatsappIconWrapper}>
            {/* Custom WhatsApp Clean SVG */}
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.908.533 3.69 1.458 5.214L2 22l4.928-1.428A9.957 9.957 0 0012.004 22c5.52 0 10-4.48 10-10S17.524 2 12.004 2zm5.795 14.197c-.244.686-1.233 1.258-1.795 1.343-.54.085-1.218.157-3.415-.744-2.825-1.157-4.607-4.047-4.75-4.232-.143-.186-1.157-1.545-1.157-2.946 0-1.4.729-2.087.986-2.373.257-.286.558-.358.744-.358.186 0 .372.014.53.028.172.014.386-.057.6-.057.215 0 .415.086.63.586.23.53.772 1.902.844 2.045.072.143.115.315.015.515-.1.2-.15.315-.3.486-.15.172-.315.386-.45.515-.15.143-.308.301-.129.615.18.3.794 1.31 1.702 2.116.78.694 1.442.909 1.758 1.052.315.143.5.122.687-.086.186-.208.787-.915.994-1.23.208-.315.415-.258.701-.15.286.1.18.1.18.1s1.825.9 2.14 1.058c.315.158.53.23.6.358.072.13.072.744-.172 1.43z" />
            </svg>
          </div>
        </a>
      </div>

      {/* Sticky Header with Glassmorphism */}
      <header className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <div className={styles.navContainer}>
          <div className={styles.navLogo}>
            <TrendingUp size={28} className={styles.logoIcon} />
            <span className={styles.logoText}>Crece<span className={styles.accentPlus}>+</span></span>
          </div>

          <nav className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksMobileActive : ''}`}>
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
            <a href="#visuales" onClick={() => setMobileMenuOpen(false)}>Ver Ejemplos</a>
            <a href="#precios" onClick={() => setMobileMenuOpen(false)}>Planes</a>
            <a href="#contacto" onClick={() => setMobileMenuOpen(false)}>Soporte</a>
            <div className={styles.mobileNavActions}>
              <Link to="/login" className={styles.navLoginMobile} onClick={() => setMobileMenuOpen(false)}>Iniciar Sesión</Link>
              <Link to="/registro" className={styles.navRegisterMobile} onClick={() => setMobileMenuOpen(false)}>Comenzar Gratis</Link>
            </div>
          </nav>

          <div className={styles.navActions}>
            <Link to="/login" className={styles.navLogin}>Iniciar Sesión</Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/registro" className={styles.navRegister}>Comenzar Gratis</Link>
            </motion.div>
          </div>

          <button className={styles.mobileMenuToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={26} color="white" /> : <Menu size={26} color="white" />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroText}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div className={styles.badge}>
                <Zap size={16} />
                <span>Para Emprendimientos</span>
              </div>
              <div className={styles.badge} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#02A5E0', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Globe size={16} />
                <span>¡Nuevo! Tu Página Web Integrada</span>
              </div>
            </div>

            <h1 className={styles.heroTitle}>
              Software POS y Sistema de Ventas en la Nube{' '}
              <span className={styles.gradientText}>para Colombia</span>
            </h1>

            <p className={styles.heroSubtitle}>
              La plataforma en la nube más rápida y accesible para controlar tu inventario, registrar tus ventas y optimizar tu caja registradora. Diseñada especialmente para emprendedores colombianos que quieren profesionalizar su negocio sin gastar una fortuna.
            </p>

            <div className={styles.heroActions}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/registro" className={styles.primaryButton}>
                    Probar Gratis Ahora
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>
                <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>Sin tarjeta de crédito requerida</span>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a href="#precios" className={styles.secondaryButton}>
                  Ver Planes de Bajo Costo
                </a>
              </motion.div>
            </div>

            <div className={styles.heroWhatsAppCallout}>
              <Phone size={18} color="#22c55e" />
              <span>Soporte personalizado por WhatsApp: <strong><a href="tel:3046422366" className={styles.phoneLink}>304 642 2366</a></strong></span>
            </div>

            <div className={styles.trustIndicators}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>Funciona ideal con:</span>
                <span style={{ fontWeight: '500', color: '#1f2937', backgroundColor: 'rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.1)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Bancolombia</span>
                <span style={{ fontWeight: '500', color: '#1f2937', backgroundColor: 'rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.1)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Nequi</span>
                <span style={{ fontWeight: '500', color: '#1f2937', backgroundColor: 'rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.1)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Daviplata</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className={styles.heroMockupContainer}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDots}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
                <span>Crece+ Nube - Caja Registradora</span>
              </div>
              <div className={styles.mockupBody}>
                {/* Visual Quick POS Simulator */}
                <div className={styles.simulatedHeroPos}>
                  <div className={styles.simulatedHeroPosHeader}>
                    <div className={styles.simulatedHeroPosTitle}>💵 Registrando Venta</div>
                    <div className={styles.simulatedHeroPosBadge}>$54.500 COP</div>
                  </div>
                  <div className={styles.simulatedHeroPosItems}>
                    <div className={styles.simulatedHeroPosItem}>🍔 Hamburguesa Premium x2 <span className={styles.simulatedHeroItemVal}>$36.000</span></div>
                    <div className={styles.simulatedHeroPosItem}>🍟 Papas Rústicas x1 <span className={styles.simulatedHeroItemVal}>$9.500</span></div>
                    <div className={styles.simulatedHeroPosItem}>🥤 Gaseosa Cola 350ml x2 <span className={styles.simulatedHeroItemVal}>$9.000</span></div>
                  </div>
                  <div className={styles.simulatedHeroPosFooter}>
                    <div className={styles.simulatedHeroMethod}>
                      <span className={styles.methodLabel}>Método Activo:</span>
                      <span className={styles.methodValue}>⚡ Pago Mixto (Efectivo/Transferencia)</span>
                    </div>
                    <div className={styles.simulatedHeroBtn}>Venta Completada con Éxito ✓</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className={styles.statItem}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className={styles.features}>
        <div className={styles.featuresContainer}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Todo lo que necesitas para profesionalizar tu negocio</h2>
            <p>Herramientas potentes y simplificadas para evitar fugas de dinero, organizar el inventario y vender más rápido.</p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, borderColor: 'rgba(251, 191, 36, 0.4)' }}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Visual Showcase (MOCKUPS DEMO) */}
      <section id="visuales" className={styles.showcaseSection}>
        <div className={styles.showcaseContainer}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Explora nuestra interfaz en funcionamiento</h2>
            <p>Diseño premium de alta velocidad desarrollado con la mejor tecnología. Haz clic en las pestañas a continuación para ver cómo opera el sistema.</p>
          </motion.div>

          {/* Interactive tabs */}
          <div className={styles.tabsRow}>
            <button
              className={`${styles.tabBtn} ${activeMockup === 'pos' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('pos')}
            >
              <ShoppingCart size={18} />
              Punto de Venta (POS)
            </button>
            <button
              className={`${styles.tabBtn} ${activeMockup === 'inventory' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('inventory')}
            >
              <Package size={18} />
              Gestión de Inventario
            </button>
            <button
              className={`${styles.tabBtn} ${activeMockup === 'dashboard' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('dashboard')}
            >
              <BarChart3 size={18} />
              Dashboard y Analítica
            </button>
            <button
              className={`${styles.tabBtn} ${activeMockup === 'catalog' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('catalog')}
            >
              <Globe size={18} />
              Mi Tienda Online
            </button>
          </div>

          <div className={styles.showcaseContent}>

            {/* Interactive Mockup Container */}
            <motion.div
              className={styles.mockupMainFrame}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.appHeader}>
                <div className={styles.mockupDots}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
                <div className={styles.appBreadcrumb}>
                  Crece+ SaaS / <span className={styles.activeBreadcrumb}>{activeMockup === 'pos' ? 'Caja Registradora' : activeMockup === 'inventory' ? 'Inventario de Productos' : activeMockup === 'catalog' ? 'Configurar Tienda Online' : 'Resumen Financiero'}</span>
                </div>
              </div>

              <div className={styles.appBody}>
                <AnimatePresence mode="wait">

                  {/* TAB 1: PUNTO DE VENTA (POS) */}
                  {activeMockup === 'pos' && (
                    <motion.div
                      key="pos-tab"
                      className={styles.posInteractiveGrid}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Left: Cart items */}
                      <div className={styles.posCartPane}>
                        <h4>📝 Cuenta Activa</h4>
                        <div className={styles.posCartItems}>
                          <div className={styles.posCartItem}>
                            <div>
                              <strong>Hamburguesa Especial con Queso</strong>
                              <span>Código: H012 / Cantidad: x2</span>
                            </div>
                            <span className={styles.itemPrice}>$36.000</span>
                          </div>

                          <div className={styles.posCartItem}>
                            <div>
                              <strong>Papas Rústicas en Casco</strong>
                              <span>Código: P005 / Cantidad: x1</span>
                            </div>
                            <span className={styles.itemPrice}>$9.500</span>
                          </div>

                          <div className={styles.posCartItem}>
                            <div>
                              <strong>Coca-Cola Original 350ml</strong>
                              <span>Código: B002 / Cantidad: x2</span>
                            </div>
                            <span className={styles.itemPrice}>$9.000</span>
                          </div>
                        </div>

                        <div className={styles.posTotalRow}>
                          <span>Subtotal de Productos:</span>
                          <span>$54.500 COP</span>
                        </div>
                        <div className={styles.posTotalRowPrimary}>
                          <span>TOTAL A PAGAR:</span>
                          <span className={styles.totalValue}>$54.500 COP</span>
                        </div>
                      </div>

                      {/* Right: Payment configuration */}
                      <div className={styles.posPaymentPane}>
                        <h4>💳 Métodos de Pago</h4>
                        <p className={styles.paneHelp}>Selecciona cómo pagará el cliente:</p>

                        <div className={styles.paymentMethodButtons}>
                          <button
                            className={`${styles.payMethodBtn} ${posPaymentMethod === 'efectivo' ? styles.payMethodBtnActive : ''}`}
                            onClick={() => setPosPaymentMethod('efectivo')}
                          >
                            <DollarSign size={16} /> Efectivo
                          </button>
                          <button
                            className={`${styles.payMethodBtn} ${posPaymentMethod === 'tarjeta' ? styles.payMethodBtnActive : ''}`}
                            onClick={() => setPosPaymentMethod('tarjeta')}
                          >
                            <CreditCard size={16} /> Tarjeta
                          </button>
                          <button
                            className={`${styles.payMethodBtn} ${posPaymentMethod === 'transferencia' ? styles.payMethodBtnActive : ''}`}
                            onClick={() => setPosPaymentMethod('transferencia')}
                          >
                            <Globe size={16} /> Transferencia / Nequi
                          </button>
                        </div>

                        {/* Interactive tender input for cash */}
                        {posPaymentMethod === 'efectivo' && (
                          <div className={styles.cashCalculator}>
                            <label>Efectivo Recibido:</label>
                            <div className={styles.cashInputRow}>
                              <button onClick={() => setPosCashReceived(55000)} className={styles.quickCashBtn}>$55.000</button>
                              <button onClick={() => setPosCashReceived(60000)} className={styles.quickCashBtn}>$60.000</button>
                              <button onClick={() => setPosCashReceived(100000)} className={styles.quickCashBtn}>$100.000</button>
                            </div>
                            <div className={styles.calcResults}>
                              <div className={styles.calcField}>
                                <span>Recibido:</span>
                                <strong>{formatPrice(posCashReceived)} COP</strong>
                              </div>
                              <div className={`${styles.calcField} ${posCashReceived - posTotal >= 0 ? styles.changeGreen : styles.changeRed}`}>
                                <span>Cambio (Vueltas):</span>
                                <strong>
                                  {posCashReceived - posTotal >= 0
                                    ? formatPrice(posCashReceived - posTotal)
                                    : `Faltan ${formatPrice(posTotal - posCashReceived)}`
                                  } COP
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {posPaymentMethod === 'tarjeta' && (
                          <div className={styles.methodDetails}>
                            <CheckCircle size={20} color="#02A5E0" />
                            <span>Integrado con datáfonos inalámbricos. Sin cobros ocultos por transacción.</span>
                          </div>
                        )}

                        {posPaymentMethod === 'transferencia' && (
                          <div className={styles.methodDetails}>
                            <CheckCircle size={20} color="#10b981" />
                            <span>Ideal para recibir pagos directos a Nequi, Daviplata o Bancolombia sin intermediarios.</span>
                          </div>
                        )}

                        <button className={styles.registerSaleBtn} onClick={() => alert('Venta simulada correctamente. ¡Así de rápido funciona en Crece+!')}>
                          <ShoppingCart size={18} />
                          Completar e Imprimir Recibo
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: GESTIÓN DE INVENTARIO */}
                  {activeMockup === 'inventory' && (
                    <motion.div
                      key="inv-tab"
                      className={styles.invInteractivePane}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.invToolbar}>
                        <div className={styles.searchSimulator}>
                          <span className={styles.searchIcon}>🔍</span>
                          <input type="text" placeholder="Buscando: Café, Leche, Queso..." readOnly />
                        </div>
                        <div className={styles.invFilters}>
                          <button
                            className={`${styles.filterTab} ${invFilter === 'all' ? styles.filterTabActive : ''}`}
                            onClick={() => setInvFilter('all')}
                          >
                            Todos ({simulatedProducts.length})
                          </button>
                          <button
                            className={`${styles.filterTab} ${invFilter === 'low' ? styles.filterTabActive : ''}`}
                            onClick={() => setInvFilter('low')}
                          >
                            ⚠️ Stock Bajo (2)
                          </button>
                          <button
                            className={`${styles.filterTab} ${invFilter === 'out' ? styles.filterTabActive : ''}`}
                            onClick={() => setInvFilter('out')}
                          >
                            🚫 Agotados (1)
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Product Table */}
                      <div className={styles.tableContainer}>
                        <table className={styles.invTable}>
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Código</th>
                              <th>Categoría</th>
                              <th>Precio</th>
                              <th>Stock</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((p, idx) => (
                              <tr key={idx} className={styles.invRow}>
                                <td>
                                  <div className={styles.productNameCell}>
                                    <div className={styles.productAvatar}>
                                      {p.label === 'Café' ? '☕' : p.label === 'Lácteo' ? '🥛' : p.label === 'Panadería' ? '🍞' : '📦'}
                                    </div>
                                    <div>
                                      <span className={styles.pName}>{p.name}</span>
                                      {p.alert && <span className={styles.pAlert}>{p.alert}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td><code className={styles.codeBadge}>{p.code}</code></td>
                                <td>{p.label}</td>
                                <td>{formatPrice(p.price)}</td>
                                <td><strong>{p.stock}</strong> und</td>
                                <td>
                                  <span className={`${styles.statusPill} ${p.status === 'En Stock' ? styles.pillGreen :
                                    p.status === 'Bajo Stock' ? styles.pillYellow : styles.pillRed
                                    }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.invFooter}>
                        <span>✓ Alertas automáticas programadas al correo y al panel de control cuando un producto baja de su Stock Mínimo.</span>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: DASHBOARD Y ANALÍTICA */}
                  {activeMockup === 'dashboard' && (
                    <motion.div
                      key="dash-tab"
                      className={styles.dashInteractivePane}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Period Filter Selector */}
                      <div className={styles.dashHeaderRow}>
                        <h4>📊 Resumen de Rendimiento</h4>
                        <div className={styles.dashPeriodButtons}>
                          <button
                            className={`${styles.periodBtn} ${dashPeriod === 'hoy' ? styles.periodBtnActive : ''}`}
                            onClick={() => setDashPeriod('hoy')}
                          >
                            Hoy
                          </button>
                          <button
                            className={`${styles.periodBtn} ${dashPeriod === 'semana' ? styles.periodBtnActive : ''}`}
                            onClick={() => setDashPeriod('semana')}
                          >
                            Esta Semana
                          </button>
                          <button
                            className={`${styles.periodBtn} ${dashPeriod === 'mes' ? styles.periodBtnActive : ''}`}
                            onClick={() => setDashPeriod('mes')}
                          >
                            Este Mes
                          </button>
                        </div>
                      </div>

                      {/* Dashboard KPI cards */}
                      <div className={styles.dashKpiGrid}>
                        <div className={styles.kpiCard}>
                          <span className={styles.kpiLabel}>Ventas Registradas</span>
                          <h3 className={styles.kpiValue}>
                            {dashPeriod === 'hoy' ? '$1.245.000' : dashPeriod === 'semana' ? '$8.450.000' : '$34.200.000'}
                          </h3>
                          <span className={styles.kpiChange}>⚡ +14.2% vs período anterior</span>
                        </div>
                        <div className={styles.kpiCard}>
                          <span className={styles.kpiLabel}>Transacciones</span>
                          <h3 className={styles.kpiValue}>
                            {dashPeriod === 'hoy' ? '38' : dashPeriod === 'semana' ? '260' : '1.050'}
                          </h3>
                          <span className={styles.kpiChange}>✓ Ticket promedio {dashPeriod === 'hoy' ? '$32.763' : '$32.500'}</span>
                        </div>
                        <div className={styles.kpiCard}>
                          <span className={styles.kpiLabel}>Caja Chica Activa</span>
                          <h3 className={styles.kpiValue}>$200.000</h3>
                          <span className={styles.kpiStatusGreen}>● Cierre de Caja Cuadrado</span>
                        </div>
                      </div>

                      {/* Charts and Alerts Mockup */}
                      <div className={styles.dashContentGrid}>
                        <div className={styles.dashChartCol}>
                          <h5>📈 Gráfico de Ventas</h5>
                          <div className={styles.simulatedChart}>
                            <div className={styles.chartBars}>
                              <div className={styles.barItem} style={{ height: dashPeriod === 'hoy' ? '30%' : '75%' }}><span className={styles.barTooltip}>Lun</span></div>
                              <div className={styles.barItem} style={{ height: dashPeriod === 'hoy' ? '45%' : '80%' }}><span className={styles.barTooltip}>Mar</span></div>
                              <div className={styles.barItem} style={{ height: dashPeriod === 'hoy' ? '60%' : '65%' }}><span className={styles.barTooltip}>Mié</span></div>
                              <div className={styles.barItem} style={{ height: dashPeriod === 'hoy' ? '85%' : '90%' }}><span className={styles.barTooltip}>Jue</span></div>
                              <div className={styles.barItem} style={{ height: dashPeriod === 'hoy' ? '70%' : '95%' }}><span className={styles.barTooltip}>Vie</span></div>
                              <div className={styles.barItem} style={{ height: dashPeriod === 'hoy' ? '90%' : '100%' }}><span className={styles.barTooltip}>Sáb</span></div>
                            </div>
                          </div>
                        </div>

                        <div className={styles.dashAlertsCol}>
                          <h5>⚠️ Alertas de Atención</h5>
                          <div className={styles.dashAlertList}>
                            <div className={styles.dashAlertItem}>
                              <span className={styles.alertIcon}>⚠️</span>
                              <div>
                                <strong>Stock Crítico de Productos</strong>
                                <p>Leche Entera Premium y Aceite de Oliva tienen existencias bajas.</p>
                              </div>
                            </div>
                            <div className={styles.dashAlertItem}>
                              <span className={styles.alertIcon}>📅</span>
                              <div>
                                <strong>Próximos Vencimientos</strong>
                                <p>1 producto vence en menos de 5 días. Revisa tu estantería.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: TIENDA ONLINE */}
                  {activeMockup === 'catalog' && (
                    <motion.div
                      key="catalog-tab"
                      className={styles.dashInteractivePane}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}
                    >
                      {/* Left: Configuration Panel */}
                      <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ marginBottom: '15px' }}>⚙️ Personaliza tu Tienda Online</h4>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>Color Principal de tu Marca</label>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div onClick={() => setCatalogTheme('rosa')} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#fce7f3', border: catalogTheme === 'rosa' ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}></div>
                            <div onClick={() => setCatalogTheme('azul')} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#E6F0FF', border: catalogTheme === 'azul' ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}></div>
                            <div onClick={() => setCatalogTheme('verde')} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#dcfce7', border: catalogTheme === 'verde' ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}></div>
                            <div onClick={() => setCatalogTheme('oscuro')} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#111827', border: catalogTheme === 'oscuro' ? '2px solid white' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}></div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>Link de WhatsApp para recibir pedidos</label>
                          <input type="text" value="+57 300 000 0000" readOnly style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>Productos Sincronizados</label>
                          <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={16} />
                            Inventario en línea. ¡Listo para vender!
                          </div>
                        </div>

                        <button style={{ width: '100%', padding: '10px', backgroundColor: '#02A5E0', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                          <Globe size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                          Copiar Enlace de mi Tienda
                        </button>
                      </div>

                      {/* Right: Mobile Preview */}
                      <div style={{ width: '280px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '10px', border: '6px solid #374151', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

                        {/* Mobile Body completely restyled */}
                        <div style={{ flex: 1, backgroundColor: activeThemeObj.bg, borderRadius: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '70px', transition: 'background-color 0.3s ease' }}>

                          {/* Top Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px', backgroundColor: activeThemeObj.bg, transition: 'background-color 0.3s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ddd', backgroundImage: 'url(https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=50&q=80)', backgroundSize: 'cover' }}></div>
                              <strong style={{ fontSize: '0.85rem', color: activeThemeObj.text, transition: 'color 0.3s ease' }}>Luxury Cosmetic</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: activeThemeObj.header, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.3s ease' }}>
                                <Phone size={14} color={activeThemeObj.text} />
                              </div>
                            </div>
                          </div>

                          {/* Search */}
                          <div style={{ padding: '0 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: activeThemeObj.header, padding: '8px 12px', borderRadius: '10px', transition: 'background-color 0.3s ease' }}>
                              <span style={{ marginRight: '8px', opacity: 0.5 }}>🔍</span>
                              <span style={{ fontSize: '0.75rem', color: activeThemeObj.text, opacity: 0.7 }}>Buscar productos...</span>
                            </div>
                          </div>

                          {/* Categories */}
                          <div style={{ display: 'flex', gap: '10px', padding: '12px 10px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                            <span style={{ backgroundColor: activeThemeObj.accent, padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', color: activeThemeObj.text, transition: 'all 0.3s ease' }}>Todas</span>
                            <span style={{ color: activeThemeObj.text, opacity: 0.7, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cuidado Facial</span>
                            <span style={{ color: activeThemeObj.text, opacity: 0.7, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Aceites</span>
                          </div>

                          {/* Promotional Banner */}
                          <div style={{ height: '100px', backgroundColor: '#333', backgroundImage: 'url(https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=300&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: '15px', left: '15px' }}>
                              <span style={{ backgroundColor: activeThemeObj.accent, color: activeThemeObj.text, fontSize: '0.55rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>Destacado</span>
                              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem', marginTop: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Solo por hoy</div>
                            </div>
                          </div>

                          {/* Promo Text */}
                          <div style={{ margin: '15px 10px', backgroundColor: activeThemeObj.header, padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: activeThemeObj.text, transition: 'all 0.3s ease' }}>
                            ✨ ¡UN MUNDO DE BELLEZA!
                          </div>

                          {/* Products Grid */}
                          <div style={{ display: 'flex', padding: '0 10px', gap: '10px' }}>
                            {/* Card 1 */}
                            <div style={{ flex: 1, backgroundColor: activeThemeObj.bg === '#1f2937' ? '#111827' : 'white', borderRadius: '10px', overflow: 'hidden', paddingBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'background-color 0.3s ease' }}>
                              <div style={{ height: '110px', backgroundImage: 'url(https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                              <div style={{ padding: '8px' }}>
                                <div style={{ fontSize: '0.55rem', color: activeThemeObj.text, opacity: 0.6, fontWeight: 'bold', textTransform: 'uppercase' }}>Luxury</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: activeThemeObj.text, lineHeight: '1.2', marginTop: '2px', height: '28px', overflow: 'hidden' }}>Aceite Almendras 120ml</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: activeThemeObj.text, opacity: 0.5, marginTop: '5px' }}>$ 8.500</div>
                                <button style={{ width: '100%', marginTop: '8px', backgroundColor: activeThemeObj.header, border: '1px solid ' + activeThemeObj.accent, padding: '6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', color: activeThemeObj.text, cursor: 'pointer', transition: 'all 0.3s ease' }}>Agregar</button>
                              </div>
                            </div>
                            {/* Card 2 */}
                            <div style={{ flex: 1, backgroundColor: activeThemeObj.bg === '#1f2937' ? '#111827' : 'white', borderRadius: '10px', overflow: 'hidden', paddingBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'background-color 0.3s ease' }}>
                              <div style={{ height: '110px', backgroundImage: 'url(https://images.unsplash.com/photo-1615397323214-e5657788b776?auto=format&fit=crop&w=200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                              <div style={{ padding: '8px' }}>
                                <div style={{ fontSize: '0.55rem', color: activeThemeObj.text, opacity: 0.6, fontWeight: 'bold', textTransform: 'uppercase' }}>Luxury</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: activeThemeObj.text, lineHeight: '1.2', marginTop: '2px', height: '28px', overflow: 'hidden' }}>Aceite Naranja 120ml</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: activeThemeObj.text, opacity: 0.5, marginTop: '5px' }}>$ 8.500</div>
                                <button style={{ width: '100%', marginTop: '8px', backgroundColor: activeThemeObj.header, border: '1px solid ' + activeThemeObj.accent, padding: '6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', color: activeThemeObj.text, opacity: 0.5, transition: 'all 0.3s ease' }}>Agotado</button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Floating Cart Bar */}
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: activeThemeObj.accent, padding: '12px 15px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'background-color 0.3s ease' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShoppingCart size={18} color={activeThemeObj.btnText} />
                            <div style={{ backgroundColor: activeThemeObj.btnText === '#000000' ? '#111' : '#fff', color: activeThemeObj.btnText === '#000000' ? '#fff' : '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>1</div>
                            <strong style={{ fontSize: '0.85rem', color: activeThemeObj.btnText }}>$ 8.500</strong>
                          </div>
                          <strong style={{ fontSize: '0.75rem', color: activeThemeObj.btnText, textTransform: 'uppercase' }}>Ver Pedido</strong>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Sidebar of details beside interactive frame */}
            <div className={styles.showcaseDetails}>
              <div className={styles.featureDetailItem}>
                <div className={styles.numberBadge}>1</div>
                <div>
                  <h4>Optimizado para Colombia</h4>
                  <p>Configurado por defecto en pesos colombianos (COP), formateador automático de miles (10.000, 50.000) y soporte directo local.</p>
                </div>
              </div>
              <div className={styles.featureDetailItem}>
                <div className={styles.numberBadge}>2</div>
                <div>
                  <h4>Operaciones en 1 Solo Clic</h4>
                  <p>Registra ventas, realiza devoluciones, imprime recibos o impórtalos a Excel de la manera más sencilla y rápida del mercado.</p>
                </div>
              </div>
              <div className={styles.featureDetailItem}>
                <div className={styles.numberBadge}>3</div>
                <div>
                  <h4>Inicio Inmediato</h4>
                  <p>Crea tu cuenta en 1 minuto, carga tus productos vía Excel (CSV) y empieza a facturar de inmediato. Sin tarjetas de crédito ni contratos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits checklist section */}
      <section className={styles.benefits}>
        <div className={styles.benefitsContainer}>
          <motion.div
            className={styles.benefitsContent}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>¿Por qué los pequeños negocios eligen Crece+?</h2>
            <p>
              Porque no necesitas ser un experto en sistemas para tener el control total de tu dinero. Crece+ elimina los cuadernos borrosos y te da las mismas herramientas que usan las grandes empresas, pero a una fracción del costo y extremadamente fáciles de usar.
            </p>

            <div className={styles.benefitsList}>
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className={styles.benefitItem}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle size={20} />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/registro" className={styles.ctaButton}>
                <Target size={20} />
                Comenzar Gratis Ahora
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.benefitsVisual}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.floatingCardsGrid}>
              <div className={styles.floatGridCard}>
                <ShoppingCart size={24} color="#fbbf24" />
                <strong>Punto de Venta</strong>
                <span>Cobra rápido y sin enredos</span>
              </div>
              <div className={styles.floatGridCard}>
                <Package size={24} color="#02A5E0" />
                <strong>Inventarios</strong>
                <span>Alertas y stock en la nube</span>
              </div>
              <div className={styles.floatGridCard}>
                <Calculator size={24} color="#10b981" />
                <strong>Cierre de Caja</strong>
                <span>Monitorea tus diferencias</span>
              </div>
              <div className={styles.floatGridCard}>
                <Users size={24} color="#8b5cf6" />
                <strong>Cajeros</strong>
                <span>Controla roles y permisos</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PRICING SECTION - MAIN FOCUS */}
      <section id="precios" className={styles.pricingSection}>
        <div className={styles.pricingContainer}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className={styles.pricingBadge}>PRECIOS CLAROS Y TRANSPARENTES</div>
            <h2>Planes de bajo costo diseñados para Emprendimientos</h2>
            <p>Comienza gratis para probar las capacidades de la herramienta. Desbloquea límites más altos a medida que tu negocio prospere, con planes mensuales sumamente accesibles.</p>
          </motion.div>

          {/* Billing Cycle Toggle */}
          <div className={styles.billingToggleWrapper}>
            <div className={styles.billingToggle}>
              <button
                className={`${styles.billingOption} ${billingPeriod === 'monthly' ? styles.billingOptionActive : ''}`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Pago Mensual
              </button>
              <button
                className={`${styles.billingOption} ${billingPeriod === 'yearly' ? styles.billingOptionActive : ''}`}
                onClick={() => setBillingPeriod('yearly')}
              >
                Pago Anual
                <span className={styles.discountBadge}>Ahorra 17%</span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className={styles.plansGrid}>

            {/* PLAN 1: GRATIS */}
            <motion.div
              className={styles.planCard}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.planHeader}>
                <span className={styles.planIcon}>🌱</span>
                <h3>Plan Gratuito</h3>
                <p className={styles.planDesc}>Perfecto para probar las bases de tu negocio</p>
                <div className={styles.planPriceRow}>
                  <span className={styles.planPriceVal}>$0</span>
                  <span className={styles.planPeriod}>COP / de por vida</span>
                </div>
              </div>
              <div className={styles.planCTA}>
                <Link to="/registro" className={styles.planCtaBtn}>Comenzar Gratis</Link>
              </div>
              <ul className={styles.planFeaturesList}>
                <li><CheckCircle size={16} color="#10b981" /> 1 Organización</li>
                <li><CheckCircle size={16} color="#10b981" /> 1 Usuario Cajero</li>
                <li><CheckCircle size={16} color="#10b981" /> Hasta <strong>20 productos</strong> en catálogo</li>
                <li><CheckCircle size={16} color="#10b981" /> Hasta <strong>50 ventas al mes</strong></li>
                <li><CheckCircle size={16} color="#10b981" /> Historial de 7 días de reportes</li>
                <li><CheckCircle size={16} color="#10b981" /> Caja registradora e inventario básico</li>
                <li className={styles.featureDisabled}>🚫 Sin imágenes de productos</li>
                <li className={styles.featureDisabled}>🚫 Sin importación masiva CSV</li>
                <li className={styles.featureDisabled}>🚫 Sin roles ni permisos de equipo</li>
              </ul>
            </motion.div>

            {/* PLAN 2: ESTÁNDAR (POPULAR) */}
            <motion.div
              className={`${styles.planCard} ${styles.planCardPopular}`}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.popularBadge}>👑 MÁS POPULAR PARA EMPRENDEDORES</div>
              <div className={styles.planHeader}>
                <span className={styles.planIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#02A5E0' }}>⚡</span>
                <h3>Plan Estándar</h3>
                <p className={styles.planDesc}>Ideal para digitalizar y escalar tu tienda</p>
                <div className={styles.planPriceRow}>
                  <span className={styles.planPriceVal}>
                    {billingPeriod === 'monthly' ? formatPrice(69900) : formatPrice(58250)}
                  </span>
                  <span className={styles.planPeriod}>COP / mes</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className={styles.yearlySubBilling}>Cobrado anualmente: {formatPrice(699000)} COP / año (Ahorras 2 meses gratis)</span>
                )}
              </div>
              <div className={styles.planCTA}>
                <Link to="/registro" className={`${styles.planCtaBtn} ${styles.planCtaBtnPopular}`}>Probar Versión Gratuita</Link>
              </div>
              <ul className={styles.planFeaturesList}>
                <li><CheckCircle size={16} color="#02A5E0" /> 1 Organización</li>
                <li><CheckCircle size={16} color="#02A5E0" /> Hasta <strong>3 usuarios cajeros</strong></li>
                <li><CheckCircle size={16} color="#02A5E0" /> <strong>PRODUCTOS ILIMITADOS</strong></li>
                <li><CheckCircle size={16} color="#02A5E0" /> <strong>VENTAS ILIMITADAS</strong></li>
                <li><CheckCircle size={16} color="#02A5E0" /> Historial de ventas de por vida</li>
                <li><CheckCircle size={16} color="#02A5E0" /> Carga de imágenes para productos</li>
                <li><CheckCircle size={16} color="#02A5E0" /> Importar / Exportar Excel masivo</li>
                <li><CheckCircle size={16} color="#02A5E0" /> Múltiples métodos de pago y caja</li>
                <li><CheckCircle size={16} color="#02A5E0" /> Reportes de cierres y finanzas</li>
                <li><CheckCircle size={16} color="#02A5E0" /> Gestión de roles y permisos</li>
                <li><CheckCircle size={16} color="#02A5E0" /> Soporte prioritario por Correo</li>
              </ul>
            </motion.div>

            {/* PLAN 3: PREMIUM */}
            <motion.div
              className={styles.planCard}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.planHeader}>
                <span className={styles.planIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>🏢</span>
                <h3>Plan Premium</h3>
                <p className={styles.planDesc}>Para empresas consolidadas y sucursales</p>
                <div className={styles.planPriceRow}>
                  <span className={styles.planPriceVal}>
                    {billingPeriod === 'monthly' ? formatPrice(119900) : formatPrice(99917)}
                  </span>
                  <span className={styles.planPeriod}>COP / mes</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className={styles.yearlySubBilling}>Cobrado anualmente: {formatPrice(1199000)} COP / año (Ahorras 2 meses gratis)</span>
                )}
              </div>
              <div className={styles.planCTA}>
                <Link to="/registro" className={styles.planCtaBtn}>Comenzar Premium</Link>
              </div>
              <ul className={styles.planFeaturesList}>
                <li><CheckCircle size={16} color="#10b981" /> <strong>Hasta 5 Organizaciones</strong></li>
                <li><CheckCircle size={16} color="#10b981" /> <strong>USUARIOS ILIMITADOS</strong></li>
                <li><CheckCircle size={16} color="#10b981" /> Todo lo del Plan Estándar</li>
                <li><CheckCircle size={16} color="#10b981" /> Panel Multi-Negocio Consolidado</li>
                <li><CheckCircle size={16} color="#10b981" /> Transferencia de stock inter-sucursal</li>
                <li><CheckCircle size={16} color="#10b981" /> Marca y recibos 100% personalizados</li>
                <li><CheckCircle size={16} color="#10b981" /> <strong>Soporte 24/7 y Onboarding</strong></li>
                <li><CheckCircle size={16} color="#10b981" /> <strong>WhatsApp de Soporte Directo</strong></li>
              </ul>
            </motion.div>
          </div>

          <div className={styles.pricingFooterNotice}>
            <p>💡 <strong>¿Por qué cobramos mensualidades bajas?</strong> Nuestro enfoque es democratizar la tecnología. Al ser un pago mensual bajo, eliminamos la barrera de entrada para que cualquier panadería, restaurante, boutique o minimercado pueda profesionalizarse hoy sin descapitalizarse.</p>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contacto" className={styles.contactSection}>
        <div className={styles.contactContainer}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>¿Cómo podemos ayudarte?</h2>
            <p>Estamos aquí para apoyarte en cada etapa de tu crecimiento. Elige el canal que prefieras.</p>
          </motion.div>

          {/* Department Cards */}
          <div className={styles.contactDeptGrid}>
            {[
              { icon: '🛒', title: 'Ventas', desc: 'Planes, precios y facturación', email: 'ventas@crecemas.co', dept: 'ventas' },
              { icon: '🛠️', title: 'Soporte Técnico', desc: 'Ayuda con la plataforma', email: 'soporte@crecemas.co', dept: 'soporte' },
              { icon: '⚖️', title: 'Legal', desc: 'Términos y privacidad', email: 'legal@crecemas.co', dept: 'legal' },
              { icon: '💬', title: 'Contacto General', desc: 'Cualquier otra consulta', email: 'hola@crecemas.co', dept: 'general' },
            ].map((dept, i) => (
              <motion.div
                key={i}
                className={styles.contactDeptCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, borderColor: 'rgba(2, 165, 224, 0.5)' }}
                onClick={() => setContactForm(f => ({ ...f, department: dept.dept }))}
              >
                <span className={styles.deptCardIcon}>{dept.icon}</span>
                <h4>{dept.title}</h4>
                <p>{dept.desc}</p>
                <a href={`mailto:${dept.email}`} className={styles.deptCardEmail} onClick={e => e.stopPropagation()}>{dept.email}</a>
              </motion.div>
            ))}
          </div>

          {/* Form + WhatsApp row */}
          <div className={styles.contactMainRow}>
            {/* Contact Form */}
            <motion.div
              className={styles.contactFormBox}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className={styles.contactFormTitle}><Mail size={20} /> Envíanos un mensaje</h3>
              <form onSubmit={handleContactSubmit} className={styles.contactForm}>
                <div className={styles.contactInputsRow}>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className={styles.contactInput}
                    id="contact-name"
                  />
                  <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className={styles.contactInput}
                    id="contact-email"
                  />
                </div>
                <select
                  value={contactForm.department}
                  onChange={e => setContactForm(f => ({ ...f, department: e.target.value }))}
                  className={styles.contactSelect}
                  id="contact-department"
                >
                  <option value="soporte">🛠️ Soporte Técnico</option>
                  <option value="ventas">🛒 Ventas y Planes</option>
                  <option value="legal">⚖️ Legal</option>
                  <option value="general">💬 Consulta General</option>
                </select>
                <textarea
                  placeholder="¿En qué podemos ayudarte? Cuéntanos con detalle..."
                  value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  required
                  rows={4}
                  className={styles.contactTextarea}
                  id="contact-message"
                />
                {contactSuccess && (
                  <div className={styles.contactSuccess}>
                    <CheckCircle size={16} /> {contactSuccess}
                  </div>
                )}
                {contactError && (
                  <div className={styles.contactErrorMsg}>{contactError}</div>
                )}
                <motion.button
                  type="submit"
                  className={styles.contactSubmitBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={contactLoading}
                  id="contact-submit"
                >
                  {contactLoading ? 'Enviando...' : <><Send size={16} /> Enviar mensaje</>}
                </motion.button>
              </form>
            </motion.div>

            {/* WhatsApp CTA */}
            <motion.div
              className={styles.contactWaBox}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className={styles.waBoxInner}>
                <div className={styles.waIconBig}>
                  <svg viewBox="0 0 24 24" width="52" height="52" fill="currentColor">
                    <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.908.533 3.69 1.458 5.214L2 22l4.928-1.428A9.957 9.957 0 0012.004 22c5.52 0 10-4.48 10-10S17.524 2 12.004 2zm5.795 14.197c-.244.686-1.233 1.258-1.795 1.343-.54.085-1.218.157-3.415-.744-2.825-1.157-4.607-4.047-4.75-4.232-.143-.186-1.157-1.545-1.157-2.946 0-1.4.729-2.087.986-2.373.257-.286.558-.358.744-.358.186 0 .372.014.53.028.172.014.386-.057.6-.057.215 0 .415.086.63.586.23.53.772 1.902.844 2.045.072.143.115.315.015.515-.1.2-.15.315-.3.486-.15.172-.315.386-.45.515-.15.143-.308.301-.129.615.18.3.794 1.31 1.702 2.116.78.694 1.442.909 1.758 1.052.315.143.5.122.687-.086.186-.208.787-.915.994-1.23.208-.315.415-.258.701-.15.286.1.18.1.18.1s1.825.9 2.14 1.058c.315.158.53.23.6.358.072.13.072.744-.172 1.43z" />
                  </svg>
                </div>
                <h3>¿Prefieres WhatsApp?</h3>
                <p>Habla con nuestro equipo en tiempo real. Respondemos en minutos durante horario hábil.</p>
                <div className={styles.waNumberRow}>
                  <Phone size={18} color="#22c55e" />
                  <strong>+57 304 642 2366</strong>
                </div>
                <motion.a
                  href="https://wa.me/573046422366?text=Hola!%20Vengo%20de%20la%20landing%20page%20de%20Crece%2B%20y%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20el%20sistema%20de%20gesti%C3%B3n."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.waCtaBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💬 Chatear por WhatsApp
                </motion.a>
                <div className={styles.waOrSeparator}><span>o escríbenos directamente</span></div>
                <div className={styles.waEmailLinks}>
                  <a href="mailto:hola@crecemas.co"><Mail size={14} /> hola@crecemas.co</a>
                  <a href="mailto:soporte@crecemas.co"><Mail size={14} /> soporte@crecemas.co</a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContainer}>
          <motion.div
            className={styles.ctaContent}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>¿Listo para organizar tu negocio y empezar a crecer?</h2>
            <p>Regístrate en menos de 1 minuto y obtén acceso inmediato a nuestra Versión Gratuita. Pásate a un plan Premium cuando tu negocio lo necesite.</p>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerInfoCol}>
            <div className={styles.footerLogo}>
              <TrendingUp size={20} color="#fbbf24" />
              <span>Crece+</span>
            </div>
            <p className={styles.footerBrandDesc}>El sistema de gestión y ventas más amigable del mercado colombiano. Empoderamos a los pequeños y medianos emprendimientos con tecnología ágil en la nube.</p>
          </div>

          <div className={styles.footerLinksCol}>
            <h4>Navegación</h4>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#visuales">Ejemplos</a>
            <a href="#precios">Precios y Planes</a>
            <a href="#contacto">Contacto y Soporte</a>
          </div>

          <div className={styles.footerContactCol}>
            <h4>Contacto Oficial</h4>
            <div className={styles.contactItem}>
              <MessageCircle size={16} color="#22c55e" />
              <span>WhatsApp: <a href="https://wa.me/573046422366" target="_blank" rel="noopener noreferrer" className={styles.footerPhoneLink}>304 642 2366</a></span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} color="#02A5E0" />
              <a href="mailto:soporte@crecemas.co" className={styles.footerPhoneLink}>soporte@crecemas.co</a>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} color="#fbbf24" />
              <a href="mailto:ventas@crecemas.co" className={styles.footerPhoneLink}>ventas@crecemas.co</a>
            </div>
            <div className={styles.contactItem}>
              <Globe size={16} />
              <span>crecemas.co — Colombia</span>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Crece+. Todos los derechos reservados. Diseñado con amor para impulsar a los emprendedores de Colombia.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
