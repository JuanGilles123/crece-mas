# 🎯 SISTEMA DE SUSCRIPCIONES - CRECE+

## Planificación completa del sistema de suscripciones con Wompi

---

## 💰 PLANES DE SUSCRIPCIÓN

### **Plan GRATIS (Básico)**
**$0 COP/mes** - Para probar la plataforma

**Límites estrictos:**
- ✅ 1 organización/negocio
- ✅ **1 usuario** (solo el dueño)
- ✅ Hasta **20 productos** activos
- ✅ Hasta **50 ventas/mes**
- ✅ Historial de **últimos 7 días** solamente
- ✅ Venta rápida básica
- ✅ Inventario básico (agregar, editar, buscar)
- ✅ Caja básica (abrir/cerrar, efectivo)
- ❌ Sin gestión de equipo
- ❌ Sin roles ni permisos
- ❌ Sin reportes avanzados
- ❌ Sin exportación de datos
- ❌ Sin múltiples métodos de pago
- ❌ Sin configuración de impuestos
- ❌ Sin notificaciones avanzadas
- ❌ Sin importación CSV
- ❌ Sin imágenes de productos (solo placeholder)

---

### **Plan PROFESIONAL** ⭐ (MÁS POPULAR)
**$60.000 COP/mes** o **$600.000/año** (ahorro 2 meses)

**Todo desbloqueado para negocios pequeños/medianos:**
- ✅ 1 organización
- ✅ Hasta **10 usuarios/empleados**
- ✅ **Productos ilimitados**
- ✅ **Ventas ilimitadas**
- ✅ **Historial completo** (sin límite de días)
- ✅ Sistema completo de inventario
- ✅ **Gestión de equipo y roles**
- ✅ Permisos personalizados
- ✅ **Reportes avanzados** (Dashboard, gráficos, métricas)
- ✅ **Exportación** a Excel/CSV/PDF
- ✅ **Múltiples métodos de pago** (efectivo, tarjeta, transferencia, mixto)
- ✅ **Configuración de impuestos** (IVA, retenciones)
- ✅ **Notificaciones avanzadas** (stock bajo, vencimientos)
- ✅ **Importación CSV** de productos
- ✅ **Imágenes de productos** ilimitadas
- ✅ **Recibos personalizados**
- ✅ Soporte prioritario por email
- ✅ Backups automáticos diarios

---

### **Plan EMPRESARIAL** 🏢
**$150.000 COP/mes** o **$1.500.000/año** (ahorro 2 meses)

**Para negocios con múltiples sucursales:**
- ✅ **Hasta 5 organizaciones/sucursales**
- ✅ **Usuarios ilimitados**
- ✅ Todo lo del plan Profesional
- ✅ **Multi-sucursal completo**
- ✅ Transferencias entre sucursales
- ✅ Consolidado de ventas multi-sucursal
- ✅ **Sistema de clientes** (próximamente)
- ✅ **Sistema de proveedores** (próximamente)
- ✅ **Facturación electrónica** DIAN (próximamente)
- ✅ **API REST** para integraciones
- ✅ Soporte 24/7 prioritario (WhatsApp)
- ✅ Capacitación personalizada
- ✅ **Branding personalizado** (logo, colores)
- ✅ Asesoría en configuración

---

### **Plan CUSTOM (Enterprise+)** 💎
**Precio personalizado** - Desde $300.000/mes

**Para grandes empresas:**
- ✅ **Organizaciones ilimitadas**
- ✅ Todo lo del plan Empresarial
- ✅ Desarrollo de funcionalidades a medida
- ✅ Integración con sistemas ERP propios
- ✅ Servidor dedicado (opcional)
- ✅ Gerente de cuenta dedicado
- ✅ SLA garantizado 99.9%
- ✅ Soporte telefónico directo

---

## 🔐 SISTEMA DE FEATURES FLAGS - LÓGICA COMPLETA

### **Constante de Features por Plan**

