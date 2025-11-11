import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  Building,
  Calendar,
  ArrowUp,
  ArrowDown,
  CreditCard,
  UserCheck,
  UserMinus,
  Package,
  ShoppingCart,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LottieLoader from '../components/LottieLoader';
import toast from 'react-hot-toast';
import './PlatformAnalytics.css';

const PlatformAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // month, quarter, year

  // Verificar que el usuario sea super admin (email específico)
  const isSuperAdmin = user?.email === 'juanjosegilarbelaez@gmail.com';

  useEffect(() => {
    if (isSuperAdmin) {
      loadAnalytics();
    }
  }, [selectedPeriod, isSuperAdmin]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [
        revenueData,
        subscriptionsData,
        organizationsData,
        usageData,
        cancellationsData
      ] = await Promise.all([
        fetchRevenueMetrics(),
        fetchSubscriptionMetrics(),
        fetchOrganizationMetrics(),
        fetchUsageMetrics(),
        fetchCancellationMetrics()
      ]);

      setAnalytics({
        revenue: revenueData,
        subscriptions: subscriptionsData,
        organizations: organizationsData,
        usage: usageData,
        cancellations: cancellationsData
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueMetrics = async () => {
    try {
      // MRR (Monthly Recurring Revenue)
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(price_monthly, price_yearly)
        `)
        .eq('status', 'active');

      const mrr = activeSubscriptions?.reduce((sum, sub) => {
        const price = sub.billing_cycle === 'monthly' 
          ? sub.plan.price_monthly 
          : sub.plan.price_yearly / 12;
        return sum + price;
      }, 0) || 0;

      const arr = mrr * 12;

      // Pagos del mes actual
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'completed');

      const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Calcular crecimiento (comparar con mes anterior)
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      const { data: lastMonthPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString())
        .eq('status', 'completed');

      const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      return {
        mrr,
        arr,
        monthlyRevenue,
        revenueGrowth,
        averageRevenuePerUser: activeSubscriptions?.length > 0 
          ? mrr / activeSubscriptions.length 
          : 0
      };
    } catch (error) {
      console.error('Error fetching revenue:', error);
      return { mrr: 0, arr: 0, monthlyRevenue: 0, revenueGrowth: 0, averageRevenuePerUser: 0 };
    }
  };

  const fetchSubscriptionMetrics = async () => {
    try {
      // Total de suscripciones activas por plan
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(name, slug)
        `);

      const byPlan = subscriptions?.reduce((acc, sub) => {
        const planName = sub.plan?.name || 'Unknown';
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
      }, {});

      // Nuevas suscripciones este mes
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { data: newSubscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .gte('created_at', startOfMonth.toISOString());

      // Calcular churn rate
      const { data: cancelledThisMonth } = await supabase
        .from('subscription_cancellations')
        .select('*')
        .gte('cancellation_date', startOfMonth.toISOString());

      const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
      const churnRate = activeCount > 0 
        ? (cancelledThisMonth?.length || 0) / activeCount * 100 
        : 0;

      // Tasa de conversión (free → paid)
      const { data: allOrgs } = await supabase
        .from('organizations')
        .select('subscription_id');

      const paidOrgs = allOrgs?.filter(o => o.subscription_id).length || 0;
      const conversionRate = allOrgs?.length > 0 
        ? (paidOrgs / allOrgs.length) * 100 
        : 0;

      return {
        total: subscriptions?.length || 0,
        active: activeCount,
        byPlan,
        newThisMonth: newSubscriptions?.length || 0,
        churnRate,
        conversionRate
      };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return { total: 0, active: 0, byPlan: {}, newThisMonth: 0, churnRate: 0, conversionRate: 0 };
    }
  };

  const fetchOrganizationMetrics = async () => {
    try {
      const { data: organizations } = await supabase
        .from('organizations')
        .select('*, created_at');

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const newThisMonth = organizations?.filter(
        o => new Date(o.created_at) >= startOfMonth
      ).length || 0;

      return {
        total: organizations?.length || 0,
        newThisMonth,
        withActiveSubscription: organizations?.filter(o => o.subscription_id).length || 0
      };
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return { total: 0, newThisMonth: 0, withActiveSubscription: 0 };
    }
  };

  const fetchUsageMetrics = async () => {
    try {
      // Total de productos en la plataforma
      const { count: totalProducts } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      // Total de ventas
      const { count: totalSales } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true });

      // Ventas de este mes
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { count: salesThisMonth } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', startOfMonth.toISOString());

      return {
        totalProducts: totalProducts || 0,
        totalSales: totalSales || 0,
        salesThisMonth: salesThisMonth || 0
      };
    } catch (error) {
      console.error('Error fetching usage:', error);
      return { totalProducts: 0, totalSales: 0, salesThisMonth: 0 };
    }
  };

  const fetchCancellationMetrics = async () => {
    try {
      const { data: cancellations } = await supabase
        .from('subscription_cancellations')
        .select('reason, cancellation_date')
        .order('cancellation_date', { ascending: false })
        .limit(10);

      // Agrupar motivos
      const reasonCounts = cancellations?.reduce((acc, c) => {
        if (c.reason) {
          acc[c.reason] = (acc[c.reason] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        total: cancellations?.length || 0,
        topReasons: reasonCounts || {},
        recent: cancellations || []
      };
    } catch (error) {
      console.error('Error fetching cancellations:', error);
      return { total: 0, topReasons: {}, recent: [] };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (!isSuperAdmin) {
    return (
      <div className="platform-analytics-denied">
        <motion.div
          className="denied-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Activity size={64} color="#EF4444" />
          <h2>Acceso Denegado</h2>
          <p>Esta página está disponible solo para administradores de la plataforma.</p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="platform-analytics-loading">
        <LottieLoader size="large" message="Cargando analytics..." />
      </div>
    );
  }

  return (
    <div className="platform-analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>
            <BarChart3 size={32} />
            Platform Analytics
          </h1>
          <p className="subtitle">Métricas globales de la plataforma</p>
        </div>

        <div className="period-selector">
          <button 
            className={selectedPeriod === 'month' ? 'active' : ''}
            onClick={() => setSelectedPeriod('month')}
          >
            Este Mes
          </button>
          <button 
            className={selectedPeriod === 'quarter' ? 'active' : ''}
            onClick={() => setSelectedPeriod('quarter')}
          >
            Trimestre
          </button>
          <button 
            className={selectedPeriod === 'year' ? 'active' : ''}
            onClick={() => setSelectedPeriod('year')}
          >
            Año
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {/* Revenue Metrics */}
        <section className="metrics-section">
          <h2>
            <DollarSign size={24} />
            Ingresos
          </h2>
          
          <div className="metrics-grid">
            <motion.div 
              className="metric-card highlight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="metric-header">
                <span className="metric-label">MRR</span>
                <TrendingUp size={20} color="#10B981" />
              </div>
              <div className="metric-value">{formatCurrency(analytics.revenue.mrr)}</div>
              <div className="metric-footer">
                <span className={analytics.revenue.revenueGrowth >= 0 ? 'positive' : 'negative'}>
                  {analytics.revenue.revenueGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {formatPercentage(analytics.revenue.revenueGrowth)}
                </span>
                <span className="metric-sublabel">vs mes anterior</span>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="metric-header">
                <span className="metric-label">ARR</span>
                <Target size={20} />
              </div>
              <div className="metric-value">{formatCurrency(analytics.revenue.arr)}</div>
              <div className="metric-footer">
                <span className="metric-sublabel">Ingreso anual proyectado</span>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="metric-header">
                <span className="metric-label">ARPU</span>
                <UserCheck size={20} />
              </div>
              <div className="metric-value">{formatCurrency(analytics.revenue.averageRevenuePerUser)}</div>
              <div className="metric-footer">
                <span className="metric-sublabel">Ingreso promedio por usuario</span>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="metric-header">
                <span className="metric-label">Ingresos del Mes</span>
                <CreditCard size={20} />
              </div>
              <div className="metric-value">{formatCurrency(analytics.revenue.monthlyRevenue)}</div>
              <div className="metric-footer">
                <span className="metric-sublabel">Pagos completados</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Subscription Metrics */}
        <section className="metrics-section">
          <h2>
            <Users size={24} />
            Suscripciones
          </h2>

          <div className="metrics-grid">
            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="metric-header">
                <span className="metric-label">Suscripciones Activas</span>
                <Zap size={20} />
              </div>
              <div className="metric-value">{analytics.subscriptions.active}</div>
              <div className="metric-footer">
                <span className="metric-highlight">{analytics.subscriptions.newThisMonth} nuevas</span>
                <span className="metric-sublabel">este mes</span>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="metric-header">
                <span className="metric-label">Tasa de Conversión</span>
                <Target size={20} />
              </div>
              <div className="metric-value">{analytics.subscriptions.conversionRate.toFixed(1)}%</div>
              <div className="metric-footer">
                <span className="metric-sublabel">Free → Paid</span>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card warning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="metric-header">
                <span className="metric-label">Churn Rate</span>
                <UserMinus size={20} />
              </div>
              <div className="metric-value">{analytics.subscriptions.churnRate.toFixed(1)}%</div>
              <div className="metric-footer">
                <span className="metric-sublabel">Cancelaciones del mes</span>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="metric-header">
                <span className="metric-label">Organizaciones</span>
                <Building size={20} />
              </div>
              <div className="metric-value">{analytics.organizations.total}</div>
              <div className="metric-footer">
                <span className="metric-highlight">{analytics.organizations.newThisMonth} nuevas</span>
                <span className="metric-sublabel">este mes</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Subscription Distribution */}
        <section className="metrics-section">
          <h2>
            <PieChart size={24} />
            Distribución por Plan
          </h2>

          <div className="plan-distribution">
            {Object.entries(analytics.subscriptions.byPlan).map(([plan, count], index) => {
              const percentage = (count / analytics.subscriptions.total) * 100;
              return (
                <motion.div
                  key={plan}
                  className="plan-bar"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="plan-bar-header">
                    <span className="plan-name">{plan}</span>
                    <span className="plan-count">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="plan-bar-track">
                    <motion.div
                      className="plan-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      style={{
                        background: plan === 'Empresarial' 
                          ? 'linear-gradient(90deg, #10B981, #059669)'
                          : plan === 'Profesional'
                            ? 'linear-gradient(90deg, #8B5CF6, #7C3AED)'
                            : 'linear-gradient(90deg, #6B7280, #4B5563)'
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Platform Usage */}
        <section className="metrics-section">
          <h2>
            <Activity size={24} />
            Uso de la Plataforma
          </h2>

          <div className="metrics-grid">
            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="metric-header">
                <span className="metric-label">Total Productos</span>
                <Package size={20} />
              </div>
              <div className="metric-value">{analytics.usage.totalProducts.toLocaleString()}</div>
              <div className="metric-footer">
                <span className="metric-sublabel">En toda la plataforma</span>
              </div>
            </motion.div>

            <motion.div 
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="metric-header">
                <span className="metric-label">Total Ventas</span>
                <ShoppingCart size={20} />
              </div>
              <div className="metric-value">{analytics.usage.totalSales.toLocaleString()}</div>
              <div className="metric-footer">
                <span className="metric-highlight">{analytics.usage.salesThisMonth.toLocaleString()} este mes</span>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlatformAnalytics;
