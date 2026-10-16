/* Pass a small colour signature from Hexfield's existing canvas to the
 * separate physical CSG engraving experiment. The painter is not modified. */
(function () {
  'use strict';
  const launch = document.getElementById('open3DCut');
  if (!launch) return;
  const hex = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  launch.addEventListener('click', () => {
    const word = window.HexfieldCarving?.cleanText?.(
      document.getElementById('letteringText')?.value || 'HEXFIELD'
    ) || 'HEXFIELD';
    const colors = [];
    try {
      const stage = document.getElementById('view');
      if (stage?.width && stage?.height) {
        const sample = document.createElement('canvas');
        sample.width = 64; sample.height = 24;
        const context = sample.getContext('2d', {willReadFrequently: true});
        context.drawImage(stage, 0, 0, 64, 24);
        const pixels = context.getImageData(0, 0, 64, 24).data;
        const buckets = new Map();
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          if (pixels[i + 3] < 180) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          if (max - min < 23 || max > 245 || max < 45) continue;
          const key = [r, g, b].map(x => Math.round(x / 32) * 32).join(',');
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        [...buckets].sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([key]) => {
          colors.push('#' + key.split(',').map(v => hex(+v)).join(''));
        });
      }
    } catch {
      // A tainted canvas or storage quota issue must not prevent navigation.
    }
    let sourceImage = null;
    let sourceKind = 'unavailable';
    try {
      // Capture the actual, untouched material quarry. The visible #view
      // already contains the old flat cut and would duplicate the letters.
      const uncutStack = window.__hexfield?.carving?.getStack?.()?.canvas;
      const artwork = uncutStack?.width && uncutStack?.height
        ? uncutStack : document.getElementById('view');
      sourceKind = uncutStack?.width ? 'uncut-hexfield-shapes' : 'visible-canvas';
      if (artwork?.width && artwork?.height) {
        const capture = document.createElement('canvas');
        capture.width = 640; capture.height = 270;
        const context = capture.getContext('2d');
        context.fillStyle = '#13202a';
        context.fillRect(0, 0, capture.width, capture.height);
        const captureRatio = capture.width / capture.height;
        const originalRatio = artwork.width / artwork.height;
        if (originalRatio > captureRatio) {
          const croppedWidth = artwork.height * captureRatio;
          context.drawImage(artwork, (artwork.width - croppedWidth) / 2, 0,
            croppedWidth, artwork.height, 0, 0, capture.width, capture.height);
        } else {
          const croppedHeight = artwork.width / captureRatio;
          context.drawImage(artwork, 0, (artwork.height - croppedHeight) / 2,
            artwork.width, croppedHeight, 0, 0, capture.width, capture.height);
        }
        sourceImage = capture.toDataURL('image/jpeg', 0.74);
      }
    } catch {
      // Canvas can be tainted by a remote image. Original painter still works.
    }
    try {
      sessionStorage.setItem('hexfield:volumetric-source',
        JSON.stringify({text: word, colors, image: sourceImage, sourceKind}));
    } catch {}
  });
})();
