const jscad = require('@jscad/modeling')
const { line, cube, rectangle, sphere} = jscad.primitives
const { measureBoundingBox } = jscad.measurements
const { translate, translateX, scale, center, align } = jscad.transforms
const { colorize, colorNameToRgb } = jscad.colors
const { toPolygons } = jscad.geometries.geom3


const cachedNum = [], cachedDig = [], cacheKO = [], lUNFOLD = []
  epsilon = 0.0001, frame = [210, 297]

var vol, lLINES = []

const getParameterDefinitions = () => {
  return [
    { name: 'firstTriangle', type: 'int', initial: 0, caption: 'Start by' },
  ]
}

const main = (params) => {
  vol = toPolyhedron(sphere({segments:8}))
  //vol = toPolyhedron(cube())
  
  // INITS
  vol.voisins = getNeighbors(vol.faces)

  g_s = 5, gSCALE = 0.05
  vol.vertices = vol.vertices.map(v => [v[0]*g_s, v[1]*g_s, v[2]*g_s])

  vol.v2d = [], vol.v3d = []
  for (var i = 0; i < vol.faces.length; i++){
    var tmp = create2dTriangleFromFace(vol.faces[i])
    vol.v2d.push(tmp[0])
    vol.v3d.push(tmp[1])
  }

  var r = []  
  // START UNFOLDING  
  // frame
  r.push(rectangle({center: [210/2, 297/2], size: [210, 297]})) 
  
  // center first triangle into frame
  vol.v2d[params.firstTriangle] = vol.v2d[params.firstTriangle]
    .map(v => [v[0]+210/2, v[1]+ 297/2])

  r.push(pose(params.firstTriangle)) // display first triangle

  var ok= true
  while(ok){
    var c = candidates()
    if(c.length > 0){
      if(attach(c[0][0], c[0][1])){
        ok = true
        r.push(pose(c[0][1]))
      }
    } else
      ok = false
   }
  
  // render
  for(var i = 0; i < lLINES.length; i++){
    var l = lLINES[i]
    var col = l[4] === 1 ? [1,0,0] : [0,0,1]
    if(l[4] === 1){// border => add neighbour #
      r.push(colorize([1,0,0], line([l[0], l[1]])))
      var m = milieu(l[0], l[1])
      r.push(number(l[2], gSCALE*0.6, m[0], m[1]))
    }else{
	   var tri1 = vol.v3d[l[2]], tri2 = vol.v3d[l[3]]
       var p, ok = false
       var t2 = tri2[0]
       if ((distance(tri2[0], tri1[0]) >= epsilon)
        && (distance(tri2[0], tri1[1]) >= epsilon)
        && (distance(tri2[0], tri1[2]) >= epsilon)){
         p = tri2[0]
       } else
       if ((distance(tri2[1], tri1[0]) >= epsilon)
        && (distance(tri2[1], tri1[1]) >= epsilon)
        && (distance(tri2[1], tri1[2]) >= epsilon)){
          p = tri2[1]
       } else
       if ((distance(tri2[2], tri1[0]) >= epsilon)
        && (distance(tri2[2], tri1[1]) >= epsilon)
        && (distance(tri2[2], tri1[2]) >= epsilon)){
          p = tri2[2]
       }        
       
       var estCop = estCoplanaire(vol.v3d[l[2]], p)
       if (estCop)
         r.push(colorize(col, line([l[0], l[1]] )))    
    }
  }

  return r
}

function lline(p1, p2, n, nf){
  var pp1, pp2
  if (distance2d(p1, [0,0])> distance2d(p2, [0,0])){
    pp1 = p1
	pp2 = p2
  } else {
    pp1 = p2
	pp2 = p1
  }
  var l = lLINES.find(v => 
	(distance2d(v[0], pp1)< epsilon) && 
	(distance2d(v[1], pp2)< epsilon)
  )
  if( l === undefined){
    lLINES.push([pp1, pp2, n, nf, 1])
  } else {
    l[4] = l[4]+1
  }
}

function pose(n){
  var r = []
  var pts = vol.v2d[n]
  
  lUNFOLD.push(n)
  
  var c = centroid(pts)
  r.push(colorize([0,0,1], number(n, gSCALE, c[0], c[1])))
 
  for(var i = 0; i < 3; i++){
    lline(pts[i], pts[suiv(i)], vol.voisins[n][i], n)
  }
  
  console.log(n,lUNFOLD.length, '/', vol.faces.length)
  
  return r
}

