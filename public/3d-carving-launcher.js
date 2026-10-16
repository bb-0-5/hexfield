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
    try {
      sessionStorage.setItem('hexfield:volumetric-source',
        JSON.stringify({text: word, colors}));
    } catch {}
  });
})();
