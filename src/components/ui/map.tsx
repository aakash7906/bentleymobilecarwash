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
export const MAP_STYLES = {
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
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Resolve current active style URL from styles or mapStyle
  const activeStyleUrl = useMemo(() => {
    if (styles) {
      if (typeof styles === 'string') return styles
      return styles.light || styles.dark || MAP_STYLES.voyager
    }
    return mapStyle || MAP_STYLES.voyager
  }, [styles, mapStyle])

  // Expose MapLibreMap instance to parent ref
  useImperativeHandle(ref, () => mapRef.current as MapLibreMap, [])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let mapInstance: MapLibreMap | null = null

    try {
      mapInstance = new MapLibreMap({
        container: containerRef.current,
        style: activeStyleUrl,
        center,
        zoom,
        pitch,
        bearing,
        interactive,
        attributionControl: false,
      })

      mapRef.current = mapInstance

      mapInstance.on('load', () => {
        setIsLoaded(true)
        if (mapInstance) {
          mapInstance.resize()
          if (onLoad) onLoad(mapInstance)
        }
      })

      mapInstance.on('idle', () => {
        if (mapInstance) {
          mapInstance.resize()
        }
      })

      mapInstance.on('error', (e) => {
        console.warn('MapLibre event notice:', e)
      })

      // Immediate resize passes to accommodate modal/card animations
      const timer1 = setTimeout(() => mapInstance?.resize(), 100)
      const timer2 = setTimeout(() => mapInstance?.resize(), 400)

      // Keep map canvas responsive on layout shifts
      const resizeObserver = new ResizeObserver(() => {
        mapInstance?.resize()
      })
      resizeObserver.observe(containerRef.current)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        resizeObserver.disconnect()
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

  // Smooth camera update when center changes without re-instantiating WebGL
  const prevCenterRef = useRef<[number, number] | undefined>(undefined)
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !center) return
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
  }, [center, isLoaded])

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
    <MapContext.Provider value={{ map: mapRef.current, isLoaded }}>
      <div className={`relative overflow-hidden ${className}`}>
        <div ref={containerRef} className="w-full h-full min-h-[350px]" />
        {isLoaded && children}
      </div>
    </MapContext.Provider>
  )
})

/* =========================================================================
   2. MAP MARKER COMPONENT
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

  if (!elRef.current && typeof document !== 'undefined') {
    const el = document.createElement('div')
    el.className = `cursor-pointer ${className}`
    if (onClick) {
      el.addEventListener('click', onClick)
    }
    elRef.current = el
  }

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
  }, [map, isLoaded, longitude, latitude, anchor])

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

  const updateRoute = useCallback(() => {
    if (!map || !isLoaded || coordinates.length < 2) return

    const resolvedColor = resolveColorToken(color)
    const sourceId = `source-${id}`
    const layerId = `layer-${id}`

    const geojsonData: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    }

    try {
      const existingSource = map.getSource(sourceId) as any

      if (existingSource) {
        existingSource.setData(geojsonData)
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojsonData,
        })

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
      console.warn('Error configuring map route:', err)
    }
  }, [map, isLoaded, id, coordinates, color, width, opacity, dashArray])

  useEffect(() => {
    if (!map) return

    updateRoute()

    // Automatically re-apply route layer when map style changes
    const handleStyleLoad = () => {
      updateRoute()
    }
    map.on('style.load', handleStyleLoad)

    return () => {
      map.off('style.load', handleStyleLoad)
      try {
        const sourceId = `source-${id}`
        const layerId = `layer-${id}`
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // Ignored on cleanup
      }
    }
  }, [map, updateRoute, id])

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

  const handleZoomIn = () => {
    if (map) map.zoomIn({ duration: 300 })
  }

  const handleZoomOut = () => {
    if (map) map.zoomOut({ duration: 300 })
  }

  const handleReset = () => {
    if (onRecenter) {
      onRecenter()
    } else if (map) {
      map.resetNorthPitch({ duration: 400 })
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
        title="Re-center"
      >
        <Navigation className="w-3.5 h-3.5" />
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
