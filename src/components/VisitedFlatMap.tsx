import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import worldGeoJsonData from '../data/world.json';

type VisitedFlatMapProps = {
  visitedCountries: string[];
};

function buildFlatMapHtml(visitedCountries: string[]) {
  const visitedJson = JSON.stringify(visitedCountries);
  const worldGeoJson = JSON.stringify(worldGeoJsonData);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, #flatMap {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #f8fafc;
        touch-action: none;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      .tooltip {
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
    <script src="https://unpkg.com/d3@7/dist/d3.min.js"></script>
  </head>
  <body>
    <div id="flatMap"></div>
    <div id="tooltip" class="tooltip"></div>
    <script>
      const visited = ${visitedJson};
      const world = ${worldGeoJson};
      const visitedSet = new Set(visited.map((name) => {
        const n = (name || '').trim().toLowerCase();
        return n === 'cabo verde' ? 'cape verde' : n;
      }));

      const host = document.getElementById('flatMap');
      const tooltip = document.getElementById('tooltip');
      const svg = d3.select(host).append('svg');
      const layer = svg.append('g');
      const stretchedLayer = layer.append('g');
      const VERTICAL_STRETCH = 1;
      const POLAR_X_STRETCH = 0.5;
      const POLAR_Y_STRETCH = 0.5;
      const HORIZONTAL_MAP_PADDING = 10;
      let viewportWidth = 0;
      let viewportHeight = 0;
      let mapMinX = 0;
      let mapMinY = 0;
      let mapBaseWidth = 0;
      let mapBaseHeight = 0;
      let mapBaseLeft = 0;
      let mapBaseTop = 0;
      let mapBaseRight = 0;
      let mapBaseBottom = 0;
      let currentTransform = d3.zoomIdentity;

      const getCountryName = (feature) => {
        if (!feature || !feature.properties) return '';
        const p = feature.properties;
        const name = p.NAME || p.ADMIN || p.name || p.NAME_LONG || '';
        const n = (name || '').trim().toLowerCase();
        return n === 'cabo verde' ? 'cape verde' : n;
      };

      const projection = d3.geoNaturalEarth1();
      const path = d3.geoPath(projection);
      let visibleFeatures = [];

      function createPolarStretchedPath(width, height) {
        const transform = d3.geoTransform({
          point(lon, lat) {
            const projected = projection([lon, lat]);
            if (!projected) return;

            const latNorm = Math.min(1, Math.abs(lat) / 90);
            const xStretch = 1 + POLAR_X_STRETCH * latNorm * latNorm;
            const yStretch = 1 + POLAR_Y_STRETCH * latNorm * latNorm;
            const x = width / 2 + (projected[0] - width / 2) * xStretch;
            const y = height / 2 + (projected[1] - height / 2) * yStretch;
            this.stream.point(x, y);
          },
        });

        return d3.geoPath(transform);
      }

      function applyVerticalStretch() {
        const tx = (viewportWidth - mapBaseWidth) / 2 - mapMinX;
        const ty = (viewportHeight - mapBaseHeight) / 2 - mapMinY * VERTICAL_STRETCH;
        stretchedLayer.attr('transform', 'matrix(1,0,0,' + VERTICAL_STRETCH + ',' + tx + ',' + ty + ')');

        mapBaseLeft = (viewportWidth - mapBaseWidth) / 2;
        mapBaseTop = (viewportHeight - mapBaseHeight) / 2;
        mapBaseRight = mapBaseLeft + mapBaseWidth;
        mapBaseBottom = mapBaseTop + mapBaseHeight;
      }

      function render() {
        const width = host.clientWidth || 600;
        const height = host.clientHeight || 340;
        viewportWidth = width;
        viewportHeight = height;

        svg.attr('viewBox', [0, 0, width, height]);
        const allFeatures = (world && world.features) || [];
        visibleFeatures = allFeatures.filter((feature) => {
          const rawName =
            (feature &&
              feature.properties &&
              (feature.properties.NAME ||
                feature.properties.ADMIN ||
                feature.properties.name ||
                feature.properties.NAME_LONG)) ||
            '';
          const normalized = (rawName || '').trim().toLowerCase();
          return normalized !== 'antarctica';
        });

        projection.fitExtent(
          [
            [HORIZONTAL_MAP_PADDING, 0],
            [Math.max(HORIZONTAL_MAP_PADDING + 1, width - HORIZONTAL_MAP_PADDING), height],
          ],
          {
            type: 'FeatureCollection',
            features: visibleFeatures,
          }
        );

        const polarPath = createPolarStretchedPath(width, height);
        const polarBounds = polarPath.bounds({
          type: 'FeatureCollection',
          features: visibleFeatures,
        });
        mapMinX = polarBounds[0][0] || 0;
        mapMinY = polarBounds[0][1] || 0;
        mapBaseWidth = Math.max(1, (polarBounds[1][0] || width) - mapMinX);
        mapBaseHeight = Math.max(
          1,
          ((polarBounds[1][1] || height) - mapMinY) * VERTICAL_STRETCH
        );

        applyVerticalStretch();

        stretchedLayer.selectAll('path.country')
          .data(visibleFeatures)
          .join('path')
          .attr('class', 'country')
          .attr('d', polarPath)
          .attr('fill', (d) => visitedSet.has(getCountryName(d)) ? '#2563eb' : '#9ca3af')
          .attr('stroke', '#e5e7eb')
          .attr('stroke-width', 0.45)
          .attr('vector-effect', 'non-scaling-stroke')
          .on('click', (event, d) => {
            const rawName = ((d && d.properties && (d.properties.NAME || d.properties.ADMIN || d.properties.name || d.properties.NAME_LONG)) || 'Unknown');
            tooltip.textContent = rawName;
            tooltip.style.display = 'block';
            tooltip.style.left = event.clientX + 'px';
            tooltip.style.top = event.clientY + 'px';
          });

        if (currentTransform.k <= 1.0001) {
          currentTransform = d3.zoomIdentity;
        }
        layer.attr('transform', currentTransform.toString());
      }

      function clampTransform(transform) {
        if (!viewportWidth || !viewportHeight) return transform;

        const k = Math.max(1, transform.k);
        if (k <= 1.0001) {
          return d3.zoomIdentity;
        }

        const scaledWidth = mapBaseWidth * k;
        const scaledHeight = mapBaseHeight * k;

        const minX = viewportWidth - k * mapBaseRight;
        const maxX = -k * mapBaseLeft;
        const minY = viewportHeight - k * mapBaseBottom;
        const maxY = -k * mapBaseTop;

        const clampAxis = (value, min, max) => {
          // If the content is smaller than the viewport on this axis, keep it centered.
          if (min > max) {
            return (min + max) / 2;
          }
          return Math.min(max, Math.max(min, value));
        };

        const x = clampAxis(transform.x, minX, maxX);
        const y = clampAxis(transform.y, minY, maxY);
        return d3.zoomIdentity.translate(x, y).scale(k);
      }

      const zoom = d3.zoom()
        .scaleExtent([1, 14])
        .on('zoom', (event) => {
          const clamped = clampTransform(event.transform);
          if (
            Math.abs(clamped.x - event.transform.x) > 0.001 ||
            Math.abs(clamped.y - event.transform.y) > 0.001 ||
            Math.abs(clamped.k - event.transform.k) > 0.001
          ) {
            svg.call(zoom.transform, clamped);
            return;
          }

          currentTransform = clamped;
          layer.attr('transform', currentTransform.toString());
        });

      svg.call(zoom);

      let lastTouchX = null;
      svg.on('touchstart', (event) => {
        if (currentTransform.k <= 1.01 && event.touches && event.touches.length === 1) {
          lastTouchX = event.touches[0].clientX;
        } else {
          lastTouchX = null;
        }
      });

      svg.on('touchmove', (event) => {
        if (currentTransform.k > 1.01) {
          return;
        }
        if (!event.touches || event.touches.length !== 1 || lastTouchX === null) return;
        const x = event.touches[0].clientX;
        const dx = x - lastTouchX;
        lastTouchX = x;

        if (Math.abs(dx) < 1) return;
        const factor = Math.exp(dx * 0.01);
        svg.call(zoom.scaleBy, factor);
        event.preventDefault();
      });

      svg.on('touchend', () => {
        lastTouchX = null;
      });

      svg.on('click', (event) => {
        if (event.target && event.target.tagName !== 'path') {
          tooltip.style.display = 'none';
        }
      });

      render();
      window.addEventListener('resize', render);
    </script>
  </body>
</html>
  `;
}

export function VisitedFlatMap({ visitedCountries }: VisitedFlatMapProps) {
  const source = useMemo(
    () => ({
      html: buildFlatMapHtml(visitedCountries),
      baseUrl: 'https://unpkg.com/',
    }),
    [visitedCountries]
  );

  return (
    <View style={styles.wrapper}>
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
    backgroundColor: '#f8fafc',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