```javascript
// src/constants/subscriptionFeatures.js

export const PLAN_FEATURES = {
  free: {
    // Límites numéricos
    limits: {
      maxOrganizations: 1,
      maxUsers: 1,
      maxProducts: 20,
      maxSalesPerMonth: 50,
      historyDays: 7,
      maxProductImages: 0, // Sin imágenes
    },
    
    // Features booleanas (true = permitido)
    features: {
      // Inventario
      inventoryBasic: true,
      inventoryAdvanced: false,
      productImages: false,
      importCSV: false,
      exportData: false,
      bulkOperations: false,
      
      // Ventas
      quickSale: true,
      advancedSale: false,
      multiplePaymentMethods: false,
      mixedPayments: false,
      salesHistory: true,
      salesReports: false,
      
      // Caja
      cashRegister: true,
      cashRegisterReports: false,
      closingHistory: false,
      
      // Equipo
      teamManagement: false,
      rolesAndPermissions: false,
      inviteUsers: false,
      
      // Reportes
      basicDashboard: true,
      advancedReports: false,
      charts: false,
      metrics: false,
      
      // Configuración
      taxConfiguration: false,
      invoiceCustomization: false,
      notifications: false,
      
      // Soporte
      emailSupport: false,
      prioritySupport: false,
    }
  },
  
  professional: {
    limits: {
      maxOrganizations: 1,
      maxUsers: 10,
      maxProducts: null, // null = ilimitado
      maxSalesPerMonth: null,
      historyDays: null,
      maxProductImages: null,
    },
    
    features: {
      // Todo desbloqueado excepto multi-sucursal
      inventoryBasic: true,
      inventoryAdvanced: true,
      productImages: true,
      importCSV: true,
      exportData: true,
      bulkOperations: true,
      
      quickSale: true,
      advancedSale: true,
      multiplePaymentMethods: true,
      mixedPayments: true,
      salesHistory: true,
      salesReports: true,
      
      cashRegister: true,
      cashRegisterReports: true,
      closingHistory: true,
      
      teamManagement: true,
      rolesAndPermissions: true,
      inviteUsers: true,
      
      basicDashboard: true,
      advancedReports: true,
      charts: true,
      metrics: true,
      
      taxConfiguration: true,
      invoiceCustomization: true,
      notifications: true,
      
      emailSupport: true,
      prioritySupport: false,
      
      // Features empresariales desactivadas
      multiOrg: false,
      branchTransfers: false,
      consolidatedReports: false,
      apiAccess: false,
      customBranding: false,
    }
  },
  
  enterprise: {
    limits: {
      maxOrganizations: 5,
      maxUsers: null,
      maxProducts: null,
      maxSalesPerMonth: null,
      historyDays: null,
      maxProductImages: null,
    },
    
    features: {
      // Todo del profesional + empresarial
      inventoryBasic: true,
      inventoryAdvanced: true,
      productImages: true,
      importCSV: true,
      exportData: true,
      bulkOperations: true,
      
      quickSale: true,
      advancedSale: true,
      multiplePaymentMethods: true,
      mixedPayments: true,
      salesHistory: true,
      salesReports: true,
      
      cashRegister: true,
      cashRegisterReports: true,
      closingHistory: true,
      
      teamManagement: true,
      rolesAndPermissions: true,
      inviteUsers: true,
      
      basicDashboard: true,
      advancedReports: true,
      charts: true,
      metrics: true,
      
      taxConfiguration: true,
      invoiceCustomization: true,
      notifications: true,
      
      emailSupport: true,
      prioritySupport: true,
      
      multiOrg: true,
      branchTransfers: true,
      consolidatedReports: true,
      apiAccess: true,
      customBranding: true,
      clientsModule: true, // Próximamente
      suppliersModule: true, // Próximamente
      electronicInvoicing: true, // Próximamente
      
      whatsappSupport: true,
      onboarding: true,
    }
  },
  
  custom: {
    limits: {
      maxOrganizations: null, // Ilimitado
      maxUsers: null,
      maxProducts: null,
      maxSalesPerMonth: null,
      historyDays: null,
      maxProductImages: null,
    },
    
    features: {
      // Todo desbloqueado
      inventoryBasic: true,
      inventoryAdvanced: true,
      productImages: true,
      importCSV: true,
      exportData: true,
      bulkOperations: true,
      
      quickSale: true,
      advancedSale: true,
      multiplePaymentMethods: true,
      mixedPayments: true,
      salesHistory: true,
      salesReports: true,
      
      cashRegister: true,
      cashRegisterReports: true,
      closingHistory: true,
      
      teamManagement: true,
      rolesAndPermissions: true,
      inviteUsers: true,
      
      basicDashboard: true,
      advancedReports: true,
      charts: true,
      metrics: true,
      
      taxConfiguration: true,
      invoiceCustomization: true,
      notifications: true,
      
      emailSupport: true,
      prioritySupport: true,
      
      multiOrg: true,
      branchTransfers: true,
      consolidatedReports: true,
      apiAccess: true,
      customBranding: true,
      clientsModule: true,
      suppliersModule: true,
      electronicInvoicing: true,
      
      whatsappSupport: true,
      onboarding: true,
      
      dedicatedServer: true,
      accountManager: true,
      customDevelopment: true,
      erpIntegration: true,
      slaGuarantee: true,
      phoneSupport: true,
    }
  }
};
```

