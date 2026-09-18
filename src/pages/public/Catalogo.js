import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/api/supabaseClient';
import { Search, Store, PackageX, ShoppingCart, ShoppingBag, Plus, Minus, MessageCircle, X, Instagram, Facebook, Phone, ArrowLeft, ArrowRight, Sparkles, LayoutGrid, Rows, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import './Catalogo.css';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import { useDebounce } from '../../hooks/useInfiniteScroll';

// Formateador de moneda instanciado una sola vez para máximo rendimiento (evita overhead en bucles)
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0
});
const formatCOP = (amount) => copFormatter.format(amount || 0);

// Helper para normalizar texto (búsqueda sin acentos, mayúsculas o espacios sobrantes)
const normalizeText = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Componente memoizado para cada tarjeta de producto (evita re-renders al actualizar carrito o carousel)
const ProductoCard = React.memo(({ producto, categoriaNombre, onAddToCart }) => {
  const hasStock = producto.es_servicio || (producto.stock_disponible || 0) > 0;

  return (
    <div className="producto-card">
      <div className="producto-img-container">
        <OptimizedProductImage
          imagePath={producto.url_imagen}
          alt={producto.nombre}
          className="producto-img"
        />
      </div>
      <div className="producto-info">
        <div className="producto-categoria">{categoriaNombre}</div>
        <h3 className="producto-nombre">{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="producto-descripcion">
            {producto.descripcion}
          </p>
        )}
        <div className="producto-footer">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="producto-precio" style={{ color: 'var(--catalogo-theme-color, #4f46e5)' }}>
              {formatCOP(producto.precio_venta)}
            </span>
            {!producto.es_servicio && (
              <span className={`producto-stock ${hasStock ? 'disponible' : ''}`} style={{ alignSelf: 'flex-start', marginTop: '0.2rem' }}>
                {hasStock ? 'Disponible' : 'Agotado'}
              </span>
            )}
          </div>

          {hasStock ? (
            <button
              type="button"
              className="btn-agregar-pedido"
              onClick={() => onAddToCart(producto)}
            >
              Agregar
            </button>
          ) : (
            <button
              type="button"
              className="btn-agregar-pedido agotado"
              disabled
            >
              Agotado
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Componente memoizado para el carrusel de promociones (aísla su propio temporizador de 5s del catálogo)
const PromoCarousel = React.memo(({ promociones, onSelectPromo }) => {
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  useEffect(() => {
    if (promociones && promociones.length > 1) {
      const interval = setInterval(() => {
        setActivePromoIndex(prev => (prev + 1) % promociones.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [promociones]);

  if (!promociones || promociones.length === 0) return null;

  return (
    <div className="catalogo-promo-carousel-wrapper">
      <div className="catalogo-promo-carousel">
        <div className="promo-slider" style={{ transform: `translateX(-${activePromoIndex * 100}%)` }}>
          {promociones.map((promo, idx) => {
            const hasLink = promo.enlace_filtro && promo.enlace_filtro.trim() !== '';
            return (
              <div
                key={promo.id || idx}
                className="promo-slide"
                onClick={() => {
                  if (hasLink && onSelectPromo) {
                    onSelectPromo(promo.enlace_filtro);
                  }
                }}
                style={{ cursor: hasLink ? 'pointer' : 'default' }}
              >
                <img src={promo.imagen_url} alt={promo.titulo || 'Promoción'} className="promo-image" loading="lazy" />
                {promo.titulo && (
                  <div className="promo-overlay">
                    <div className="promo-text-container">
                      <span className="promo-badge" style={{ backgroundColor: 'var(--catalogo-theme-color, #4f46e5)' }}>Destacado</span>
                      <h2 className="promo-title">{promo.titulo}</h2>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {promociones.length > 1 && (
          <div className="promo-indicators">
            {promociones.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`promo-dot ${activePromoIndex === idx ? 'active' : ''}`}
                onClick={() => setActivePromoIndex(idx)}
                style={{
                  backgroundColor: activePromoIndex === idx ? 'var(--catalogo-theme-color, #4f46e5)' : '#d1d5db'
                }}
                aria-label={`Ir a promoción ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const Catalogo = () => {
  const { slug } = useParams();
  const [organizacion, setOrganizacion] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [logoError, setLogoError] = useState(false);

  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [vistaLayout, setVistaLayout] = useState('grid');
  const [categoriasMobileOpen, setCategoriasMobileOpen] = useState(false);
  const categoriasRef = useRef(null);

  // Paginación virtual progresiva (Scroll infinito fluido estilo Inventario)
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef(null);
  const debouncedBusqueda = useDebounce(busqueda, 200);

  // Estados del carrito
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notaPedido, setNotaPedido] = useState('');

  // Estados de datos de envío
  const [shippingNombre, setShippingNombre] = useState('');
  const [shippingTelefono, setShippingTelefono] = useState('');
  const [shippingDireccion, setShippingDireccion] = useState('');
  const [shippingCiudad, setShippingCiudad] = useState('');
  const [shippingIndicaciones, setShippingIndicaciones] = useState('');
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' o 'checkout'

  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const cacheKeyOrg = `crecemas_org_${slug}`;
        const cacheKeyProd = `crecemas_prod_${slug}`;

        // Intentar cargar del caché local instantáneamente
        const cachedOrg = localStorage.getItem(cacheKeyOrg);
        const cachedProd = localStorage.getItem(cacheKeyProd);
        if (cachedOrg && cachedProd) {
          try {
            setOrganizacion(JSON.parse(cachedOrg));
            const parsedProd = JSON.parse(cachedProd);

            // Re-procesar categorías del caché
            const categoriasMap = new Map();
            parsedProd.forEach(p => {
              const catName = (p.metadata_parsed?.categoria || p.tipo || 'General').trim();
              const catId = catName.toLowerCase().replace(/\s+/g, '-');
              if (!categoriasMap.has(catId)) {
                categoriasMap.set(catId, { id: catId, nombre: catName });
              }
            });
            setCategorias(Array.from(categoriasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setProductos(parsedProd);

            // Decir que ya no está cargando para visualización inmediata
            setCargando(false);
          } catch (e) {
            console.error("Error al cargar caché:", e);
          }
        } else {
          setCargando(true);
        }
        setError(null);

        // Fetch en red real
        const { data: orgData, error: orgError } = await supabase
          .from('public_organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (orgError || !orgData) {
          throw new Error('Tienda no encontrada. Verifica el enlace.');
        }

        // Verificar suscripción para tiendas
        try {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('status, current_period_end, plan_id')
            .eq('organization_id', orgData.id)
            .eq('status', 'active')
            .maybeSingle();

          let blockStore = false;
          if (subData) {
            if (subData.plan_id === 'free') {
              blockStore = true; // El plan gratis no tiene tienda virtual
            } else if (subData.current_period_end) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDate = new Date(subData.current_period_end);
              endDate.setHours(0, 0, 0, 0);
              const diffDays = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < -3) blockStore = true;
            }
          } else {
            // Si no hay subcripción activa, se bloquea (salvo que en el futuro haya un caso especial)
            blockStore = true;
          }

          if (blockStore) {
            throw new Error('Tienda temporalmente no disponible');
          }
        } catch (err) {
          if (err.message === 'Tienda temporalmente no disponible') throw err;
          console.error('Error al verificar suscripción:', err);
        }

        setOrganizacion(orgData);
        localStorage.setItem(cacheKeyOrg, JSON.stringify(orgData));

        let allProducts = [];
        let from = 0;
        let to = 999;
        let hasMore = true;
        let loopError = null;

        while (hasMore) {
          const { data: prodData, error: prodError } = await supabase
            .from('public_productos')
            .select('*')
            .eq('organization_id', orgData.id)
            .order('nombre')
            .range(from, to);

          if (prodError) {
            loopError = prodError;
            console.error("Error al cargar lote de productos:", prodError);
            break;
          }

          if (prodData && prodData.length > 0) {
            allProducts = [...allProducts, ...prodData];
            if (prodData.length < 1000) {
              hasMore = false;
            } else {
              from += 1000;
              to += 1000;
            }
          } else {
            hasMore = false;
          }
        }

        if (!loopError && allProducts.length > 0) {
          const categoriasMap = new Map();
          const productosProcesados = allProducts
            .filter(p => {
              let meta = {};
              if (typeof p.metadata === 'string') {
                try { meta = JSON.parse(p.metadata); } catch (e) { }
              } else if (p.metadata) {
                meta = p.metadata;
              }
              return meta.ocultar_en_catalogo !== true && meta.ocultar_en_catalogo !== 'true';
            })
            .map(p => {
              let meta = {};
              if (typeof p.metadata === 'string') {
                try { meta = JSON.parse(p.metadata); } catch (e) { }
              } else if (p.metadata) {
                meta = p.metadata;
              }
              const catName = (meta.categoria || p.tipo || 'General').trim();
              const catId = catName.toLowerCase().replace(/\s+/g, '-');
              if (!categoriasMap.has(catId)) {
                categoriasMap.set(catId, { id: catId, nombre: catName });
              }
              return {
                ...p,
                metadata_parsed: meta,
                categoria_id: catId,
                descripcion: meta.descripcion || ''
              };
            });

          setCategorias(Array.from(categoriasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)));
          setProductos(productosProcesados);
          localStorage.setItem(cacheKeyProd, JSON.stringify(productosProcesados));
        }
      } catch (err) {
        console.error('Error cargando catálogo:', err);
        const isBlockError = err.message === 'Tienda temporalmente no disponible';
        // Si hay error pero tenemos caché, no mostramos error al usuario, 
        // a menos que sea el error de tienda bloqueada
        if (isBlockError || !localStorage.getItem(`crecemas_org_${slug}`)) {
          setError(err.message || 'Error al cargar el catálogo');
        }
        
        if (isBlockError) {
          localStorage.removeItem(`crecemas_org_${slug}`);
          localStorage.removeItem(`crecemas_prod_${slug}`);
        }
      } finally {
        setCargando(false);
      }
    };

    if (slug) {
      fetchCatalogo();
    }
  }, [slug]);

  // Efecto para limpiar variables CSS al desmontar el catálogo
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('--catalogo-theme-color');
      document.documentElement.style.removeProperty('--catalogo-bg-color');
      document.documentElement.style.removeProperty('--catalogo-text-btn-color');
      document.documentElement.style.removeProperty('--catalogo-header-bg');
      document.documentElement.style.removeProperty('--catalogo-header-text');
      document.documentElement.style.removeProperty('--catalogo-font');
      document.documentElement.style.removeProperty('--catalogo-theme-rgb');
    };
  }, []);

  // Efecto para inyectar color dinámico y variables auxiliares
  useEffect(() => {
    const isLightColor = (hex) => {
      if (!hex || typeof hex !== 'string') return true;
      const cleanHex = hex.replace('#', '');
      if (cleanHex.length !== 6 && cleanHex.length !== 3) return true;
      const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex;
      const r = parseInt(fullHex.substring(0, 2), 16);
      const g = parseInt(fullHex.substring(2, 4), 16);
      const b = parseInt(fullHex.substring(4, 6), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return true;
      return (r * 299 + g * 587 + b * 114) / 1000 >= 128;
    };

    const applyThemeColors = () => {
      const isDark = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
        document.body.classList.contains('dark') ||
        document.body.classList.contains('dark-theme') ||
        document.documentElement.classList.contains('dark');

      const config = organizacion?.catalogo_config || {};
      const colorTemaVal = config.color_botones || config.color_tema || '#4f46e5';
      const colorTextBtnVal = config.color_texto_botones || '#ffffff';
      const fuenteVal = config.fuente_principal || 'Inter';

      // Si el dispositivo está en modo oscuro y el fondo/header configurado es claro o no está definido,
      // se adapta automáticamente a la paleta oscura moderna
      let colorFondoVal = config.color_fondo;
      let colorHeaderVal = config.color_header;
      let colorTextoHeaderVal = config.color_texto_header;

      if (isDark) {
        if (!colorFondoVal || isLightColor(colorFondoVal)) {
          colorFondoVal = '#0f172a';
        }
        if (!colorHeaderVal || isLightColor(colorHeaderVal)) {
          colorHeaderVal = '#1e293b';
        }
        if (!colorTextoHeaderVal || !isLightColor(colorTextoHeaderVal)) {
          colorTextoHeaderVal = '#f8fafc';
        }
      } else {
        colorFondoVal = colorFondoVal || '#f9fafb';
        colorHeaderVal = colorHeaderVal || '#ffffff';
        colorTextoHeaderVal = colorTextoHeaderVal || '#111827';
      }

      document.documentElement.style.setProperty('--catalogo-theme-color', colorTemaVal);
      document.documentElement.style.setProperty('--catalogo-bg-color', colorFondoVal);
      document.documentElement.style.setProperty('--catalogo-text-btn-color', colorTextBtnVal);
      document.documentElement.style.setProperty('--catalogo-header-bg', colorHeaderVal);
      document.documentElement.style.setProperty('--catalogo-header-text', colorTextoHeaderVal);
      document.documentElement.style.setProperty('--catalogo-font', `'${fuenteVal}', Inter, sans-serif`);

      // Inyectar Google Fonts dinámicamente
      const fontId = 'catalogo-google-font';
      let linkEl = document.getElementById(fontId);
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = fontId;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      const encoded = encodeURIComponent(fuenteVal);
      linkEl.href = `https://fonts.googleapis.com/css2?family=${encoded.replace(/%20/g, '+')}:wght@400;500;600;700;800&display=swap`;

      // Inyectar versión RGB para opacidades y gradientes
      try {
        const hex = colorTemaVal.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty('--catalogo-theme-rgb', `${r}, ${g}, ${b}`);
      } catch (e) {
        document.documentElement.style.setProperty('--catalogo-theme-rgb', '79, 70, 229');
      }
    };

    applyThemeColors();

    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mediaQuery) {
      mediaQuery.addEventListener('change', applyThemeColors);
    }

    return () => {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', applyThemeColors);
      }
    };
  }, [organizacion]);

  // Manejador para seleccionar promoción en el carrusel
  const handleSelectPromo = useCallback((enlace) => {
    if (!enlace) return;
    setCategoriaActiva('todas');
    setBusqueda(enlace);
    const target = document.getElementById('catalogo-productos');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Funciones del carrito
  const addToCart = useCallback((producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === producto.id);
      if (existing) {
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
    toast.success(`${producto.nombre} agregado al pedido`);
  }, []);

  const updateQuantity = useCallback((productId, change) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (!existing) return prev;
      const newQty = existing.cantidad + change;
      if (newQty <= 0) {
        return prev.filter(item => item.id !== productId);
      }
      return prev.map(item => item.id === productId ? { ...item, cantidad: newQty } : item);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalCart = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.cantidad, 0);
  }, [cart]);

  const sendOrderWhatsApp = () => {
    const config = organizacion?.catalogo_config || {};
    const whatsappNum = config.whatsapp;
    if (!whatsappNum) {
      toast.error("Este negocio no ha configurado su WhatsApp para recibir pedidos.");
      return;
    }

    if (!shippingNombre.trim() || !shippingTelefono.trim() || !shippingDireccion.trim() || !shippingCiudad.trim()) {
      toast.error("Por favor, completa todos los datos de envío requeridos.");
      return;
    }

    let text = `¡Hola! Me gustaría realizar un pedido de la tienda *${organizacion.name}*:\n\n`;

    text += `*📦 DATOS DE ENVÍO:*\n`;
    text += `• *Nombre:* ${shippingNombre.trim()}\n`;
    text += `• *Teléfono:* ${shippingTelefono.trim()}\n`;
    text += `• *Dirección:* ${shippingDireccion.trim()}\n`;
    text += `• *Ciudad:* ${shippingCiudad.trim()}\n`;
    if (shippingIndicaciones.trim() !== '') {
      text += `• *Indicaciones:* ${shippingIndicaciones.trim()}\n`;
    }

    text += `\n*🛒 DETALLE DEL PEDIDO:*\n`;
    cart.forEach(item => {
      text += `• *${item.cantidad}x* ${item.nombre} - ${formatCOP(item.precio_venta * item.cantidad)}\n`;
    });

    if (notaPedido.trim() !== '') {
      text += `\n*Nota adicional:* ${notaPedido}\n`;
    }

    text += `\n*Total a pagar: ${formatCOP(totalCart)}*\n\nMuchas gracias.`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNum}?text=${encoded}`, '_blank');

    // Resetear carrito y formulario
    clearCart();
    setCartOpen(false);
    setCheckoutStep('cart');
    setShippingNombre('');
    setShippingTelefono('');
    setShippingDireccion('');
    setShippingCiudad('');
    setShippingIndicaciones('');
    setNotaPedido('');
  };

  // Filtrar productos por búsqueda y categoría
  const productosFiltrados = useMemo(() => {
    let filtrados = productos;

    if (categoriaActiva !== 'todas') {
      filtrados = filtrados.filter(p => p.categoria_id === categoriaActiva);
    }

    if (debouncedBusqueda.trim() !== '') {
      const termino = normalizeText(debouncedBusqueda);
      filtrados = filtrados.filter(p => {
        const nombreNorm = normalizeText(p.nombre);
        const descNorm = normalizeText(p.descripcion);
        return nombreNorm.includes(termino) || descNorm.includes(termino);
      });
    }

    return filtrados;
  }, [productos, categoriaActiva, debouncedBusqueda]);

  // Reiniciar la cantidad visible cuando cambian filtros o búsqueda
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [categoriaActiva, debouncedBusqueda]);

  // IntersectionObserver para paginación progresiva virtual (estilo Inventario)
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && visibleCount < productosFiltrados.length) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, productosFiltrados.length));
    }
  }, [visibleCount, productosFiltrados.length, PAGE_SIZE]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '600px', // Precarga fluida antes de llegar al final del scroll
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [handleObserver]);

  // Tomar solo la rebanada (slice) visible para no sobrecargar el DOM
  const productosVisibles = useMemo(() => {
    return productosFiltrados.slice(0, visibleCount);
  }, [productosFiltrados, visibleCount]);

  // Mapa de categorías para acceso O(1) ultra rápido
  const categoriasMap = useMemo(() => {
    const map = new Map();
    categorias.forEach(c => map.set(c.id, c.nombre));
    return map;
  }, [categorias]);

  const getCategoriaNombre = useCallback((id) => {
    return categoriasMap.get(id) || 'Sin Categoría';
  }, [categoriasMap]);

  const nombreCategoriaActiva = useMemo(() => {
    if (categoriaActiva === 'todas') return 'Todas';
    return categoriasMap.get(categoriaActiva) || 'Todas';
  }, [categoriaActiva, categoriasMap]);

  // Cerrar desplegable de categorías en móvil si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoriasRef.current && !categoriasRef.current.contains(e.target)) {
        setCategoriasMobileOpen(false);
      }
    };
    if (categoriasMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [categoriasMobileOpen]);

  if (cargando) {
    return (
      <div className="catalogo-loading">
        <div className="spinner"></div>
        <p>Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalogo-error">
        <Store size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
        <h2>¡Ups!</h2>
        <p>{error}</p>
      </div>
    );
  }

  const layoutCategorias = organizacion?.catalogo_config?.layout_categorias || 'top';

  return (
    <div className="catalogo-container">

      {/* ===== ENCABEZADO STICKY HORIZONTAL ===== */}
      <header className="catalogo-header" style={{ borderBottom: `3px solid var(--catalogo-theme-color, #4f46e5)`, backgroundColor: 'var(--catalogo-header-bg, #ffffff)' }}>
        {/* Fila 1: Logo + Nombre  |  Buscador */}
        <div className="catalogo-header-row1">
          {/* Identidad */}
          <div className="catalogo-header-identity">
            <div className="catalogo-logo-container" style={{ border: `2px solid var(--catalogo-theme-color, #4f46e5)` }}>
              {organizacion?.logo_url && !logoError ? (
                <img
                  src={organizacion.logo_url}
                  alt={`Logo de ${organizacion.name}`}
                  className="catalogo-logo"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Store size={28} color="var(--catalogo-theme-color, #4f46e5)" />
              )}
            </div>
            <h1 className="catalogo-title" style={{ color: 'var(--catalogo-header-text, #111827)' }}>{organizacion?.name || 'Tienda'}</h1>
          </div>

          {/* Redes Sociales en el Encabezado Sticky */}
          {(organizacion?.catalogo_config?.instagram || organizacion?.catalogo_config?.facebook || organizacion?.catalogo_config?.whatsapp) && (
            <div className="catalogo-header-socials">
              {organizacion.catalogo_config?.whatsapp && (
                <a href={`https://wa.me/${organizacion.catalogo_config.whatsapp}`} target="_blank" rel="noreferrer" className="header-social-icon whatsapp" title="WhatsApp">
                  <Phone size={15} />
                </a>
              )}
              {organizacion.catalogo_config?.instagram && (
                <a href={`https://instagram.com/${organizacion.catalogo_config.instagram}`} target="_blank" rel="noreferrer" className="header-social-icon instagram" title="Instagram">
                  <Instagram size={15} />
                </a>
              )}
              {organizacion.catalogo_config?.facebook && (
                <a href={organizacion.catalogo_config.facebook} target="_blank" rel="noreferrer" className="header-social-icon facebook" title="Facebook">
                  <Facebook size={15} />
                </a>
              )}
            </div>
          )}

          {/* Buscador */}
          <div className="catalogo-header-search">
            <div className="catalogo-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Fila 2: Categorías (scroll horizontal) */}
        {categorias.length > 0 && layoutCategorias !== 'side' && (
          <div className="catalogo-header-cats">
            <div className="catalogo-categorias">
              <button
                className={`categoria-pill ${categoriaActiva === 'todas' ? 'active' : ''}`}
                onClick={() => setCategoriaActiva('todas')}
                style={categoriaActiva === 'todas' ? {
                  backgroundColor: 'var(--catalogo-theme-color, #4f46e5)',
                  borderColor: 'var(--catalogo-theme-color, #4f46e5)',
                  color: 'var(--catalogo-text-btn-color, #ffffff)'
                } : {}}
              >
                Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  className={`categoria-pill ${categoriaActiva === cat.id ? 'active' : ''}`}
                  onClick={() => setCategoriaActiva(cat.id)}
                  style={categoriaActiva === cat.id ? {
                    backgroundColor: 'var(--catalogo-theme-color, #4f46e5)',
                    borderColor: 'var(--catalogo-theme-color, #4f46e5)',
                    color: 'var(--catalogo-text-btn-color, #ffffff)'
                  } : {}}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>


      {/* Carrete de Promociones Memoizado e Independiente */}
      {organizacion?.catalogo_config?.promociones && organizacion.catalogo_config.promociones.length > 0 && (
        <PromoCarousel
          promociones={organizacion.catalogo_config.promociones}
          onSelectPromo={handleSelectPromo}
        />
      )}

      {/* Mensaje de Bienvenida (debajo del carrusel) */}
      {organizacion?.catalogo_config?.mensaje_bienvenida && (
        <div className="catalogo-banner-container">
          <div className="catalogo-banner" style={{ borderLeft: `4px solid var(--catalogo-theme-color, #4f46e5)` }}>
            <p>
              <Sparkles className="banner-sparkle" style={{ color: 'var(--catalogo-theme-color, #4f46e5)', flexShrink: 0 }} />
              <span className="banner-text">
                {organizacion.catalogo_config.mensaje_bienvenida}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Grilla de Productos */}
      <div id="catalogo-productos" className={`catalogo-main-layout ${layoutCategorias === 'side' ? 'side-layout' : 'top-layout'}`}>
        {/* Menú lateral de categorías - solo si es diseño lateral */}
        {categorias.length > 0 && layoutCategorias === 'side' && (
          <aside className="catalogo-categorias-container" ref={categoriasRef}>
            <h3 className="side-categorias-title">Categorías</h3>

            {/* Cabecera desplegable para dispositivos pequeños */}
            <button
              type="button"
              className="side-categorias-mobile-toggle"
              onClick={() => setCategoriasMobileOpen(prev => !prev)}
              aria-expanded={categoriasMobileOpen}
            >
              <div className="side-categorias-mobile-info">
                <span className="side-categorias-mobile-label">Categorías:</span>
                <span
                  className="side-categorias-mobile-active"
                  title={nombreCategoriaActiva}
                  style={categoriaActiva !== 'todas' ? {
                    backgroundColor: 'var(--catalogo-theme-color, #4f46e5)',
                    color: 'var(--catalogo-text-btn-color, #ffffff)',
                    borderColor: 'var(--catalogo-theme-color, #4f46e5)'
                  } : {}}
                >
                  {nombreCategoriaActiva}
                </span>
              </div>
              <ChevronDown 
                size={18} 
                className={`side-categorias-chevron ${categoriasMobileOpen ? 'open' : ''}`} 
              />
            </button>

            <div className={`catalogo-categorias ${categoriasMobileOpen ? 'mobile-open' : 'mobile-closed'}`}>
              <button
                type="button"
                className={`categoria-pill ${categoriaActiva === 'todas' ? 'active' : ''}`}
                onClick={() => {
                  setCategoriaActiva('todas');
                  setCategoriasMobileOpen(false);
                }}
                style={categoriaActiva === 'todas' ? {
                  backgroundColor: 'var(--catalogo-theme-color, #4f46e5)',
                  borderColor: 'var(--catalogo-theme-color, #4f46e5)',
                  color: 'var(--catalogo-text-btn-color, #ffffff)'
                } : {}}
              >
                <span className="categoria-pill-text">Todas</span>
              </button>
              {categorias.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  className={`categoria-pill ${categoriaActiva === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setCategoriaActiva(cat.id);
                    setCategoriasMobileOpen(false);
                  }}
                  style={categoriaActiva === cat.id ? {
                    backgroundColor: 'var(--catalogo-theme-color, #4f46e5)',
                    borderColor: 'var(--catalogo-theme-color, #4f46e5)',
                    color: 'var(--catalogo-text-btn-color, #ffffff)'
                  } : {}}
                >
                  <span className="categoria-pill-text">{cat.nombre}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className="catalogo-content">
          {productosFiltrados.length === 0 ? (
            <div className="catalogo-empty">
              <PackageX size={64} />
              <h3>No se encontraron productos</h3>
              <p>Intenta con otra búsqueda o categoría.</p>
            </div>
          ) : (
            <>
              <div className="catalogo-products-header">
                <span className="products-count">{productosFiltrados.length} productos</span>
                <div className="vista-toggle-container">
                  <button
                    type="button"
                    className={`vista-toggle-btn ${vistaLayout === 'grid' ? 'active' : ''}`}
                    onClick={() => setVistaLayout('grid')}
                    title="Vista cuadrícula"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    className={`vista-toggle-btn ${vistaLayout === 'list' ? 'active' : ''}`}
                    onClick={() => setVistaLayout('list')}
                    title="Vista lista"
                  >
                    <Rows size={16} />
                  </button>
                </div>
              </div>

              <div className={`productos-grid vista-${vistaLayout}`}>
                {productosVisibles.map((producto) => (
                  <ProductoCard
                    key={producto.id}
                    producto={producto}
                    categoriaNombre={getCategoriaNombre(producto.categoria_id)}
                    onAddToCart={addToCart}
                  />
                ))}

                {visibleCount < productosFiltrados.length && (
                  <div ref={loadMoreRef} className="catalogo-load-more-sentinel">
                    <div className="catalogo-loading-more-spinner" />
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Botón flotante del carrito */}
      {totalItems > 0 && (
        <div className="catalogo-cart-floating" onClick={() => setCartOpen(true)} style={{ background: 'var(--catalogo-theme-color, #4f46e5)', cursor: 'pointer' }}>
          <div className="cart-floating-content">
            <div className="cart-floating-info">
              <ShoppingCart size={20} />
              <span className="cart-floating-badge">{totalItems}</span>
              <span className="cart-floating-total">{formatCOP(totalCart)}</span>
            </div>
            <span className="cart-floating-btn-text">Ver Pedido</span>
          </div>
        </div>
      )}

      {/* Drawer del carrito */}
      {cartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              {checkoutStep === 'checkout' && (
                <button
                  className="cart-drawer-back"
                  onClick={() => setCheckoutStep('cart')}
                  title="Volver"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h3>{checkoutStep === 'checkout' ? 'Datos de Envío' : 'Tu Pedido'}</h3>
              <button className="cart-drawer-close" onClick={() => { setCartOpen(false); setCheckoutStep('cart'); }}>
                <X size={24} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-drawer-empty">
                <ShoppingBag size={48} />
                <p>Tu pedido está vacío</p>
                <button
                  className="btn-keep-shopping"
                  onClick={() => { setCartOpen(false); setCheckoutStep('cart'); }}
                  style={{ maxWidth: '220px', fontSize: '0.85rem', padding: '0.65rem', marginTop: '0.75rem' }}
                >
                  <ArrowLeft size={16} /> Volver a la tienda
                </button>
              </div>
            ) : checkoutStep === 'cart' ? (
              <>
                <div className="cart-drawer-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.nombre}</h4>
                        <span>{formatCOP(item.precio_venta)}</span>
                      </div>
                      <div className="cart-item-actions">
                        <button className="cart-action-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                        <span className="cart-item-qty">{item.cantidad}</span>
                        <button className="cart-action-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-drawer-footer">
                  <div className="cart-drawer-total" style={{ borderTop: 'none', paddingTop: 0, marginBottom: '1.25rem' }}>
                    <span>Total:</span>
                    <span>{formatCOP(totalCart)}</span>
                  </div>

                  <button className="btn-send-whatsapp" onClick={() => setCheckoutStep('checkout')} style={{ width: '100%' }}>
                    Siguiente: Datos de Envío
                  </button>

                  <button
                    className="btn-keep-shopping"
                    onClick={() => setCartOpen(false)}
                  >
                    Volver y seguir comprando
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="cart-drawer-items cart-shipping-form">
                  <div className="cart-form-group">
                    <label className="cart-form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      className="cart-form-input"
                      value={shippingNombre}
                      onChange={(e) => setShippingNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      required
                    />
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">Celular / Teléfono *</label>
                    <input
                      type="tel"
                      className="cart-form-input"
                      value={shippingTelefono}
                      onChange={(e) => setShippingTelefono(e.target.value)}
                      placeholder="Ej. 3001234567"
                      required
                    />
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">Dirección de Envío *</label>
                    <input
                      type="text"
                      className="cart-form-input"
                      value={shippingDireccion}
                      onChange={(e) => setShippingDireccion(e.target.value)}
                      placeholder="Ej. Calle 45 # 12 - 34"
                      required
                    />
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">Ciudad / Municipio *</label>
                    <input
                      type="text"
                      className="cart-form-input"
                      value={shippingCiudad}
                      onChange={(e) => setShippingCiudad(e.target.value)}
                      placeholder="Ej. Bogotá"
                      required
                    />
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">Indicaciones de Entrega (Opcional)</label>
                    <input
                      type="text"
                      className="cart-form-input"
                      value={shippingIndicaciones}
                      onChange={(e) => setShippingIndicaciones(e.target.value)}
                      placeholder="Ej. Portería, casa blanca reja negra"
                    />
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">Nota o comentarios para el negocio (Opcional)</label>
                    <textarea
                      rows={2}
                      className="cart-form-textarea"
                      value={notaPedido}
                      onChange={(e) => setNotaPedido(e.target.value)}
                      placeholder="Ej. Sin cebolla, empacar por separado, etc."
                    />
                  </div>
                </div>

                <div className="cart-drawer-footer">
                  <div className="cart-drawer-total">
                    <span>Total:</span>
                    <span>{formatCOP(totalCart)}</span>
                  </div>

                  <button className="btn-send-whatsapp" onClick={sendOrderWhatsApp}>
                    <MessageCircle size={20} /> Enviar pedido por WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer de redes */}
      <footer className="catalogo-footer-social">
        {(organizacion?.catalogo_config?.instagram || organizacion?.catalogo_config?.facebook || organizacion?.catalogo_config?.whatsapp) && (
          <>
            <p className="footer-social-title">Contacta con nosotros</p>
            <div className="social-links">
              {organizacion.catalogo_config?.whatsapp && (
                <a href={`https://wa.me/${organizacion.catalogo_config.whatsapp}`} target="_blank" rel="noreferrer" className="social-link whatsapp">
                  <Phone size={18} /> WhatsApp
                </a>
              )}
              {organizacion.catalogo_config?.instagram && (
                <a href={`https://instagram.com/${organizacion.catalogo_config.instagram}`} target="_blank" rel="noreferrer" className="social-link instagram">
                  <Instagram size={18} /> Instagram
                </a>
              )}
              {organizacion.catalogo_config?.facebook && (
                <a href={organizacion.catalogo_config.facebook} target="_blank" rel="noreferrer" className="social-link facebook">
                  <Facebook size={18} /> Facebook
                </a>
              )}
            </div>
          </>
        )}

        <div className="footer-creceplus-promo">
          <div className="promo-divider" />
          <p className="promo-subtitle">¿Quieres controlar tu inventario, registrar ventas y tener un catálogo como este?</p>
          <a href="https://crecemas.co" target="_blank" rel="noreferrer" className="promo-button">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Potencia tu negocio gratis con <strong>crecemas.co</strong></span>
            <ArrowRight size={14} className="arrow-icon" />
          </a>
          <p className="footer-credits">
            Desarrollado y Potenciado por <a href="https://crecemas.co" target="_blank" rel="noreferrer"><strong>CreceMás.co</strong></a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Catalogo;
