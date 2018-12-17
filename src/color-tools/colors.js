const selectElements = name => {
  const display = document.getElementById(`display-${name}`);
  return {
    display,
    input: document.getElementById(`input-${name}`),
    picker: document.getElementById(`picker-${name}`),
    examples: Array.from(document.getElementsByClassName(`example-${name}`)),
    output: {
      hex: display.getElementsByClassName("output-hex")[0],
      rgb: display.getElementsByClassName("output-rgb")[0],
      hsl: display.getElementsByClassName("output-hsl")[0]
    }
  };
};

const alpha = selectElements("alpha");
const beta = selectElements("beta");
const contrastRatio = document.getElementById("contrast-ratio");

const defaultAlphaColor = one.color("#dea");
const defaultBetaColor = one.color("#222");

// create favicon canvas
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 16;
canvas.height = 16;
document.body.appendChild(canvas);

const normalizeValue = value => (value ? value.trim() : value);

const getColor = value => one.color(normalizeValue(value));

const toggleClass = (element, conditions) => {
  Object.entries(conditions).forEach(
    ([key, value]) =>
      value ? element.classList.add(key) : element.classList.remove(key)
  );
};

const updateContrastRatio = () => {
  const alphaColor = getColor(alpha.input.value) || defaultAlphaColor;
  const betaColor = getColor(beta.input.value) || defaultBetaColor;

  // update contrast ratio
  const contrast = alphaColor.contrast(betaColor);
  contrastRatio.innerText = Math.round(contrast * 100) / 100;

  toggleClass(contrastRatio, {
    "wcag-aaa": contrast >= 7.1,
    "wcag-aa": contrast >= 4.5,
    "wcag-fail": contrast < 4.5
  });
};

const updateFavicon = () => {
  const alphaColor = getColor(alpha.input.value) || defaultAlphaColor;
  const betaColor = getColor(beta.input.value) || defaultBetaColor;

  ctx.clearRect(0, 0, 16, 16);

  ctx.fillStyle = alphaColor.hex();
  ctx.fillRect(0, 0, 8, 16);

  ctx.fillStyle = betaColor.hex();
  ctx.fillRect(8, 0, 8, 16);

  document.getElementById("favicon").setAttribute("href", canvas.toDataURL());
};

const toHSL = color => {
  const hue = Math.round(color.hue() * 360);
  // eslint-disable-next-line no-underscore-dangle
  const saturation = Math.round(color.hsl()._saturation * 100);
  const lightness = Math.round(color.lightness() * 100);
  const alphaValue = color.alpha();
  if (alphaValue === 1) return `hsl(${hue},${saturation}%,${lightness}%)`;
  return `hsla(${hue},${saturation}%,${lightness}%,${alphaValue})`;
};

/* eslint-disable no-param-reassign */
const updateColor = (panel, otherPanel, color) => {
  panel.display.style.background = color.cssa();
  otherPanel.display.style.color = color.cssa();

  panel.output.rgb.innerText = color.alpha() === 1 ? color.css() : color.cssa();
  panel.output.hex.innerText = color.hex();
  panel.output.hsl.innerText = toHSL(color);
  panel.picker.value = color.hex();

  toggleClass(panel.display, {
    dark: color.isDark(),
    light: color.isLight()
  });

  if (alpha.input.value && beta.input.value) {
    // save state to url hash
    window.location.hash = encodeURIComponent(
      `${alpha.input.value}-and-${beta.input.value}`
    );
  }

  updateContrastRatio();
  updateFavicon();
};

const setInputValue = (panel, value) => {
  panel.input.value = value;
  panel.input.dispatchEvent(new Event("input"));
};

const preparePanels = (panel, otherPanel) => {
  panel.input.addEventListener("input", event => {
    const color = getColor(event.target.value);
    if (color) {
      updateColor(panel, otherPanel, color);
    }
  });

  panel.picker.addEventListener("input", event => {
    const color = getColor(event.target.value);
    if (color) {
      setInputValue(panel, event.target.value);
    }
  });

  panel.input.addEventListener("keyup", event => {
    // clear input on Escape
    const key = event.key || event.keyCode;
    if (key === "Escape" || key === "Esc" || key === 27) {
      panel.input.value = "";
    }
  });

  panel.examples.forEach(example => {
    example.addEventListener("click", () => {
      setInputValue(panel, example.innerText);
    });
  });

  Object.values(panel.output).forEach(output =>
    output.addEventListener("click", () => {
      // select output value on click
      window.getSelection().selectAllChildren(output);
    })
  );
};

preparePanels(alpha, beta);
preparePanels(beta, alpha);

updateColor(alpha, beta, defaultAlphaColor);
updateColor(beta, alpha, defaultBetaColor);

const { hash } = window.location;
if (hash) {
  // load state from URL hash
  const state = decodeURIComponent(hash.substring(1)).split("-and-");
  if (state.length === 2) {
    setInputValue(alpha, state[0]);
    setInputValue(beta, state[1]);
  }
}
