/** This script analyzes multiple color palettes to find/check whether there is a "magic number" between two color grades that ensures a sufficient WCAG contrast ratio */
const onecolor = require("onecolor");

// Color Palettes

// https://designsystem.digital.gov/design-tokens/color/system-tokens/
const paletteUSWDS = require("./palettes/uswds.json");

// https://github.com/IBM-Design/colors/blob/master/ibm-colors.json
const paletteIBMv1 = require("./palettes/ibm-v1.json");

// https://github.com/carbon-design-system/carbon/blob/master/packages/colors/scss/mixins.scss
const paletteIBMv2 = require("./palettes/ibm-v2.json");

// https://github.com/yeun/open-color/blob/master/open-color.json
const paletteOpenColor = require("./palettes/open-color.json");

// https://github.com/tailwindcss/tailwindcss
const paletteTailwind = require("./palettes/tailwind.json");

const allPalettes = [
  { name: "uswds", palette: paletteUSWDS },
  { name: "ibm-v1", palette: paletteIBMv1 },
  { name: "ibm-v2", palette: paletteIBMv2 },
  { name: "open-color", palette: paletteOpenColor },
  { name: "tailwind", palette: paletteTailwind }
];

// Create an array of { family, grade, hex } values
const flattenPalette = palette => {
  return Object.entries(palette).reduce(
    (acc1, [family, colors]) => [
      ...acc1,
      ...Object.entries(colors).reduce(
        (acc2, [name, hex]) => [
          ...acc2,
          { family, grade: name.substring(name.lastIndexOf("-") + 1), hex }
        ],
        []
      )
    ],
    []
  );
};

const verifyContrastRatio = (rawPalette, magicNumber) => {
  const palette = flattenPalette(rawPalette);

  const violations = [];

  palette.forEach(color1 => {
    palette.forEach(color2 => {
      const contrastRatio = onecolor(color1.hex).contrast(onecolor(color2.hex));

      if (color1.grade > color2.grade) {
        return; // don't compare same colors to each other
      }

      if (Math.abs(color1.grade - color2.grade) >= magicNumber.value) {
        if (contrastRatio < magicNumber.ratio) {
          violations.push({ color1, color2, contrastRatio });
        }
      }
    });
  });

  return violations;
};

/**
 Results:

 uswds: { 'WCAG AA (large text)': 40, 'WCAG AA': 50, 'WCAG AAA': 70 },
 ibm-v1: { 'WCAG AA (large text)': 50, 'WCAG AA': 60, 'WCAG AAA': 70 },
 ibm-v2: { 'WCAG AA (large text)': 50, 'WCAG AA': 60, 'WCAG AAA': 70 },
 open-color: { 'WCAG AA (large text)': '-', 'WCAG AA': '-', 'WCAG AAA': '-' },
 tailwind: { 'WCAG AA (large text)': 60, 'WCAG AA': 70, 'WCAG AAA': 80 }
 */
const calculateAllMagicNumbers = () => {
  const ratios = [
    { level: "WCAG AA (large text)", minRatio: 3 },
    { level: "WCAG AA", minRatio: 4.5 },
    { level: "WCAG AAA", minRatio: 7 }
  ];

  const magicNumbers = {};

  // Calculate the magic number to pass WCAG AA
  allPalettes.forEach(({ name, palette }) => {
    magicNumbers[name] = {};

    ratios.forEach(({ level, minRatio }) => {
      for (let i = 10; i < 100; i += 10) {
        const violations = verifyContrastRatio(palette, {
          value: i,
          ratio: minRatio
        });
        if (violations.length === 0) {
          magicNumbers[name][level] = i;
          return;
        }
      }
      magicNumbers[name][level] = "-";
    });
  });

  return magicNumbers;
};

const findViolations = (palette, magicNumber) =>
  verifyContrastRatio(palette, magicNumber).forEach(
    ({ color1, color2, contrastRatio }) =>
      console.log(
        `${color1.family}-${color1.grade} / ${color2.family}-${color2.grade} (${contrastRatio})`
      )
  );

const displayNumberOfColors = ({ name, palette }) => console.log(name, flattenPalette(palette).length);

// Uncomment to output all violations for a given palette and constraint
// findViolations(paletteIBMv2, { value: 50, ratio: 4.5 });

// Uncomment to calculate all magic numbers
console.log(calculateAllMagicNumbers());

// Uncomment to see the number of defined colors
// allPalettes.forEach(displayNumberOfColors);