function estCoplanaire(t, p){
// Function to find equation of plane.
// https://www.geeksforgeeks.org/program-to-check-whether-4-points-in-a-3-d-plane-are-coplanar/
var x1 = t[0][0], y1 = t[0][1], z1 = t[0][2],
    x2 = t[1][0], y2 = t[1][1], z2 = t[1][2],
    x3 = t[2][0], y3 = t[2][1], z3 = t[2][2],
    x  = p[0],    y  = p[1],    z  = p[2]

var a1 = x2 - x1,
    b1 = y2 - y1,
    c1 = z2 - z1,
    a2 = x3 - x1,
    b2 = y3 - y1,
    c2 = z3 - z1,
    a = b1 * c2 - b2 * c1,
    b = a2 * c1 - a1 * c2,
    c = a1 * b2 - b1 * a2,
    d = (- a * x1 - b * y1 - c * z1)
// equation of plane is: a*x + b*y + c*z = 0 #    
// checking if the 4th point satisfies  
// the above equation  
return a * x + b * y + c * z + d
}

function eq2(v1, v2){return Math.abs(v1 - v2) < epsilon}
function toPolyhedron(O){
  var p = toPolygons(O)
  var r = {vertices:[], faces:[]}
  
  for(var i = 0; i < p.length; i++){
    var f = []
    var poly = p[i]
    for(j = 0; j < poly.vertices.length; j++){
      var v = poly.vertices[j]
      var n = r.vertices.findIndex(x => 
        eq2(x[0],v[0]) && eq2(x[1],v[1]) && eq2(x[2],v[2]) )    
      if (n === -1)
        n = r.vertices.push(v) -1
      f.push(n)
    }
    
    if(f.length == 3){
	  r.faces.push(f);
	} else {
	  for(var j = 1; j < f.length-1; j++){
		r.faces.push([f[0], f[j], f[j+1]])
	  }
	}    
  }
  return r
}

function candidates() {
 var r = []
 for(var i = 0; i < lUNFOLD.length; i++){
   nFace = lUNFOLD[i]
   for(var j = 0; j < 3; j++){
     var n = vol.voisins[nFace][j]
     if(!lUNFOLD.includes(n)){
       if(cacheKO.find(x => (x[0] === nFace) && (x[1] === n)) === undefined)
         r.push([nFace, n])
     }
   }
 }
 return r
}

function attach(nFace, nT){
  if(cacheKO.find(x => (x[0] === nFace) && (x[1] === nT)) !== undefined){
    return false
  }
  var nVP = vol.voisins[nT].findIndex(x => x === nFace)
  var ptV = vol.v2d[nT]
  var ptV0 = ptV[nVP]
  var ptV1 = ptV[suiv(nVP)]

  var nFP = vol.voisins[nFace].findIndex(x => x === nT)
  var ptF = vol.v2d[nFace]
  var ptF0 = ptF[nFP]
  var ptF1 = ptF[suiv(nFP)]
  
  // put neighbor close
  var dx = ptF1[0] - ptV0[0], dy = ptF1[1] - ptV0[1]
  vol.v2d[nT] = vol.v2d[nT].map(v => [v[0] + dx, v[1] + dy])
      
  ptV = vol.v2d[nT]
  ptV0 = ptV[nVP]
  ptV1 = ptV[suiv(nVP)]
    
  // rotate neighbor
  let a = calcAngle(ptF0, ptF1, ptV1)
  let tmp = vol.v2d[nT]
    .map(x => rotation(ptF1[0], ptF1[1], x[0], x[1], a))
  ptV1 = tmp[suiv(nVP)]
  let delta = Math.abs(distance2d(ptF0, ptV1))
  if(delta > epsilon){
    ptV = ptV.map(x=> rotation(ptF1[0], ptF1[1], x[0], x[1], 360-a))
  }else
    ptV = tmp

  ptV0 = ptV[nVP]
  ptV1 = ptV[suiv(nVP)]
  
  // check for overlaps
  var ok = false
  for(var i = 0; i < lUNFOLD.length; i++){
    ok = !overlap(ptV, vol.v2d[lUNFOLD[i]])
    if (!ok){
      cacheKO.push([nFace, nT])
      return false
    }
  }
  
  
  vol.v2d[nT] = ptV
  return true
}

function overlap(t1, t2){
  let r = li(t1[0], t1[1], t2[0], t2[1])
    || li(t1[0], t1[1], t2[1], t2[2])
	|| li(t1[0], t1[1], t2[2], t2[0])
	|| li(t1[1], t1[2], t2[0], t2[1])
	|| li(t1[1], t1[2], t2[1], t2[2])
	|| li(t1[1], t1[2], t2[2], t2[0])
	|| li(t1[2], t1[0], t2[0], t2[1])
	|| li(t1[2], t1[0], t2[1], t2[2])
	|| li(t1[2], t1[0], t2[2], t2[0])
  return r
}

