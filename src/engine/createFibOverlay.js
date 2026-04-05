import { FIB_LEVELS, buildDomainPoint, clamp, resolveFibLevelY } from '../core/fibMath';

const COLORS = {
  line: '#f59e0b',
  level: 'rgba(245, 158, 11, 0.8)',
  labelBg: 'rgba(11, 14, 19, 0.75)',
  labelText: '#f9fafb',
  anchorFill: '#0b0e13',
  anchorStroke: '#f59e0b',
};

function createCanvas(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fib-overlay-canvas';
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);
  return canvas;
}

export function createFibOverlay({ container, chart, series }) {
  const canvas = createCanvas(container);
  const ctx = canvas.getContext('2d');

  let frameId = 0;
  let disposed = false;
  let activeAnchorIndex = null;

  const anchors = [null, null];

  const resizeObserver = new ResizeObserver(() => {
    syncCanvasSize();
  });

  function syncCanvasSize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    const time = chart.timeScale().coordinateToTime(clampedX);
    const price = series.coordinateToPrice(clampedY);

    if (time == null || price == null || Number.isNaN(price)) {
      return null;
    }

    return buildDomainPoint(time, price);
  }

  function ensureAnchors() {
    if (anchors[0] && anchors[1]) {
      return;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) {
      return;
    }

    const start = toDomainPoint(width * 0.3, height * 0.25);
    const end = toDomainPoint(width * 0.7, height * 0.75);

    if (!start || !end) {
      return;
    }

    anchors[0] = start;
    anchors[1] = end;
  }

  function findAnchorIndex(x, y) {
    const hitRadius = 12;

    for (let i = 0; i < anchors.length; i += 1) {
      const point = toCanvasPoint(anchors[i]);
      if (!point) continue;

      const dx = point.x - x;
      const dy = point.y - y;
      if (Math.hypot(dx, dy) <= hitRadius) {
        return i;
      }
    }

    return null;
  }

  function drawLabel(text, x, y) {
    ctx.font = '12px Inter, system-ui, sans-serif';
    const paddingX = 6;
    const paddingY = 3;

    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 18;

    ctx.fillStyle = COLORS.labelBg;
    ctx.fillRect(x, y - boxHeight + paddingY, boxWidth, boxHeight);

    ctx.fillStyle = COLORS.labelText;
    ctx.fillText(text, x + paddingX, y);
  }

  function drawFib(start, end) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const deltaY = end.y - start.y;

    ctx.strokeStyle = COLORS.level;
    ctx.lineWidth = 1;

    FIB_LEVELS.forEach((level) => {
      const y = resolveFibLevelY(start.y, deltaY, level);

      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();

      drawLabel(`${(level * 100).toFixed(1)}%`, maxX + 8, y + 4);
    });

    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    [start, end].forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.anchorFill;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.anchorStroke;
      ctx.stroke();
    });
  }

  function render() {
    if (disposed) {
      return;
    }

    ensureAnchors();

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    const start = toCanvasPoint(anchors[0]);
    const end = toCanvasPoint(anchors[1]);

    if (start && end) {
      drawFib(start, end);
    }

    frameId = window.requestAnimationFrame(render);
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const anchorIndex = findAnchorIndex(x, y);
    if (anchorIndex == null) {
      return;
    }

    activeAnchorIndex = anchorIndex;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (activeAnchorIndex == null) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const point = toDomainPoint(x, y);
    if (!point) {
      return;
    }

    anchors[activeAnchorIndex] = point;
  }

  function onPointerUp(event) {
    if (activeAnchorIndex == null) {
      return;
    }

    activeAnchorIndex = null;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  syncCanvasSize();
  resizeObserver.observe(container);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  frameId = window.requestAnimationFrame(render);

  return {
    destroy() {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);

      canvas.remove();
    },
  };
}
