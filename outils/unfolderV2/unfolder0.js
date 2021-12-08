const jscad = require('@jscad/modeling')
const { polyhedron, polygon } = jscad.primitives
const { measureBoundingBox } = jscad.measurements
const { translateY } = jscad.transforms
 
const main = () => {

  const points = [ [10, 10, 0], [10, -10, 0], [-10, -10, 0], [-10, 10, 0], [0, 0, 10] ]
  const faces = [ [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [1, 0, 3], [2, 1, 3] ]
  const myshape = polyhedron({points, faces, orientation: 'inward'})
 
 
  let r = [], dkY = 0
  for(let i = 0; i < faces.length; i++){
    let p2d = create2dPolyFromFace(points, faces[i])
    r.push(translateY(dkY, p2d))
    let b = measureBoundingBox(p2d)
    console.log(b)
    dkY += (b[1][1] - b[0][1]) + 1
  }
  
  return [r, myshape]
}

function create2dPolyFromFace(points, face){
  let pts3d = extractFacesPoints(points, face)
  let pts2d = d2ize(pts3d)
  let p2d = polygon({points : pts2d})
  return p2d
}
  
function extractFacesPoints (pts, f) {
 return f.map(x=> pts[x])
}

function d2ize(p){
// https://stackoverflow.com/a/8051489
var x0 = p[0][0], y0 = p[0][1], z0 = p[0][2],
    x1 = p[1][0], y1 = p[1][1], z1 = p[1][2],
    x2 = p[2][0], y2 = p[2][1], z2 = p[2][2]
    
var X0 = 0, Y0 = 0
var X1 = Math.sqrt((x1 - x0)*(x1 - x0) + (y1 - y0)*(y1 - y0) + (z1 - z0)*(z1 - z0)),
    Y1 = 0
var X2 = ((x1 - x0) * (x2 - x0) + (y1 - y0) * (y2 - y0) + (z1 - z0) * (z2 - z0)) / X1,
    Y2 = Math.sqrt((x2 - x0)*(x2 - x0) + (y2 - y0)*(y2 - y0) + (z2 - z0)*(z2 - z0) - X2*X2)
return [[X0, Y0], [X1, Y1], [X2, Y2]]
}

module.exports = { main }
