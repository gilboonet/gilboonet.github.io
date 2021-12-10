const jscad = require('@jscad/modeling')
const { line, polygon, rectangle, circle } = jscad.primitives
const { measureBoundingBox, measureCenterOfMass } = jscad.measurements
const { translate, translateX, scale, center, align } = jscad.transforms
const { colorize, colorNameToRgb } = jscad.colors
const { union } = jscad.booleans
const { path2 } = jscad.geometries

const cachedNum = [], cachedDig = [], cacheKO = [], lUNFOLD = []
  epsilon = 0.0001, frame = [210, 297]

const vol = {
faces :[[6,46,8],[7,9,6],[7,17,9],[8,46,18],[9,31,20],[9,45,6],[13,36,35],[16,33,32],[16,34,33],[16,35,34],[17,31,9],[18,32,8],[18,40,32],[20,44,9],[20,49,44],[29,40,30],[29,41,40],[29,55,41],[30,40,18],[33,37,32],[35,36,34],[35,60,13],[43,49,29],[44,49,43],[45,46,6],[49,55,29],[0,23,12],[0,50,23],[5,37,8],[6,51,7],[7,51,17],[8,32,5],[17,51,24],[23,53,12],[23,54,53],[24,51,6],[32,37,5],[50,54,23],[0,12,1],[0,26,21],[1,26,0],[3,56,4],[3,58,56],[4,55,3],[4,57,55],[12,38,1],[12,53,38],[19,54,39],[21,22,0],[22,50,0],[22,54,50],[25,28,27],[25,57,28],[28,59,27],[38,53,19],[39,54,22],[41,57,25],[53,54,19],[55,57,41],[2,47,11],[3,42,10],[3,55,42],[10,58,3],[11,52,2],[14,47,15],[15,47,2],[16,40,27],[17,52,31],[24,52,17],[27,35,16],[27,40,25],[27,59,35],[31,52,11],[32,40,16],[40,41,25],[42,55,49],[48,58,10],[48,61,58],[59,60,35],[1,44,26],[1,45,9],[2,36,15],[2,52,33],[8,24,6],[8,37,24],[9,44,1],[10,31,11],[10,42,31],[11,48,10],[14,15,13],[14,48,47],[14,61,48],[15,36,13],[18,39,30],[18,46,19],[19,39,18],[19,45,38],[19,46,45],[21,29,22],[21,43,29],[26,43,21],[26,44,43],[29,30,22],[30,39,22],[31,42,20],[33,34,2],[33,52,37],[34,36,2],[37,52,24],[38,45,1],[42,49,20],[47,48,11],[13,60,14],[28,57,56],[56,57,4],[56,58,28],[58,59,28],[58,61,59],[59,61,60],[60,61,14]],
vertices : [[2.18515314,-5.66906501,-10.77388586],[2.43210414,0.82779499,-10.30188186],[-0.29528786,6.25000799,5.47664414],[4.13009714,-3.01705901,0.69581914],[1.46449814,-11.05883601,1.48296114],[-4.20202986,11.74657899,-6.43274186],[1.76210314,9.44943799,-6.33619386],[3.19248914,8.52623199,-4.88176586],[-1.69497386,9.59488899,-6.39661086],[4.14186414,5.49562299,-7.26941186],[4.88347514,-1.36499801,3.64397014],[2.16482214,5.95683299,3.96508914],[1.84181014,-2.95060701,-14.17623386],[-1.25984886,-3.35124401,13.04639014],[1.10314414,-3.02590001,13.39368614],[0.047290145,-0.17638001,11.58252314],[-3.60132686,4.62640399,1.57291514],[2.73655714,8.41181199,-3.31748986],[-3.92215486,6.01013999,-7.92936786],[-1.59579286,4.76547699,-10.56344086],[3.58461014,3.87044599,-3.14977686],[0.38438314,-2.97141501,-7.31977486],[-1.80094486,-3.09396701,-8.84670486],[-0.79305486,-6.31723901,-12.98161186],[1.69175814,9.79957199,-4.17293186],[-4.07114686,-3.52512501,0.88831814],[2.43116114,-1.78938501,-8.77571186],[-4.94782986,-2.72556401,3.87805714],[-4.38850286,-9.47509201,4.26982414],[-0.33428886,-2.43236701,-4.60392386],[-3.66268086,-1.12694901,-5.73591086],[3.30817814,6.91763299,-2.09996286],[-3.30302786,7.95453699,-4.95989686],[-1.49345886,8.90576999,-0.33442386],[-1.91500986,6.27745099,3.90967314],[-4.33650886,-2.55702901,7.20820814],[-1.59560286,3.02654499,7.68190014],[-1.95584286,9.48761799,-3.58585986],[1.53664614,3.37955499,-10.80585686],[-2.56934586,0.95661999,-9.91045986],[-3.51885886,2.54441099,-2.16110486],[-1.57399686,-2.78087001,-1.74482786],[3.68439514,1.30763999,-1.31338186],[2.79857114,-2.18289301,-5.32179086],[3.74590714,0.27503999,-6.84499586],[2.92300714,5.71537799,-9.78312586],[0.37404214,8.71167199,-8.26816586],[1.25524414,2.44824599,8.69050614],[4.12591214,-1.94520301,7.06802914],[2.76914814,0.66925999,-2.95216986],[-1.19023086,-6.62480701,-10.39142486],[3.34262114,12.65198199,-7.36000086],[1.13191014,9.14929599,-0.64515886],[-0.0018628552,-3.30936801,-14.86011386],[-2.23563986,-3.10630801,-13.28313286],[0.50913914,-3.12659101,-2.25022586],[4.29845114,-9.14855201,4.07653214],[-1.47953986,-10.87022401,1.98925314],[5.45283414,-7.04318101,7.08779314],[-5.58808286,-7.64922001,7.05212814],[-3.81056786,-4.51207001,11.53466014],[3.77669014,-4.37932801,11.14128914]]
}

