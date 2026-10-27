import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  setWorkerUrl,
  type PositionAnchor,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { Plus, Minus, Navigation } from 'lucide-react'

// Explicitly register worker URL so Vite dev and prod both serve the worker seamlessly
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl(mapWorkerUrl || 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl-worker.mjs')
  } catch (err) {
    console.warn('MapLibre worker registration warning:', err)
  }
}

// Utility to resolve CSS variable tokens (e.g. var(--primary)) to hex/rgb for WebGL Canvas
function resolveColorToken(color: string): string {
  if (typeof window === 'undefined') return color
  if (color.startsWith('var(')) {
    const varName = color.slice(4, -1).trim()
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    if (resolved) return resolved
  }
  return color
}

// Free high-performance basemap styles with zero API key required
const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  bright: 'https://tiles.openfreemap.org/styles/bright',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
}

export type MapRef = MapLibreMap

export type MapStyleOption = string | { light: string; dark?: string }

interface MapContextValue {
  map: MapLibreMap | null
  isLoaded: boolean
}

const MapContext = createContext<MapContextValue>({
  map: null,
  isLoaded: false,
})

export const useMap = () => useContext(MapContext)

/* =========================================================================
   1. CORE MAP COMPONENT (mapcn)
   ========================================================================= */
export interface MapProps {
  center?: [number, number] // [lng, lat]
  zoom?: number
  pitch?: number
  bearing?: number
  mapStyle?: string
  styles?: MapStyleOption
  interactive?: boolean
  className?: string
  children?: ReactNode
  onLoad?: (map: MapLibreMap) => void
  onUserInteract?: (isInteracting: boolean) => void
  followUser?: boolean
}

