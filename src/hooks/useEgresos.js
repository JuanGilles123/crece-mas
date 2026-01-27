import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';

// ============================================
// PROVEEDORES
// ============================================

export const useProveedores = (organizationId, filters = {}) => {
  return useQuery({
    queryKey: ['proveedores', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('proveedores')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (filters.activo !== undefined) {
        query = query.eq('activo', filters.activo);
      }
      
      if (filters.tipo_proveedor) {
        query = query.eq('tipo_proveedor', filters.tipo_proveedor);
      }
      
      const { data, error } = await query.order('nombre', { ascending: true });
      
      if (error) {
        console.error('Error fetching proveedores:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useProveedor = (proveedorId) => {
  return useQuery({
    queryKey: ['proveedor', proveedorId],
    queryFn: async () => {
      if (!proveedorId) return null;
      
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('id', proveedorId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!proveedorId,
  });
};

export const useCrearProveedor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (proveedorData) => {
      const { data, error } = await supabase
        .from('proveedores')
        .insert([proveedorData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newProveedor) => {
      queryClient.invalidateQueries(['proveedores', newProveedor.organization_id]);
      toast.success('Proveedor creado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating proveedor:', error);
      toast.error(error.message || 'Error al crear proveedor');
    },
  });
};

export const useActualizarProveedor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('proveedores')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedProveedor) => {
      queryClient.invalidateQueries(['proveedores', updatedProveedor.organization_id]);
      queryClient.invalidateQueries(['proveedor', updatedProveedor.id]);
      toast.success('Proveedor actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating proveedor:', error);
      toast.error(error.message || 'Error al actualizar proveedor');
    },
  });
};

export const useEliminarProveedor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['proveedores', variables.organizationId]);
      toast.success('Proveedor eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting proveedor:', error);
      toast.error(error.message || 'Error al eliminar proveedor');
    },
  });
};

// ============================================
// CATEGORÍAS DE GASTOS
// ============================================

export const useCategoriasGastos = (organizationId, tipo = null) => {
  return useQuery({
    queryKey: ['categorias_gastos', organizationId, tipo],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('categorias_gastos')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('activa', true);
      
      if (tipo) {
        query = query.eq('tipo', tipo);
      }
      
      const { data, error } = await query.order('nombre', { ascending: true });
      
      if (error) {
        console.error('Error fetching categorias_gastos:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCrearCategoriaGasto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoriaData) => {
      const { data, error } = await supabase
        .from('categorias_gastos')
        .insert([categoriaData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newCategoria) => {
      queryClient.invalidateQueries(['categorias_gastos', newCategoria.organization_id]);
      toast.success('Categoría creada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating categoria:', error);
      toast.error(error.message || 'Error al crear categoría');
    },
  });
};

// ============================================
// GASTOS FIJOS
// ============================================

export const useGastosFijos = (organizationId, filters = {}) => {
  return useQuery({
    queryKey: ['gastos_fijos', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('gastos_fijos')
        .select(`
          *,
          categoria:categorias_gastos(id, nombre),
          proveedor:proveedores(id, nombre, nit)
        `)
        .eq('organization_id', organizationId);
      
      if (filters.activo !== undefined) {
        query = query.eq('activo', filters.activo);
      }
      
      const { data, error } = await query.order('nombre', { ascending: true });
      
      if (error) {
        console.error('Error fetching gastos_fijos:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCrearGastoFijo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gastoData) => {
      const { data, error } = await supabase
        .from('gastos_fijos')
        .insert([gastoData])
        .select(`
          *,
          categoria:categorias_gastos(id, nombre),
          proveedor:proveedores(id, nombre, nit)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newGasto) => {
      queryClient.invalidateQueries(['gastos_fijos', newGasto.organization_id]);
      toast.success('Gasto fijo creado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating gasto_fijo:', error);
      toast.error(error.message || 'Error al crear gasto fijo');
    },
  });
};

export const useActualizarGastoFijo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('gastos_fijos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          categoria:categorias_gastos(id, nombre),
          proveedor:proveedores(id, nombre, nit)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedGasto) => {
      queryClient.invalidateQueries(['gastos_fijos', updatedGasto.organization_id]);
      toast.success('Gasto fijo actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating gasto_fijo:', error);
      toast.error(error.message || 'Error al actualizar gasto fijo');
    },
  });
};

export const useEliminarGastoFijo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      const { error } = await supabase
        .from('gastos_fijos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['gastos_fijos', variables.organizationId]);
      toast.success('Gasto fijo eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting gasto_fijo:', error);
      toast.error(error.message || 'Error al eliminar gasto fijo');
    },
  });
};

// ============================================
// GASTOS VARIABLES
// ============================================

export const useGastosVariables = (organizationId, filters = {}) => {
  return useQuery({
    queryKey: ['gastos_variables', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('gastos_variables')
        .select(`
          *,
          categoria:categorias_gastos(id, nombre),
          proveedor:proveedores(id, nombre, nit)
        `)
        .eq('organization_id', organizationId);
      
      if (filters.fecha_desde) {
        query = query.gte('fecha', filters.fecha_desde);
      }
      
      if (filters.fecha_hasta) {
        query = query.lte('fecha', filters.fecha_hasta);
      }
      
      if (filters.categoria_id) {
        query = query.eq('categoria_id', filters.categoria_id);
      }
      
      if (filters.proveedor_id) {
        query = query.eq('proveedor_id', filters.proveedor_id);
      }
      
      const { data, error } = await query.order('fecha', { ascending: false });
      
      if (error) {
        console.error('Error fetching gastos_variables:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCrearGastoVariable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gastoData) => {
      const { data, error } = await supabase
        .from('gastos_variables')
        .insert([gastoData])
        .select(`
          *,
          categoria:categorias_gastos(id, nombre),
          proveedor:proveedores(id, nombre, nit)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newGasto) => {
      queryClient.invalidateQueries(['gastos_variables', newGasto.organization_id]);
      toast.success('Gasto variable registrado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating gasto_variable:', error);
      toast.error(error.message || 'Error al registrar gasto variable');
    },
  });
};

export const useActualizarGastoVariable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('gastos_variables')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          categoria:categorias_gastos(id, nombre),
          proveedor:proveedores(id, nombre, nit)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedGasto) => {
      queryClient.invalidateQueries(['gastos_variables', updatedGasto.organization_id]);
      toast.success('Gasto variable actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating gasto_variable:', error);
      toast.error(error.message || 'Error al actualizar gasto variable');
    },
  });
};

export const useEliminarGastoVariable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      const { error } = await supabase
        .from('gastos_variables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['gastos_variables', variables.organizationId]);
      toast.success('Gasto variable eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting gasto_variable:', error);
      toast.error(error.message || 'Error al eliminar gasto variable');
    },
  });
};

