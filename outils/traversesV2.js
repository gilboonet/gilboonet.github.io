// Interlock Traverse
// Gilbert Duval - 2021-12-03
const jscad = require('@jscad/modeling')
// https://openjscad.xyz/docs/module-modeling_primitives.html
const { rectangle } = jscad.primitives

const { rotate, translate } = jscad.transforms
// https://openjscad.xyz/docs/module-modeling_booleans.html
const { subtract } = jscad.booleans

function main({
  //@jscad-params
  // Interlock Traverse
  width = 100, // Width
  height = 40, // height
  thickness = 6, // Thickness
  notches = "3;10", // Notches 
  count = 1, // Count
}) {

  const dataNotches = notches.split(";")
  console.log(dataNotches)
  const traverse = rectangle({size:[width, height]})

  return traverse
}

module.exports = { main } // eslint-disable-line