export const Map = forwardRef<MapLibreMap, MapProps>(function Map(
  {
    center = [-79.3832, 43.6532],
    zoom = 13.5,
    pitch = 0,
    bearing = 0,
    mapStyle = MAP_STYLES.voyager,
    styles,
    interactive = true,
    className = 'w-full h-full min-h-[350px]',
    children,
    onLoad,
    onUserInteract,
    followUser = true,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const isUserInteractingRef = useRef(false)
  const isMiddleDraggingRef = useRef(false)

  // Resolve current active style URL from styles or mapStyle
  const activeStyleUrl = useMemo(() => {
    if (styles) {
      if (typeof styles === 'string') return styles
      return styles.light || styles.dark || MAP_STYLES.voyager
    }
    return mapStyle || MAP_STYLES.voyager
  }, [styles, mapStyle])

  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null)

  // Expose MapLibreMap instance to parent ref with instant synchronization
  useImperativeHandle(ref, () => (mapRef.current || mapInstance) as MapLibreMap, [isLoaded, mapInstance])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let instance: MapLibreMap | null = null

    try {
      const fastPanInertia = {
        linearity: 0.35,
        maxSpeed: 3600,
        deceleration: 1400,
      }

      instance = new MapLibreMap({
        container: containerRef.current,
        style: activeStyleUrl,
        center,
        zoom,
        pitch,
        bearing,
        interactive,
        dragPan: fastPanInertia,
        dragRotate: true,
        scrollZoom: true,
        boxZoom: true,
        doubleClickZoom: true,
        touchZoomRotate: true,
        touchPitch: true,
        maxPitch: 60,
        attributionControl: false,
      })

      mapRef.current = instance
      setMapInstance(instance)

      // Direct assignment to ref so parent components have immediate access
      if (ref) {
        if (typeof ref === 'function') {
          ref(instance)
        } else {
          (ref as React.MutableRefObject<MapLibreMap | null>).current = instance
        }
      }

      // Enable middle-click (scroll wheel press) drag-to-pan in addition to standard left-click
      const targetEl = wrapperRef.current || containerRef.current
      let isMiddleClickDragging = false
      let lastClientPos: { x: number; y: number } | null = null

      const handleAuxClick = (e: MouseEvent) => {
        // Prevent default browser behavior on middle click (autoscroll, paste, etc.)
        if (e.button === 1) {
          e.preventDefault()
          e.stopPropagation()
        }
      }

      const handleMouseDown = (e: MouseEvent) => {
        // e.button === 1 is scroll wheel press (middle click)
        if (e.button === 1 && instance) {
          e.preventDefault()
          e.stopPropagation()
          isMiddleClickDragging = true
          isMiddleDraggingRef.current = true
          lastClientPos = { x: e.clientX, y: e.clientY }
          if (targetEl) targetEl.style.cursor = 'grabbing'
          document.body.style.cursor = 'grabbing'
          document.body.style.userSelect = 'none'
        }
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isMiddleClickDragging || !lastClientPos || !instance) return

        // If middle mouse button is no longer held (e.buttons & 4 is 0)
        if ((e.buttons & 4) === 0 && e.button !== 1) {
          handleMouseUp(e)
          return
        }

        e.preventDefault()
        e.stopPropagation()

        const dx = e.clientX - lastClientPos.x
        const dy = e.clientY - lastClientPos.y
        if (dx === 0 && dy === 0) return

        lastClientPos = { x: e.clientX, y: e.clientY }

        // Accurately project screen delta onto geographic coordinates for instantaneous 1:1 panning
        try {
          const currentCenter = instance.getCenter()
          const centerPx = instance.project(currentCenter)
          const targetPx: [number, number] = [centerPx.x - dx, centerPx.y - dy]
          const newCenter = instance.unproject(targetPx)
          instance.jumpTo({ center: newCenter })
        } catch (err) {
          console.warn('Map drag pan translation error:', err)
        }
      }

      const handleMouseUp = (e?: MouseEvent | Event) => {
        const isMiddle = e && 'button' in e ? e.button === 1 : false
        if (isMiddleClickDragging || isMiddle || !e) {
          isMiddleClickDragging = false
          isMiddleDraggingRef.current = false
          lastClientPos = null
          if (targetEl) targetEl.style.cursor = ''
          document.body.style.cursor = ''
          document.body.style.userSelect = ''
        }
      }

      if (targetEl) {
        targetEl.addEventListener('auxclick', handleAuxClick, { passive: false })
        targetEl.addEventListener('mousedown', handleMouseDown, { passive: false })
      }
      window.addEventListener('mousemove', handleMouseMove, { passive: false })
      window.addEventListener('mouseup', handleMouseUp, { passive: true })
      window.addEventListener('blur', handleMouseUp)

      instance.on('load', () => {
        setIsLoaded(true)
        if (instance) {
          // 1. Enable fast, fluid Google Maps-style drag panning with high fling inertia
          instance.dragPan.enable(fastPanInertia)

          // 2. Fast, responsive mouse wheel and trackpad zoom
          instance.scrollZoom.enable()
          instance.scrollZoom.setWheelZoomRate(1 / 150)
          instance.scrollZoom.setZoomRate(1 / 40)

          // 3. Fast, fluid two-finger pinch-to-zoom AND two-finger rotation (Google Maps style)
          instance.touchZoomRotate.enable()
          instance.touchZoomRotate.enableRotation()
          const touchZoom = (instance.touchZoomRotate as any)._touchZoom
          if (touchZoom) {
            touchZoom.setZoomRate(1.8)
            touchZoom.setZoomThreshold(0)
          }

          // 4. Two-finger tilt/pitch (3D perspective up to 60 degrees, like Google Maps)
          instance.touchPitch.enable()
          instance.resize()
          if (onLoad) onLoad(instance)
        }
      })

      // USER INTERACTION DETECTION: Only trigger on genuine human gestures, not programmatic flyTo/easeTo
      const handleUserGestureStart = (e?: any) => {
        // Programmatic animations do NOT contain an originalEvent
        if (e && !e.originalEvent) return
        isUserInteractingRef.current = true
        if (onUserInteract) onUserInteract(true)
      }

      // Allow natural momentum and continuous gestures without stopping camera animations
      instance.on('dragstart', handleUserGestureStart)
      instance.on('rotatestart', handleUserGestureStart)
      instance.on('pitchstart', handleUserGestureStart)
      instance.on('zoomstart', handleUserGestureStart)

      instance.on('error', (e) => {
        console.warn('MapLibre event notice:', e)
      })

      // Immediate resize passes to accommodate modal/card animations
      const timer1 = setTimeout(() => mapInstance?.resize(), 100)
      const timer2 = setTimeout(() => mapInstance?.resize(), 400)

      // Debounced ResizeObserver to prevent canvas drag frame interruptions
      let resizeTimer: any = null
      const resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          mapInstance?.resize()
        }, 150)
      })
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current)
      }

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeObserver.disconnect()
        if (targetEl) {
          targetEl.removeEventListener('auxclick', handleAuxClick)
          targetEl.removeEventListener('mousedown', handleMouseDown)
        }
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('blur', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        if (mapInstance) {
          mapInstance.remove()
        }
        mapRef.current = null
        setIsLoaded(false)
      }
    } catch (err) {
      console.error('Failed to initialize MapLibre map:', err)
    }
  }, [])

  // Smooth camera update when center changes - paused when user is dragging or in explore mode
  const prevCenterRef = useRef<[number, number] | undefined>(undefined)
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !center) return
    // Respect user drag: do not hijack camera if user is exploring or followUser is false
    if (isUserInteractingRef.current || !followUser) return
    const [lng, lat] = center
    if (
      !prevCenterRef.current ||
      prevCenterRef.current[0] !== lng ||
      prevCenterRef.current[1] !== lat
    ) {
      prevCenterRef.current = [lng, lat]
      const current = mapRef.current.getCenter()
      const dist = Math.hypot(current.lng - lng, current.lat - lat)
      if (dist > 0.0001) {
        mapRef.current.easeTo({ center: [lng, lat], duration: 800 })
      }
    }
  }, [center, isLoaded, followUser])

  // Reset user interaction flag when followUser becomes active again
  useEffect(() => {
    if (followUser) {
      isUserInteractingRef.current = false
    }
  }, [followUser])

  // React to dynamic style switching
  const prevStyleUrlRef = useRef(activeStyleUrl)
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    if (prevStyleUrlRef.current !== activeStyleUrl) {
      prevStyleUrlRef.current = activeStyleUrl
      try {
        mapRef.current.setStyle(activeStyleUrl)
      } catch (err) {
        console.warn('Failed to switch map style:', err)
      }
    }
  }, [activeStyleUrl, isLoaded])

  return (
    <MapContext.Provider value={{ map: mapRef.current || mapInstance, isLoaded }}>
      <div
        ref={wrapperRef}
        className={`relative overflow-hidden select-none ${className}`}
        style={{
          touchAction: 'none',
          overscrollBehavior: 'contain',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          ref={containerRef}
          className="w-full h-full min-h-[350px]"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        />
        {isLoaded && children}
      </div>
    </MapContext.Provider>
  )
})

