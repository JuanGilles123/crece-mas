/**
 * CameraScanner — Escáner de códigos de barras por cámara (Optimizado)
 * Compatible con: Android, iPhone, iPad, PC (cualquier dispositivo con cámara)
 * Optimizado para lectura rápida de códigos pequeños con webcam de PC
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, SwitchCamera, Zap, ZapOff, AlertCircle, ZoomIn, ZoomOut, Focus } from 'lucide-react';
import './CameraScanner.css';

const CameraScanner = ({ onScan, onClose, title = 'Escanear código de barras' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const [useNativeDetector, setUseNativeDetector] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1 });
  const [focusSupported, setFocusSupported] = useState(false);

  // Verificar si BarcodeDetector nativo está disponible
  const checkNativeDetector = useCallback(async () => {
    if ('BarcodeDetector' in window) {
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats.length > 0) {
          detectorRef.current = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e', 'data_matrix', 'itf', 'codabar']
              .filter(f => formats.includes(f))
          });
          setUseNativeDetector(true);
          return true;
        }
      } catch {
        // fallback a zxing
      }
    }
    return false;
  }, []);

  // Obtener lista de cámaras
  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);

      // Preferir cámara trasera en móviles
      const backIndex = videoDevices.findIndex(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('trasera') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      if (backIndex >= 0) setActiveCameraIndex(backIndex);
      return videoDevices;
    } catch {
      return [];
    }
  }, []);

  // Iniciar stream de cámara con resolución ALTA para leer códigos pequeños
  const startCamera = useCallback(async (deviceId = null, retry = false) => {
    try {
      setError(null);
      setScanning(false);

      // Detener stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch {}
        controlsRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      // RESOLUCIÓN ALTA — Clave para leer códigos pequeños en webcam
      const constraints = {
        video: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }),
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          // Autofoco continuo — crítico para webcams
          focusMode: { ideal: 'continuous' },
          // Reducir exposición automática para imágenes más nítidas
          exposureMode: { ideal: 'continuous' },
          whiteBalanceMode: { ideal: 'continuous' }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Verificar capacidades del track (torch, zoom, focus)
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities?.();
        if (caps) {
          setTorchSupported(!!caps.torch);

          // Zoom
          if (caps.zoom) {
            setZoomSupported(true);
            setZoomRange({ min: caps.zoom.min, max: Math.min(caps.zoom.max, 5) });
            setZoomLevel(caps.zoom.min);
          }

          // Focus
          if (caps.focusMode && caps.focusMode.includes('continuous')) {
            setFocusSupported(true);
            // Activar autofoco continuo
            try {
              await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
            } catch {}
          }
        }
      }

      setScanning(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en tu navegador.');
      } else if (err.name === 'NotFoundError' && !retry) {
        startCamera(null, true);
      } else if (!retry) {
        // Reintentar con resolución más baja
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          setScanning(true);
        } catch (fallbackErr) {
          setError(`No se pudo acceder a la cámara: ${fallbackErr.message}`);
        }
      } else {
        setError(`No se pudo acceder a la cámara: ${err.message}`);
      }
    }
  }, []);

  // Zoom digital
  const changeZoom = useCallback(async (newZoom) => {
    if (!streamRef.current || !zoomSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const clamped = Math.max(zoomRange.min, Math.min(zoomRange.max, newZoom));
    try {
      await track.applyConstraints({ advanced: [{ zoom: clamped }] });
      setZoomLevel(clamped);
    } catch {}
  }, [zoomSupported, zoomRange]);

  // Re-enfocar manualmente (tap-to-focus)
  const refocus = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      // Cambiar a manual y luego a continuo para forzar re-enfoque
      await track.applyConstraints({ advanced: [{ focusMode: 'manual' }] });
      setTimeout(async () => {
        try {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
        } catch {}
      }, 200);
    } catch {}
  }, []);

  // Escaneo con BarcodeDetector nativo + canvas para región de interés
  const scanWithNativeDetector = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || !scanning) return;
    if (videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanWithNativeDetector);
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        if (code && code !== lastCode) {
          setLastCode(code);
          setScanned(true);
          setTimeout(() => {
            setScanned(false);
            setLastCode('');
          }, 1500);
          onScan(code);
          return; // No seguir escaneando después de éxito
        }
      }
    } catch {}

    animFrameRef.current = requestAnimationFrame(scanWithNativeDetector);
  }, [scanning, lastCode, onScan]);

  // Escaneo con @zxing/browser — OPTIMIZADO con TRY_HARDER y resolución alta
  const startZxingScanner = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { DecodeHintType, BarcodeFormat, NotFoundException } = await import('@zxing/library');

      // Configurar hints para mejor detección
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
        BarcodeFormat.DATA_MATRIX
      ]);
      // Permitir caracteres del charset completo
      hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');

      const reader = new BrowserMultiFormatReader(hints);
      reader.timeBetweenDecodingAttempts = 150; // Acelerar los intentos de decodificación
      readerRef.current = reader;

      const devices = await getCameras();
      const device = devices[activeCameraIndex];

      // Configurar video constraints (1280x720 es ideal, más resolución es lento en JS)
      const videoConstraints = {
        ...(device?.deviceId ? { deviceId: { exact: device.deviceId } } : { facingMode: { ideal: 'environment' } }),
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 }
      };

      controlsRef.current = await reader.decodeFromConstraints(
        { video: videoConstraints },
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText();
            if (code && code !== lastCode) {
              setLastCode(code);
              setScanned(true);
              setTimeout(() => {
                setScanned(false);
                setLastCode('');
              }, 1500);
              onScan(code);
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            // Ignorar errores normales de "no barcode found"
          }
        }
      );

      // Después de iniciar, verificar capacidades del stream
      if (videoRef.current?.srcObject) {
        streamRef.current = videoRef.current.srcObject;
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          const caps = track.getCapabilities?.();
          if (caps) {
            setTorchSupported(!!caps.torch);
            if (caps.zoom) {
              setZoomSupported(true);
              setZoomRange({ min: caps.zoom.min, max: Math.min(caps.zoom.max, 5) });
              setZoomLevel(caps.zoom.min);
            }
            if (caps.focusMode?.includes('continuous')) {
              setFocusSupported(true);
              try {
                await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
              } catch {}
            }
          }
        }
      }

      setScanning(true);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Permite el acceso en tu navegador.');
      } else {
        setError(`Error al iniciar el escáner: ${err.message}`);
      }
    }
  }, [activeCameraIndex, getCameras, lastCode, onScan]);

  // Inicialización
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      const hasNative = await checkNativeDetector();

      if (hasNative) {
        const devs = await getCameras();
        const device = devs[activeCameraIndex];
        await startCamera(device?.deviceId);
      } else {
        await startZxingScanner();
      }
    };

    init();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch {}
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loop de detección nativa
  useEffect(() => {
    if (useNativeDetector && scanning) {
      animFrameRef.current = requestAnimationFrame(scanWithNativeDetector);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [useNativeDetector, scanning, scanWithNativeDetector]);

  // Cambio de cámara
  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;
    const next = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(next);
    setZoomLevel(1);

    if (useNativeDetector) {
      await startCamera(cameras[next]?.deviceId);
    } else {
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch {}
        controlsRef.current = null;
      }
      setTimeout(() => startZxingScanner(), 300);
    }
  }, [cameras, activeCameraIndex, useNativeDetector, startCamera, startZxingScanner]);

  // Linterna
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(prev => !prev);
    } catch {}
  }, [torchOn]);

  // Cleanup
  const handleClose = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch {}
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="camera-scanner-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <motion.div
          className="camera-scanner-modal"
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Header */}
          <div className="camera-scanner-header">
            <div className="camera-scanner-title">
              <Camera size={20} />
              <span>{title}</span>
            </div>
            <button className="camera-scanner-close" onClick={handleClose}>
              <X size={22} />
            </button>
          </div>

          {/* Visor */}
          <div className="camera-scanner-viewport">
            <video
              ref={videoRef}
              className="camera-scanner-video"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Overlay de guía */}
            <div className={`camera-scanner-guide ${scanned ? 'success' : ''}`}>
              <div className="guide-corner top-left" />
              <div className="guide-corner top-right" />
              <div className="guide-corner bottom-left" />
              <div className="guide-corner bottom-right" />
              <div className={`guide-scan-line ${scanning ? 'animated' : ''}`} />
            </div>

            {/* Feedback de escaneo */}
            <AnimatePresence>
              {scanned && (
                <motion.div
                  className="camera-scanner-success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  ✅ ¡Código escaneado!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <div className="camera-scanner-error">
                <AlertCircle size={28} />
                <p>{error}</p>
                <button onClick={() => startCamera()} className="camera-retry-btn">
                  Reintentar
                </button>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="camera-scanner-controls">
            {/* Zoom */}
            {zoomSupported && (
              <div className="camera-zoom-controls">
                <button
                  className="camera-ctrl-btn"
                  onClick={() => changeZoom(zoomLevel - 0.5)}
                  disabled={zoomLevel <= zoomRange.min}
                  title="Alejar"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="camera-zoom-label">{zoomLevel.toFixed(1)}x</span>
                <button
                  className="camera-ctrl-btn"
                  onClick={() => changeZoom(zoomLevel + 0.5)}
                  disabled={zoomLevel >= zoomRange.max}
                  title="Acercar"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            )}

            {focusSupported && (
              <button className="camera-ctrl-btn" onClick={refocus} title="Re-enfocar">
                <Focus size={20} />
                <span>Enfocar</span>
              </button>
            )}

            {torchSupported && (
              <button
                className={`camera-ctrl-btn ${torchOn ? 'active' : ''}`}
                onClick={toggleTorch}
                title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              >
                {torchOn ? <ZapOff size={20} /> : <Zap size={20} />}
                <span>{torchOn ? 'ON' : 'Luz'}</span>
              </button>
            )}

            {cameras.length > 1 && (
              <button className="camera-ctrl-btn" onClick={switchCamera} title="Cambiar cámara">
                <SwitchCamera size={20} />
                <span>Cámara</span>
              </button>
            )}

            <button className="camera-ctrl-btn cancel" onClick={handleClose}>
              <X size={20} />
              <span>Cerrar</span>
            </button>
          </div>

          <p className="camera-scanner-hint">
            📌 Acerca el código de barras al centro del cuadro. {zoomSupported ? 'Usa el zoom para acercar.' : 'Acerca el producto a la cámara.'}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraScanner;
