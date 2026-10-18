import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DemoBadge } from '../common/DemoBanner';
import { ChartSkeleton } from '../common/LoadingSkeleton';
import { ErrorMessage } from '../common/ErrorMessage';
import { EmptyState } from '../common/EmptyState';

/**
 * Custom Tooltip with dark navy styling and high contrast
 */
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload || {};
  const isPeak = dataPoint.is_peak;
  const exceedsThreshold = dataPoint.predicted_kw > dataPoint.threshold_q95;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-time">{label || dataPoint.display_time}</span>
        {isPeak && <span className="tooltip-peak-tag">Peak Forecast</span>}
      </div>

      <div className="tooltip-body">
        {dataPoint.actual_kw != null && (
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ backgroundColor: '#2DD4BF' }} />
            <span className="tooltip-label">Observed Demand:</span>
            <strong className="tooltip-val">{dataPoint.actual_kw} kW</strong>
          </div>
        )}

        {dataPoint.predicted_kw != null && (
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ backgroundColor: '#A78BFA' }} />
            <span className="tooltip-label">Predicted Demand:</span>
            <strong className="tooltip-val">{dataPoint.predicted_kw} kW</strong>
          </div>
        )}

        {dataPoint.threshold_q95 != null && (
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ backgroundColor: '#F59E0B' }} />
            <span className="tooltip-label">95th Percentile (q95):</span>
            <strong className="tooltip-val">{dataPoint.threshold_q95} kW</strong>
          </div>
        )}

        {exceedsThreshold && (
          <div className="tooltip-alert">
            ⚠️ Forecast exceeds historical 95th percentile threshold
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Observed vs Predicted Demand Line Chart
 */
export function DemandChart({
  data = [],
  loading = false,
  error = null,
  onRetry,
}) {
  // Identify peak forecast hour
  const { chartData, peakHour, peakKw, q95Threshold } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], peakHour: null, peakKw: null, q95Threshold: 590 };
    }

    let maxKw = -Infinity;
    let peakH = null;
    let avgQ95 = 590;

    data.forEach((item) => {
      if (item.predicted_kw > maxKw) {
        maxKw = item.predicted_kw;
        peakH = item.hour;
      }
      if (item.threshold_q95) {
        avgQ95 = item.threshold_q95;
      }
    });

    const enriched = data.map((item) => ({
      ...item,
      is_peak: item.hour === peakH,
      label_hour: item.display_time || `${item.hour}:00`,
    }));

    return {
      chartData: enriched,
      peakHour: peakH,
      peakKw: maxKw,
      q95Threshold: avgQ95,
    };
  }, [data]);

  if (loading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="chart-card">
        <ErrorMessage
          title="Could not load demand forecast"
          message={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="chart-card">
        <EmptyState
          title="No forecast data"
          description="Telemetry for the selected window is not available."
        />
      </div>
    );
  }

  return (
    <section className="chart-card" aria-label="Electricity demand forecast chart">
      <div className="chart-card-header">
        <div className="chart-title-group">
          <h2 className="chart-title">Observed vs Predicted Demand (24h)</h2>
          <span className="chart-subtitle">
            Hourly demand telemetry (kW) vs machine learning forecast. Dashed line denotes 95th percentile historical threshold (q95).
          </span>
        </div>

        <div className="chart-header-actions">
          <DemoBadge />
          {peakKw && (
            <div className="peak-indicator-pill" title="Projected peak demand hour">
              <span className="peak-dot" />
              <span>Peak: <strong>{peakKw} kW</strong> at {peakHour}:00</span>
            </div>
          )}
        </div>
      </div>

      <div className="chart-container" style={{ width: '100%', height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 25, left: 5, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="label_hour"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#1e293b' }}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#1e293b' }}
              unit=" kW"
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomChartTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '13px' }}
              iconType="circle"
            />

            {/* Threshold Line (q95) */}
            <ReferenceLine
              y={q95Threshold}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `q95 Threshold (${q95Threshold} kW)`,
                fill: '#F59E0B',
                position: 'insideTopLeft',
                fontSize: 12,
              }}
            />

            {/* Observed Demand Line */}
            <Line
              type="monotone"
              dataKey="actual_kw"
              name="Observed (Actual kW)"
              stroke="#2DD4BF"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2DD4BF', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#2DD4BF', stroke: '#0B1220', strokeWidth: 2 }}
              connectNulls={false}
            />

            {/* Predicted Demand Line */}
            <Line
              type="monotone"
              dataKey="predicted_kw"
              name="Predicted (Forecast kW)"
              stroke="#A78BFA"
              strokeWidth={2.5}
              strokeDasharray="4 2"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return null;
                if (payload.hour === peakHour) {
                  return (
                    <g key={`peak-dot-${payload.hour}`}>
                      <circle cx={cx} cy={cy} r={6} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
                      <circle cx={cx} cy={cy} r={11} fill="none" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="3 3" />
                    </g>
                  );
                }
                return (
                  <circle
                    key={`dot-${payload.hour}`}
                    cx={cx}
                    cy={cy}
                    r={2.5}
                    fill="#A78BFA"
                  />
                );
              }}
              activeDot={{ r: 6, fill: '#A78BFA', stroke: '#0B1220', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer-note">
        <span className="note-icon" aria-hidden="true">💡</span>
        <span>
          <strong>Peak Hour Highlight:</strong> Hour {peakHour}:00 is highlighted with a red ring indicating projected maximum demand load of {peakKw} kW.
        </span>
      </div>
    </section>
  );
}
