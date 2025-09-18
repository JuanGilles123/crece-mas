import React, { useState } from 'react';
import { useStorageCleanup } from '../hooks/useStorageCleanup';
import './StorageInfo.css';

const StorageInfo = () => {
  const [cleanupResult, setCleanupResult] = useState(null);
  const {
    storageInfo,
    loading,
    cleaning,
    lastCleanup,
    loadStorageInfo,
    cleanupOrphaned,
    formatBytes
  } = useStorageCleanup();

  const handleCleanup = async () => {
    const confirmar = window.confirm(
      '¿Estás seguro de que quieres limpiar las imágenes huérfanas? Esta acción eliminará permanentemente las imágenes que no están siendo utilizadas por ningún producto.'
    );
    
    if (!confirmar) return;

    setCleanupResult(null);
    
    try {
      const result = await cleanupOrphaned(false);
      setCleanupResult(result);
      
      if (result.deleted > 0) {
        alert(`Limpieza completada: ${result.deleted} imágenes huérfanas eliminadas`);
      } else {
        alert('No se encontraron imágenes huérfanas para eliminar');
      }
    } catch (error) {
      console.error('Error en limpieza:', error);
      alert('Error durante la limpieza. Revisa la consola para más detalles.');
    }
  };

  return (
    <div className="storage-info-container">
      <h3 className="storage-info-title">
        📁 Información del Storage
      </h3>
      
      {loading ? (
        <div style={{ color: '#64748b' }}>Cargando información...</div>
      ) : (
        <div className="storage-info-content">
          <div className="storage-info-row">
            <span className="storage-info-label">Archivos:</span>
            <span className="storage-info-value">
              {storageInfo.fileCount}
            </span>
          </div>
          <div className="storage-info-row">
            <span className="storage-info-label">Tamaño total:</span>
            <span className="storage-info-value">
              {formatBytes(storageInfo.totalSize)}
            </span>
          </div>
          {lastCleanup && (
            <div className="storage-info-last-cleanup">
              <span className="storage-info-last-cleanup-label">Última limpieza:</span>
              <span className="storage-info-last-cleanup-value">
                {lastCleanup.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleCleanup}
        disabled={cleaning || loading}
        className="storage-info-button"
      >
        {cleaning ? '🧹 Limpiando...' : '🧹 Limpiar Imágenes Huérfanas'}
      </button>

      {cleanupResult && (
        <div className={`storage-info-result ${cleanupResult.errors > 0 ? 'error' : 'success'}`}>
          <div>
            {cleanupResult.errors > 0 
              ? `❌ Error: ${cleanupResult.errors} archivos no pudieron eliminarse`
              : `✅ Limpieza exitosa: ${cleanupResult.deleted} archivos eliminados`
            }
          </div>
        </div>
      )}

      <div className="storage-info-tip">
        💡 <strong>Tip:</strong> La limpieza elimina imágenes que no están siendo utilizadas por ningún producto, liberando espacio en el storage.
      </div>
    </div>
  );
};

export default StorageInfo;
