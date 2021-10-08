// EDITEUR CARRE DE NICHES 

const { rectangle } = require('@jscad/modeling').primitives
const { intersect, subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear, extrudeRectangular, extrudeRotate } = require('@jscad/modeling').extrusions
const { rotateX, translate, translateZ } = require('@jscad/modeling').transforms
const { degToRad } = require('@jscad/modeling').utils

const getParameterDefinitions = () => {
  return [
    {name: 'ep',         caption: 'Epaisseur:',   type: 'float', initial: 4},
    {name: 'largeur',    caption: 'Largeur:',     type: 'float', initial: 20},
    {name: 'hauteur',    caption: 'Hauteur:',     type: 'float', initial: 20},
    {name: 'profondeur', caption: 'Profondeur:',  type: 'float', initial: 20}
   ];
}

const niche = (l, h, ep) => {
  let fond = rectangle({size: [l, h]})
  return subtract(fond, rectangle({size: [l-ep, h-ep]}))
}

const main = (params) => {
  
  face = niche(params.largeur, params.hauteur, params.ep)
  
  face =  union(face, translate([params.largeur - params.ep/2], face))
  face =  union(face, translate([0, params.hauteur - params.ep/2], face))


  let vol = extrudeLinear({height: params.profondeur}, face)
  vol = rotateX(degToRad(90), vol) 
  vol = translateZ(params.hauteur/2, vol)
  
  return vol
}

 
module.exports = { main, getParameterDefinitions }
