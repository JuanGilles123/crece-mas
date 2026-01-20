import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      const isConfigError = this.state.error?.message?.includes('Variables de entorno') || 
                           this.state.error?.message?.includes('SUPABASE_URL');

      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '40px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <h1 style={{ marginTop: 0, fontSize: '2rem' }}>⚠️ Error de Configuración</h1>
            
            {isConfigError ? (
              <div>
                <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                  Las variables de entorno no están configuradas correctamente.
                </p>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ marginTop: 0 }}>Pasos para solucionarlo:</h3>
                  <ol style={{ lineHeight: '1.8' }}>
                    <li>Crea o edita el archivo <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code> en la raíz del proyecto</li>
                    <li>Agrega tus credenciales de Supabase:
                      <pre style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '0.9rem'
                      }}>{`REACT_APP_SUPABASE_URL=tu_url_real
REACT_APP_SUPABASE_ANON_KEY=tu_clave_real`}</pre>
                    </li>
                    <li>Reinicia el servidor de desarrollo</li>
                  </ol>
                </div>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Puedes encontrar estas credenciales en tu proyecto de Supabase:
                  <br />
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                    Settings → API
                  </a>
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                  Ha ocurrido un error inesperado.
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details style={{ marginTop: '20px' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Detalles del error</summary>
                    <pre style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '0.8rem',
                      maxHeight: '200px'
                    }}>
                      {this.state.error && this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                fontSize: '1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
