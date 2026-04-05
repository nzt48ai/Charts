# Project Overview
This project is a premium, Apple-inspired futures charting platform for personal use.

# Tech Stack
- React
- lightweight-charts for chart rendering
- HTML canvas overlay for custom drawings and interaction layers

# Architecture Rules
- /src/core: pure math, candle aggregation, Fibonacci calculations, snapping logic
- /src/engine: drawing engine, interaction engine, overlay render loop, selection/grouping/z-index logic
- /src/data: persistence, localStorage helpers, layout storage, drawing storage
- /src/hooks: React integration hooks only
- /src/ui: presentational UI components only

# Performance Rules
- Do not use React state for high-frequency updates
- Use refs for live market data, crosshair state, and drag state
- Use requestAnimationFrame for overlay rendering
- Keep one chart instance alive and do not recreate it on symbol switch
- Avoid unnecessary rerenders and heavy dependencies

# UX Rules
- UI should feel calm, premium, precise, and mobile-friendly
- Use a Liquid Glass design language for panels and controls
- The chart should remain the dominant visual surface
- Desktop uses floating panels and toolbars
- Mobile uses a full-screen chart, floating action controls, and bottom sheets
- Use smooth but restrained motion
- Keep touch targets mobile-friendly

# Coding Style
- Prefer small, focused modules
- Keep functions single-purpose
- Avoid mixing business logic into UI components
- Make systems extensible for future drawing tools
