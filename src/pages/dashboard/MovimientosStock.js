import React from 'react';
import MovimientosStockGeneral from '../../components/inventario/MovimientosStockGeneral';
import './MovimientosStock.css';

const MovimientosStock = () => {
  return (
    <div className="movimientos-stock-page">
      <div className="movimientos-stock-page-header">
        <h1>Movimientos de Stock</h1>
        <p>Historial detallado de entradas, ventas y ajustes de inventario</p>
      </div>
      <MovimientosStockGeneral />
    </div>
  );
};

export default MovimientosStock;
