import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import worldGeoJsonData from '../data/world.json';

type VisitedFlatMapProps = {
  visitedCountries: string[];
  friendVisitedCountries?: string[];
  height?: number;
};

function buildFlatMapHtml(visitedCountries: string[], friendVisitedCountries: string[]) {
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
      html, body, #flatMap {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #f6f8fb;
        touch-action: none;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 420ms ease, transform 420ms ease;
      }
      svg.ready {
        opacity: 1;
        transform: translateY(0);
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
      const friendVisited = ${friendVisitedJson};
      const world = ${worldGeoJson};
      const normalizeCountryName = (name) => {
        const n = (name || '').trim().toLowerCase();
        return n === 'cabo verde' || n === 'cape verde' ? 'cape verde' : n;
      };
      const visitedSet = new Set(visited.map((name) => normalizeCountryName(name)));
      const friendVisitedSet = new Set(friendVisited.map((name) => normalizeCountryName(name)));

      const host = document.getElementById('flatMap');
      const tooltip = document.getElementById('tooltip');
      const svg = d3.select(host).append('svg');
      const defs = svg.append('defs');
      const layer = svg.append('g');
      const stretchedLayer = layer.append('g');
      const VERTICAL_STRETCH = 1;
      const POLAR_X_STRETCH = 0.5;
      const POLAR_Y_STRETCH = 0.5;
      const HORIZONTAL_MAP_PADDING = 10;
      const VISITED_TILE_COLOR = '#2563eb';
      const FRIEND_TILE_COLOR = '#ef4444';
      const UNVISITED_TILE_COLOR = '#b3bac6';
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
      let selectedCountryName = null;

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

      const appendOverlapPattern = (id, first, second) => {
        const TILE_SIZE = 32;
        const STRIPE_SPACING = 8;
        const STRIPE_WIDTH = 4;
        const pattern = defs
          .append('pattern')
          .attr('id', id)
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('width', TILE_SIZE)
          .attr('height', TILE_SIZE);

        pattern.append('rect').attr('width', TILE_SIZE).attr('height', TILE_SIZE).attr('fill', first);

        for (let x = -TILE_SIZE; x <= TILE_SIZE * 2; x += STRIPE_SPACING) {
          pattern
            .append('line')
            .attr('x1', x)
            .attr('y1', 0)
            .attr('x2', x - TILE_SIZE)
            .attr('y2', TILE_SIZE)
            .attr('stroke', second)
            .attr('stroke-width', STRIPE_WIDTH);
        }
      };

      appendOverlapPattern('overlap-stripes', VISITED_TILE_COLOR, FRIEND_TILE_COLOR);
      appendOverlapPattern('overlap-stripes-selected', darkenHex(VISITED_TILE_COLOR), darkenHex(FRIEND_TILE_COLOR));

      const getCountryName = (feature) => {
        if (!feature || !feature.properties) return '';
        const p = feature.properties;
        const name = p.NAME || p.ADMIN || p.name || p.NAME_LONG || '';
        return normalizeCountryName(name);
      };

      const getCountryStatus = (feature) => {
        const countryName = getCountryName(feature);
        const isVisitedByUser = visitedSet.has(countryName);
        const isVisitedByFriend = friendVisitedSet.has(countryName);
        if (isVisitedByUser && isVisitedByFriend) return 'both';
        if (isVisitedByUser) return 'user';
        if (isVisitedByFriend) return 'friend';
        return 'none';
      };

      const getCountryFill = (feature) => {
        const status = getCountryStatus(feature);
        const countryName = getCountryName(feature);
        const isSelected = selectedCountryName && countryName === selectedCountryName;

        if (status === 'both') {
          return isSelected ? 'url(#overlap-stripes-selected)' : 'url(#overlap-stripes)';
        }
        if (status === 'user') {
          return isSelected ? darkenHex(VISITED_TILE_COLOR) : VISITED_TILE_COLOR;
        }
        if (status === 'friend') {
          return isSelected ? darkenHex(FRIEND_TILE_COLOR) : FRIEND_TILE_COLOR;
        }
        return isSelected ? darkenHex(UNVISITED_TILE_COLOR) : UNVISITED_TILE_COLOR;
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

      function updateCountryVisualState() {
        stretchedLayer.selectAll('path.country')
          .attr('fill', (d) => getCountryFill(d))
          .attr('stroke', (d) => {
            return '#e5e7eb';
          })
          .attr('stroke-width', (d) => {
            const countryName = getCountryName(d);
            return selectedCountryName && countryName === selectedCountryName ? 1.2 : 0.45;
          });
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
          .attr('vector-effect', 'non-scaling-stroke')
          .on('click', (event, d) => {
            const rawName = ((d && d.properties && (d.properties.NAME || d.properties.ADMIN || d.properties.name || d.properties.NAME_LONG)) || 'Unknown');
            const clickedCountryName = getCountryName(d);
            if (selectedCountryName && clickedCountryName === selectedCountryName) {
              selectedCountryName = null;
              updateCountryVisualState();
              tooltip.style.display = 'none';
              event.stopPropagation();
              return;
            }
            selectedCountryName = clickedCountryName;
            updateCountryVisualState();
            tooltip.textContent = rawName;
            tooltip.style.display = 'block';
            tooltip.style.left = event.clientX + 'px';
            tooltip.style.top = event.clientY + 'px';
            event.stopPropagation();
          });

        updateCountryVisualState();

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
          selectedCountryName = null;
          updateCountryVisualState();
          tooltip.style.display = 'none';
        }
      });

      render();
      requestAnimationFrame(() => {
        svg.classed('ready', true);
      });
      window.addEventListener('resize', render);
    </script>
  </body>
</html>
  `;
}

export function VisitedFlatMap({
  visitedCountries,
  friendVisitedCountries = [],
  height = 340,
}: VisitedFlatMapProps) {
  const source = useMemo(
    () => ({
      html: buildFlatMapHtml(visitedCountries, friendVisitedCountries),
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
