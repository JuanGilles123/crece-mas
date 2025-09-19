import React, { useMemo, useState, useEffect } from "react";
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import OptimizedProductImage from '../components/OptimizedProductImage';
import ReciboVenta from '../components/ReciboVenta';
import './Caja.css';

// Componente SafeImg removido ya que usamos OptimizedProductImage

// Utilidad: formato COP
function formatCOP(value) {
  try {
    return new Intl.NumberFormat("es-CO", { 
      style: "currency", 
      currency: "COP", 
      maximumFractionDigits: 0 
    }).format(value);
  } catch {
    return "$" + value.toLocaleString("es-CO");
  }
}

// Total carrito
function calcTotal(cart) {
  return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export default function Caja() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState("Efectivo");
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [pagoCliente, setPagoCliente] = useState(0);

  // Cargar productos del usuario
  useEffect(() => {
    const fetchProductos = async () => {
      if (!user) return;
      setCargando(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error) {
        setProductos(data || []);
      }
      setCargando(false);
    };
    fetchProductos();
  }, [user]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [query, productos]);

  const total = useMemo(() => calcTotal(cart.map((c) => ({ id: c.id, price: c.precio_venta, qty: c.qty }))), [cart]);

  function addToCart(producto) {
    // Verificar stock disponible
    const stockDisponible = producto.stock;
    const itemEnCarrito = cart.find(item => item.id === producto.id);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.qty : 0;
    
    if (cantidadEnCarrito >= stockDisponible) {
      alert(`No hay suficiente stock. Disponible: ${stockDisponible}`);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === producto.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { 
        id: producto.id, 
        nombre: producto.nombre, 
        precio_venta: producto.precio_venta, 
        qty: 1 
      }];
    });
  }

  const inc = (id) => {
    const producto = productos.find(p => p.id === id);
    const itemEnCarrito = cart.find(item => item.id === id);
    
    if (itemEnCarrito && itemEnCarrito.qty >= producto.stock) {
      alert(`No hay suficiente stock. Disponible: ${producto.stock}`);
      return;
    }
    
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  };
  
  const dec = (id) =>
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i)).filter((i) => i.qty > 0));
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const handleNuevaVenta = () => {
    setVentaCompletada(null);
    setPagoCliente(0);
  };

  async function confirmSale() {
    if (!user) return;
    
    // Validar que no se exceda el stock
    for (const item of cart) {
      const producto = productos.find(p => p.id === item.id);
      if (item.qty > producto.stock) {
        alert(`No hay suficiente stock para ${item.nombre}. Disponible: ${producto.stock}`);
        return;
      }
    }
    
    // Validación adicional: no permitir stock negativo
    for (const item of cart) {
      const producto = productos.find(p => p.id === item.id);
      if (producto.stock < item.qty) {
        alert(`No hay suficiente stock para ${item.nombre}. Disponible: ${producto.stock}`);
        return;
      }
    }
    
    // Si es pago en efectivo, pedir el monto entregado por el cliente
    let montoPagoCliente = total;
    if (method === "Efectivo") {
      const monto = prompt(`Total a pagar: ${formatCOP(total)}\n\nIngrese el monto entregado por el cliente:`);
      if (monto === null) return; // Usuario canceló
      
      const montoNumero = parseFloat(monto.replace(/[^\d]/g, ''));
      if (isNaN(montoNumero) || montoNumero < total) {
        alert('El monto debe ser mayor o igual al total de la venta.');
        return;
      }
      montoPagoCliente = montoNumero;
    }
    
    try {
      // Guardar la venta en la base de datos
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
          user_id: user.id,
          total: total,
          metodo_pago: method,
          items: cart,
          fecha: new Date().toISOString(),
          pago_cliente: montoPagoCliente
        }])
        .select();
      
      if (ventaError) {
        console.error('Error guardando venta:', ventaError);
        alert('Error al guardar la venta. Intenta de nuevo.');
        return;
      }
      
      console.log("Venta guardada:", ventaData);
      
      // Actualizar stock de productos
      for (const item of cart) {
        const producto = productos.find(p => p.id === item.id);
        const nuevoStock = producto.stock - item.qty;
        
        // Validación adicional: asegurar que el stock no sea negativo
        if (nuevoStock < 0) {
          alert(`Error: El stock de ${item.nombre} se volvería negativo. Stock actual: ${producto.stock}, Cantidad a vender: ${item.qty}`);
          return;
        }
        
        const { error: stockError } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.id);
        
        if (stockError) {
          console.error('Error actualizando stock:', stockError);
          alert('Error al actualizar el stock. La venta no se completó.');
          return;
        }
      }
      
      // Crear objeto de venta para el recibo
      const ventaRecibo = {
        id: ventaData[0].id,
        date: new Date().toLocaleDateString("es-CO"),
        time: new Date().toLocaleTimeString("es-CO"),
        cashier: user.user_metadata?.full_name || user.email || "Usuario",
        register: "Caja Principal",
        items: cart,
        metodo_pago: method,
        pagoCliente: montoPagoCliente
      };
      
      // Mostrar recibo
      setVentaCompletada(ventaRecibo);
      setCart([]);
      setShowCartMobile(false);
      
      // Recargar productos para actualizar stock
      const { data } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', user.id);
      setProductos(data || []);
      
    } catch (error) {
      console.error('Error confirmando venta:', error);
      alert('Error al procesar la venta. Intenta de nuevo.');
    }
  }

  if (cargando) {
    return (
      <div className="caja-loading">
        <div className="caja-skeleton">
          <div className="caja-skeleton-search"></div>
          <div className="caja-skeleton-products">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="caja-skeleton-product"></div>
            ))}
      </div>
    </div>
  </div>
);
  }

  return (
    <div className="caja-container">
      {/* Panel de productos */}
      <div className="caja-products-panel">
        <div className="caja-search-container">
          <div className="caja-search-icon">🔍</div>
          <input
            type="text"
            placeholder="Buscar producto..."
            className="caja-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="caja-products-list">
          {filteredProducts.map((producto) => (
            <div 
              key={producto.id} 
              className="caja-product-card"
              onClick={() => addToCart(producto)}
            >
              <div className="caja-product-content">
                <OptimizedProductImage 
                  imagePath={producto.imagen} 
                  alt={producto.nombre} 
                  className="caja-product-image"
                />
                <div className="caja-product-info">
                  <p className="caja-product-name">{producto.nombre}</p>
                  <p className="caja-product-stock">Stock: {producto.stock}</p>
                </div>
                <span className="caja-product-price">{formatCOP(producto.precio_venta)}</span>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <p className="caja-no-products">No se encontraron productos para "{query}"</p>
          )}
        </div>
      </div>

      {/* Panel carrito (desktop) */}
      <div className="caja-cart-panel">
        <div className="caja-cart-header">
          <h2 className="caja-cart-title">
            <span className="caja-cart-icon">🛒</span> Carrito de Venta
          </h2>
          {cart.length > 0 && (
            <button 
              className="caja-clear-btn"
              onClick={() => setCart([])}
            >
              Vaciar
            </button>
          )}
        </div>

        <div className="caja-cart-items">
          {cart.length === 0 ? (
            <p className="caja-empty-cart">Aún no has agregado productos.</p>
          ) : (
            <ul className="caja-cart-list">
              {cart.map((item) => (
                <li key={item.id} className="caja-cart-item">
                  <div className="caja-cart-item-info">
                    <p className="caja-cart-item-name">{item.nombre}</p>
                    <p className="caja-cart-item-price">{formatCOP(item.precio_venta)} c/u</p>
                  </div>
                  <div className="caja-cart-item-controls">
                    <button 
                      className="caja-qty-btn"
                      onClick={() => dec(item.id)}
                    >
                      −
                    </button>
                    <span className="caja-qty-display">{item.qty}</span>
                    <button 
                      className="caja-qty-btn"
                      onClick={() => inc(item.id)}
                    >
                      +
                    </button>
                  </div>
                  <div className="caja-cart-item-total">
                    {formatCOP(item.qty * item.precio_venta)}
                  </div>
                  <button 
                    className="caja-remove-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="caja-cart-footer">
          <div className="caja-total-container">
            <span className="caja-total-label">Total</span>
            <span className="caja-total-amount">{formatCOP(total)}</span>
          </div>
          
          <div className="caja-payment-method">
            <label className="caja-payment-label">Método de pago</label>
            <select 
              className="caja-payment-select"
              value={method} 
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Nequi</option>
              <option>Mixto</option>
            </select>
          </div>
          
          <button 
            className="caja-confirm-btn"
            onClick={confirmSale} 
            disabled={cart.length === 0}
          >
            <span className="caja-confirm-icon">💰</span> Confirmar Venta
          </button>
        </div>
      </div>

      {/* Botón fijo en móvil para abrir carrito */}
      <div className="caja-mobile-footer">
        <div className="caja-mobile-total">
          <p className="caja-mobile-total-label">Total</p>
          <p className="caja-mobile-total-amount">{formatCOP(total)}</p>
        </div>
        <button 
          className="caja-mobile-cart-btn"
          onClick={() => setShowCartMobile(true)}
        >
          <span className="caja-mobile-cart-icon">🛒</span> 
          Ver carrito ({cart.reduce((n, i) => n + i.qty, 0)})
        </button>
        <button 
          className="caja-mobile-pay-btn"
          onClick={() => setShowCartMobile(true)} 
          disabled={cart.length === 0}
        >
          Cobrar
        </button>
      </div>

      {/* Overlay del carrito en móvil */}
      {showCartMobile && (
        <div className="caja-mobile-overlay">
          <div className="caja-mobile-cart-header">
            <h3 className="caja-mobile-cart-title">
              <span className="caja-mobile-cart-icon">🛒</span> Carrito
            </h3>
            <button 
              className="caja-mobile-close-btn"
              onClick={() => setShowCartMobile(false)}
            >
              ✕
            </button>
          </div>

          <div className="caja-mobile-cart-content">
            {cart.length === 0 ? (
              <p className="caja-mobile-empty-cart">Aún no has agregado productos.</p>
            ) : (
              <ul className="caja-mobile-cart-list">
                {cart.map((item) => (
                  <li key={item.id} className="caja-mobile-cart-item">
                    <div className="caja-mobile-cart-item-info">
                      <p className="caja-mobile-cart-item-name">{item.nombre}</p>
                      <p className="caja-mobile-cart-item-price">{formatCOP(item.precio_venta)} c/u</p>
                    </div>
                    <div className="caja-mobile-cart-item-controls">
                      <button 
                        className="caja-mobile-qty-btn"
                        onClick={() => dec(item.id)}
                      >
                        −
                      </button>
                      <span className="caja-mobile-qty-display">{item.qty}</span>
                      <button 
                        className="caja-mobile-qty-btn"
                        onClick={() => inc(item.id)}
                      >
                        +
                      </button>
                    </div>
                    <div className="caja-mobile-cart-item-total">
                      {formatCOP(item.qty * item.precio_venta)}
                    </div>
                    <button 
                      className="caja-mobile-remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="caja-mobile-cart-footer">
            <div className="caja-mobile-total-container">
              <span className="caja-mobile-total-label">Total</span>
              <span className="caja-mobile-total-amount">{formatCOP(total)}</span>
            </div>
            
            <div className="caja-mobile-payment-method">
              <label className="caja-mobile-payment-label">Método de pago</label>
              <select 
                className="caja-mobile-payment-select"
                value={method} 
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Nequi</option>
                <option>Mixto</option>
              </select>
            </div>
            
            <button 
              className="caja-mobile-confirm-btn"
              onClick={confirmSale} 
              disabled={cart.length === 0}
            >
              <span className="caja-mobile-confirm-icon">💰</span> Confirmar Venta
            </button>
          </div>
        </div>
      )}

      {/* Recibo de venta */}
      {ventaCompletada && (
        <ReciboVenta 
          venta={ventaCompletada} 
          onNuevaVenta={handleNuevaVenta}
        />
      )}
    </div>
  );
}