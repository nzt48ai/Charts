import { buildDomainPoint, buildLineDashPattern, clamp, resolveFibLevelY, toRgba } from '../core/fibMath';
import {
  applyAxisConstraint,
  AXIS_LOCK,
  buildSelectionFromGroup,
  clampCanvasPoint,
  hitTestFibPrice,
  hitTestFibTime,
  hitTestHandle,
  resolveAxisLock,
  resolveMagnetRadius,
} from '../core/drawingInteraction';
import { FIB_DRAWING_TYPES, normalizeFibDrawings, normalizeFibToolConfigs, withNormalizedZOrder } from '../core/fibDrawings';
import { resolvePriceSnapStep, snapToStep } from '../core/snapMath';

const LABEL_COLORS = {
  bg: 'rgba(11, 14, 19, 0.74)',
  text: '#e2e8f0',
};

const HISTORY_LIMIT = 150;

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

function createGroupId() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `group-${Date.now()}-${suffix}`;
}

function cloneDrawings(sourceDrawings) {
  return sourceDrawings.map((drawing) => ({ ...drawing, anchors: drawing.anchors.map((anchor) => ({ ...anchor })) }));
}

function snapshotState(drawings) {
  return cloneDrawings(drawings);
}

export function createFibOverlay({
  container,
  chart,
  series,
  initialDrawings = [],
  initialMagnetStrength = 35,
  onDrawingsChange,
  onInteractionStateChange,
}) {
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
  let drawings = withNormalizedZOrder(normalizeFibDrawings(initialDrawings));
  let draftDrawing = null;
  let selectedIds = new Set();
  let hoveredHandle = null;
  let dragState = null;
  let snapPreview = null;
  let magnetStrength = clamp(Number(initialMagnetStrength) || 35, 0, 100);
  let candles = [];
  let historyPast = [];
  let historyFuture = [];

  const resizeObserver = new ResizeObserver(() => {
    syncCanvasSize();
    scheduleRender();
  });

  const onTimeScaleChange = () => {
    scheduleRender();
  };

  function emitInteractionState() {
    onInteractionStateChange?.({
      canUndo: historyPast.length > 0,
      canRedo: historyFuture.length > 0,
      selectedCount: selectedIds.size,
      magnetStrength,
      activeTool,
    });
  }

  function pushHistorySnapshot() {
    historyPast.push(snapshotState(drawings));
    if (historyPast.length > HISTORY_LIMIT) {
      historyPast = historyPast.slice(historyPast.length - HISTORY_LIMIT);
    }
    historyFuture = [];
    emitInteractionState();
  }

  function commitDrawings(nextDrawings, { pushHistory = true } = {}) {
    if (pushHistory) {
      pushHistorySnapshot();
    }
    drawings = withNormalizedZOrder(nextDrawings);
    onDrawingsChange?.(drawings);
    emitInteractionState();
    scheduleRender();
  }

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

  function toCanvasPoint(anchor) {
    if (!anchor) return null;

    const x = chart.timeScale().timeToCoordinate(anchor.time);
    const y = series.priceToCoordinate(anchor.price);

    if (x == null || y == null || Number.isNaN(x) || Number.isNaN(y)) {
      return null;
    }

    return { x, y };
  }

  function resolveSnapFromCandle(rawPrice, x) {
    if (!candles.length || magnetStrength <= 0) {
      return { price: rawPrice, preview: null };
    }

    const logical = chart.timeScale().coordinateToLogical?.(x);
    const candleIndex = clamp(Math.round(Number.isFinite(logical) ? logical : 0), 0, candles.length - 1);
    const candle = candles[candleIndex];
    if (!candle) {
      return { price: rawPrice, preview: null };
    }

    const points = [
      { label: 'O', price: candle.open },
      { label: 'H', price: candle.high },
      { label: 'L', price: candle.low },
      { label: 'C', price: candle.close },
    ];

    const nearest = points
      .map((point) => ({ ...point, y: series.priceToCoordinate(point.price) }))
      .filter((point) => point.y != null)
      .sort((a, b) => Math.abs(a.y - series.priceToCoordinate(rawPrice)) - Math.abs(b.y - series.priceToCoordinate(rawPrice)))[0];

    if (!nearest) {
      return { price: rawPrice, preview: null };
    }

    const rawY = series.priceToCoordinate(rawPrice);
    const distance = Math.abs(nearest.y - rawY);
    const radius = resolveMagnetRadius(magnetStrength);

    if (distance > radius) {
      return { price: rawPrice, preview: null };
    }

    return {
      price: nearest.price,
      preview: {
        x,
        y: nearest.y,
        label: nearest.label,
      },
    };
  }

  function toDomainPoint(x, y, { snapToCandle = false } = {}) {
    const clampedPoint = clampCanvasPoint({ x, y }, canvas.clientWidth, canvas.clientHeight);

    const timeScale = chart.timeScale();
    const logical = timeScale.coordinateToLogical?.(clampedPoint.x);
    const snappedLogical = Number.isFinite(logical) ? Math.round(logical) : null;
    const snappedX =
      snappedLogical == null ? clampedPoint.x : (timeScale.logicalToCoordinate?.(snappedLogical) ?? clampedPoint.x);

    const time = timeScale.coordinateToTime(snappedX);
    const rawPrice = series.coordinateToPrice(clampedPoint.y);

    if (time == null || rawPrice == null || Number.isNaN(rawPrice)) {
      return null;
    }

    const visibleRange = series.priceScale().getVisibleRange?.();
    const priceStep = resolvePriceSnapStep({
      minPrice: visibleRange?.from ?? rawPrice,
      maxPrice: visibleRange?.to ?? rawPrice,
    });

    const snapResult = snapToCandle ? resolveSnapFromCandle(rawPrice, snappedX) : { price: rawPrice, preview: null };
    const steppedPrice = snapToStep(snapResult.price, priceStep);

    return {
      point: buildDomainPoint(time, steppedPrice),
      preview: snapResult.preview,
    };
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

  function drawHandles(drawing, start, end, isSelected) {
    if (!isSelected) {
      return;
    }

    [start, end].forEach((point, handleIndex) => {
      const isHovered = hoveredHandle?.drawingId === drawing.id && hoveredHandle?.anchorIndex === handleIndex;
      ctx.beginPath();
      ctx.arc(point.x, point.y, isHovered ? 6.8 : 5.8, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? 'rgba(226, 232, 240, 0.9)' : 'rgba(11, 14, 19, 0.88)';
      ctx.fill();
      ctx.lineWidth = isHovered ? 1.9 : 1.3;
      ctx.strokeStyle = isHovered ? 'rgba(148, 163, 184, 1)' : 'rgba(148, 163, 184, 0.78)';
      ctx.stroke();
    });
  }

  function drawFibPrice(drawing, start, end, isSelected) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const deltaY = end.y - start.y;
    const lineColor = toRgba(drawing.config.color, drawing.config.opacity);

    ctx.save();
    ctx.lineWidth = isSelected ? 1.3 : 1;
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

    if (isSelected) {
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.strokeRect(minX, Math.min(start.y, end.y), maxX - minX, Math.abs(end.y - start.y));
    }

    ctx.restore();
    drawHandles(drawing, start, end, isSelected);
  }

  function drawFibTime(drawing, start, end, isSelected) {
    const spanX = end.x - start.x;
    const lineColor = toRgba(drawing.config.color, drawing.config.opacity);

    ctx.save();
    ctx.lineWidth = isSelected ? 1.3 : 1;
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
    drawHandles(drawing, start, end, isSelected);
  }

  function drawDrawing(drawing) {
    const start = toCanvasPoint(drawing.anchors[0]);
    const end = toCanvasPoint(drawing.anchors[1]);

    if (!start || !end) {
      return;
    }

    const isSelected = selectedIds.has(drawing.id);

    if (drawing.type === FIB_DRAWING_TYPES.FIB_PRICE) {
      drawFibPrice(drawing, start, end, isSelected);
      return;
    }

    if (drawing.type === FIB_DRAWING_TYPES.FIB_TIME) {
      drawFibTime(drawing, start, end, isSelected);
    }
  }

  function drawSnapPreview() {
    if (!snapPreview) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(snapPreview.x, snapPreview.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.stroke();
    drawLabel(`Snap ${snapPreview.label}`, snapPreview.x + 8, snapPreview.y - 8);
    ctx.restore();
  }

  function updateDraftFromPointer() {
    if (!draftDrawing || !pendingPointerEvent) {
      return;
    }

    const resolved = toDomainPoint(pendingPointerEvent.x, pendingPointerEvent.y, { snapToCandle: true });
    pendingPointerEvent = null;

    if (!resolved?.point) {
      return;
    }

    draftDrawing = {
      ...draftDrawing,
      anchors: [draftDrawing.anchors[0], resolved.point],
    };
    snapPreview = resolved.preview;
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
    drawSnapPreview();
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

  function clearHoverState() {
    hoveredHandle = null;
    canvas.style.cursor = activeTool ? 'crosshair' : 'default';
  }

  function resolveHandleHit(point) {
    for (let index = drawings.length - 1; index >= 0; index -= 1) {
      const drawing = drawings[index];
      if (!selectedIds.has(drawing.id)) {
        continue;
      }

      const handles = drawing.anchors.map(toCanvasPoint);
      for (let anchorIndex = 0; anchorIndex < handles.length; anchorIndex += 1) {
        if (hitTestHandle(point, handles[anchorIndex])) {
          return { drawingId: drawing.id, anchorIndex };
        }
      }
    }
    return null;
  }

  function resolveDrawingHit(point) {
    const ordered = drawings.slice().sort((a, b) => b.layer.zIndex - a.layer.zIndex);

    for (const drawing of ordered) {
      const start = toCanvasPoint(drawing.anchors[0]);
      const end = toCanvasPoint(drawing.anchors[1]);
      if (!start || !end) {
        continue;
      }

      if (drawing.type === FIB_DRAWING_TYPES.FIB_PRICE && hitTestFibPrice(point, start, end, drawing.config.levels)) {
        return drawing;
      }

      if (drawing.type === FIB_DRAWING_TYPES.FIB_TIME && hitTestFibTime(point, start, end, drawing.config.levels, canvas.clientWidth)) {
        return drawing;
      }
    }

    return null;
  }

  function setSelection(nextIds) {
    selectedIds = buildSelectionFromGroup(drawings, nextIds);
    emitInteractionState();
    scheduleRender();
  }

  function applyDrag(point, withSnap = true) {
    if (!dragState) {
      return;
    }

    const resolved = toDomainPoint(point.x, point.y, { snapToCandle: withSnap });
    if (!resolved?.point) {
      return;
    }

    snapPreview = resolved.preview;

    const axisLock = dragState.isShiftPressed
      ? resolveAxisLock(dragState.pointerStart, point, dragState.lockAxis)
      : AXIS_LOCK.NONE;

    dragState.lockAxis = axisLock;

    const constrainedPoint = applyAxisConstraint(resolved.point, dragState.sourceAnchor, axisLock);

    if (dragState.mode === 'anchor') {
      const targetIds = dragState.groupId
        ? drawings.filter((drawing) => drawing.layer.groupId === dragState.groupId).map((drawing) => drawing.id)
        : [dragState.drawingId];

      drawings = drawings.map((drawing) => {
        if (!targetIds.includes(drawing.id)) {
          return drawing;
        }

        const nextAnchors = drawing.anchors.map((anchor, anchorIndex) => {
          if (anchorIndex !== dragState.anchorIndex) {
            return anchor;
          }

          if (!dragState.groupId) {
            return constrainedPoint;
          }

          const baseAnchor = dragState.originalById[drawing.id].anchors[anchorIndex];
          const sourceAnchor = dragState.sourceAnchor;
          return {
            time: constrainedPoint.time,
            price: baseAnchor.price + (constrainedPoint.price - sourceAnchor.price),
          };
        });

        return {
          ...drawing,
          anchors: nextAnchors,
        };
      });
    }

    if (dragState.mode === 'move') {
      const source = dragState.sourceAnchor;
      const timeToLogical = chart.timeScale().timeToLogical;
      const sourceLogical = timeToLogical?.(source.time);
      const targetLogical = timeToLogical?.(constrainedPoint.time);
      const logicalDelta = Number.isFinite(sourceLogical) && Number.isFinite(targetLogical) ? targetLogical - sourceLogical : 0;
      const priceDelta = constrainedPoint.price - source.price;

      drawings = drawings.map((drawing) => {
        if (!dragState.selectedIds.has(drawing.id)) {
          return drawing;
        }

        const original = dragState.originalById[drawing.id];
        const anchors = original.anchors.map((anchor) => {
          const anchorLogical = timeToLogical?.(anchor.time);
          const nextTime = Number.isFinite(anchorLogical)
            ? chart.timeScale().logicalToTime?.(anchorLogical + logicalDelta) ?? anchor.time
            : anchor.time;

          return {
            time: nextTime,
            price: anchor.price + priceDelta,
          };
        });

        return {
          ...drawing,
          anchors,
        };
      });
    }

    onDrawingsChange?.(drawings);
    scheduleRender();
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if (activeTool) {
      const resolved = toDomainPoint(point.x, point.y, { snapToCandle: true });
      if (!resolved?.point) {
        return;
      }

      if (!draftDrawing) {
        draftDrawing = {
          id: createDrawingId(activeTool),
          type: activeTool,
          anchors: [resolved.point, resolved.point],
          config: { ...toolConfigs[activeTool] },
          layer: { groupId: null, zIndex: drawings.length },
        };
        canvas.style.cursor = 'crosshair';
        scheduleRender();
        return;
      }

      const completeDrawing = {
        ...draftDrawing,
        anchors: [draftDrawing.anchors[0], resolved.point],
      };

      const nextDrawings = [...drawings, completeDrawing];
      pushHistorySnapshot();
      drawings = withNormalizedZOrder(nextDrawings);
      draftDrawing = null;
      setSelection(new Set([completeDrawing.id]));
      onDrawingsChange?.(drawings);
      emitInteractionState();
      scheduleRender();
      return;
    }

    const handleHit = resolveHandleHit(point);
    if (handleHit) {
      const drawing = drawings.find((candidate) => candidate.id === handleHit.drawingId);
      if (!drawing) {
        return;
      }

      dragState = {
        mode: 'anchor',
        drawingId: drawing.id,
        groupId: drawing.layer.groupId,
        anchorIndex: handleHit.anchorIndex,
        pointerStart: point,
        sourceAnchor: drawing.anchors[handleHit.anchorIndex],
        originalById: Object.fromEntries(
          drawings.map((entry) => [entry.id, { anchors: entry.anchors.map((anchor) => ({ ...anchor })) }]),
        ),
        isShiftPressed: event.shiftKey,
        lockAxis: AXIS_LOCK.NONE,
      };

      pushHistorySnapshot();
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    const hitDrawing = resolveDrawingHit(point);
    if (hitDrawing) {
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        const next = new Set(selectedIds);
        if (next.has(hitDrawing.id)) {
          next.delete(hitDrawing.id);
        } else {
          next.add(hitDrawing.id);
        }
        setSelection(next);
      } else if (!selectedIds.has(hitDrawing.id)) {
        setSelection(new Set([hitDrawing.id]));
      }

      dragState = {
        mode: 'move',
        pointerStart: point,
        sourceAnchor: hitDrawing.anchors[0],
        selectedIds: new Set(selectedIds.has(hitDrawing.id) ? selectedIds : buildSelectionFromGroup(drawings, [hitDrawing.id])),
        originalById: Object.fromEntries(
          drawings.map((entry) => [entry.id, { anchors: entry.anchors.map((anchor) => ({ ...anchor })) }]),
        ),
        isShiftPressed: event.shiftKey,
        lockAxis: AXIS_LOCK.NONE,
      };

      pushHistorySnapshot();
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    setSelection(new Set());
    snapPreview = null;
    scheduleRender();
  }

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if (activeTool && draftDrawing) {
      pendingPointerEvent = point;
      scheduleRender();
      return;
    }

    if (dragState) {
      dragState.isShiftPressed = event.shiftKey;
      applyDrag(point, true);
      return;
    }

    const handleHit = resolveHandleHit(point);
    hoveredHandle = handleHit;
    canvas.style.cursor = handleHit ? 'grab' : 'default';
    scheduleRender();
  }

  function onPointerUp(event) {
    if (dragState) {
      dragState = null;
      snapPreview = null;
      canvas.releasePointerCapture?.(event.pointerId);
      onDrawingsChange?.(drawings);
      emitInteractionState();
      scheduleRender();
    }
  }

  function onPointerLeave() {
    if (!dragState && !activeTool) {
      clearHoverState();
      scheduleRender();
    }
  }

  function applyInteractivityState() {
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = activeTool ? 'crosshair' : 'default';
  }

  function restoreFromSnapshot(snapshot) {
    drawings = withNormalizedZOrder(snapshotState(snapshot));
    selectedIds = new Set([...selectedIds].filter((id) => drawings.some((drawing) => drawing.id === id)));
    onDrawingsChange?.(drawings);
    emitInteractionState();
    scheduleRender();
  }

  syncCanvasSize();
  resizeObserver.observe(container);
  chart.timeScale().subscribeVisibleLogicalRangeChange(onTimeScaleChange);
  chart.timeScale().subscribeVisibleTimeRangeChange(onTimeScaleChange);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);

  applyInteractivityState();
  emitInteractionState();
  scheduleRender();

  return {
    setDrawingTool(nextTool) {
      activeTool = nextTool;
      draftDrawing = null;
      pendingPointerEvent = null;
      snapPreview = null;
      applyInteractivityState();
      emitInteractionState();
      scheduleRender();
    },
    setToolConfigs(nextConfigs) {
      toolConfigs = normalizeFibToolConfigs(nextConfigs);
      scheduleRender();
    },
    setDrawings(nextDrawings) {
      drawings = withNormalizedZOrder(normalizeFibDrawings(nextDrawings));
      selectedIds = new Set([...selectedIds].filter((id) => drawings.some((drawing) => drawing.id === id)));
      draftDrawing = null;
      scheduleRender();
      emitInteractionState();
    },
    setCandles(nextCandles = []) {
      candles = Array.isArray(nextCandles) ? nextCandles : [];
    },
    setMagnetStrength(nextStrength) {
      magnetStrength = clamp(Number(nextStrength) || 0, 0, 100);
      emitInteractionState();
      scheduleRender();
    },
    undo() {
      const snapshot = historyPast.pop();
      if (!snapshot) {
        return;
      }
      historyFuture.push(snapshotState(drawings));
      restoreFromSnapshot(snapshot);
    },
    redo() {
      const snapshot = historyFuture.pop();
      if (!snapshot) {
        return;
      }
      historyPast.push(snapshotState(drawings));
      restoreFromSnapshot(snapshot);
    },
    deleteSelection() {
      if (!selectedIds.size) {
        return;
      }
      commitDrawings(drawings.filter((drawing) => !selectedIds.has(drawing.id)), { pushHistory: true });
      selectedIds = new Set();
      emitInteractionState();
    },
    groupSelection() {
      if (selectedIds.size < 2) {
        return;
      }
      const groupId = createGroupId();
      commitDrawings(
        drawings.map((drawing) =>
          selectedIds.has(drawing.id)
            ? {
                ...drawing,
                layer: { ...drawing.layer, groupId },
              }
            : drawing,
        ),
        { pushHistory: true },
      );
    },
    ungroupSelection() {
      if (!selectedIds.size) {
        return;
      }
      commitDrawings(
        drawings.map((drawing) =>
          selectedIds.has(drawing.id)
            ? {
                ...drawing,
                layer: { ...drawing.layer, groupId: null },
              }
            : drawing,
        ),
      );
    },
    bringToFront() {
      if (!selectedIds.size) {
        return;
      }
      const unselected = drawings.filter((drawing) => !selectedIds.has(drawing.id));
      const selected = drawings.filter((drawing) => selectedIds.has(drawing.id));
      commitDrawings([...unselected, ...selected]);
    },
    sendToBack() {
      if (!selectedIds.size) {
        return;
      }
      const unselected = drawings.filter((drawing) => !selectedIds.has(drawing.id));
      const selected = drawings.filter((drawing) => selectedIds.has(drawing.id));
      commitDrawings([...selected, ...unselected]);
    },
    destroy() {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onTimeScaleChange);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(onTimeScaleChange);

      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);

      canvas.remove();
    },
  };
}
