
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Shield, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Star,
  Zap,
  Target,
  Globe,
  Package,
  DollarSign,
  FileText,
  CreditCard,
  Calculator,
  ShoppingCart,
  Share2,
  Building2
} from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
  const features = [
    {
      icon: <ShoppingCart size={32} />,
      title: "Punto de Venta Completo",
      description: "Caja registradora moderna con métodos de pago múltiples (efectivo, tarjeta, transferencia, mixto)"
    },
    {
      icon: <Package size={32} />,
      title: "Gestión de Inventario Inteligente",
      description: "Control de stock con alertas, fechas de vencimiento, imágenes optimizadas y búsqueda avanzada"
    },
    {
      icon: <BarChart3 size={32} />,
      title: "Dashboard en Tiempo Real",
      description: "Visualiza ventas, productos más vendidos, estadísticas por método de pago y alertas de stock"
    },
    {
      icon: <FileText size={32} />,
      title: "Reportes y Análisis Completos",
      description: "Resumen de ventas, gráficos interactivos, análisis por períodos y exportación de datos"
    },
    {
      icon: <Calculator size={32} />,
      title: "Cierre de Caja Profesional",
      description: "Conciliación automática de efectivo, desglose por método de pago y reportes de diferencias"
    },
    {
      icon: <Users size={32} />,
      title: "Gestión de Equipos y Roles",
      description: "Sistema completo de permisos, invitaciones por correo y roles personalizables"
    },
    {
      icon: <Building2 size={32} />,
      title: "Multi-Organizaciones",
      description: "Maneja múltiples negocios desde una sola cuenta con cambio rápido entre organizaciones"
    },
    {
      icon: <Zap size={32} />,
      title: "Ventas Rápidas",
      description: "Registra ventas sin inventario para servicios, consultas o productos no catalogados"
    },
    {
      icon: <CreditCard size={32} />,
      title: "Métodos de Pago Flexibles",
      description: "Efectivo con cálculo de cambio, tarjeta, transferencia, pagos mixtos y más"
    },
    {
      icon: <DollarSign size={32} />,
      title: "Formato de Miles Automático",
      description: "Todos los inputs numéricos formatean automáticamente (1.000, 50.000) para mejor legibilidad"
    },
    {
      icon: <Share2 size={32} />,
      title: "Recibos Digitales",
      description: "Genera recibos profesionales con logo, descarga PDF, comparte por WhatsApp o imprime"
    },
    {
      icon: <Shield size={32} />,
      title: "100% Seguro y Confiable",
      description: "Autenticación robusta, datos encriptados y respaldo automático en la nube"
    }
  ];

  const benefits = [
    "Interfaz moderna y fácil de usar",
    "Sin necesidad de instalación",
    "Actualizaciones automáticas y gratuitas",
    "Respaldo automático en tiempo real",
    "Modo oscuro/claro personalizable",
    "Búsqueda instantánea de productos",
    "Importación masiva desde CSV",
    "Imágenes comprimidas automáticamente",
    "Scroll infinito para grandes inventarios",
    "Estadísticas en tiempo real",
    "Alertas de stock bajo",
    "Control de productos próximos a vencer"
  ];

  const stats = [
    { number: "5000+", label: "Ventas Procesadas" },
    { number: "100%", label: "Tiempo de Actividad" },
    { number: "12+", label: "Funcionalidades" },
    { number: "24/7", label: "Acceso Disponible" }
  ];

  const dashboardFeatures = [
    {
      icon: <TrendingUp size={20} />,
      title: "Ventas del Día",
      description: "Total de ventas y comparación con días anteriores"
    },
    {
      icon: <Package size={20} />,
      title: "Control de Stock",
      description: "Productos con stock bajo y próximos a vencer"
    },
    {
      icon: <Star size={20} />,
      title: "Top Productos",
      description: "Los 5 productos más vendidos del período"
    },
    {
      icon: <BarChart3 size={20} />,
      title: "Gráficos Interactivos",
      description: "Visualización de ventas por método de pago"
    }
  ];

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.div 
            className={styles.heroText}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className={styles.badge}>
              <Zap size={16} />
              <span>La solución #1 para tu negocio</span>
            </div>
            
            <h1 className={styles.heroTitle}>
              Gestiona tu negocio con{' '}
              <span className={styles.gradientText}>Crece+</span>
            </h1>
            
            <p className={styles.heroSubtitle}>
              La plataforma más completa para gestionar inventario, ventas y reportes. 
              Diseñada para hacer crecer tu negocio de manera inteligente y eficiente.
            </p>
            
            <div className={styles.heroActions}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/registro" className={styles.primaryButton}>
                  Comenzar Gratis
                  <ArrowRight size={20} />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/login" className={styles.secondaryButton}>
                  Iniciar Sesión
                </Link>
              </motion.div>
            </div>
            
            <div className={styles.trustIndicators}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                ))}
                <span>4.9/5 de nuestros usuarios</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className={styles.heroVisual}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className={styles.dashboardPreview}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDots}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
                <span>Crece+ Dashboard</span>
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.mockupChart}></div>
                <div className={styles.mockupStats}>
                  <div className={styles.mockupStat}></div>
                  <div className={styles.mockupStat}></div>
                  <div className={styles.mockupStat}></div>
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <motion.div 
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Todo lo que necesitas para hacer crecer tu negocio</h2>
            <p>Herramientas profesionales diseñadas para simplificar tu gestión diaria</p>
          </motion.div>
          
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Features Section */}
      <section className={styles.dashboardSection}>
        <div className={styles.dashboardContainer}>
          <motion.div 
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Dashboard Inteligente en Tiempo Real</h2>
            <p>Visualiza el estado completo de tu negocio desde un solo lugar</p>
          </motion.div>

          <div className={styles.dashboardContent}>
            <motion.div 
              className={styles.dashboardPreviewLarge}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className={styles.dashboardMockup}>
                <div className={styles.dashboardHeader}>
                  <div className={styles.dashboardNav}>
                    <div className={styles.navItem}>
                      <BarChart3 size={16} />
                      <span>Dashboard</span>
                    </div>
                    <div className={styles.navItem}>
                      <ShoppingCart size={16} />
                      <span>Caja</span>
                    </div>
                    <div className={styles.navItem}>
                      <Package size={16} />
                      <span>Inventario</span>
                    </div>
                    <div className={styles.navItem}>
                      <FileText size={16} />
                      <span>Reportes</span>
                    </div>
                  </div>
                </div>
                <div className={styles.dashboardBody}>
                  <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                      <TrendingUp size={20} color="#10b981" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Ventas Hoy</span>
                        <span className={styles.statValue}>$1.250.000</span>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <Package size={20} color="#3b82f6" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Productos</span>
                        <span className={styles.statValue}>245</span>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <ShoppingCart size={20} color="#f59e0b" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Transacciones</span>
                        <span className={styles.statValue}>38</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.chartArea}>
                    <div className={styles.chartBars}>
                      <div className={styles.bar} style={{ height: '70%' }}></div>
                      <div className={styles.bar} style={{ height: '85%' }}></div>
                      <div className={styles.bar} style={{ height: '60%' }}></div>
                      <div className={styles.bar} style={{ height: '90%' }}></div>
                      <div className={styles.bar} style={{ height: '75%' }}></div>
                    </div>
                  </div>
                  <div className={styles.alertsArea}>
                    <div className={styles.alert}>
                      <Package size={16} color="#ef4444" />
                      <span>5 productos con stock bajo</span>
                    </div>
                    <div className={styles.alert}>
                      <Clock size={16} color="#f59e0b" />
                      <span>3 productos próximos a vencer</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className={styles.dashboardFeaturesGrid}>
              {dashboardFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  className={styles.dashboardFeatureCard}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className={styles.dashboardFeatureIcon}>{feature.icon}</div>
                  <div>
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className={styles.benefitsContainer}>
          <motion.div 
            className={styles.benefitsContent}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>¿Por qué miles eligen Crece+?</h2>
            <p>
              Sistema completo de gestión empresarial diseñado para pequeños y medianos negocios. 
              Potencia tu empresa con tecnología de última generación, fácil de usar y accesible desde cualquier lugar.
            </p>
            
            <div className={styles.benefitsList}>
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className={styles.benefitItem}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle size={20} />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/registro" className={styles.ctaButton}>
                <Target size={20} />
                Comenzar Ahora - Es Gratis
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className={styles.benefitsVisual}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.floatingCards}>
              <div className={styles.floatingCard}>
                <ShoppingCart size={24} />
                <div>
                  <strong>Punto de Venta</strong>
                  <span>Completo y rápido</span>
                </div>
              </div>
              <div className={styles.floatingCard}>
                <Package size={24} />
                <div>
                  <strong>Inventario</strong>
                  <span>Control total</span>
                </div>
              </div>
              <div className={styles.floatingCard}>
                <BarChart3 size={24} />
                <div>
                  <strong>Reportes</strong>
                  <span>En tiempo real</span>
                </div>
              </div>
              <div className={styles.floatingCard}>
                <Users size={24} />
                <div>
                  <strong>Equipos</strong>
                  <span>Gestión de roles</span>
                </div>
              </div>
              <div className={styles.floatingCard}>
                <Calculator size={24} />
                <div>
                  <strong>Cierre de Caja</strong>
                  <span>Automático</span>
                </div>
              </div>
              <div className={styles.floatingCard}>
                <Globe size={24} />
                <div>
                  <strong>Multi-negocio</strong>
                  <span>Una sola cuenta</span>
                </div>
              </div>
            </div>
          </motion.div>
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
            <h2>¿Listo para hacer crecer tu negocio?</h2>
            <p>Únete a miles de empresarios que ya están transformando sus negocios con Crece+</p>
            
            <div className={styles.ctaActions}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/registro" className={styles.ctaPrimary}>
                  Crear Cuenta Gratis
                  <ArrowRight size={20} />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/login" className={styles.ctaSecondary}>
                  Ya tengo cuenta
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