---

## 🎯 HOOK PERSONALIZADO PARA VERIFICAR FEATURES

```javascript
// src/hooks/useSubscription.js

import { useAuth } from '../context/AuthContext';
import { PLAN_FEATURES } from '../constants/subscriptionFeatures';
import { supabase } from '../supabaseClient';
import { useState, useEffect } from 'react';

export const useSubscription = () => {
  const { organization } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadSubscription();
    }
  }, [organization?.id]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .single();

      if (error) {
        // Si no tiene suscripción, usar plan gratis
        setSubscription({
          plan: { slug: 'free' },
          status: 'active'
        });
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPlanSlug = () => {
    return subscription?.plan?.slug || 'free';
  };

  const getPlanFeatures = () => {
    const planSlug = getPlanSlug();
    return PLAN_FEATURES[planSlug] || PLAN_FEATURES.free;
  };

  // Verificar si tiene acceso a una feature
  const hasFeature = (featureName) => {
    const features = getPlanFeatures();
    return features.features[featureName] === true;
  };

  // Obtener límite específico
  const getLimit = (limitName) => {
    const features = getPlanFeatures();
    return features.limits[limitName];
  };

  // Verificar si alcanzó un límite
  const checkLimit = async (limitType) => {
    const limit = getLimit(limitType);
    
    // null = ilimitado
    if (limit === null) return { allowed: true, current: null, limit: null };

    let current = 0;

    switch(limitType) {
      case 'maxProducts':
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id);
        current = productsCount;
        break;

      case 'maxSalesPerMonth':
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: salesCount } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('created_at', startOfMonth.toISOString());
        current = salesCount;
        break;

      case 'maxUsers':
        const { count: usersCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'active');
        current = usersCount + 1; // +1 por el dueño
        break;
    }

    return {
      allowed: current < limit,
      current,
      limit,
      remaining: limit - current
    };
  };

  // Verificar si puede realizar una acción
  const canPerformAction = async (action) => {
    const planSlug = getPlanSlug();
    
    switch(action) {
      case 'createProduct':
        const productLimit = await checkLimit('maxProducts');
        return {
          allowed: productLimit.allowed,
          reason: !productLimit.allowed ? `Has alcanzado el límite de ${productLimit.limit} productos en el plan ${planSlug}` : null
        };

      case 'createSale':
        const salesLimit = await checkLimit('maxSalesPerMonth');
        return {
          allowed: salesLimit.allowed,
          reason: !salesLimit.allowed ? `Has alcanzado el límite de ${salesLimit.limit} ventas este mes` : null
        };

      case 'inviteUser':
        if (!hasFeature('inviteUsers')) {
          return {
            allowed: false,
            reason: 'La gestión de equipo no está disponible en tu plan'
          };
        }
        const usersLimit = await checkLimit('maxUsers');
        return {
          allowed: usersLimit.allowed,
          reason: !usersLimit.allowed ? `Has alcanzado el límite de ${usersLimit.limit} usuarios` : null
        };

      case 'uploadProductImage':
        return {
          allowed: hasFeature('productImages'),
          reason: !hasFeature('productImages') ? 'Las imágenes de productos no están disponibles en tu plan' : null
        };

      case 'exportData':
        return {
          allowed: hasFeature('exportData'),
          reason: !hasFeature('exportData') ? 'La exportación de datos no está disponible en tu plan' : null
        };

      case 'importCSV':
        return {
          allowed: hasFeature('importCSV'),
          reason: !hasFeature('importCSV') ? 'La importación CSV no está disponible en tu plan' : null
        };

      default:
        return { allowed: true };
    }
  };

  return {
    subscription,
    loading,
    planSlug: getPlanSlug(),
    planFeatures: getPlanFeatures(),
    hasFeature,
    getLimit,
    checkLimit,
    canPerformAction,
    isFreePlan: getPlanSlug() === 'free',
    isProfessional: getPlanSlug() === 'professional',
    isEnterprise: getPlanSlug() === 'enterprise' || getPlanSlug() === 'custom',
  };
};
```

