import React from 'react';
import './DashboardHome.css';

const Caja = () => (
  <div className="dashboard-home-main">
    <div className="dashboard-caja-card glass">
      <div className="dashboard-caja-actions">
        <button className="dashboard-caja-btn abrir">Registrar venta</button>
      </div>
      <h3 className="dashboard-caja-title">Caja</h3>
      <table className="dashboard-caja-table">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Movimiento</th>
            <th>Método</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="4" className="dashboard-caja-empty">No hay movimientos registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default Caja;
