export const actualizarStockVenta = async ({ supabase, items = [], productos = [] }) => {
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
        }
      }
      continue;
    }

    let producto = productos.find(p => p.id === item.id);

    if (!producto) {
      const { data: productoBD, error: productoBDError } = await supabase
        .from('productos')
        .select('id, nombre, stock, metadata')
        .eq('id', item.id)
        .single();

      if (!productoBDError && productoBD) {
        producto = productoBD;
      }
    }

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
          }
        }
      }
    }
  }
};