---

## 🚫 COMPONENTE DE BLOQUEO/UPGRADE

```javascript
// src/components/UpgradePrompt.js

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UpgradePrompt.css';

const UpgradePrompt = ({ 
  feature, 
  reason, 
  currentPlan = 'free',
  recommendedPlan = 'professional',
  inline = false // inline para dentro de páginas, modal para popups
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/subscription/plans');
  };

  if (inline) {
    return (
      <motion.div 
        className="upgrade-prompt-inline"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Lock size={24} />
        <div className="upgrade-content">
          <h3>Función Premium</h3>
          <p>{reason || 'Esta función no está disponible en tu plan actual'}</p>
          <button onClick={handleUpgrade} className="upgrade-button">
            <Zap size={18} />
            Mejorar a {recommendedPlan === 'professional' ? 'Profesional' : 'Empresarial'}
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="upgrade-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => e.target.classList.contains('upgrade-modal-overlay') && close()}
    >
      <motion.div 
        className="upgrade-modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="upgrade-modal-icon">
          <Lock size={48} />
        </div>
        <h2>Mejora tu Plan</h2>
        <p className="upgrade-reason">{reason}</p>
        <div className="upgrade-benefits">
          <h4>Con el plan {recommendedPlan === 'professional' ? 'Profesional' : 'Empresarial'} obtienes:</h4>
          <ul>
            {recommendedPlan === 'professional' ? (
              <>
                <li>✅ Productos ilimitados</li>
                <li>✅ Ventas ilimitadas</li>
                <li>✅ Gestión de equipo</li>
                <li>✅ Reportes avanzados</li>
                <li>✅ Exportación de datos</li>
              </>
            ) : (
              <>
                <li>✅ Todo del plan Profesional</li>
                <li>✅ Multi-sucursal (hasta 5)</li>
                <li>✅ Usuarios ilimitados</li>
                <li>✅ API para integraciones</li>
                <li>✅ Soporte prioritario 24/7</li>
              </>
            )}
          </ul>
        </div>
        <div className="upgrade-modal-actions">
          <button onClick={handleUpgrade} className="btn-upgrade-primary">
            <Zap size={20} />
            Ver Planes y Precios
          </button>
          <button onClick={close} className="btn-upgrade-secondary">
            Tal vez después
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UpgradePrompt;
```

---

## 🛡️ MIDDLEWARE PARA PROTEGER RUTAS

```javascript
// src/components/FeatureGuard.js

import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import { LottieLoader } from './LottieLoader';

const FeatureGuard = ({ 
  feature, 
  action,
  children,
  fallback,
  recommendedPlan = 'professional'
}) => {
  const { hasFeature, canPerformAction, loading } = useSubscription();

  if (loading) {
    return <LottieLoader />;
  }

  // Verificar feature booleana
  if (feature && !hasFeature(feature)) {
    return fallback || (
      <UpgradePrompt 
        feature={feature}
        reason={`Esta función requiere el plan ${recommendedPlan}`}
        recommendedPlan={recommendedPlan}
        inline={true}
      />
    );
  }

  // Verificar acción con límites
  if (action) {
    const [canPerform, setCanPerform] = React.useState(null);

    React.useEffect(() => {
      canPerformAction(action).then(setCanPerform);
    }, [action]);

    if (canPerform === null) return <LottieLoader />;

    if (!canPerform.allowed) {
      return fallback || (
        <UpgradePrompt 
          reason={canPerform.reason}
          recommendedPlan={recommendedPlan}
          inline={true}
        />
      );
    }
  }

  return <>{children}</>;
};

export default FeatureGuard;
```

