import React from 'react';
import './DashboardHome.css';
import obrero from '../assets/obrero.png';
import StorageInfo from '../components/StorageInfo';

const DashboardHome = () => (
  <div className="dashboard-home">
    <div className="dashboard-card">
      <h2>Dashboard</h2>
      <img src={obrero} alt="Dashboard en construcción" className="dashboard-img" />
      <h3>Dashboard en Construcción</h3>
      <p>Pronto verá aquí tus métricas clave.</p>
    </div>
    
    <StorageInfo />
  </div>
);

export default DashboardHome;
