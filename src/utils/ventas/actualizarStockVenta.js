export const actualizarStockVenta = async ({ supabase, items = [], productos = [], organizationId, userId, userName, ventaId }) => {
  for (const item of items) {
    if (item.es_topping || (typeof item.id === 'string' && item.id.startsWith('topping_'))) {
      const toppingId = item.topping_id || (typeof item.id === 'string' && item.id.startsWith('topping_') ? item.id.replace('topping_', '') : item.id);

      const { data: topping, error: toppingError } = await supabase
        .from('toppings')
        .select('stock')
        .eq('id', toppingId)
        .single();

      if (!toppingError && topping && topping.stock !== null && topping.stock !== undefined) {
        const nuevoStock = topping.stock - item.qty;
        const { error: stockError } = await supabase
          .from('toppings')
          .update({ stock: nuevoStock })
          .eq('id', toppingId);

        if (stockError) {
          console.error(`Error al actualizar el stock del topping ${item.nombre}:`, stockError);
        } else if (organizationId) {
          // Registrar movimiento de stock
          await supabase.from('movimientos_stock').insert([{
            organization_id: organizationId,
            topping_id: toppingId,
            tipo: 'venta',
            cantidad: -item.qty,
            stock_anterior: topping.stock,
            stock_nuevo: nuevoStock,
            referencia_id: ventaId,
            usuario_id: userId,
            usuario_nombre: userName,
            notas: `Venta de topping: ${item.nombre}`
          }]);
        }
      }
      continue;
    }

    let producto = productos.find(p => p.id === item.id);

    if (!producto) {
      const { data: productoBD, error: productoBDError } = await supabase
        .from('productos')
        .select('id, nombre, stock, metadata, organization_id')
        .eq('id', item.id)
        .single();

      if (!productoBDError && productoBD) {
        producto = productoBD;
      }
    }

    const orgId = organizationId || producto?.organization_id;

    if (item.variant_id) {
      const { data: variante, error: varianteError } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single();

      if (!varianteError && variante && variante.stock !== null && variante.stock !== undefined) {
        const nuevoStock = variante.stock - item.qty;
        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ stock: nuevoStock })
          .eq('id', item.variant_id);

        if (stockError) {
          console.error(`Error al actualizar el stock de la variante ${item.variant_nombre || item.nombre}:`, stockError);
        } else if (orgId) {
          // Registrar movimiento de stock
          await supabase.from('movimientos_stock').insert([{
            organization_id: orgId,
            producto_id: item.id,
            variante_id: item.variant_id,
            tipo: 'venta',
            cantidad: -item.qty,
            stock_anterior: variante.stock,
            stock_nuevo: nuevoStock,
            referencia_id: ventaId,
            usuario_id: userId,
            usuario_nombre: userName,
            notas: `Venta de variante: ${item.variant_nombre || item.nombre}`
          }]);
        }
      }
    } else if (producto && producto.stock !== null && producto.stock !== undefined) {
      const nuevoStock = producto.stock - item.qty;
      const { error: stockError } = await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', item.id);

      if (stockError) {
        console.error(`Error al actualizar el stock de ${item.nombre}:`, stockError);
      } else if (orgId) {
        // Registrar movimiento de stock
        await supabase.from('movimientos_stock').insert([{
          organization_id: orgId,
          producto_id: item.id,
          producto_nombre: item.nombre,
          tipo: 'venta',
          cantidad: -item.qty,
          stock_anterior: producto.stock,
          stock_nuevo: nuevoStock,
          referencia_id: ventaId,
          usuario_id: userId,
          usuario_nombre: userName,
          notas: `Venta de producto: ${item.nombre}`
        }]);
      }
    }

    let metadata = producto?.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.warn('Error parseando metadata:', e);
        metadata = null;
      }
    }

    const productosVinculados = metadata?.productos_vinculados;
    if (productosVinculados && Array.isArray(productosVinculados) && productosVinculados.length > 0) {
      for (const productoVinculado of productosVinculados) {
        if (!productoVinculado.producto_id) {
          console.warn('Producto vinculado sin producto_id:', productoVinculado);
          continue;
        }

        const cantidadADescontar = parseFloat(productoVinculado.cantidad || 0) * parseFloat(item.qty || 1);

        const { data: prodVinculado, error: prodError } = await supabase
          .from('productos')
          .select('id, nombre, stock')
          .eq('id', productoVinculado.producto_id)
          .single();

        if (prodError) {
          console.error(`Error obteniendo producto vinculado ${productoVinculado.producto_id}:`, prodError);
          continue;
        }

        if (prodVinculado && prodVinculado.stock !== null && prodVinculado.stock !== undefined) {
          const stockActual = parseFloat(prodVinculado.stock) || 0;
          const nuevoStockVinculado = Math.max(0, stockActual - cantidadADescontar);
          const nuevoStockRedondeado = Math.round(nuevoStockVinculado * 100) / 100;

          const { error: stockVinculadoError } = await supabase
            .from('productos')
            .update({ stock: nuevoStockRedondeado })
            .eq('id', productoVinculado.producto_id);

          if (stockVinculadoError) {
            console.error(`Error al actualizar el stock del producto vinculado ${productoVinculado.producto_nombre || prodVinculado.nombre}:`, stockVinculadoError);
          } else if (orgId) {
            // Registrar movimiento de stock para producto vinculado
            await supabase.from('movimientos_stock').insert([{
              organization_id: orgId,
              producto_id: productoVinculado.producto_id,
              tipo: 'venta',
              cantidad: -cantidadADescontar,
              stock_anterior: stockActual,
              stock_nuevo: nuevoStockRedondeado,
              referencia_id: ventaId,
              usuario_id: userId,
              notas: `Descuento por venta de producto vinculado: ${item.nombre}`
            }]);
          }
        }
      }
    }
  }
};