---

## 💡 EJEMPLOS DE USO EN COMPONENTES

### **1. Proteger botón de agregar producto:**

```javascript
// En Inventario.js

const handleAddProduct = async () => {
  const check = await canPerformAction('createProduct');
  
  if (!check.allowed) {
    toast.error(check.reason);
    setShowUpgradeModal(true);
    return;
  }
  
  // Continuar con agregar producto...
};

// Y el límite mostrado en UI:
<FeatureGuard action="createProduct">
  <button onClick={() => setShowModal(true)}>
    Agregar Producto
  </button>
</FeatureGuard>

// Mostrar progreso del límite
{!isProfessional && (
  <div className="plan-limit-badge">
    {currentProducts}/{getLimit('maxProducts')} productos
  </div>
)}
```

### **2. Ocultar sección de equipo en plan gratis:**

```javascript
// En Dashboard/Sidebar

{hasFeature('teamManagement') && (
  <NavLink to="/dashboard/equipo">
    <Users size={20} />
    <span>Equipo</span>
  </NavLink>
)}
```

### **3. Bloquear exportación:**

```javascript
// En Reportes

<FeatureGuard 
  feature="exportData" 
  recommendedPlan="professional"
>
  <button onClick={handleExport}>
    <Download size={18} />
    Exportar a Excel
  </button>
</FeatureGuard>
```

### **4. Bloquear imágenes de productos:**

```javascript
// En AgregarProductoModal

{hasFeature('productImages') ? (
  <input type="file" accept="image/*" onChange={handleImageUpload} />
) : (
  <div className="feature-locked">
    <Lock size={20} />
    <p>Las imágenes requieren plan Profesional</p>
  </div>
)}
```

---

## 📊 BANNER DE LÍMITES ALCANZADOS

```javascript
// src/components/UsageBanner.js

import React, { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsageBanner = () => {
  const { checkLimit, planSlug, isFreePlan } = useSubscription();
  const [limits, setLimits] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (isFreePlan) {
      Promise.all([
        checkLimit('maxProducts'),
        checkLimit('maxSalesPerMonth')
      ]).then(([products, sales]) => {
        setLimits({ products, sales });
      });
    }
  }, [isFreePlan]);

  if (!isFreePlan) return null;

  const productsPercent = (limits.products?.current / limits.products?.limit) * 100;
  const salesPercent = (limits.sales?.current / limits.sales?.limit) * 100;

  if (productsPercent < 70 && salesPercent < 70) return null;

  return (
    <div className="usage-banner">
      <AlertTriangle size={20} />
      <div>
        {productsPercent >= 90 && (
          <p>⚠️ Has usado {limits.products.current}/{limits.products.limit} productos</p>
        )}
        {salesPercent >= 90 && (
          <p>⚠️ Has usado {limits.sales.current}/{limits.sales.limit} ventas este mes</p>
        )}
      </div>
      <button onClick={() => navigate('/subscription/plans')}>
        Mejorar Plan
      </button>
    </div>
  );
};

export default UsageBanner;
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### **Nueva tabla: `subscription_plans`**
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL,
  price_yearly NUMERIC(10, 2),
  currency TEXT DEFAULT 'COP',
  max_organizations INTEGER,
  max_users_per_org INTEGER,
  max_products INTEGER,
  max_sales_per_month INTEGER,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Nueva tabla: `subscriptions`**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  wompi_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT status_check CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing'))
);
```

### **Nueva tabla: `payments`**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  wompi_transaction_id TEXT UNIQUE,
  wompi_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'declined', 'voided'))
);
```

### **Nueva tabla: `usage_tracking`**
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  products_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, period_start)
);
```

### **Modificar tabla: `organizations`**
```sql
ALTER TABLE organizations 
ADD COLUMN subscription_id UUID REFERENCES subscriptions(id),
ADD COLUMN subscription_status TEXT DEFAULT 'free',
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_trial_used BOOLEAN DEFAULT false;
```

---

## 💳 INTEGRACIÓN CON WOMPI

