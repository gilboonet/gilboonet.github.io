/**
 * @description Création de pied de meuble galbé et gainé
 * @category Creating Shapes
 * @skillLevel 5
 * @tags extrude, slice, slices, extrudefromslices, callback
 * @authors Jeff Gay, Moissette Mark, Simon Clark, Gilbert Duval
 * @licence MIT License
 */
const jscad = require('@jscad/modeling')
const { circle } = jscad.primitives
const { translate, translateX, translateY } = jscad.transforms
const { geom2 } = jscad.geometries
const { extrudeFromSlices, slice } = jscad.extrusions
const { mat4 } = jscad.maths


const getParameterDefinitions = () => {
  return [
    { name: 'g1', type: 'group', caption: 'PIED' },
    { name: 'hauteur', type: 'int', initial: 40, min: 1, max: 100, step: 1, caption: 'Hauteur :' },
    { name: 'nb', type: 'int', initial: 8, min: 1, max: 100, step: 1, caption: 'Etages :' },
    { name: 'avecGainage', type: 'checkbox', checked: false, initial: '0', caption: 'Avec gainage ?' },
    //{ name: 'avecGalbe', type: 'checkbox', checked: false, initial: '0', caption: 'Avec galbe ?' },
    { name: 'galbeX', type: 'choice', caption: 'Galbe en X ?', values: [-1, 0, 1], captions: ['vers la gauche', 'aucun', 'vers la droite'], initial: 0 },
    { name: 'galbeY', type: 'choice', caption: 'Galbe en Y ?', values: [-1, 0, 1], captions: ['vers la gauche', 'aucun', 'vers la droite'], initial: 0 },

    { name: 'g2', type: 'group', caption: 'GAINAGE' },
    { name: 'sgai1', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '1:' },
    { name: 'sgai2', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '2:' },
    { name: 'sgai3', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '3:' },
    { name: 'sgai4', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '4:' },
    { name: 'sgai5', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '5:' },
    { name: 'sgai6', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '6:' },
    { name: 'sgai7', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '7:' },
    { name: 'sgai8', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '8:' },
    { name: 'sgai9', type: 'slider', initial: 100, min: 0, max: 100, step: 1, caption: '9:' },

    { name: 'g3', type: 'group', caption: 'GALBE' },
    { name: 'sgal1', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '1:' },
    { name: 'sgal2', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '2:' },
    { name: 'sgal3', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '3:' },
    { name: 'sgal4', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '4:' },
    { name: 'sgal5', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '5:' },
    { name: 'sgal6', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '6:' },
    { name: 'sgal7', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '7:' },
    { name: 'sgal8', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '8:' },
    { name: 'sgal9', type: 'slider', initial: 50, min: 0, max: 100, step: 1, caption: '9:' },
  ]
}

const main = (params) => {
	
	console.log(params.avecGainage)
  const piedGalbeGaine = (hauteur, dx, dy) => {
    let etagePied = geom2.create(
      [ [[-10.0, 10.0], [-10.0, -10.0]],
        [[-10.0, -10.0], [10.0, -10.0]],
        [[10.0, -10.0], [10.0, 10.0]],
        [[10.0, 10.0], [-10.0, 10.0]] ])
        
    let ech = [], dt = []
    
    ech.push(params.sgai1/100)
    ech.push(params.sgai2/100)
    ech.push(params.sgai3/100)
    ech.push(params.sgai4/100)
    ech.push(params.sgai5/100)
    ech.push(params.sgai6/100)
    ech.push(params.sgai7/100)
    ech.push(params.sgai8/100)
    ech.push(params.sgai9/100)
    
		dt.push((params.sgal1-50)/-10)
		dt.push((params.sgal2-50)/-10)
		dt.push((params.sgal3-50)/-10)
		dt.push((params.sgal4-50)/-10)
		dt.push((params.sgal5-50)/-10)
		dt.push((params.sgal6-50)/-10)
		dt.push((params.sgal7-50)/-10)
		dt.push((params.sgal8-50)/-10)
		dt.push((params.sgal9-50)/-10)
    
    const nbT = params.nb
    
    etagePied = slice.fromSides(geom2.toSides(etagePied))
    return extrudeFromSlices({
      numberOfSlices: nbT,
      callback: (progress, count, base) => {
        const i = nbT - count
        let scaleFactor = params.avecGainage ? ech[i] : 1
        let dxy = dt[i]
        const scaleMatrix = mat4.fromScaling([scaleFactor, scaleFactor, 1])
        const transformMatrix = mat4.fromTranslation([dxy * dx, dxy * dy, progress * hauteur])
        return slice.transform(mat4.multiply(scaleMatrix, transformMatrix), base)
      }
    }, etagePied)
  }

return piedGalbeGaine(params.hauteur, params.galbeX, params.galbeY)
}

module.exports = { main, getParameterDefinitions }
