/**
 * Genera un código de venta amigable y corto
 * Formato: [Método][Fecha][Consecutivo]
 * Ejemplo: EF-20250121-001, TR-20250121-002
 */
export const generarCodigoVenta = async (organizationId, metodoPago) => {
  const { supabase } = await import('../services/api/supabaseClient');
  
  // Abreviaciones de métodos de pago
  const abreviaciones = {
    'Efectivo': 'EF',
    'Transferencia': 'TR',
    'Tarjeta': 'TA',
    'Nequi': 'NE',
    'Mixto': 'MX',
    'COTIZACION': 'COT'
  };
  
  const abrev = abreviaciones[metodoPago] || 'VT';
  
  // Fecha en formato YYYYMMDD
  const hoy = new Date();
  const fecha = hoy.toISOString().split('T')[0].replace(/-/g, '');
  
  // Buscar el último consecutivo del día para este método de pago
  const inicioDia = new Date(hoy);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(hoy);
  finDia.setHours(23, 59, 59, 999);
  
  // Intentar obtener el último código de venta
  let ventasHoy = [];
  
  try {
    const result = await supabase
      .from('ventas')
      .select('numero_venta')
      .eq('organization_id', organizationId)
      .gte('created_at', inicioDia.toISOString())
      .lte('created_at', finDia.toISOString())
      .like('numero_venta', `${abrev}-${fecha}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (result.error) {
      // Si la columna numero_venta no existe (código 42703), usar fallback
      if (result.error.code === '42703' || result.error.message?.includes('numero_venta does not exist')) {
        console.warn('Columna numero_venta no existe, usando código generado sin consultar base de datos');
        // Generar código basado en timestamp para asegurar unicidad
        const timestamp = Date.now().toString().slice(-6);
        return `${abrev}-${fecha}-${timestamp}`;
      }
      // Para otros errores, también usar fallback
      console.warn('Error obteniendo último código:', result.error);
      const timestamp = Date.now().toString().slice(-6);
      return `${abrev}-${fecha}-${timestamp}`;
    }
    
    ventasHoy = result.data || [];
  } catch (err) {
    // Si hay cualquier error, usar fallback
    console.warn('Error obteniendo último código:', err);
    const timestamp = Date.now().toString().slice(-6);
    return `${abrev}-${fecha}-${timestamp}`;
  }
  
  // Extraer el consecutivo del último código del mismo método y fecha
  let consecutivo = 1;
  if (ventasHoy && ventasHoy.length > 0) {
    // Filtrar solo los que coinciden con el patrón
    const ventasFiltradas = ventasHoy.filter(v => 
      v.numero_venta && v.numero_venta.startsWith(`${abrev}-${fecha}-`)
    );
    
    if (ventasFiltradas.length > 0) {
      // Ordenar por consecutivo descendente
      const consecutivos = ventasFiltradas
        .map(v => {
          const partes = v.numero_venta.split('-');
          if (partes.length === 3) {
            return parseInt(partes[2]);
          }
          return 0;
        })
        .filter(n => !isNaN(n) && n > 0)
        .sort((a, b) => b - a);
      
      if (consecutivos.length > 0) {
        consecutivo = consecutivos[0] + 1;
      }
    }
  }
  
  // Formato: EF-20250121-001
  return `${abrev}-${fecha}-${String(consecutivo).padStart(3, '0')}`;
};
