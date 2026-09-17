import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import {
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowUp,
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
  MessageSquare,
  Mail,
  Send,
  Coffee,
  ShoppingBag,
  Scale,
  Headphones,
  Receipt,
  Wallet,
  Boxes,
  PieChart,
  AlertCircle,
  Calendar,
  Search,
  Settings,
  Sparkles,
  Leaf,
  Building2
} from 'lucide-react';
import { ReactComponent as LogoSVG } from '../../assets/logo-crece.svg';
import FlickeringGrid from '../../components/animations/FlickeringGrid';
import { LightRays } from '../../components/animations/LightRays';
import { TextAnimate } from '../../components/animations/TextAnimate';
import { Marquee } from '../../components/animations/Marquee';
import { NumberTicker } from '../../components/animations/NumberTicker';
import { DiaTextReveal } from '../../components/animations/DiaTextReveal';
import styles from './Home.module.css';

// Logo animado — rota -45° en hover aludiendo a la flecha verde "subiendo"
const CreceLogo = () => (
  <motion.div
    className={styles.logoAnimated}
    whileHover={{ rotate: -45 }}
    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
  >
    <LogoSVG />
  </motion.div>
);

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

  // MacBook 3D Scroll Animation logic
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const { scrollY } = useScroll();
  // El grid empieza en 0.8 en el hero y baja suavemente a 0.45 para que siga siendo visible en el resto de la página
  const gridOpacity = useTransform(scrollY, [0, 800], [0.8, 0.45]);

  // Animaciones controladas por Scroll
  const lidRotateX = useTransform(scrollYProgress, [0, 0.7], ["0deg", "-95deg"]);
  const globalRotateX = useTransform(scrollYProgress, [0, 0.7], ["0deg", "90deg"]);
  const globalY = useTransform(scrollYProgress, [0, 0.7], ["0px", "100px"]);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const globalXMobile = useTransform(scrollYProgress, [0, 0.7], ["0vw", "0vw"]);
  const globalXDesktop = useTransform(scrollYProgress, [0, 0.7], ["2vw", "-27vw"]); // 2vw para empujarlo un poco a la derecha al inicio
  const globalX = isMobile ? globalXMobile : globalXDesktop;
  
  const globalWidthMobile = useTransform(scrollYProgress, [0, 0.7], ["85vw", "95vw"]);
  const globalWidthDesktop = useTransform(scrollYProgress, [0, 0.7], ["30vw", "85vw"]); // 30vw (antes 38) para darle más espacio horizontal al texto
  const globalWidth = isMobile ? globalWidthMobile : globalWidthDesktop;
  
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      const navHeight = 80; // approximate height of fixed navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
      {/* Fondos Animados Globales (Full Screen & Fixed) */}
      <motion.div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0, pointerEvents: 'none', opacity: gridOpacity }}>
        
        {/* Rayos de Luz (Verdes) que crecen y se animan desde arriba */}
        <LightRays />

        {/* Cuadrícula Mágica */}
        <FlickeringGrid 
          squareSize={3} 
          gridGap={20} 
          maxOpacity={0.4} 
          flickerChance={0.08} 
          colors={['#014abb', '#1ad61a']}
        />
      </motion.div>

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
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
            </svg>
          </div>
        </a>
      </div>

      {/* Sticky Header with Glassmorphism */}
      <header className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <div className={styles.navContainer}>
          <div className={styles.navLogo}>
            <CreceLogo />
          </div>

          <nav className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksMobileActive : ''}`} onMouseLeave={() => setHoveredNav(null)}>
            {[
              { id: 'funcionalidades', label: 'Funcionalidades' },
              { id: 'visuales', label: 'Ver Ejemplos' },
              { id: 'precios', label: 'Planes' },
              { id: 'contacto', label: 'Soporte' }
            ].map((item) => (
              <a 
                key={item.id}
                href={`#${item.id}`} 
                onClick={(e) => handleSmoothScroll(e, item.id)}
                onMouseEnter={() => setHoveredNav(item.id)}
              >
                {hoveredNav === item.id && (
                  <motion.div
                    layoutId="navHoverPill"
                    className={styles.navHoverPill}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 2 }}>{item.label}</span>
              </a>
            ))}
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
      <section className={styles.hero} id="inicio" ref={heroRef}>
        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroText}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            style={{ opacity: textOpacity, position: 'relative', zIndex: 10 }}
          >  <h1 className={styles.heroTitle}>
              <TextAnimate content="Transforma tu negocio con el POS más ágil" as="span" by="word" once={false} />{' '}
              <span className={styles.gradientText}>
                <TextAnimate content="de " as="span" by="character" delay={0.6} once={false} />
                <DiaTextReveal once={false}>
                  <TextAnimate content="Colombia" as="span" by="character" delay={0.6} once={false} />
                </DiaTextReveal>
              </span>
            </h1>

            <p className={styles.heroSubtitle}>
              <TextAnimate content="Olvídate del papel y los descuadres. Controla tu inventario, registra ventas en segundos y mira cómo crecen tus ganancias desde cualquier dispositivo." as="span" by="word" delay={0.8} once={false} />
            </p>

            <div className={styles.heroActions}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/registro" className={styles.primaryButton}>
                    Probar Gratis Ahora
                    <ArrowRight size={20} color="#ffffff" />
                  </Link>
                </motion.div>
                <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>Sin tarjeta de crédito requerida</span>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a href="#precios" onClick={(e) => handleSmoothScroll(e, 'precios')} className={styles.secondaryButton}>
                  Ver Planes de Bajo Costo
                </a>
              </motion.div>
            </div>

            <div className={styles.heroWhatsAppCallout}>
              <Phone size={18} color="#1ad61a" />
              <span>Soporte directo por WhatsApp: <strong><a href="tel:3046422366" className={styles.phoneLink}>304 642 2366</a></strong></span>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
            style={{ zIndex: 10 }}
          >
            <motion.div 
              className={styles.macbookContainer}
              style={{ 
                rotateX: globalRotateX,
                width: globalWidth,
                x: globalX,
                y: globalY
              }}
            >
              <motion.div 
                className={styles.macbookLid}
                style={{ rotateX: lidRotateX }}
              >
                {/* Front of the lid (Screen) */}
                <div className={styles.macbookScreen}>
                  <div className={styles.macbookCamera}></div>
                  <div className={styles.macbookDisplay}>
                    <img src="/pantalla%20primera%20.jpeg" alt="Dashboard Crece+ POS" />
                  </div>
                </div>
                
                {/* Back of the lid (Apple Logo) */}
                <div className={styles.macbookBackFace}>
                  {/* Using Crece+ logo instead of Apple to avoid copyright, but styled exactly like an Apple logo on a Mac */}
                  <LogoSVG className={styles.macbookAppleLogo} />
                </div>
              </motion.div>
              
              <div className={styles.macbookBase}>
                <div className={styles.macbookNotch}></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Marquee Logos Section */}
      <section className={styles.marqueeSection} style={{ padding: '3rem 0', background: '#ffffff', borderTop: '1px solid rgba(1, 74, 187, 0.05)', borderBottom: '1px solid rgba(1, 74, 187, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Negocios que confían en nuestro sistema
        </div>
        <Marquee pauseOnHover={true} className="[--duration:30s]">
          {/* Aquí irán los logos reales. Por ahora usamos textos con estilo de logo */}
          {[
            { src: '/logo lotus.jpeg', alt: 'Lotus' },
            { src: '/logo luxury.jpeg', alt: 'Luxury' },
            { src: '/logo lotus.jpeg', alt: 'Lotus' },
            { src: '/logo luxury.jpeg', alt: 'Luxury' },
            { src: '/logo lotus.jpeg', alt: 'Lotus' },
            { src: '/logo luxury.jpeg', alt: 'Luxury' }
          ].map((client, i) => (
            <div key={i} style={{ 
              padding: '1rem', 
              background: '#ffffff', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              width: '180px',
              height: '90px',
              margin: '0 1rem'
            }}>
              <img 
                src={client.src} 
                alt={client.alt} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  borderRadius: '4px'
                }} 
              />
            </div>
          ))}
        </Marquee>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          <motion.div
            className={styles.statItem}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0 }}
          >
            <div className={styles.statNumber}>
              <NumberTicker value={10000} suffix="+" once={false} />
            </div>
            <div className={styles.statLabel}>Ventas Registradas</div>
          </motion.div>
          <motion.div
            className={styles.statItem}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className={styles.statNumber}>
              <NumberTicker value={99.9} decimalPlaces={1} suffix="%" once={false} />
            </div>
            <div className={styles.statLabel}>Tiempo de Actividad</div>
          </motion.div>

          <motion.div
            className={styles.statItem}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className={styles.statNumber}>
              <DiaTextReveal text="24/7" once={false} repeat={true} repeatDelay={4} gradient="linear-gradient(to right, #072146 0%, #072146 45%, #02A5E0 55%, #072146 65%, #072146 100%)" />
            </div>
            <div className={styles.statLabel}>Acceso Seguro Nube</div>
          </motion.div>
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

          <motion.div 
            className={styles.featuresGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {features.map((feature, index) => {
              let layoutClass = styles.featureCard;
              if (index === 0 || index === 4) layoutClass = `${styles.featureCard} ${styles.featureWide}`;
              if (index === 1) layoutClass = `${styles.featureCard} ${styles.featureTall}`;

              return (
                <motion.div
                  key={index}
                  className={layoutClass}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                  }}
                  whileHover={{ y: -6, borderColor: 'rgba(2, 165, 224, 0.4)' }}
                >
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
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
            viewport={{ once: false, amount: 0.1 }}
          >
            <h2>
              <TextAnimate content="Explora nuestra interfaz en funcionamiento" as="span" by="word" once={false} />
            </h2>
            <p>Diseño premium de alta velocidad desarrollado con la mejor tecnología. Haz clic en las pestañas a continuación para ver cómo opera el sistema.</p>
          </motion.div>

          {/* Interactive tabs */}
          <div className={styles.tabsRow}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${styles.tabBtn} ${activeMockup === 'pos' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('pos')}
            >
              <ShoppingCart size={18} />
              Punto de Venta (POS)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${styles.tabBtn} ${activeMockup === 'inventory' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('inventory')}
            >
              <Package size={18} />
              Gestión de Inventario
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${styles.tabBtn} ${activeMockup === 'dashboard' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('dashboard')}
            >
              <BarChart3 size={18} />
              Dashboard y Analítica
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${styles.tabBtn} ${activeMockup === 'catalog' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveMockup('catalog')}
            >
              <Globe size={18} />
              Mi Tienda Online
            </motion.button>
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
                        <h4><Receipt size={18} className={styles.paneTitleIcon} /> Cuenta Activa</h4>
                        <div className={styles.posCartItems}>
                          {[
                            { name: "Hamburguesa Especial con Queso", code: "H012 / Cantidad: x2", price: "$36.000" },
                            { name: "Papas Rústicas en Casco", code: "P005 / Cantidad: x1", price: "$9.500" },
                            { name: "Coca-Cola Original 350ml", code: "B002 / Cantidad: x2", price: "$9.000" }
                          ].map((item, index) => (
                            <motion.div 
                              key={index}
                              className={styles.posCartItem}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: 0.1 * index, type: "spring", stiffness: 100 }}
                            >
                              <div>
                                <strong>{item.name}</strong>
                                <span>Código: {item.code}</span>
                              </div>
                              <span className={styles.itemPrice}>{item.price}</span>
                            </motion.div>
                          ))}
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
                        <h4><Wallet size={18} className={styles.paneTitleIcon} /> Métodos de Pago</h4>
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
                          <Search size={16} className={styles.searchIcon} />
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
                            <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Stock Bajo (2)
                          </button>
                          <button
                            className={`${styles.filterTab} ${invFilter === 'out' ? styles.filterTabActive : ''}`}
                            onClick={() => setInvFilter('out')}
                          >
                            <X size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Agotados (1)
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
                                      {p.label === 'Café' ? <Coffee size={16} color="#072146" /> : 
                                       p.label === 'Lácteo' ? <Package size={16} color="#072146" /> : 
                                       p.label === 'Panadería' ? <ShoppingBag size={16} color="#072146" /> : 
                                       <Boxes size={16} color="#072146" />}
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
                        <h4><PieChart size={18} className={styles.paneTitleIcon} /> Resumen de Rendimiento</h4>
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
                          <h5><BarChart3 size={16} className={styles.paneSubtitleIcon} /> Gráfico de Ventas</h5>
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
                          <h5><AlertCircle size={16} className={styles.paneSubtitleIcon} /> Alertas de Atención</h5>
                          <div className={styles.dashAlertList}>
                            <div className={styles.dashAlertItem}>
                              <span className={styles.alertIcon}><AlertCircle size={16} color="#d97706" /></span>
                              <div>
                                <strong>Stock Crítico de Productos</strong>
                                <p>Leche Entera Premium y Aceite de Oliva tienen existencias bajas.</p>
                              </div>
                            </div>
                            <div className={styles.dashAlertItem}>
                              <span className={styles.alertIcon}><Calendar size={16} color="#02A5E0" /></span>
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
                        <h4 style={{ marginBottom: '15px' }}><Settings size={18} className={styles.paneTitleIcon} /> Personaliza tu Tienda Online</h4>

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
                              <Search size={14} style={{ marginRight: '8px', opacity: 0.5, color: activeThemeObj.text }} />
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
                          <div style={{ margin: '15px 10px', backgroundColor: activeThemeObj.header, padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: activeThemeObj.text, transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Sparkles size={14} color="#fcd116" /> ¡UN MUNDO DE BELLEZA! <Sparkles size={14} color="#fcd116" />
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
                <Zap size={20} />
                Comenzar Gratis Ahora
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.benefitsVisual}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.3
                }
              }
            }}
          >
            <div className={styles.floatingCardsGrid}>
              <motion.div 
                className={styles.floatGridCard}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
              >
                <ShoppingCart size={24} color="#014abb" />
                <strong>Punto de Venta</strong>
                <span>Cobra rápido y sin enredos</span>
              </motion.div>
              <motion.div 
                className={styles.floatGridCard}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
              >
                <Package size={24} color="#014abb" />
                <strong>Inventarios</strong>
                <span>Alertas y stock en la nube</span>
              </motion.div>
              <motion.div 
                className={styles.floatGridCard}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
              >
                <Calculator size={24} color="#014abb" />
                <strong>Cierre de Caja</strong>
                <span>Monitorea tus diferencias</span>
              </motion.div>
              <motion.div 
                className={styles.floatGridCard}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
              >
                <Users size={24} color="#014abb" />
                <strong>Cajeros</strong>
                <span>Controla roles y permisos</span>
              </motion.div>
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
            viewport={{ once: false, amount: 0.1 }}
          >
            <div className={styles.pricingBadge}>PRECIOS CLAROS Y TRANSPARENTES</div>
            <h2>
              <TextAnimate content="Planes de bajo costo diseñados para Emprendimientos" as="span" by="word" once={false} />
            </h2>
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
          <motion.div 
            className={styles.plansGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
          >

            {/* PLAN 1: GRATIS */}
            <motion.div
              className={styles.planCard}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
              }}
              whileHover={{ y: -8 }}
            >
              <div className={styles.planHeader}>
                <span className={styles.planIcon} style={{ background: '#f4f9fd', color: '#10b981' }}><Leaf size={24} /></span>
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
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
              }}
              whileHover={{ y: -8 }}
              animate={{
                boxShadow: ["0 0 0 0 rgba(2, 165, 224, 0)", "0 0 0 8px rgba(2, 165, 224, 0.1)", "0 0 0 0 rgba(2, 165, 224, 0)"],
              }}
              transition={{
                boxShadow: {
                  repeat: Infinity,
                  duration: 2,
                }
              }}
            >
              <div className={styles.popularBadge}>MÁS POPULAR PARA EMPRENDEDORES</div>
              <div className={styles.planHeader}>
                <span className={styles.planIcon} style={{ background: 'rgba(1, 74, 187, 0.1)', color: '#014abb' }}><Zap size={24} /></span>
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
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
              }}
              whileHover={{ y: -8 }}
            >
              <div className={styles.planHeader}>
                <span className={styles.planIcon} style={{ background: 'rgba(26, 214, 26, 0.1)', color: '#1ad61a' }}><Building2 size={24} /></span>
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
          </motion.div>

          <div className={styles.pricingFooterNotice}>
            <p><Zap size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: '#014abb' }} /> <strong>¿Por qué cobramos mensualidades bajas?</strong> Nuestro enfoque es democratizar la tecnología. Al ser un pago mensual bajo, eliminamos la barrera de entrada para que cualquier panadería, restaurante, boutique o minimercado pueda profesionalizarse hoy sin descapitalizarse.</p>
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
              { icon: <ShoppingCart size={24} color="#014abb" />, title: 'Ventas', desc: 'Planes, precios y facturación', email: 'ventas@crecemas.co', dept: 'ventas' },
              { icon: <Headphones size={24} color="#014abb" />, title: 'Soporte Técnico', desc: 'Ayuda con la plataforma', email: 'soporte@crecemas.co', dept: 'soporte' },
              { icon: <Scale size={24} color="#014abb" />, title: 'Legal', desc: 'Términos y privacidad', email: 'legal@crecemas.co', dept: 'legal' },
              { icon: <MessageSquare size={24} color="#014abb" />, title: 'Contacto General', desc: 'Cualquier otra consulta', email: 'hola@crecemas.co', dept: 'general' },
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
              <h3 className={styles.contactFormTitle}><MessageSquare size={24} color="#014abb" /> Envíanos un mensaje</h3>
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
                  <option value="soporte">Soporte Técnico</option>
                  <option value="ventas">Ventas y Planes</option>
                  <option value="legal">Legal</option>
                  <option value="general">Consulta General</option>
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
                  <MessageCircle size={36} strokeWidth={2.5} color="white" />
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
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <MessageCircle size={18} /> Chatear por WhatsApp
                  </span>
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
            viewport={{ once: false, amount: 0.1 }}
          >
            <h2 style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '1rem' }}>
              <TextAnimate content="¿Listo para organizar tu negocio y llevarlo al siguiente nivel?" as="span" by="word" once={false} />
            </h2>
            <p>Regístrate en menos de 1 minuto y obtén acceso inmediato a nuestra Versión Gratuita. Pásate a un plan Premium cuando tu negocio lo necesite.</p>
            <Link to="/registro" className={styles.ctaFinalButton}>
              Crear Cuenta Gratis <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <motion.footer 
        className={styles.footer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.1 }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        <div className={styles.footerContainer}>
          <motion.div className={styles.footerInfoCol} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <div className={styles.footerLogo}>
              <CreceLogo />
              <span>Crece+</span>
            </div>
            <p className={styles.footerBrandDesc}>El sistema de gestión y ventas más amigable del mercado colombiano. Empoderamos a los pequeños y medianos emprendimientos con tecnología ágil en la nube.</p>
          </motion.div>

          <motion.div className={styles.footerLinksCol} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4>Navegación</h4>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#visuales">Ejemplos</a>
            <a href="#precios">Precios y Planes</a>
            <a href="#contacto">Contacto y Soporte</a>
          </motion.div>

          <motion.div className={styles.footerContactCol} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
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
          </motion.div>
        </div>
        <motion.div className={styles.footerBottom} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
          <p>&copy; {new Date().getFullYear()} Crece+. Todos los derechos reservados. Diseñado con amor para impulsar a los emprendedores de Colombia.</p>
        </motion.div>
      </motion.footer>
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className={styles.scrollTopButton}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1, boxShadow: "0 12px 28px rgba(1, 74, 187, 0.5)" }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
          >
            <ArrowUp size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;