/* =========================================================================
   2. MAP MARKER COMPONENT (Imperative 60fps Updates with Zero Dead-Zones)
   ========================================================================= */
interface MapMarkerProps {
  longitude: number
  latitude: number
  children: ReactNode
  className?: string
  onClick?: () => void
  anchor?: PositionAnchor
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  longitude,
  latitude,
  children,
  className = '',
  onClick,
  anchor = 'center',
}) => {
  const { map, isLoaded } = useMap()
  const elRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<MapLibreMarker | null>(null)

  // Initialize marker DOM element with pointer-events-none on outer container to prevent dead-zones
  if (!elRef.current && typeof document !== 'undefined') {
    const el = document.createElement('div')
    el.className = `pointer-events-none select-none ${className}`
    if (onClick) {
      el.addEventListener('click', onClick)
    }
    elRef.current = el
  }

  // Mount MapLibreMarker once on load/anchor change (bypasses unmount/remount on coord changes)
  useEffect(() => {
    if (!map || !isLoaded || !elRef.current) return

    const marker = new MapLibreMarker({
      element: elRef.current,
      anchor,
    })
      .setLngLat([longitude, latitude])
      .addTo(map)

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [map, isLoaded, anchor])

  // Imperative position update on lng/lat change (60fps smooth tracking without DOM recreation)
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude])
    }
  }, [longitude, latitude])

  if (!elRef.current) return null
  return createPortal(children, elRef.current)
}

/* =========================================================================
   3. MAP ROUTE POLYLINE COMPONENT
   ========================================================================= */
interface MapRouteProps {
  id?: string
  coordinates: [number, number][]
  color?: string
  width?: number
  opacity?: number
  dashArray?: [number, number]
}

export const MapRoute: React.FC<MapRouteProps> = ({
  id = 'route-path',
  coordinates,
  color = 'var(--primary)',
  width = 5,
  opacity = 0.9,
  dashArray,
}) => {
  const { map, isLoaded } = useMap()

  // 1. Setup Layer and Source Lifecycle (Mount once, re-attach on style change, clean up only on unmount or id change)
  useEffect(() => {
    if (!map || !isLoaded) return

    const sourceId = `source-${id}`
    const layerId = `layer-${id}`

    const setupRouteLayer = () => {
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates.length >= 2 ? coordinates : [],
              },
            },
          })
        }

        if (!map.getLayer(layerId)) {
          const resolvedColor = resolveColorToken(color)
          const paintProps: Record<string, any> = {
            'line-color': resolvedColor,
            'line-width': width,
            'line-opacity': opacity,
          }

          if (dashArray) {
            paintProps['line-dasharray'] = dashArray
          }

          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: paintProps,
          })
        }
      } catch (err) {
        console.warn('Error configuring map route layer:', err)
      }
    }

    setupRouteLayer()
    map.on('style.load', setupRouteLayer)

    return () => {
      map.off('style.load', setupRouteLayer)
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // Ignored on cleanup
      }
    }
  }, [map, isLoaded, id])

  // 2. High-performance GeoJSON data update without destroying/recreating WebGL layers
  useEffect(() => {
    if (!map || !isLoaded || coordinates.length < 2) return
    const sourceId = `source-${id}`
    try {
      const existingSource = map.getSource(sourceId) as any
      if (existingSource && typeof existingSource.setData === 'function') {
        existingSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        })
      }
    } catch (err) {
      console.warn('Error updating route coordinates:', err)
    }
  }, [map, isLoaded, id, coordinates])

  // 3. Dynamic paint property updates without layer recreation
  useEffect(() => {
    if (!map || !isLoaded) return
    const layerId = `layer-${id}`
    try {
      if (map.getLayer(layerId)) {
        const resolvedColor = resolveColorToken(color)
        map.setPaintProperty(layerId, 'line-color', resolvedColor)
        map.setPaintProperty(layerId, 'line-width', width)
        map.setPaintProperty(layerId, 'line-opacity', opacity)
        if (dashArray) {
          map.setPaintProperty(layerId, 'line-dasharray', dashArray)
        }
      }
    } catch {}
  }, [map, isLoaded, id, color, width, opacity, dashArray])

  return null
}

