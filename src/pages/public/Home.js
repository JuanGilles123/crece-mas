
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Shield, 
  Smartphone, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Star,
  Zap,
  Target,
  Globe
} from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
  const features = [
    {
      icon: <BarChart3 size={32} />,
      title: "Dashboard Completo",
      description: "Visualiza todas tus métricas importantes en un solo lugar"
    },
    {
      icon: <Users size={32} />,
      title: "Gestión de Inventario",
      description: "Controla tu stock, precios y productos de manera eficiente"
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Reportes en Tiempo Real",
      description: "Analiza tus ventas y tendencias al instante"
    },
    {
      icon: <Shield size={32} />,
      title: "100% Seguro",
      description: "Tus datos están protegidos con la mejor tecnología"
    },
    {
      icon: <Smartphone size={32} />,
      title: "Multiplataforma",
      description: "Accede desde cualquier dispositivo, en cualquier lugar"
    },
    {
      icon: <Clock size={32} />,
      title: "Soporte 24/7",
      description: "Estamos aquí para ayudarte cuando lo necesites"
    }
  ];

  const benefits = [
    "Fácil de usar e intuitivo",
    "Sin necesidad de instalación",
    "Actualizaciones automáticas",
    "Respaldo automático de datos",
    "Integración con múltiples monedas",
    "Reportes exportables"
  ];

  const stats = [
    { number: "1000+", label: "Usuarios Activos" },
    { number: "50K+", label: "Ventas Procesadas" },
    { number: "99.9%", label: "Tiempo de Actividad" },
    { number: "24/7", label: "Soporte Disponible" }
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
            <p>Herramientas poderosas diseñadas para simplificar tu gestión diaria</p>
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
            <h2>¿Por qué elegir Crece+?</h2>
            <p>
              Miles de empresarios ya confían en nosotros para gestionar sus negocios. 
              Únete a la revolución digital y lleva tu empresa al siguiente nivel.
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
                Comenzar Ahora
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
                <TrendingUp size={24} />
                <span>+25% Ventas</span>
              </div>
              <div className={styles.floatingCard}>
                <Clock size={24} />
                <span>50% Menos Tiempo</span>
              </div>
              <div className={styles.floatingCard}>
                <Globe size={24} />
                <span>Acceso Global</span>
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
