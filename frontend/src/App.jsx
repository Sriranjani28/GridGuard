import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { USER_ROLES } from './constants';
import {
  getSummary,
  getForecast,
  getRisk,
  getAnomalies,
  getModelMetrics,
} from './services/api';
import { DemoBanner } from './components/common/DemoBanner';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SummaryCard } from './components/dashboard/SummaryCard';
import { DemandChart } from './components/dashboard/DemandChart';
import { RiskAlertPanel } from './components/dashboard/RiskAlertPanel';
import { AnomalyTable } from './components/dashboard/AnomalyTable';
import { PlaceholderView } from './components/placeholders/PlaceholderView';
import { CardSkeleton } from './components/common/LoadingSkeleton';
import { ErrorMessage } from './components/common/ErrorMessage';

function App() {
  // Navigation & operational state
  const [activeNav, setActiveNav] = useState('overview');
  const [activeRole, setActiveRole] = useState(USER_ROLES.ENGINEER);
  const [selectedDate, setSelectedDate] = useState('2026-10-17');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Data states
  const [summary, setSummary] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [risk, setRisk] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all dashboard data
  const [refreshIndex, setRefreshIndex] = useState(0);

  const handleRetry = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, forecastRes, riskRes, anomaliesRes, metricsRes] = await Promise.all([
          getSummary(selectedDate),
          getForecast(selectedDate),
          getRisk(selectedDate),
          getAnomalies(selectedDate),
          getModelMetrics(),
        ]);

        if (active) {
          setSummary(summaryRes);
          setForecast(forecastRes);
          setRisk(riskRes);
          setAnomalies(anomaliesRes);
          setModelMetrics(metricsRes);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || 'Failed to communicate with forecasting telemetry service.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
    };
  }, [selectedDate, refreshIndex]);

  // Render content according to active sidebar navigation
  const renderMainContent = () => {
    if (activeNav === 'performance' || activeNav === 'india-context') {
      return (
        <PlaceholderView
          viewId={activeNav}
          modelMetrics={modelMetrics}
        />
      );
    }

    if (activeNav === 'forecast') {
      return (
        <div className="section-view">
          <div className="section-intro">
            <div>
              <h2 className="section-intro-title">24-Hour Electricity Demand Forecast</h2>
              <p className="section-intro-desc">
                Observed feeder load versus projected machine learning demand trajectory (kW).
              </p>
            </div>
          </div>
          <DemandChart
            data={forecast}
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />
        </div>
      );
    }

    if (activeNav === 'risk') {
      return (
        <div className="section-view">
          <div className="section-intro">
            <div>
              <h2 className="section-intro-title">Overload Risk Matrix & Advisory</h2>
              <p className="section-intro-desc">
                Hourly explainable proxy risk index (0–100) and role-specific operational directives.
              </p>
            </div>
          </div>
          <RiskAlertPanel
            riskData={risk}
            summary={summary}
            activeRole={activeRole}
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />
        </div>
      );
    }

    if (activeNav === 'anomalies') {
      return (
        <div className="section-view">
          <div className="section-intro">
            <div>
              <h2 className="section-intro-title">Residual Telemetry & Voltage Anomalies</h2>
              <p className="section-intro-desc">
                Detected statistical outliers where forecast residual exceeds 3.0 standard deviations (|z| &gt; 3.0).
              </p>
            </div>
          </div>
          <AnomalyTable
            anomalies={anomalies}
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />
        </div>
      );
    }

    // Default: 'overview' dashboard view
    return (
      <>
        {/* Top 4 KPI Summary Cards */}
        <section className="summary-grid" aria-label="Key operational indicators">
          {loading && !summary ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : error && !summary ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ErrorMessage
                title="Could not load summary metrics"
                message={error}
                onRetry={handleRetry}
              />
            </div>
          ) : (
            <>
              {/* Card 1: Current Demand */}
              <SummaryCard
                title="Current Demand"
                value={summary?.current_kw ?? 530}
                unit="kW"
                subtitle={`Recorded at ${summary?.current_hour || '15:00'}`}
                icon="⚡"
                trend={{ direction: 'up', text: '+4.2% vs baseline' }}
              />

              {/* Card 2: Predicted Peak Demand */}
              <SummaryCard
                title="Predicted Peak Demand (24h)"
                value={summary?.predicted_peak_kw ?? 648}
                unit="kW"
                subtitle={`Projected at ${summary?.peak_hour || '19:00'}`}
                icon="📈"
                trend={{ direction: 'up', text: 'Crosses q95 threshold' }}
              />

              {/* Card 3: Demand Risk (Proxy Score) */}
              <SummaryCard
                title="Demand Risk (proxy score)"
                value={summary?.risk_score ?? 88}
                unit="/ 100"
                subtitle="Peak index across 24h window"
                icon="🛡️"
                isRisk
                riskBand={summary?.risk_band || 'High'}
                riskScore={summary?.risk_score ?? 88}
              />

              {/* Card 4: Anomalies Detected */}
              <SummaryCard
                title="Anomalies Detected"
                value={summary?.anomaly_count ?? 3}
                subtitle="Events with |z| > 3 or voltage dips"
                icon="⚠️"
                trend={{ direction: 'down', text: '1 voltage dip, 2 spikes' }}
              />
            </>
          )}
        </section>

        {/* Analytics Row: Demand Chart & Risk Alert Panel */}
        <div className="analytics-grid">
          <DemandChart
            data={forecast}
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />

          <RiskAlertPanel
            riskData={risk}
            summary={summary}
            activeRole={activeRole}
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />
        </div>

        {/* Telemetry Anomalies Table */}
        <AnomalyTable
          anomalies={anomalies}
          loading={loading}
          error={error}
          onRetry={handleRetry}
        />
      </>
    );
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Persistent Demo Banner */}
        <DemoBanner />

        {/* Header */}
        <Header
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isMobileNavOpen={isMobileNavOpen}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        {/* Content Body */}
        <main className="page-content" id="main-content">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