/* =========================================================================
   4. MAP CONTROLS COMPONENT (Zoom, Re-center)
   ========================================================================= */
interface MapControlsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  onRecenter?: () => void
}

export const MapControls: React.FC<MapControlsProps> = ({
  position = 'top-right',
  onRecenter,
}) => {
  const { map } = useMap()
  const [bearing, setBearing] = useState(0)

  // Listen to map rotation changes to rotate the compass needle dynamically
  useEffect(() => {
    if (!map) return
    const updateBearing = () => {
      setBearing(Math.round(map.getBearing()))
    }
    map.on('rotate', updateBearing)
    map.on('rotateend', updateBearing)
    return () => {
      map.off('rotate', updateBearing)
      map.off('rotateend', updateBearing)
    }
  }, [map])

  const handleZoomIn = () => {
    if (map) map.zoomIn({ duration: 250 })
  }

  const handleZoomOut = () => {
    if (map) map.zoomOut({ duration: 250 })
  }

  const handleReset = () => {
    if (onRecenter) {
      onRecenter()
    } else if (map) {
      map.resetNorthPitch({ duration: 500 })
    }
  }

  const positionClasses = {
    'top-right': 'top-3 right-3',
    'top-left': 'top-3 left-3',
    'bottom-right': 'bottom-3 right-3',
    'bottom-left': 'bottom-3 left-3',
  }[position]

  return (
    <div className={`absolute z-10 flex flex-col gap-1.5 ${positionClasses}`}>
      <button
        type="button"
        onClick={handleZoomIn}
        className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-md flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary active:scale-95 transition-all cursor-pointer"
        title="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleZoomOut}
        className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-md flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary active:scale-95 transition-all cursor-pointer"
        title="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-md flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary active:scale-95 transition-all cursor-pointer"
        title="Re-center & Reset North"
      >
        <Navigation
          className="w-3.5 h-3.5 text-primary fill-primary transition-transform duration-150"
          style={{ transform: `rotate(${-bearing}deg)` }}
        />
      </button>
    </div>
  )
}

/* =========================================================================
   5. CUSTOM STYLE EXAMPLE COMPONENT
   ========================================================================= */
const exampleStyles = {
  default: undefined,
  openstreetmap: 'https://tiles.openfreemap.org/styles/bright',
  openstreetmap3d: 'https://tiles.openfreemap.org/styles/liberty',
}

type ExampleStyleKey = keyof typeof exampleStyles

export function CustomStyleExample() {
  const mapRef = useRef<MapRef>(null)
  const [style, setStyle] = useState<ExampleStyleKey>('default')
  const selectedStyle = exampleStyles[style]
  const is3D = style === 'openstreetmap3d'

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 })
  }, [is3D])

  return (
    <div className="relative h-[420px] w-full">
      <Map
        ref={mapRef}
        center={[-0.1276, 51.5074]}
        zoom={15}
        styles={
          selectedStyle
            ? { light: selectedStyle, dark: selectedStyle }
            : undefined
        }
      />
      <div className="absolute top-2 right-2 z-10">
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as ExampleStyleKey)}
          className="bg-white/95 text-gray-800 rounded-md border border-gray-200 px-2 py-1 text-sm shadow cursor-pointer focus:outline-none"
        >
          <option value="default">Default (Carto)</option>
          <option value="openstreetmap">OpenStreetMap</option>
          <option value="openstreetmap3d">OpenStreetMap 3D</option>
        </select>
      </div>
    </div>
  )
}
