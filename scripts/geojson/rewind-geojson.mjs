#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

// run with "npm run geojson:rewind"

function signedRingArea(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return 0;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function sign(value) {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

function reverseRing(ring) {
  return [...ring].reverse();
}

function getDominantOuterSign(featureCollection) {
  let positives = 0;
  let negatives = 0;

  for (const feature of featureCollection.features || []) {
    const geometry = feature?.geometry;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      const outer = geometry.coordinates?.[0];
      const ringSign = sign(signedRingArea(outer));
      if (ringSign > 0) positives += 1;
      if (ringSign < 0) negatives += 1;
      continue;
    }

    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates || []) {
        const outer = polygon?.[0];
        const ringSign = sign(signedRingArea(outer));
        if (ringSign > 0) positives += 1;
        if (ringSign < 0) negatives += 1;
      }
    }
  }

  if (positives === 0 && negatives === 0) {
    throw new Error('No valid polygon rings found to infer winding direction.');
  }

  return negatives >= positives ? -1 : 1;
}

function rewindGeometry(geometry, expectedOuterSign) {
  let changedRings = 0;

  const maybeRewind = (ring, expectedSign) => {
    const currentSign = sign(signedRingArea(ring));
    if (currentSign !== 0 && currentSign !== expectedSign) {
      changedRings += 1;
      return reverseRing(ring);
    }
    return ring;
  };

  if (geometry.type === 'Polygon') {
    geometry.coordinates = (geometry.coordinates || []).map((ring, index) => {
      const expectedSign = index === 0 ? expectedOuterSign : -expectedOuterSign;
      return maybeRewind(ring, expectedSign);
    });
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates = (geometry.coordinates || []).map((polygon) =>
      (polygon || []).map((ring, index) => {
        const expectedSign = index === 0 ? expectedOuterSign : -expectedOuterSign;
        return maybeRewind(ring, expectedSign);
      })
    );
  }

  return changedRings;
}

function main() {
  const [, , inputArg, ...flags] = process.argv;
  if (!inputArg) {
    console.error('Usage: node scripts/geojson/rewind-geojson.mjs <geojson-path> [--write]');
    process.exit(1);
  }

  const write = flags.includes('--write');
  const inputPath = path.resolve(process.cwd(), inputArg);
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);

  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection.');
  }

  const expectedOuterSign = getDominantOuterSign(data);
  let changedRings = 0;
  let touchedFeatures = 0;

  for (const feature of data.features) {
    const geometry = feature?.geometry;
    if (!geometry) continue;
    if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') continue;

    const changedInFeature = rewindGeometry(geometry, expectedOuterSign);
    if (changedInFeature > 0) {
      touchedFeatures += 1;
      changedRings += changedInFeature;
    }
  }

  const directionName = expectedOuterSign < 0 ? 'clockwise' : 'counterclockwise';
  console.log(
    `Detected dominant outer-ring winding: ${directionName}. Rewound ${changedRings} ring(s) across ${touchedFeatures} feature(s).`
  );

  if (write && changedRings > 0) {
    fs.writeFileSync(inputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`Updated: ${inputPath}`);
  } else if (!write) {
    console.log('Dry run only. Re-run with --write to persist changes.');
  } else {
    console.log('No file changes were needed.');
  }
}

main();
