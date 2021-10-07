// EDITEUR COLONNE 

const { rectangle } = require('@jscad/modeling').primitives
const { intersect, subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear, extrudeRectangular, extrudeRotate } = require('@jscad/modeling').extrusions
const { rotate, translate } = require('@jscad/modeling').transforms
const { degToRad } = require('@jscad/modeling').utils

const getParameterDefinitions = () => {
  return [
    {name: 'ep', caption: 'Epaisseur:', type: 'float', initial: 4},
    {name: 'largeur', caption: 'Largeur:', type: 'float', initial: 20},
    {name: 'profondeur', caption: 'Profondeur:', type: 'float', initial: 20},
    {name: 'hauteurs', caption: 'Hauteurs:', type: 'text', initial: '20, 10'}
   ];
}

const etage = (l, h, ep) => {
  let fond = rectangle({size: [l, h]})
  return subtract(fond, rectangle({size: [l-ep, h-ep]}))
}

const main = (params) => {
  
  let hauteur = params.hauteurs.split(',').map(Number)
  console.log(hauteur)

  let face = null  
  while(hauteur.length > 1){
    if(face === null)
      face = etage(params.largeur, hauteur[0], params.ep)
    etg = etage(params.largeur, hauteur[1], params.ep)
    
  face = union(
    translate([0, -hauteur[1]/2 + params.ep/4], face),
    translate([0,  hauteur[0]/2 - params.ep/4], etg)
   )
   hauteur[0] = hauteur[0] + hauteur[1] - params.ep/2
   hauteur.splice(1,1)
  }
  
  let vol = extrudeLinear({height: params.profondeur}, face)
  vol = rotate([degToRad(90),0,0], vol) 
  vol = translate([0,0,hauteur[0]/2], vol)
  
  return vol
}

 
module.exports = { main, getParameterDefinitions }
