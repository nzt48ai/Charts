import { useEffect, useMemo, useRef } from 'react';

function normalizeTimestamp(epochMillis, intervalSeconds) {
  const epochSeconds = Math.floor(epochMillis / 1000);
  return Math.floor(epochSeconds / intervalSeconds) * intervalSeconds;
}

function priceFromPayload(payload) {
  if (typeof payload.last === 'number') {
    return payload.last;
  }

  if (typeof payload.price === 'number') {
    return payload.price;
  }

  if (typeof payload.bid === 'number' && typeof payload.ask === 'number') {
    return (payload.bid + payload.ask) / 2;
  }

  return null;
}

function updateCandles(candlesRef, nextPrice, epochMillis, intervalSeconds) {
  const candles = candlesRef.current;

  if (candles.length === 0) {
    const time = normalizeTimestamp(epochMillis, intervalSeconds);
    const seedCandle = { time, open: nextPrice, high: nextPrice, low: nextPrice, close: nextPrice };
    candles.push(seedCandle);
    return seedCandle;
  }

  const lastCandle = candles[candles.length - 1];
  const bucketTime = normalizeTimestamp(epochMillis, intervalSeconds);

  if (lastCandle.time !== bucketTime) {
    const nextCandle = { time: bucketTime, open: lastCandle.close, high: nextPrice, low: nextPrice, close: nextPrice };
    candles.push(nextCandle);
    return nextCandle;
  }

  lastCandle.high = Math.max(lastCandle.high, nextPrice);
  lastCandle.low = Math.min(lastCandle.low, nextPrice);
  lastCandle.close = nextPrice;

  return { ...lastCandle };
}

export function useTradovateMarketData(chartApiRef, { seedData = [], symbol = 'ESM6', intervalSeconds = 60 } = {}) {
  const candlesRef = useRef(seedData.map((candle) => ({ ...candle })));
  const socketRef = useRef(null);

  const config = useMemo(
    () => ({
      endpoint: import.meta.env.VITE_TRADOVATE_MD_URL ?? 'wss://md.tradovateapi.com/v1/websocket',
      token: import.meta.env.VITE_TRADOVATE_ACCESS_TOKEN,
      symbol: import.meta.env.VITE_TRADOVATE_SYMBOL ?? symbol,
      intervalSeconds,
    }),
    [intervalSeconds, symbol]
  );

  useEffect(() => {
    let isDisposed = false;
    let initTimer = null;

    const initializeStream = () => {
      if (isDisposed || socketRef.current || !chartApiRef.current?.isReady()) {
        return;
      }

      chartApiRef.current.setData(candlesRef.current);
      chartApiRef.current.fitContent();

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
          const quotePayload = payload?.d ?? payload;
          const nextPrice = priceFromPayload(quotePayload);

          if (nextPrice === null) {
            return;
          }

          const ts = quotePayload.timestamp ?? quotePayload.time ?? Date.now();
          const candleUpdate = updateCandles(candlesRef, nextPrice, Number(ts), config.intervalSeconds);

          chartApiRef.current?.update(candleUpdate);
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
  }, [chartApiRef, config]);

  return { candlesRef, socketRef };
}