const getParameterDefinitions = () => {
  return [
    { name: 'firstTriangle', type: 'int', initial: 0, caption: 'Start by' },
  ]
}

const main = (params) => {

//  const points = [ [10, 10, 0], [10, -10, 0], [-10, -10, 0], [-10, 10, 0], [0, 0, 10] ]
//  const faces = [ [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [1, 0, 3], [2, 1, 3] ]

// INITS
vol.voisins = getNeighbors(vol.faces)

g_s = 3, gSCALE = 0.05
vol.vertices = vol.vertices.map(v => [v[0]*g_s, v[1]*g_s, v[2]*g_s])

vol.v2d = []
for (var i = 0; i < vol.faces.length; i++){
  vol.v2d.push(create2dTriangleFromFace(vol.faces[i]))
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

function pose(n){
  var r = []
  var pts = vol.v2d[n]
  
  lUNFOLD.push(n)
  r.push(colorize([1,0,0], line([pts[0], pts[1]])))
  r.push(colorize([1,0,0], line([pts[1], pts[2]])))
  r.push(colorize([1,0,0], line([pts[2], pts[0]])))
  
  var c = centroid(pts)
  r.push(colorize([0,0,1], number(n, gSCALE, c[0], c[1])))
 
  for(var i = 0; i < 3; i++){
    var m = milieu(pts[i], pts[i < 2 ? i+1 : 0])
    r.push(colorize([0,1,0], 
      number(vol.voisins[n][i], gSCALE*0.6, m[0], m[1])))  
  }
  
  console.log(n,lUNFOLD.length, '/', vol.faces.length)
  
  return r
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
  return pts2d
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

//cachedDig.push({id:num, s:scale, lines: r})
return r
}

module.exports = { main, getParameterDefinitions }