// ============================================
// ÓRDENES DE COMPRA
// ============================================

export const useOrdenesCompra = (organizationId, filters = {}) => {
  return useQuery({
    queryKey: ['ordenes_compra', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('ordenes_compra')
        .select(`
          *,
          proveedor:proveedores(id, nombre, nit, contacto_nombre, telefono),
          items:orden_compra_items(*)
        `)
        .eq('organization_id', organizationId);
      
      if (filters.estado) {
        query = query.eq('estado', filters.estado);
      }
      
      if (filters.proveedor_id) {
        query = query.eq('proveedor_id', filters.proveedor_id);
      }
      
      if (filters.fecha_desde) {
        query = query.gte('fecha_orden', filters.fecha_desde);
      }
      
      if (filters.fecha_hasta) {
        query = query.lte('fecha_orden', filters.fecha_hasta);
      }
      
      const { data, error } = await query.order('fecha_orden', { ascending: false });
      
      if (error) {
        console.error('Error fetching ordenes_compra:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useOrdenCompra = (ordenId) => {
  return useQuery({
    queryKey: ['orden_compra', ordenId],
    queryFn: async () => {
      if (!ordenId) return null;
      
      const { data, error } = await supabase
        .from('ordenes_compra')
        .select(`
          *,
          proveedor:proveedores(*),
          items:orden_compra_items(
            *,
            producto:productos(id, nombre, codigo, precio_compra)
          )
        `)
        .eq('id', ordenId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!ordenId,
  });
};

export const useCrearOrdenCompra = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ordenData, items }) => {
      // Crear la orden primero
      const { data: orden, error: ordenError } = await supabase
        .from('ordenes_compra')
        .insert([ordenData])
        .select()
        .single();
      
      if (ordenError) throw ordenError;
      
      // Si hay items, crearlos
      if (items && items.length > 0) {
        const itemsData = items.map(item => ({
          ...item,
          orden_compra_id: orden.id
        }));
        
        const { error: itemsError } = await supabase
          .from('orden_compra_items')
          .insert(itemsData);
        
        if (itemsError) throw itemsError;
      }
      
      // Obtener la orden completa con relaciones
      const { data: ordenCompleta, error: fetchError } = await supabase
        .from('ordenes_compra')
        .select(`
          *,
          proveedor:proveedores(*),
          items:orden_compra_items(
            *,
            producto:productos(id, nombre, codigo, precio_compra)
          )
        `)
        .eq('id', orden.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      return ordenCompleta;
    },
    onSuccess: (newOrden) => {
      queryClient.invalidateQueries(['ordenes_compra', newOrden.organization_id]);
      queryClient.invalidateQueries(['orden_compra', newOrden.id]);
      toast.success('Orden de compra creada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating orden_compra:', error);
      toast.error(error.message || 'Error al crear orden de compra');
    },
  });
};

export const useActualizarOrdenCompra = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates, items = null }) => {
      // Actualizar la orden
      const { error: ordenError } = await supabase
        .from('ordenes_compra')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (ordenError) throw ordenError;
      
      // Si se proporcionan items, reemplazarlos
      if (items !== null) {
        // Eliminar items existentes
        await supabase
          .from('orden_compra_items')
          .delete()
          .eq('orden_compra_id', id);
        
        // Insertar nuevos items
        if (items.length > 0) {
          const itemsData = items.map(item => ({
            ...item,
            orden_compra_id: id
          }));
          
          const { error: itemsError } = await supabase
            .from('orden_compra_items')
            .insert(itemsData);
          
          if (itemsError) throw itemsError;
        }
      }
      
      // Obtener la orden completa
      const { data: ordenCompleta, error: fetchError } = await supabase
        .from('ordenes_compra')
        .select(`
          *,
          proveedor:proveedores(*),
          items:orden_compra_items(
            *,
            producto:productos(id, nombre, codigo, precio_compra)
          )
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      return ordenCompleta;
    },
    onSuccess: (updatedOrden) => {
      queryClient.invalidateQueries(['ordenes_compra', updatedOrden.organization_id]);
      queryClient.invalidateQueries(['orden_compra', updatedOrden.id]);
      toast.success('Orden de compra actualizada exitosamente');
    },
    onError: (error) => {
      console.error('Error updating orden_compra:', error);
      toast.error(error.message || 'Error al actualizar orden de compra');
    },
  });
};

export const useEliminarOrdenCompra = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, organizationId }) => {
      const { error } = await supabase
        .from('ordenes_compra')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ordenes_compra', variables.organizationId]);
      toast.success('Orden de compra eliminada exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting orden_compra:', error);
      toast.error(error.message || 'Error al eliminar orden de compra');
    },
  });
};

// ============================================
// CRÉDITOS PROVEEDORES
// ============================================

export const useCreditosProveedores = (organizationId, filters = {}) => {
  return useQuery({
    queryKey: ['creditos_proveedores', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('creditos_proveedores')
        .select(`
          *,
          proveedor:proveedores(id, nombre, nit, contacto_nombre, telefono)
        `)
        .eq('organization_id', organizationId);
      
      if (filters.estado) {
        query = query.eq('estado', filters.estado);
      }
      
      if (filters.proveedor_id) {
        query = query.eq('proveedor_id', filters.proveedor_id);
      }
      
      if (filters.vencidos) {
        query = query.lt('fecha_vencimiento', new Date().toISOString().split('T')[0])
                    .in('estado', ['pendiente', 'parcial', 'vencido']);
      }
      
      const { data, error } = await query.order('fecha_emision', { ascending: false });
      
      if (error) {
        console.error('Error fetching creditos_proveedores:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCrearCreditoProveedor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (creditoData) => {
      const { data, error } = await supabase
        .from('creditos_proveedores')
        .insert([creditoData])
        .select(`
          *,
          proveedor:proveedores(id, nombre, nit)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newCredito) => {
      queryClient.invalidateQueries(['creditos_proveedores', newCredito.organization_id]);
      toast.success('Crédito con proveedor registrado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating credito_proveedor:', error);
      toast.error(error.message || 'Error al registrar crédito');
    },
  });
};

