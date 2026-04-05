import { useEffect, useMemo, useRef } from 'react';
import { createCandleEngine } from '../core/candleEngine';
import { extractQuotePayload, priceFromQuotePayload, resolveQuoteTimestamp } from '../core/marketData';

const MAX_TICK_BUFFER_SIZE = 12000;

export function useTradovateMarketData(chartApiRef, { seedData = [], symbol = 'ESM6', timeframe = '1m' } = {}) {
  const candleEngineRef = useRef(createCandleEngine({ timeframe, seedCandles: seedData }));
  const socketRef = useRef(null);
  const tickBufferRef = useRef([]);
  const hasAppliedInitialFitRef = useRef(false);

  const config = useMemo(
    () => ({
      endpoint: import.meta.env.VITE_TRADOVATE_MD_URL ?? 'wss://md.tradovateapi.com/v1/websocket',
      token: import.meta.env.VITE_TRADOVATE_ACCESS_TOKEN,
      symbol: import.meta.env.VITE_TRADOVATE_SYMBOL ?? symbol,
      timeframe,
    }),
    [symbol, timeframe]
  );

  useEffect(() => {
    tickBufferRef.current = [];
  }, [config.symbol]);

  useEffect(() => {
    const chartApi = chartApiRef.current;
    const rebuiltCandles = candleEngineRef.current.reset({
      timeframe: config.timeframe,
      seedCandles: seedData,
    });

    for (const tick of tickBufferRef.current) {
      candleEngineRef.current.upsertFromTick(tick);
    }

    if (!chartApi?.isReady()) {
      return;
    }

    const visibleRange = chartApi.getVisibleLogicalRange?.();
    chartApi.setData(candleEngineRef.current.getCandles() ?? rebuiltCandles);

    if (visibleRange) {
      chartApi.setVisibleLogicalRange?.(visibleRange);
      return;
    }

    if (!hasAppliedInitialFitRef.current) {
      chartApi.fitContent();
      hasAppliedInitialFitRef.current = true;
    }
  }, [chartApiRef, config.symbol, config.timeframe, seedData]);

  useEffect(() => {
    let isDisposed = false;
    let initTimer = null;

    const initializeStream = () => {
      if (isDisposed || socketRef.current || !chartApiRef.current?.isReady()) {
        return;
      }

      chartApiRef.current.setData(candleEngineRef.current.getCandles());

      if (!config.token) {
        console.warn('Tradovate market data stream disabled: set VITE_TRADOVATE_ACCESS_TOKEN.');
        return;
      }

      const wsUrl = `${config.endpoint}?accessToken=${encodeURIComponent(config.token)}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        socket.send(
          JSON.stringify({
            e: 'md/subscribeQuote',
            d: {
              symbol: config.symbol,
            },
          })
        );
      });

      socket.addEventListener('message', (event) => {
        if (isDisposed) {
          return;
        }

        try {
          const payload = JSON.parse(event.data);
          const quotePayload = extractQuotePayload(payload);
          const nextPrice = priceFromQuotePayload(quotePayload);

          if (nextPrice === null) {
            return;
          }

          const tick = {
            price: nextPrice,
            timestamp: Number(resolveQuoteTimestamp(quotePayload)),
          };

          tickBufferRef.current.push(tick);

          if (tickBufferRef.current.length > MAX_TICK_BUFFER_SIZE) {
            tickBufferRef.current.shift();
          }

          const candleUpdate = candleEngineRef.current.upsertFromTick(tick);

          if (candleUpdate) {
            chartApiRef.current?.update(candleUpdate);
          }
        } catch (error) {
          console.warn('Unable to parse Tradovate market data payload.', error);
        }
      });

      socket.addEventListener('error', (error) => {
        console.error('Tradovate market data WebSocket error:', error);
      });
    };

    initializeStream();
    initTimer = setInterval(initializeStream, 100);

    return () => {
      isDisposed = true;
      clearInterval(initTimer);

      if (socketRef.current && socketRef.current.readyState <= 1) {
        socketRef.current.close();
      }

      socketRef.current = null;
    };
  }, [chartApiRef, config.endpoint, config.symbol, config.token]);

  return { candleEngineRef, socketRef };
}
