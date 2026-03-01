import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import worldGeoJsonData from '../data/world.json';

// Original geojson data is from: https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson
// Later been extended with some missing countries from: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson

type VisitedGlobeProps = {
  visitedCountries: string[];
  friendVisitedCountries?: string[];
  height?: number;
};

function buildGlobeHtml(visitedCountries: string[], friendVisitedCountries: string[]) {
  const visitedJson = JSON.stringify(visitedCountries);
  const friendVisitedJson = JSON.stringify(friendVisitedCountries);
  const worldGeoJson = JSON.stringify(worldGeoJsonData);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, #globeViz {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #f6f8fb;
      }
      .country-label {
        position: absolute;
        pointer-events: none;
        display: none;
        padding: 7px 10px;
        border-radius: 10px;
        background: rgba(17, 24, 39, 0.92);
        color: #f9fafb;
        font: 12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
        max-width: 220px;
        transform: translate(-50%, -110%);
        white-space: nowrap;
      }
    </style>
    <script src="https://unpkg.com/three@0.157.0/build/three.min.js"></script>
    <script src="https://unpkg.com/globe.gl@2.41.1/dist/globe.gl.min.js"></script>
  </head>
  <body>
    <div id="globeViz"></div>
    <div id="countryLabel" class="country-label"></div>
    <script>
      const visited = ${visitedJson};
      const friendVisited = ${friendVisitedJson};
      const world = ${worldGeoJson};
      const normalizeCountryName = (name) => {
        const normalized = (name || '').trim().toLowerCase();
        if (normalized === 'cape verde' || normalized === 'cabo verde') return 'cape verde';
        return normalized;
      };

      const visitedSet = new Set(visited.map((country) => normalizeCountryName(country)));
      const friendVisitedSet = new Set(friendVisited.map((country) => normalizeCountryName(country)));
      let selectedCountryName = '';
      const VISITED_TILE_COLOR = '#2563eb';
      const FRIEND_TILE_COLOR = '#ef4444';
      const UNVISITED_TILE_COLOR = '#9ca3af';

      const darkenHex = (hex, factor = 0.72) => {
        const raw = (hex || '').replace('#', '');
        if (raw.length !== 6) return hex;
        const toChannel = (idx) => {
          const value = parseInt(raw.slice(idx, idx + 2), 16);
          return Math.max(0, Math.min(255, Math.round(value * factor)));
        };
        const r = toChannel(0).toString(16).padStart(2, '0');
        const g = toChannel(2).toString(16).padStart(2, '0');
        const b = toChannel(4).toString(16).padStart(2, '0');
        return '#' + r + g + b;
      };

      const container = document.getElementById('globeViz');
      const countryLabel = document.getElementById('countryLabel');
      const globe = Globe({ rendererConfig: { logarithmicDepthBuffer: true } })(container)
        .backgroundColor('#f6f8fb')
        .showGlobe(true)
        .showAtmosphere(false);
      const supportsCapMaterial = typeof globe.polygonCapMaterial === 'function';

      // Start with a closer camera so the globe appears larger on first render.
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 0);

      const tuneCameraForDepthPrecision = () => {
        const camera = globe.camera && globe.camera();
        if (camera) {
          camera.near = 0.4;
          if (camera.far > 1200) {
            camera.far = 1200;
          }
          camera.updateProjectionMatrix();
        }

        const controls = globe.controls && globe.controls();
        if (controls) {
          controls.minDistance = 110;
          controls.maxDistance = 380;
          controls.update();
        }
      };

      tuneCameraForDepthPrecision();

      const waterMaterial = new THREE.MeshPhongMaterial({ color: '#d1d5db' });
      waterMaterial.polygonOffset = true;
      waterMaterial.polygonOffsetFactor = 1;
      waterMaterial.polygonOffsetUnits = 1;
      globe.globeMaterial(waterMaterial);

      const getCountryName = (feature) => {
        if (!feature || !feature.properties) return '';
        const p = feature.properties;
        return p.NAME || p.ADMIN || p.name || p.NAME_LONG || '';
      };

      const altitudeNudge = (countryName) => {
        const key = (countryName || '').toLowerCase();
        let hash = 0;
        for (let i = 0; i < key.length; i += 1) {
          hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
        }
        return (hash % 11) * 0.00002;
      };

      const materialCache = new Map();

      const getCountryStatus = (feature) => {
        const countryName = normalizeCountryName(getCountryName(feature));
        const isVisitedByUser = visitedSet.has(countryName);
        const isVisitedByFriend = friendVisitedSet.has(countryName);
        if (isVisitedByUser && isVisitedByFriend) return 'both';
        if (isVisitedByUser) return 'user';
        if (isVisitedByFriend) return 'friend';
        return 'none';
      };

      const getSolidMaterial = (color) => {
        const key = 'solid:' + color;
        if (materialCache.has(key)) return materialCache.get(key);
        const material = new THREE.MeshBasicMaterial({ color });
        materialCache.set(key, material);
        return material;
      };

      const getStripedMaterial = (first, second) => {
        const key = 'striped:' + first + ':' + second;
        if (materialCache.has(key)) return materialCache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return getSolidMaterial(first);
        }
        ctx.fillStyle = first;
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = second;
        ctx.lineWidth = 8;

        for (let x = -64; x <= 128; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x - 64, 64);
          ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);

        const material = new THREE.MeshBasicMaterial({ map: texture });
        materialCache.set(key, material);
        return material;
      };

      const getCapMaterial = (feature) => {
        const countryName = normalizeCountryName(getCountryName(feature));
        const status = getCountryStatus(feature);
        const isSelected = selectedCountryName && countryName === selectedCountryName;

        if (status === 'both') {
          const primary = isSelected ? darkenHex(VISITED_TILE_COLOR) : VISITED_TILE_COLOR;
          const secondary = isSelected ? darkenHex(FRIEND_TILE_COLOR) : FRIEND_TILE_COLOR;
          return getStripedMaterial(primary, secondary);
        }
        if (status === 'user') {
          return getSolidMaterial(isSelected ? darkenHex(VISITED_TILE_COLOR) : VISITED_TILE_COLOR);
        }
        if (status === 'friend') {
          return getSolidMaterial(isSelected ? darkenHex(FRIEND_TILE_COLOR) : FRIEND_TILE_COLOR);
        }
        return getSolidMaterial(isSelected ? darkenHex(UNVISITED_TILE_COLOR) : UNVISITED_TILE_COLOR);
      };

      const getCapColorFallback = (feature) => {
        const countryName = normalizeCountryName(getCountryName(feature));
        const status = getCountryStatus(feature);
        const isSelected = selectedCountryName && countryName === selectedCountryName;

        if (status === 'both') {
          return isSelected ? '#7c2d12' : '#7c3aed';
        }
        if (status === 'user') {
          return isSelected ? darkenHex(VISITED_TILE_COLOR) : VISITED_TILE_COLOR;
        }
        if (status === 'friend') {
          return isSelected ? darkenHex(FRIEND_TILE_COLOR) : FRIEND_TILE_COLOR;
        }
        return isSelected ? darkenHex(UNVISITED_TILE_COLOR) : UNVISITED_TILE_COLOR;
      };

      const getStrokeColor = (feature) => {
        return '#e5e7eb';
      };

      const getAltitude = (feature) => {
        const countryName = getCountryName(feature);
        const baseAltitude = 0.006;
        return baseAltitude + altitudeNudge(countryName);
      };

      const getPointerPosition = (event) => {
        if (!event) return null;
        if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
          return { x: event.clientX, y: event.clientY };
        }
        if (event.changedTouches && event.changedTouches.length > 0) {
          const touch = event.changedTouches[0];
          return { x: touch.clientX, y: touch.clientY };
        }
        if (event.touches && event.touches.length > 0) {
          const touch = event.touches[0];
          return { x: touch.clientX, y: touch.clientY };
        }
        return null;
      };

      const showCountryLabel = (countryName, event) => {
        if (!countryLabel) return;
        const rect = container.getBoundingClientRect();
        const pointer = getPointerPosition(event);
        const x = pointer ? pointer.x - rect.left : rect.width / 2;
        const y = pointer ? pointer.y - rect.top : rect.height / 2;
        countryLabel.textContent = countryName || 'Unknown';
        countryLabel.style.display = 'block';
        countryLabel.style.left = x + 'px';
        countryLabel.style.top = y + 'px';
      };

      const hideCountryLabel = () => {
        if (!countryLabel) return;
        countryLabel.style.display = 'none';
      };

      const refreshPolygonStyles = () => {
        if (supportsCapMaterial) {
          globe.polygonCapMaterial(getCapMaterial);
        } else {
          globe.polygonCapColor(getCapColorFallback);
        }
        globe.polygonStrokeColor(getStrokeColor).polygonAltitude(getAltitude);
      };

      const polygonLayer = globe
        .polygonsData((world && world.features) || [])
        .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
        .polygonStrokeColor(getStrokeColor)
        .polygonAltitude(getAltitude)
        .polygonLabel(() => '')
        .onPolygonClick((feature, event) => {
          const countryName = getCountryName(feature) || 'Unknown';
          const clickedCountryName = normalizeCountryName(countryName);
          if (selectedCountryName && clickedCountryName === selectedCountryName) {
            selectedCountryName = '';
            refreshPolygonStyles();
            hideCountryLabel();
            return;
          }
          selectedCountryName = clickedCountryName;
          refreshPolygonStyles();
          showCountryLabel(countryName, event);
        })
        .onGlobeClick(() => {
          selectedCountryName = '';
          refreshPolygonStyles();
          hideCountryLabel();
        });

      if (supportsCapMaterial) {
        polygonLayer.polygonCapMaterial(getCapMaterial);
      } else {
        polygonLayer.polygonCapColor(getCapColorFallback);
      }

      const stabilizePolygonDepth = () => {
        const scene = globe.scene && globe.scene();
        if (!scene) {
          return;
        }

        scene.traverse((obj) => {
          if (!obj || !obj.material) {
            return;
          }

          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((mat) => {
            if (!mat) {
              return;
            }
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = -1;
            mat.polygonOffsetUnits = -1;
            if ('depthTest' in mat) mat.depthTest = true;
            if ('depthWrite' in mat) mat.depthWrite = true;
            if ('needsUpdate' in mat) mat.needsUpdate = true;
          });

          if (obj.isMesh) {
            obj.renderOrder = 1;
          } else if (obj.isLine || obj.isLineSegments) {
            obj.renderOrder = 2;
          }
        });
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(stabilizePolygonDepth);
      });

      globe.controls().autoRotate = false;
      globe.controls().enableZoom = true;
      globe.controls().enablePan = true;

      function resize() {
        globe.width(window.innerWidth);
        globe.height(window.innerHeight);
        tuneCameraForDepthPrecision();
      }

      resize();
      window.addEventListener('resize', resize);
    </script>
  </body>
</html>
  `;
}

export function VisitedGlobe({
  visitedCountries,
  friendVisitedCountries = [],
  height = 340,
}: VisitedGlobeProps) {
  const source = useMemo(
    () => ({
      html: buildGlobeHtml(visitedCountries, friendVisitedCountries),
      baseUrl: 'https://unpkg.com/',
    }),
    [visitedCountries, friendVisitedCountries]
  );

  return (
    <View style={[styles.wrapper, { height }]}>
      <WebView
        source={source}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 340,
    overflow: 'hidden',
    backgroundColor: '#f6f8fb',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
