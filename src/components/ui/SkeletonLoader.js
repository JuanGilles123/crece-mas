import React from 'react';
import './SkeletonLoader.css';

// Skeleton para tarjetas de producto
export const ProductCardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-price"></div>
      <div className="skeleton-line skeleton-stock"></div>
      <div className="skeleton-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  </div>
);

// Skeleton para lista de productos
export const ProductListSkeleton = () => (
  <div className="skeleton-list-item">
    <div className="skeleton-image-small"></div>
    <div className="skeleton-content">
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-price"></div>
      <div className="skeleton-line skeleton-stock"></div>
    </div>
    <div className="skeleton-actions">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

// Skeleton para el header del inventario
export const InventoryHeaderSkeleton = () => (
  <div className="skeleton-header">
    <div className="skeleton-search"></div>
    <div className="skeleton-buttons">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

// Skeleton para el dashboard
export const DashboardSkeleton = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-sidebar">
      <div className="skeleton-logo"></div>
      <div className="skeleton-nav">
        <div className="skeleton-nav-item"></div>
        <div className="skeleton-nav-item"></div>
        <div className="skeleton-nav-item"></div>
      </div>
    </div>
    <div className="skeleton-main">
      <div className="skeleton-content-area">
        <InventoryHeaderSkeleton />
        <div className="skeleton-grid">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </div>
    </div>
  </div>
);

// Skeleton para formularios
export const FormSkeleton = () => (
  <div className="skeleton-form">
    <div className="skeleton-input"></div>
    <div className="skeleton-input"></div>
    <div className="skeleton-input"></div>
    <div className="skeleton-button-large"></div>
  </div>
);

// Skeleton genérico para cualquier contenido
export const GenericSkeleton = ({ width = "100%", height = "20px", className = "" }) => (
  <div 
    className={`skeleton-line ${className}`}
    style={{ width, height }}
  ></div>
);

const SkeletonComponents = {
  ProductCardSkeleton,
  ProductListSkeleton,
  InventoryHeaderSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  GenericSkeleton
};

export default SkeletonComponents;