function li(l1S, l1E, l2S, l2E){// true if the lines intersect
	if(eq(l1S, l2S)||eq(l1S, l2E)||eq(l1E, l2S)||eq(l1E, l2E)){
	  return false
	}
		
	var denominator = ((l2E[1] - l2S[1]) * (l1E[0] - l1S[0])) 
	                - ((l2E[0] - l2S[0]) * (l1E[1] - l1S[1]))
  
  if(denominator === 0){
		return false
	}
  
  var a = l1S[1] - l2S[1]
  var b = l1S[0] - l2S[0]
  var numerator1 = ((l2E[0] - l2S[0]) * a) - ((l2E[1] - l2S[1]) * b)
  var numerator2 = ((l1E[0] - l1S[0]) * a) - ((l1E[1] - l1S[1]) * b)
  a = numerator1 / denominator;
  b = numerator2 / denominator;
  
  if((a > 0 && a < 1) && (b > 0 && b < 1)){
		return true
	}else{
		return false
	}
}

function eq(p1, p2){ return distance2d(p1,p2) < epsilon}

function suiv(n) { return n < 2 ? n+1 : 0}

function calcAngle(A,B,C) {
  var AB = Math.sqrt(Math.pow(B[0]-A[0],2)+ Math.pow(B[1]-A[1],2));    
  var BC = Math.sqrt(Math.pow(B[0]-C[0],2)+ Math.pow(B[1]-C[1],2)); 
  var AC = Math.sqrt(Math.pow(C[0]-A[0],2)+ Math.pow(C[1]-A[1],2));
    
  return Math.acos((BC*BC+AB*AB-AC*AC) / (2*BC*AB)) * (180 / Math.PI);   
}

function rotation(cx, cy, x, y, angle) {
  var radians = (Math.PI / 180) * angle,
      cos = Math.cos(radians),
      sin = Math.sin(radians)
  return [(cos * (x - cx)) + (sin * (y - cy)) + cx,
	      (cos * (y - cy)) - (sin * (x - cx)) + cy]
}

function distance2d(p1, p2){
  var a = p2[0] - p1[0]
  var b = p2[1] - p1[1]
  return Math.sqrt(a*a + b*b)
}

function distance(p1, p2) {
  var a = p2[0] - p1[0]
  var b = p2[1] - p1[1]
  var c = p2[2] - p1[2]
  return Math.sqrt(a * a + b * b + c * c)
}

function centroid(pts){
  var a = pts[0], b = pts[1], c = pts[2] 
  return [((a[0] + b[0] + c[0]) / 3), ((a[1] + b[1] + c[1]) / 3)]
}

function milieu(a, b){
  return [((a[0] + b[0]) / 2), ((a[1] + b[1]) / 2)]
}

function number(n, s = 1, x=0, y=0){
 var ch = n.toString().split("").map(Number)
 var r = [] 
 var dkX = 0
 for(var i = 0; i < ch.length; i++){   
   var nl = line(digit(ch[i], s).map(v => [v[0]+dkX+x-(12/2*s)*ch.length, v[1]+y-15/2*s]))
   //r.push(translateX(dkX, nl))
   r.push(nl)
   var b = measureBoundingBox(nl)
   dkX += b[1][0] - b[0][0] + 4 * s
 }
 return r
}

function getNeighbors (f){
  let V = []
  for(let i= 0; i< f.length; i++){
    V[i] = []
    for(let j= 0; j<3; j++){
      let p1 = f[i][j], p2 = f[i][j==2 ? 0: j+1]
      let v = f.findIndex(function(el, idx){
  	    return (idx !== i) && el.includes(p1) && el.includes(p2)})
	  V[i].push(v)
    }
  }
  return V
}

function create2dTriangleFromFace (face){
  let pts3d = extractFacesVertices(face)
  let pts2d = d2ize(pts3d)
  return [pts2d, pts3d]
}
  
function extractFacesVertices (f) {
 return f.map(x=> vol.vertices[x])
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

function digit(num, scale = 1){
  // look for cached
  c = cachedDig.find(function (dig, index) {
    if((dig.id == num) && (dig.s == scale))
      return true
  })
  
  if (c !== undefined){
    return c.lines
  }

var np = [
[[0,0],[0,16],[8,16],[8,0],[0,0]],
[[0,8],[8,16],[8,0]],
[[0,12],[0,16],[8,16],[8,8],[0,8],[0,0],[8,0]],
[[0,13],[0,16],[8,16],[8,11],[4,8],[8,5],[8,0],[0,0],[0,3]],
[[8,8],[0,8],[6,16],[6,0]],
[[8,16],[0,16],[0,8],[8,8],[8,0],[0,0]],
[[8,16],[0,8],[0,0],[8,0],[8,8],[0,8]],
[[0,16],[8,16],[0,0]],
[[4,9],[1,12],[1,16],[7,16],[7,12],[4,9],[8,7],[8,0],[0,0],[0,7],[4,9]],
[[8,8],[0,8],[0,16],[8,16],[8,0],[0,0]]
]

let r = np[num].map(x => x.map(y => y * scale))

return r
}

module.exports = { main, getParameterDefinitions }