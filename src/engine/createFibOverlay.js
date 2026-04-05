import { buildDomainPoint, buildLineDashPattern, clamp, resolveFibLevelY, toRgba } from '../core/fibMath';
import { FIB_DRAWING_TYPES, normalizeFibDrawings, normalizeFibToolConfigs } from '../core/fibDrawings';
import { resolvePriceSnapStep, snapToStep } from '../core/snapMath';

const LABEL_COLORS = {
  bg: 'rgba(11, 14, 19, 0.74)',
  text: '#e2e8f0',
};

function createCanvas(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fib-overlay-canvas';
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);
  return canvas;
}

function createDrawingId(type) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${type}-${Date.now()}-${suffix}`;
}

export function createFibOverlay({ container, chart, series, initialDrawings = [], onDrawingsChange }) {
  const canvas = createCanvas(container);
  const ctx = canvas.getContext('2d');

  let frameId = 0;
  let disposed = false;
  let isFrameQueued = false;
  let needsRender = true;
  let pendingPointerEvent = null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasDpr = 0;
  let activeTool = null;
  let toolConfigs = normalizeFibToolConfigs();
  let drawings = normalizeFibDrawings(initialDrawings);
  let draftDrawing = null;

  const resizeObserver = new ResizeObserver(() => {
    syncCanvasSize();
    scheduleRender();
  });

  const onTimeScaleChange = () => {
    scheduleRender();
  };

  function syncCanvasSize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    if (width === canvasWidth && height === canvasHeight && dpr === canvasDpr) {
      return;
    }

    canvasWidth = width;
    canvasHeight = height;
    canvasDpr = dpr;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function emitDrawingsChange() {
    onDrawingsChange?.(drawings);
  }

  function toCanvasPoint(anchor) {
    if (!anchor) return null;

    const x = chart.timeScale().timeToCoordinate(anchor.time);
    const y = series.priceToCoordinate(anchor.price);

    if (x == null || y == null || Number.isNaN(x) || Number.isNaN(y)) {
      return null;
    }

    return { x, y };
  }

  function toDomainPoint(x, y) {
    const clampedX = clamp(x, 0, canvas.clientWidth);
    const clampedY = clamp(y, 0, canvas.clientHeight);

    const timeScale = chart.timeScale();
    const logical = timeScale.coordinateToLogical?.(clampedX);
    const snappedLogical = Number.isFinite(logical) ? Math.round(logical) : null;
    const snappedX =
      snappedLogical == null ? clampedX : (timeScale.logicalToCoordinate?.(snappedLogical) ?? clampedX);

    const time = timeScale.coordinateToTime(snappedX);
    const rawPrice = series.coordinateToPrice(clampedY);

    if (time == null || rawPrice == null || Number.isNaN(rawPrice)) {
      return null;
    }

    const visibleRange = series.priceScale().getVisibleRange?.();
    const priceStep = resolvePriceSnapStep({
      minPrice: visibleRange?.from ?? rawPrice,
      maxPrice: visibleRange?.to ?? rawPrice,
    });
    const snappedPrice = snapToStep(rawPrice, priceStep);

    return buildDomainPoint(time, snappedPrice);
  }

  function drawLabel(text, x, y) {
    ctx.font = '12px Inter, system-ui, sans-serif';
    const paddingX = 6;
    const paddingY = 3;

    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 18;

    ctx.fillStyle = LABEL_COLORS.bg;
    ctx.fillRect(x, y - boxHeight + paddingY, boxWidth, boxHeight);

    ctx.fillStyle = LABEL_COLORS.text;
    ctx.fillText(text, x + paddingX, y);
  }

  function drawAnchors(start, end, color) {
    [start, end].forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(11, 14, 19, 0.92)';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = color;
      ctx.stroke();
    });
  }

  function drawFibPrice(drawing, start, end) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const deltaY = end.y - start.y;
    const lineColor = toRgba(drawing.config.color, drawing.config.opacity);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineColor;
    ctx.setLineDash(buildLineDashPattern(drawing.config.lineStyle));

    drawing.config.levels.forEach((level) => {
      const y = resolveFibLevelY(start.y, deltaY, level);
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();

      if (drawing.config.showLabels) {
        drawLabel(`${(level * 100).toFixed(1)}%`, maxX + 8, y + 4);
      }
    });

    ctx.restore();
    drawAnchors(start, end, lineColor);
  }

  function drawFibTime(drawing, start, end) {
    const spanX = end.x - start.x;
    const lineColor = toRgba(drawing.config.color, drawing.config.opacity);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineColor;

    drawing.config.levels.forEach((level) => {
      const x = end.x + spanX * level;
      if (x < 0 || x > canvas.clientWidth) {
        return;
      }

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.clientHeight);
      ctx.stroke();

      if (drawing.config.showLabels) {
        drawLabel(`${level.toFixed(3)}x`, x + 4, 18);
      }
    });

    ctx.restore();
    drawAnchors(start, end, lineColor);
  }

  function drawDrawing(drawing) {
    const start = toCanvasPoint(drawing.anchors[0]);
    const end = toCanvasPoint(drawing.anchors[1]);

    if (!start || !end) {
      return;
    }

    if (drawing.type === FIB_DRAWING_TYPES.FIB_PRICE) {
      drawFibPrice(drawing, start, end);
      return;
    }

    if (drawing.type === FIB_DRAWING_TYPES.FIB_TIME) {
      drawFibTime(drawing, start, end);
    }
  }

  function updateDraftFromPointer() {
    if (!draftDrawing || !pendingPointerEvent) {
      return;
    }

    const point = toDomainPoint(pendingPointerEvent.x, pendingPointerEvent.y);
    pendingPointerEvent = null;

    if (!point) {
      return;
    }

    draftDrawing = {
      ...draftDrawing,
      anchors: [draftDrawing.anchors[0], point],
    };
    needsRender = true;
  }

  function render() {
    if (disposed) {
      return;
    }

    needsRender = false;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    drawings.forEach(drawDrawing);
    if (draftDrawing) {
      drawDrawing(draftDrawing);
    }
  }

  function flushFrame() {
    isFrameQueued = false;
    if (disposed) {
      return;
    }

    updateDraftFromPointer();
    if (!needsRender) {
      return;
    }

    render();
  }

  function scheduleRender() {
    needsRender = true;
    if (disposed || isFrameQueued) {
      return;
    }

    isFrameQueued = true;
    frameId = window.requestAnimationFrame(flushFrame);
  }

  function onPointerDown(event) {
    if (!activeTool) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point = toDomainPoint(x, y);

    if (!point) {
      return;
    }

    if (!draftDrawing) {
      draftDrawing = {
        id: createDrawingId(activeTool),
        type: activeTool,
        anchors: [point, point],
        config: { ...toolConfigs[activeTool] },
      };
      canvas.style.cursor = 'crosshair';
      scheduleRender();
      return;
    }

    draftDrawing = {
      ...draftDrawing,
      anchors: [draftDrawing.anchors[0], point],
    };

    drawings = [...drawings, draftDrawing];
    draftDrawing = null;
    emitDrawingsChange();
    scheduleRender();
  }

  function onPointerMove(event) {
    if (!activeTool || !draftDrawing) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    pendingPointerEvent = { x, y };
    scheduleRender();
  }

  function applyInteractivityState() {
    canvas.style.pointerEvents = activeTool ? 'auto' : 'none';
    canvas.style.cursor = activeTool ? 'crosshair' : 'default';
  }

  syncCanvasSize();
  resizeObserver.observe(container);
  chart.timeScale().subscribeVisibleLogicalRangeChange(onTimeScaleChange);
  chart.timeScale().subscribeVisibleTimeRangeChange(onTimeScaleChange);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);

  applyInteractivityState();
  scheduleRender();

  return {
    setDrawingTool(nextTool) {
      activeTool = nextTool;
      draftDrawing = null;
      pendingPointerEvent = null;
      applyInteractivityState();
      scheduleRender();
    },
    setToolConfigs(nextConfigs) {
      toolConfigs = normalizeFibToolConfigs(nextConfigs);
      scheduleRender();
    },
    setDrawings(nextDrawings) {
      drawings = normalizeFibDrawings(nextDrawings);
      draftDrawing = null;
      scheduleRender();
    },
    destroy() {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onTimeScaleChange);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(onTimeScaleChange);

      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);

      canvas.remove();
    },
  };
}
