import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import worldGeoJsonData from '../data/world.json';

type VisitedGlobeProps = {
  visitedCountries: string[];
  height?: number;
};

function buildGlobeHtml(visitedCountries: string[]) {
  const visitedJson = JSON.stringify(visitedCountries);
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
    </style>
    <script src="https://unpkg.com/three@0.157.0/build/three.min.js"></script>
    <script src="https://unpkg.com/globe.gl@2.41.1/dist/globe.gl.min.js"></script>
  </head>
  <body>
    <div id="globeViz"></div>
    <script>
      const visited = ${visitedJson};
      const world = ${worldGeoJson};
      const normalizeCountryName = (name) => {
        const normalized = (name || '').trim().toLowerCase();
        if (normalized === 'cape verde' || normalized === 'cabo verde') return 'cape verde';
        return normalized;
      };

      const visitedSet = new Set(visited.map((country) => normalizeCountryName(country)));

      const container = document.getElementById('globeViz');
      const globe = Globe({ rendererConfig: { logarithmicDepthBuffer: true } })(container)
        .backgroundColor('#f6f8fb')
        .showGlobe(true)
        .showAtmosphere(false);

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

      globe
        .polygonsData((world && world.features) || [])
        .polygonCapColor((feature) => {
          const countryName = getCountryName(feature);
          return visitedSet.has(normalizeCountryName(countryName)) ? '#2563eb' : '#9ca3af';
        })
        .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
        .polygonStrokeColor(() => '#e5e7eb')
        .polygonAltitude((feature) => {
          const countryName = getCountryName(feature);
          const baseAltitude = 0.006;
          return baseAltitude + altitudeNudge(countryName);
        })
        .polygonLabel((feature) => {
          const countryName = getCountryName(feature) || 'Unknown';
          return '<b>' + countryName + '</b>';
        });

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
  height = 340,
}: VisitedGlobeProps) {
  const source = useMemo(
    () => ({
      html: buildGlobeHtml(visitedCountries),
      baseUrl: 'https://unpkg.com/',
    }),
    [visitedCountries]
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