### **Variables de Entorno necesarias:**
```env
WOMPI_PUBLIC_KEY=pub_test_xxx
WOMPI_PRIVATE_KEY=prv_test_xxx
WOMPI_EVENTS_SECRET=xxx
WOMPI_REDIRECT_URL=https://app.crece.com/subscription/success
```

### **Endpoints de Wompi a usar:**
- `POST /transactions` - Crear transacción
- `POST /payment_sources` - Tokenizar tarjeta
- `GET /transactions/{id}` - Consultar estado
- Webhooks para notificaciones

### **Flujo de Pago:**
```
1. Usuario selecciona plan → 
2. Redirige a checkout Wompi (Widget o Link) →
3. Usuario paga →
4. Wompi envía webhook →
5. Backend procesa webhook →
6. Actualiza suscripción →
7. Activa funcionalidades →
8. Email de confirmación
```

---

## 📈 LÓGICA DE NEGOCIO

### **Período de Prueba (Trial):**
- 14 días gratis del plan Profesional
- Solo una vez por organización
- Se activa al crear cuenta
- Email 7 días antes de terminar
- Email 1 día antes de terminar
- Al terminar → Downgrade a Gratis automático

### **Ciclo de Facturación:**
- Mensual: Cobra cada 30 días
- Anual: Cobra cada 365 días (2 meses de ahorro)
- Renovación automática
- Email 3 días antes del cobro

### **Período de Gracia:**
- Si falla el pago → 7 días de gracia
- Email inmediato al fallo
- Email día 3 de gracia
- Email día 6 de gracia
- Día 8 → Downgrade a Gratis

### **Upgrade/Downgrade:**
- **Upgrade:** Inmediato, se prorratea el costo
- **Downgrade:** Al finalizar período actual
- Email de confirmación

### **Cancelación:**
- Mantiene acceso hasta fin de período
- No hay reembolsos
- Puede reactivar antes de que expire
- Data se mantiene por 90 días después de expirar

---

## 🔔 NOTIFICACIONES Y EMAILS

### **Emails Transaccionales:**
1. Bienvenida + inicio de trial
2. Trial termina en 7 días
3. Trial termina en 1 día
4. Suscripción activada exitosamente
5. Pago próximo en 3 días
6. Pago exitoso + recibo
7. Pago fallido
8. Período de gracia (días 3, 6)
9. Downgrade por falta de pago
10. Upgrade confirmado
11. Downgrade programado
12. Cancelación confirmada
13. Reactivación exitosa

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1 - Base de Datos y Backend (2-3 días)**
1. Crear tablas en Supabase
2. Crear políticas RLS
3. Funciones de validación de límites
4. Middleware de suscripciones

### **Fase 2 - Integración Wompi (2-3 días)**
1. Configurar cuenta Wompi (test y producción)
2. Implementar generación de link de pago
3. Endpoint para webhooks
4. Procesar estados de pago

### **Fase 3 - UI/UX (3-4 días)**
1. Página de precios
2. Dashboard de suscripción
3. Proceso de checkout
4. Modales y banners

### **Fase 4 - Lógica de Negocio (2 días)**
1. Sistema de trials
2. Upgrade/Downgrade
3. Período de gracia
4. Cancelaciones

### **Fase 5 - Notificaciones (1-2 días)**
1. Plantillas de email
2. Sistema de cron jobs para recordatorios
3. Webhooks de Wompi

### **Fase 6 - Testing (2-3 días)**
1. Testing de flujos de pago
2. Testing de límites
3. Testing de webhooks
4. Testing de edge cases

**Total estimado: 12-17 días de desarrollo**

---

## 💰 PROYECCIÓN DE INGRESOS

### **Escenario Conservador (6 meses):**
- 50 usuarios plan Profesional = $3.000.000 COP/mes
- 10 usuarios plan Empresarial = $1.500.000 COP/mes
- **Total MRR: $4.500.000 COP/mes** (~$1,080 USD)
- **ARR: $54.000.000 COP/año** (~$12,960 USD)

### **Escenario Optimista (1 año):**
- 200 usuarios plan Profesional = $12.000.000 COP/mes
- 30 usuarios plan Empresarial = $4.500.000 COP/mes
- 5 usuarios plan Custom = $1.500.000 COP/mes
- **Total MRR: $18.000.000 COP/mes** (~$4,320 USD)
- **ARR: $216.000.000 COP/año** (~$51,840 USD)

