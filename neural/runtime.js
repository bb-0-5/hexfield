(function () {
  "use strict";

  const MODEL_URL = "/models/hexfield-strokes-v2.json";
  const UINT32 = 4294967296;
  const COORDINATE_SPACE = "glyph-local-normalized";
  const LATENT_AXES = Object.freeze(["x-warp", "y-warp", "wave", "bend"]);
  let model = null;
  let loadError = null;

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const clamp01 = (value) => clamp(Number.isFinite(Number(value)) ? Number(value) : 0.5, 0, 1);
  const rounded = (value) => Math.round(Number(value) * 100000) / 100000;

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / UINT32;
    };
  }

  function hashText(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function curveValue(rule) {
    if (rule === "straight") return -1;
    if (rule === "circle") return 1;
    if (rule === "curved") return 0.55;
    return 0;
  }

  function normalizeMode(rendererMode) {
    const requested = String(rendererMode || "neural-painted");
    return model?.rendererModes?.includes(requested) ? requested : "neural-painted";
  }

  function baseStyle(program) {
    return [
      clamp01(program?.widthAxis) * 2 - 1,
      clamp01(program?.xHeight) * 2 - 1,
      clamp(Number(program?.slant) || 0, -0.5, 0.5) * 2,
      curveValue(program?.curveRule),
      clamp01(program?.jitter) * 2 - 1,
      clamp01(program?.penWeight) * 2 - 1,
    ];
  }

  function infer(input) {
    const { inputSize, hiddenSize, maxCommands, commandSize, weights } = model;
    if (input.length !== inputSize) throw new Error("neural conditioning has the wrong size");
    const hidden = new Float32Array(hiddenSize);
    for (let h = 0; h < hiddenSize; h++) {
      let sum = weights.b1[h];
      for (let i = 0; i < inputSize; i++) sum += input[i] * weights.w1[i * hiddenSize + h];
      hidden[h] = Math.tanh(sum);
    }
    const outputSize = maxCommands * commandSize;
    const output = new Float32Array(outputSize);
    for (let o = 0; o < outputSize; o++) {
      let sum = weights.b2[o];
      for (let h = 0; h < hiddenSize; h++) sum += hidden[h] * weights.w2[h * outputSize + o];
      output[o] = sum;
    }
    return output;
  }

  function decodeCommands(glyph, rendererMode, style) {
    const glyphIndex = model.glyphs.indexOf(String(glyph || "O").toUpperCase());
    const mode = normalizeMode(rendererMode);
    const input = new Float32Array(model.inputSize);
    input[glyphIndex >= 0 ? glyphIndex : model.glyphs.indexOf("O")] = 1;
    input[model.glyphs.length + model.rendererModes.indexOf(mode)] = 1;
    input.set(style, model.glyphs.length + model.modeSize);
    const output = infer(input);
    const commands = [];
    for (let step = 0; step < model.maxCommands; step++) {
      const offset = step * model.commandSize;
      let token = 0;
      for (let index = 1; index < 4; index++) {
        if (output[offset + index] > output[offset + token]) token = index;
      }
      if (token === 0) continue;
      const values = Array.from(output.slice(offset + 4, offset + 8), (value) => clamp(value, -0.45, 1.45));
      if (token === 1) commands.push(["M", values[0], values[1]]);
      else if (token === 2) commands.push(["L", values[0], values[1]]);
      else commands.push(["Q", values[0], values[1], values[2], values[3]]);
    }
    if (!commands.length || commands[0][0] !== "M") return null;
    const strokes = [];
    let stroke = null;
    for (const command of commands) {
      if (command[0] === "M") {
        stroke = [command];
        strokes.push(stroke);
      } else if (stroke) {
        stroke.push(command);
      }
    }
    return strokes.filter((item) => item.length > 1);
  }

  function createStrokeSession(text, program, rendererMode = "neural-painted", rng = Math.random) {
    if (!model) return null;
    const mode = normalizeMode(rendererMode);
    const latentSeed = Math.floor(clamp01(rng()) * 0xffffffff) >>> 0;
    const random = mulberry32(latentSeed ^ hashText(text) ^ hashText(mode));
    const latentVector = Array.from({ length: model.latentSize }, () => random() * 2 - 1);
    const style = baseStyle(program);
    const decoded = new Map();
    const strokeSequence = [];
    const metadata = {
      model_version: model.version,
      backend: "synchronous-js-mlp-v2",
      coordinate_space: COORDINATE_SPACE,
      latent_axes: LATENT_AXES.slice(),
      latent_seed: latentSeed,
      latent_vector: latentVector.map(rounded),
      conditioning: {
        renderer_mode: mode,
        width: rounded(style[0]), height: rounded(style[1]), slant: rounded(style[2]),
        curve: rounded(style[3]), jitter: rounded(style[4]), pen: rounded(style[5]),
      },
      stroke_sequence: strokeSequence,
    };

    return {
      metadata,
      decode(glyph, index) {
        const key = index + ":" + glyph;
        if (decoded.has(key)) return decoded.get(key);
        const glyphNoise = mulberry32(latentSeed ^ hashText(glyph) ^ Math.imul(index + 1, 0x9e3779b9));
        const glyphLatent = latentVector.map((value) =>
          clamp(value * 0.78 + (glyphNoise() * 2 - 1) * 0.22, -1, 1));
        const strokes = decodeCommands(glyph, mode, style.concat(glyphLatent));
        decoded.set(key, strokes);
        if (strokes) {
          strokeSequence[index] = {
            glyph,
            commands: strokes.flat().map((command) => command.map((value, at) => at ? rounded(value) : value)),
          };
        }
        return strokes;
      },
    };
  }

  function status() {
    if (model) return {
      ready: true,
      label: "neural strokes ready - " + model.version + " - 3 learned modes",
      version: model.version,
      metrics: model.metrics,
      modes: model.rendererModes,
      backend: "synchronous-js-mlp-v2",
      coordinateSpace: COORDINATE_SPACE,
      latentAxes: LATENT_AXES.slice(),
    };
    if (loadError) return { ready: false, label: "neural model unavailable - procedural fallback", error: loadError.message };
    return { ready: false, label: "neural stroke model warming..." };
  }

  const ready = fetch(MODEL_URL, { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("model HTTP " + response.status);
      return response.json();
    })
    .then((loaded) => {
      if (loaded?.schema !== "hexfield-neural-strokes-v2" ||
          !Array.isArray(loaded?.weights?.w1) || loaded?.rendererModes?.length !== 3) {
        throw new Error("invalid neural v2 model");
      }
      model = loaded;
      window.dispatchEvent(new CustomEvent("hexfield-neural-ready", { detail: status() }));
      return status();
    })
    .catch((error) => {
      loadError = error;
      console.warn("neural stroke model unavailable", error);
      window.dispatchEvent(new CustomEvent("hexfield-neural-error", { detail: status() }));
      return status();
    });

  window.HexfieldNeural = {
    get ready() { return Boolean(model); },
    whenReady: ready,
    status,
    createStrokeSession,
  };
})();
