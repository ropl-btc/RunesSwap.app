import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import usePriceChart from '@/hooks/usePriceChart';
import {
  formatDate,
  formatNumberWithLocale,
  formatTime,
} from '@/utils/formatters';
import styles from '../layout/AppInterface.module.css';
import { Loading } from '@/components/loading';
import PriceTooltip from './PriceTooltip';
import TimeframeSelector from './TimeframeSelector';
// Path to hourglass icon used while BTC price is loading
const HOURGLASS_SRC = '/icons/windows_hourglass.png';

interface PriceChartProps {
  assetName: string;
  timeFrame?: '24h' | '7d' | '30d' | '90d' | undefined;
  onClose?: (() => void) | undefined;
  btcPriceUsd: number | undefined; // BTC price in USD
}

const PriceChart: React.FC<PriceChartProps> = ({
  assetName,
  timeFrame = '24h',
  onClose,
  btcPriceUsd,
}) => {
  const [btcPriceLoadingTimeout, setBtcPriceLoadingTimeout] = useState(false);

  const {
    selectedTimeframe,
    setSelectedTimeframe,
    showTooltip,
    setShowTooltip,
    filteredPriceData,
    startTime,
    endTime,
    getCustomTicks,
    isLoading,
    isError,
  } = usePriceChart(assetName, timeFrame);

  useEffect(() => {
    if (btcPriceUsd === undefined) {
      const timer = setTimeout(() => setBtcPriceLoadingTimeout(true), 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
    setBtcPriceLoadingTimeout(false);
    return undefined; // Explicit return for the else path
  }, [btcPriceUsd]);

  // If BTC price is not available, show loading spinner
  if (btcPriceUsd === undefined) {
    return (
      <div
        className={styles.priceChartInner}
        style={{
          position: 'relative',
          width: '100%',
          height: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          src={HOURGLASS_SRC}
          alt="Loading..."
          width={48}
          height={48}
          style={{ marginRight: 12 }}
        />
        <span
          style={{ fontSize: '1.2rem', color: '#000080', fontWeight: 'bold' }}
        >
          {btcPriceLoadingTimeout
            ? 'Unable to load BTC price. Chart may be inaccurate.'
            : 'Loading BTC price...'}
        </span>
      </div>
    );
  }

  // Render the chart
  return (
    <div className={styles.priceChartInner}>
      <div>
        <div className={styles.priceChartHeader}>
          <h3 className={styles.priceChartTitle}>{assetName} Price</h3>
          <PriceTooltip show={showTooltip} setShow={setShowTooltip} />
        </div>
        <div style={{ position: 'relative', width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={filteredPriceData}
              margin={{ top: 30, right: 10, left: 0, bottom: 25 }}
            >
              <CartesianGrid stroke="#C0C0C0" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={[
                  startTime?.getTime() || 'dataMin',
                  endTime?.getTime() || 'dataMax',
                ]}
                ticks={getCustomTicks}
                tickFormatter={(ts) => {
                  const date = new Date(ts);
                  switch (selectedTimeframe) {
                    case '24h':
                      // Show HH:00 format for 24 hour view
                      return `${date.getHours()}:00`;
                    case '7d':
                      // Show day and month for 7d view
                      return formatDate(date, {
                        month: 'numeric',
                        day: 'numeric',
                      });
                    case '30d':
                    case '90d':
                      return formatDate(date, {
                        month: 'short',
                        day: 'numeric',
                      });
                    default:
                      return formatDate(date);
                  }
                }}
                tick={{ fill: '#000', fontSize: 10 }}
                axisLine={{ stroke: '#000' }}
                tickLine={{ stroke: '#000' }}
                minTickGap={15}
              />
              <YAxis
                dataKey="price"
                tickFormatter={(v) => formatNumberWithLocale(v) + ' sats'}
                tick={{ fill: '#000', fontSize: 10 }}
                axisLine={{ stroke: '#000' }}
                tickLine={{ stroke: '#000' }}
                width={80}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #000080',
                  fontSize: 12,
                }}
                labelFormatter={(ts) => {
                  const date = new Date(ts as number);
                  // Snap to last full hour
                  date.setMinutes(0, 0, 0);
                  const time = formatTime(date, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });
                  const day = formatDate(date);
                  return `${time} · ${day}`;
                }}
                formatter={(value: number) => {
                  // value is sats
                  const usd = btcPriceUsd ? (value / 1e8) * btcPriceUsd : null;
                  return [
                    `${formatNumberWithLocale(value)} sats`,
                    usd !== null
                      ? `≈ $${formatNumberWithLocale(usd, { maximumFractionDigits: 6 })}`
                      : '',
                  ];
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#000080"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Show message when chart data is not available */}
          {!isLoading && filteredPriceData.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(240, 240, 240, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#000080',
                textShadow: '1px 1px 2px white',
              }}
            >
              Price Chart Not Available
            </div>
          )}

          {/* Show loading indicator */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(240, 240, 240, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Loading variant="progress" message="Loading chart data..." />
            </div>
          )}

          {/* Show error message */}
          {isError && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(240, 240, 240, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#CC0000',
                textShadow: '1px 1px 2px white',
              }}
            >
              Error loading price data
            </div>
          )}
        </div>
        <TimeframeSelector
          timeframe={selectedTimeframe}
          onChange={setSelectedTimeframe}
        />
      </div>

      {/* Collapse Chart button */}
      <button className={styles.collapseChartButton} onClick={onClose}>
        Collapse Price Chart
      </button>
    </div>
  );
};

export default PriceChart;