// ============================================
// PAGOS PROVEEDORES
// ============================================

export const usePagosProveedores = (creditoId) => {
  return useQuery({
    queryKey: ['pagos_proveedores', creditoId],
    queryFn: async () => {
      if (!creditoId) return [];
      
      const { data, error } = await supabase
        .from('pagos_proveedores')
        .select('*')
        .eq('credito_proveedor_id', creditoId)
        .order('fecha_pago', { ascending: false });
      
      if (error) {
        console.error('Error fetching pagos_proveedores:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!creditoId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCrearPagoProveedor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pagoData) => {
      const { data, error } = await supabase
        .from('pagos_proveedores')
        .insert([pagoData])
        .select(`
          *,
          credito:creditos_proveedores(id, monto_total, monto_pagado, monto_pendiente, estado)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newPago) => {
      queryClient.invalidateQueries(['pagos_proveedores', newPago.credito_proveedor_id]);
      queryClient.invalidateQueries(['creditos_proveedores']);
      toast.success('Pago registrado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating pago_proveedor:', error);
      toast.error(error.message || 'Error al registrar pago');
    },
  });
};

export const useEliminarPagoProveedor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, creditoId, organizationId }) => {
      const { error } = await supabase
        .from('pagos_proveedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, creditoId, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['pagos_proveedores', variables.creditoId]);
      queryClient.invalidateQueries(['creditos_proveedores', variables.organizationId]);
      toast.success('Pago eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting pago_proveedor:', error);
      toast.error(error.message || 'Error al eliminar pago');
    },
  });
};

// ============================================
// ESTADÍSTICAS DE EGRESOS
// ============================================

export const useEstadisticasEgresos = (organizationId, periodo = 'mes') => {
  return useQuery({
    queryKey: ['estadisticas_egresos', organizationId, periodo],
    queryFn: async () => {
      if (!organizationId) return null;
      
      try {
        const hoy = new Date();
        let fechaInicio, fechaFin;
        
        if (periodo === 'mes') {
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        } else if (periodo === 'semana') {
          const diaSemana = hoy.getDay();
          fechaInicio = new Date(hoy);
          fechaInicio.setDate(hoy.getDate() - diaSemana);
          fechaFin = new Date(fechaInicio);
          fechaFin.setDate(fechaInicio.getDate() + 6);
        } else if (periodo === 'año') {
          fechaInicio = new Date(hoy.getFullYear(), 0, 1);
          fechaFin = new Date(hoy.getFullYear(), 11, 31);
        } else {
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        }
        
        // Gastos variables del período
        const { data: gastosVariables } = await supabase
          .from('gastos_variables')
          .select('monto')
          .eq('organization_id', organizationId)
          .gte('fecha', fechaInicio.toISOString().split('T')[0])
          .lte('fecha', fechaFin.toISOString().split('T')[0]);
        
        // Gastos fijos activos (calcular proyección mensual)
        const { data: gastosFijos } = await supabase
          .from('gastos_fijos')
          .select('monto, frecuencia')
          .eq('organization_id', organizationId)
          .eq('activo', true);
        
        // Créditos pendientes
        const { data: creditos } = await supabase
          .from('creditos_proveedores')
          .select('monto_pendiente, estado')
          .eq('organization_id', organizationId)
          .in('estado', ['pendiente', 'parcial', 'vencido']);
        
        const totalGastosVariables = (gastosVariables || []).reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
        
        // Calcular proyección de gastos fijos según frecuencia
        const totalGastosFijos = (gastosFijos || []).reduce((sum, g) => {
          const monto = parseFloat(g.monto || 0);
          const frecuencia = g.frecuencia;
          let multiplicador = 1;
          
          if (frecuencia === 'diario') multiplicador = 30;
          else if (frecuencia === 'semanal') multiplicador = 4.33;
          else if (frecuencia === 'quincenal') multiplicador = 2;
          else if (frecuencia === 'mensual') multiplicador = 1;
          else if (frecuencia === 'bimestral') multiplicador = 0.5;
          else if (frecuencia === 'trimestral') multiplicador = 0.33;
          else if (frecuencia === 'semestral') multiplicador = 0.17;
          else if (frecuencia === 'anual') multiplicador = 0.083;
          
          return sum + (monto * multiplicador);
        }, 0);
        
        const totalCreditosPendientes = (creditos || []).reduce((sum, c) => sum + parseFloat(c.monto_pendiente || 0), 0);
        
        return {
          totalGastosVariables,
          totalGastosFijos,
          totalCreditosPendientes,
          totalEgresos: totalGastosVariables + totalGastosFijos,
          cantidadGastosVariables: gastosVariables?.length || 0,
          cantidadGastosFijos: gastosFijos?.length || 0,
          cantidadCreditos: creditos?.length || 0
        };
      } catch (error) {
        console.error('Error en useEstadisticasEgresos:', error);
        return null;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
};
