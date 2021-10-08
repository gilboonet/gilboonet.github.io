// EDITEUR ESCALIER DE NICHES 

const { rectangle } = require('@jscad/modeling').primitives
const { intersect, subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear, extrudeRectangular, extrudeRotate } = require('@jscad/modeling').extrusions
const { rotateX, translate, translateX, translateY, translateZ, center } = require('@jscad/modeling').transforms
const { degToRad } = require('@jscad/modeling').utils

const getParameterDefinitions = () => {
  return [
    {name: 'ep',         caption: 'Epaisseur:',   type: 'float', initial: 4},
    {name: 'largeur',    caption: 'Largeur:',     type: 'float', initial: 20},
    {name: 'hauteur',    caption: 'Hauteur:',     type: 'float', initial: 20},
    {name: 'profondeur', caption: 'Profondeur:',  type: 'float', initial: 20},
    {name: 'nb',         caption: 'Nb Marches:',   type: 'float', initial: 3}
   ];
}

const niche = (l, h, ep) => {
  let fond = rectangle({size: [l, h]})
  return subtract(fond, rectangle({size: [l-ep, h-ep]}))
}

const main = (params) => {
  let niche0 = niche(params.largeur, params.hauteur, params.ep)
  face = niche0
  for(let i = 1; i< params.nb; i++)
  {
    nicheN = niche0
    for(j = 0; j < i; j++){
      dy = params.hauteur - params.ep/2
      nicheN = union(nicheN, translateY(dy, nicheN))     
    }
    dx = (params.largeur - params.ep/2)*i
    face = union(face, translateX(dx, nicheN))
  }

  let vol = extrudeLinear({height: params.profondeur}, face)
  vol = rotateX(degToRad(90), vol) 
  vol = translateZ(params.hauteur/2, vol)
  
  return center(true, vol)
}
 
module.exports = { main, getParameterDefinitions }