---

## 🎨 PÁGINAS NUEVAS

### **1. `/pricing`** - Página pública de planes
- Comparación de planes
- FAQ sobre suscripciones
- Calculadora de ahorro anual

### **2. `/dashboard/subscription`** - Gestión de suscripción
- Plan actual
- Uso/límites (barras de progreso)
- Historial de pagos
- Método de pago
- Upgrade/Downgrade
- Cancelar suscripción

### **3. `/subscription/checkout`** - Proceso de pago
- Resumen del plan
- Formulario de Wompi
- Términos y condiciones

### **4. `/subscription/success`** - Confirmación
- Mensaje de éxito
- Detalles de la suscripción
- Próximo cobro

### **5. Modales/Banners:**
- **UpgradeModal** - "Has alcanzado el límite de X"
- **TrialBanner** - "Te quedan X días de prueba"
- **PaymentFailedBanner** - "Tu pago falló, actualiza método"

---

## 🛡️ SEGURIDAD Y VALIDACIONES

### **Validar Webhooks de Wompi:**
```javascript
// Verificar firma del webhook
const signature = req.headers['x-wompi-signature'];
const isValid = verifyWompiSignature(signature, payload, WOMPI_EVENTS_SECRET);
```

### **Prevenir Fraude:**
- Máximo 3 trials por email
- Máximo 5 trials por IP
- Validar tarjeta antes de trial
- Bloquear emails temporales

### **Logs y Auditoría:**
- Registrar todos los cambios de suscripción
- Logs de webhooks recibidos
- Intentos de pago fallidos

---

## 📊 MÉTRICAS Y ANALYTICS

### **Dashboard Administrativo:**
- MRR (Monthly Recurring Revenue)
- Churn rate
- Conversión de trial a pago
- Plan más popular
- Lifetime value por cliente
- Razones de cancelación

---

## ⚙️ DATOS SEED DE PLANES

```javascript
const plans = [
  {
    name: "Gratis",
    slug: "free",
    price_monthly: 0,
    max_organizations: 1,
    max_users_per_org: 1,
    max_products: 20,
    max_sales_per_month: 50,
    features: ["inventory", "basic_reports", "quick_sale"],
    display_order: 1
  },
  {
    name: "Profesional",
    slug: "professional",
    price_monthly: 60000,
    price_yearly: 600000,
    max_organizations: 1,
    max_users_per_org: 10,
    features: ["everything_free", "team_management", "advanced_reports", "export_data"],
    display_order: 2
  },
  {
    name: "Empresarial",
    slug: "enterprise",
    price_monthly: 150000,
    price_yearly: 1500000,
    max_organizations: 5,
    features: ["everything_professional", "multi_branch", "unlimited_users", "api_access"],
    display_order: 3
  }
];
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos
- [ ] Crear tabla `subscription_plans`
- [ ] Crear tabla `subscriptions`
- [ ] Crear tabla `payments`
- [ ] Crear tabla `usage_tracking`
- [ ] Modificar tabla `organizations`
- [ ] Configurar RLS policies
- [ ] Insertar datos seed de planes

### Backend
- [ ] Hook `useSubscription`
- [ ] Constante `subscriptionFeatures.js`
- [ ] Middleware de validación
- [ ] Endpoint webhook Wompi
- [ ] Funciones de límites

### Frontend
- [ ] Componente `UpgradePrompt`
- [ ] Componente `FeatureGuard`
- [ ] Componente `UsageBanner`
- [ ] Página `/pricing`
- [ ] Página `/subscription`
- [ ] Página `/checkout`
- [ ] Integrar validaciones en componentes existentes

### Integraciones
- [ ] Configurar Wompi (test)
- [ ] Configurar Wompi (prod)
- [ ] Sistema de emails transaccionales
- [ ] Cron jobs para trials y recordatorios

### Testing
- [ ] Test de límites
- [ ] Test de upgrade/downgrade
- [ ] Test de webhooks
- [ ] Test de período de gracia
- [ ] Test de cancelación

---

**Última actualización:** 10 de noviembre de 2025
