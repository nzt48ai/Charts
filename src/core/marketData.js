export function priceFromQuotePayload(payload) {
  if (typeof payload?.last === 'number') {
    return payload.last;
  }

  if (typeof payload?.price === 'number') {
    return payload.price;
  }

  if (typeof payload?.bid === 'number' && typeof payload?.ask === 'number') {
    return (payload.bid + payload.ask) / 2;
  }

  return null;
}

export function extractQuotePayload(rawPayload) {
  return rawPayload?.d ?? rawPayload;
}

export function resolveQuoteTimestamp(payload, fallback = Date.now()) {
  return payload?.timestamp ?? payload?.time ?? fallback;
}
