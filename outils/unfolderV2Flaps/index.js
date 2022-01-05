const jscad = require('@jscad/modeling')
const { line, cube, rectangle, circle, polygon, sphere } = jscad.primitives
const { measureBoundingBox, measureDimensions, measureAggregateBoundingBox, measureCenter } = jscad.measurements
const { rotateZ, translate, translateX, translateY, scale, center, align } = jscad.transforms
const { colorize, colorNameToRgb, cssColors } = jscad.colors
const { toPolygons } = jscad.geometries.geom3
const { union } = jscad.booleans
const { vec3 } = jscad.maths
const { radToDeg, degToRad } = jscad.utils

const epsilon = 0.0001
 
function getParameterDefinitions(){

var l = navigator.language, t
if( /^fr\b/.test(navigator.language)){
 t = [
  'VOLUME',
  'Fichier',
  'Voir Dim. (mm)',
  'Voir N° Faces',
  'DEPLIAGE',
  '1ere Face',
  'Echelle',
  'Echelle N°',
  'Voir Lang.',
  'Hauteur Lang.',
  'Format Page',
  'Personnalisé...',
  'Page Largeur',
  'Page Hauteur',
  'Déplacer Lang.',
  'Exclure Faces',
  'Voir Volume'
  ]
 }else{
 t = [ 
	'MODEL',
  'File',
  'Show dim. (mm)',
  'Show Faces n°',
  'UNFOLDING',
  'Start Face',
  'Scale',
  'n° Scale',
  'Show Flaps',
  'Flap height',
  'Frame Format',
  'Custom...',
  'Frame Width',
  'Frame Height',
  'Move Flaps',
  'Exclude faces',
  'Show Model'
  ]
 }

  return [
    {name:'g1', type:'group', caption:t[0]},
    {name:'fileN', type:'text', caption:t[1], default:'file.obj'},
    {name:'Pscale', type:'number', caption:t[6], default:1},
    {name:'ShowVol', type:'checkbox', caption:t[16], checked:true},
    {name:'ShowDims', type:'checkbox', caption:t[2], checked:true},
    {name:'ShowNums', type:'checkbox', caption:t[3], checked:true},
    
    {name:'g2', type:'group', caption:t[4]},
    {name:'firstTriangle', type:'number', caption:t[5], default:0, step:1},
    {name:'Nscale', type:'number', caption:t[7], default:1},
    
    {name:'ShowFlaps', type:'checkbox', caption:t[8], checked:true},
    {name:'FlapH', type:'number', caption:t[9], default:4},
    {name:'FrameType', type:'choice', caption:t[10], 
			captions:['A6','A5','A4','A3','A2','A1','A0', 'Cricut 30', 'Cricut 60', t[11]],
			values: [0,1,2,3,4,5,6,7,8,-1], default:2},
    {name:'frameX', type:'number', caption:t[12], default:210},
    {name:'frameY', type:'number', caption:t[13], default:297},
    {name:'Flap2', type:'text', caption:t[14], initial:'', default:''},
    {name:'Excld', type:'text', caption:t[15], initial:'', default:''}
  ]
} 

function main(params) {
  // INITS
  const frameSizes = [
		[105, 148],
		[148, 210],
		[210, 297],
		[297, 420],
		[420, 594],
		[594, 841],
		[841, 1189],
		[300, 300],
		[300, 600]
	]

  const vf = require('./'+ params.fileN)
  var vol = toPolyhedron(vf[0])
  //vol = toPolyhedron(sphere({segments:8}))
  //vol = toPolyhedron(cube())
  
  vol.lUNFOLD = [] // unfolded faces
  vol.cacheKO = [] // rejected candidates from unfold
  vol.lNums   = [] // numbers of linked edges
 
  vol.frame = params.FrameType.value === -1 
		? [params.frameX, params.frameY]
		: frameSizes[params.FrameType]

  vol.s  = params.Pscale
  vol.s2 = params.Nscale* vol.s / 30
  vol.s3 = vol.s2 * 0.6
 
  vol.voisins = getNeighbors(vol.faces)
  vol.vertices = vol.vertices.map(
    v => [v[0] * vol.s, v[1] * vol.s, v[2] * vol.s]
  )
  vol.v2d = []
  vol.v3d = []
  for (var i = 0, il = vol.faces.length; i < il; i++){
    var tmp = create2dTriangleFromFace(vol.faces[i], vol)
    vol.v2d.push(tmp[0])
    vol.v3d.push(tmp[1])
  }
  
  // Exclusions
  var ex = params.Excld.split(',').map(x => x.split('-').map(Number))
  for(var i = 0, il = ex.length; i < il; i++){
    vol.cacheKO.push(ex[i])
  } 
  
  // START UNFOLDING  
  // center first triangle into frame
  rr = []
  var fT = params.firstTriangle, nf = 0, newCLimit = 0
  var r
  do{ 
    r = []
    vol.lLINES = []
    vol.lTri = []
    r.push(pose(fT, params.ShowNums, vol)) // display first triangle
    var ok = true
    while(ok){
      var c = candidates(newCLimit, vol), cl = c.length
      if(cl > 0){
        //var lok = true
        for(var ai = 0, lok = true; lok && (ai < cl); ai++){
					if(attach(c[ai][0], c[ai][1], newCLimit, vol)){
            ok = true
            r.push(pose(c[ai][1], params.ShowNums, vol))
            lok = false
          }
			  }
      } else
        ok = false 
     }
  
    r.push(render(params.FlapH, params.Flap2, params.ShowFlaps, vol))
    rr.push(r)
    newCLimit = vol.lUNFOLD.length -1
	  fT = findFaceToUnfold(vol)
	  nf++
  }while(fT > -1)


	// join small pieces
	function minX(a, b){ return a.x > b.x }
	function minY(a, b){ return a.y > b.y }

	var rt = []
	for(var i = 0; i < rr.length; i++){
	  var b = measureAggregateBoundingBox(rr[i])
	  rt.push({d:align({modes:['center','center','none'], grouped:true}, rr[i]), x: b[1][0] - b[0][0], y: b[1][1] - b[0][1]})
	}
	
 if (rt.length > 1){
	var ok = true
	do{
	  rt.sort(minX)
	  if ((rt[0].x + rt[1].x) < vol.frame[0]){
			rt[0].d.push(translateX((rt[0].x + rt[1].x) / 2, rt[1].d))
			rt[0].d = align({modes:['center','center','none'], grouped:true}, rt[0].d)
			var b = measureGroup(rt[0].d)
			rt[0].x = b[0]
			rt[0].y = b[1]
			rt[1].d = null
			rt.splice(1, 1)
		} else {
			ok = false
		}
	}while (ok)
	
	var ok = true
	do{
	  rt.sort(minY)
	  if ((rt[0].y + rt[1].y) < vol.frame[1]){
			rt[0].d.push(translateY((rt[0].y + rt[1].y) / 2, rt[1].d))
			rt[0].d = align({modes:['center','center','none'], grouped:true}, rt[0].d)
			var b = measureGroup(rt[0].d)
			rt[0].x = b[0]
			rt[0].y = b[1]
			rt[1].d = null
			rt.splice(1, 1)
		} else {
			ok = false
		}
	}while (ok)
 }

	rr = []
	for(var i = 0, li = rt.length; i < li; i++){
		var b = measureAggregateBoundingBox(rt[i].d)
    var d = [ b[0][0] + (b[1][0]-b[0][0])/2,
		  				b[0][1] + (b[1][1]-b[0][1])/2 ]
    // frame
    var delta = [ (vol.frame[0] * (i + 0.5)) -d[0] +1, (vol.frame[1] * 0.5) -d[1] +1]
		rr.push(translate(delta, rt[i].d))
	}


  var volS = scale([vol.s, vol.s, vol.s], vf[0])
  if (params.ShowVol)
		rr.push(translate([-100,0,0], volS))
   
  if(params.ShowDims)
		rr.push(displayDims(volS))

  console.log(vol.lUNFOLD.length, '/', vol.faces.length)
  return rr
}

function measureGroup(g){
	var b = measureAggregateBoundingBox(g)
	return [b[1][0] - b[0][0], b[1][1] - b[0][1]]
}

function displayDims(V){
	var r = []
	var b = measureDimensions(V)
	r.push(number(Math.round(b[0]), 1, 0, -20))
	r.push(number(Math.round(b[1]), 1, 0, -50))
	r.push(number(Math.round(b[2]), 1, 0, -80))

	return r
}

function findFaceToUnfold(V){
	var r = -1, i = 0, il = V.faces.length
	while ( (i < il) && (r < 0)){
	  if(! V.lUNFOLD.includes(i)){
			r = i
		}else
		  i++
	}
	return r
}

function getLinkN(n1, n2, L){
	var nS = Math.min(n1, n2), 
			nB = Math.max(n1, n2)
	var n = L.findIndex(x => (x.min === nS ) && (x.max === nB))
	var isFirst = false
	if (n === -1){
		n = L.push({min:nS, max:nB}) -1
		isFirst = true
  }
  return {n: n, isFirst: isFirst}
}

function trapeze(p1, p2, s){
	const d = distance2d(p1, p2)
	const a = degToRad(90) - direction(p1, p2) 

	var P = [
	  rotationRad(p1[0], p1[1], p1[0],   p1[1], a),
		rotationRad(p1[0], p1[1], p1[0]+s, p1[1]+ d * 0.35, a),
		rotationRad(p1[0], p1[1], p1[0]+s, p1[1]+ d * 0.65, a),
	  rotationRad(p1[0], p1[1], p1[0],   p1[1]+ d, a)
	]
	
	return P
}

function colorLine(l,  V)	{		
	var tri1 = V.v3d[l[2]], tri2 = V.v3d[l[3]]
  var p
       if (eq3(tri1, tri2, 0))
     p = tri2[0]
  else if (eq3(tri1, tri2, 1))
     p = tri2[1]
  else if (eq3(tri1, tri2, 2))
     p = tri2[2]      
     
  var estCop = estCoplanaire(V.v3d[l[2]], p)
  if (estCop){
    col = estCop < 0 ? cssColors.maroon : cssColors.green
    return colorize(col, line([l[0], l[1]] ))
  } else
    return null
}

function render(s, flap2, showF, V){
	var r = []
	var f2 = flap2.split(',').map(Number)
	
  for(var i = 0, il = V.lLINES.length; i < il; i++){
    var l = V.lLINES[i]
    if(l[4] === 1){// border => add neighbour #
      var m = middle(l[0], l[1])
      var a = direction(l[0], l[1])
			var c = centroid(V.v2d[l[3]])
			var d1= distance2d(m, c)		
			var num = getLinkN(l[2], l[3], V.lNums)
			var tmp = translate(m, rotateZ(a, number(num.n, V.s3, 0, 1)))
			var b = measureAggregateBoundingBox(tmp)
			var m2 = middle(b[0], b[1])
			var d2 = distance2d(m2, c)
			if(d1 < d2){
				tmp = translate(m, rotateZ(a, number(num.n, V.s3, 0, -1)))
			}

      if (showF
       && (( num.isFirst && !f2.includes(num.n))
       || (!num.isFirst &&  f2.includes(num.n)))){
        r.push(colorize(cssColors.red, line(trapeze(l[0], l[1], s ))))
        var rl = colorLine(l, V)
        if(rl !== null)
          r.push(rl)
      }else{
        r.push(colorize(cssColors.red, line([l[0], l[1]])))
      }

      r.push(colorize(cssColors.black, tmp))
    }else{
			var rl = colorLine(l, V)
			if(rl !== null)
			  r.push(rl)
    }
  }
  return r
}

function direction(p1, p2){
	return Math.atan2(p2[1] - p1[1], p2[0] - p1[0])
}

function doLine(p1, p2, n, nf, L){
  var l = L.find(v => (eq(v[0], p1) && eq(v[1], p2))
												|| (eq(v[0], p2) && eq(v[1], p1)))
  if( l === undefined){
    L.push([p1, p2, n, nf, 1])
  } else {
    l[4] = l[4] + 1
  }
}

function pose(n, showN, V){
  var r = [], pts = V.v2d[n]
  V.lUNFOLD.push(n)
  if (showN){
		var c = centroid(pts)
    r.push(colorize(cssColors.blue, number(n, V.s2, c[0], c[1])))  
  }
  for(var i = 0; i < 3; i++){
    doLine(pts[i], pts[suiv(i)], V.voisins[n][i], n, V.lLINES)
  }  
  
  return r
}

function estCoplanaire(t, p){
// Function to find equation of plane.
// https://www.geeksforgeeks.org/program-to-check-whether-4-points-in-a-3-d-plane-are-coplanar/
  var x1 = t[0][0], y1 = t[0][1], z1 = t[0][2],
    x2 = t[1][0], y2 = t[1][1], z2 = t[1][2],
    x3 = t[2][0], y3 = t[2][1], z3 = t[2][2],
    x  = p[0],    y  = p[1],    z  = p[2]

  var a1 = x2 - x1, b1 = y2 - y1, c1 = z2 - z1,
      a2 = x3 - x1, b2 = y3 - y1, c2 = z3 - z1,
			a = b1 * c2 - b2 * c1,
			b = a2 * c1 - a1 * c2,
			c = a1 * b2 - b1 * a2,
			d = (- a * x1 - b * y1 - c * z1)
// equation of plane is: a*x + b*y + c*z = 0 #    
// checking if the 4th point satisfies  
// the above equation  
  return a * x + b * y + c * z + d
}

function toPolyhedron(O){
  var p = toPolygons(O)
  var r = {vertices:[], faces:[]}
  
  for(var i = 0, il = p.length; i < il; i++){
    var f = []
    var poly = p[i]
    for(j = 0, jl = poly.vertices.length; j < jl; j++){
      var v = poly.vertices[j]
      var n = r.vertices.findIndex(x => 
        eq2(x[0],v[0]) && eq2(x[1],v[1]) && eq2(x[2],v[2]) )    
      if (n === -1)
        n = r.vertices.push(v) -1
      f.push(n)
    }
    
    if(f.length == 3){
	  r.faces.push(f)
	  } else {
	    for(var j = 1, jl = f.length -1; j < jl; j++){
		    r.faces.push([f[0], f[j], f[j+1]])
	    }
	  }    
  }
  return r
}

function candidates(first, V) {
 var r = []
 for(var i = first, l = V.lUNFOLD.length; i < l; i++){
   var nFace = V.lUNFOLD[i]
   for(var j = 0; j < 3; j++){
     var n = V.voisins[nFace][j]
     if(! V.lUNFOLD.includes(n)){
       if(V.cacheKO.find(x => (x[0] === nFace) && (x[1] === n)) === undefined)
         r.push([nFace, n])
     }
   }
 }
 return r
}

function attach(nFace, nT, nLimit, V){
  if(V.cacheKO.find(x => (x[0] === nFace) && (x[1] === nT)) !== undefined){
    return false
  }
  var nVP = V.voisins[nT].findIndex(x => x === nFace),
			ptV = V.v2d[nT],
			ptV0 = ptV[nVP], 
			ptV1 = ptV[suiv(nVP)]

  var nFP = V.voisins[nFace].findIndex(x => x === nT),
			ptF = V.v2d[nFace],
			ptF0 = ptF[nFP],
			ptF1 = ptF[suiv(nFP)]
  
  // put neighbor close
  var dx = ptF1[0] - ptV0[0], dy = ptF1[1] - ptV0[1]
  V.v2d[nT] = V.v2d[nT].map(v => [v[0] + dx, v[1] + dy])
      
  ptV = V.v2d[nT]
  ptV0 = ptV[nVP]
  ptV1 = ptV[suiv(nVP)]
    
  // rotate neighbor
  let a = calcAngle(ptF0, ptF1, ptV1)
  let tmp = V.v2d[nT]
    .map(x => rotation(ptF1[0], ptF1[1], x[0], x[1], a))
  ptV1 = tmp[suiv(nVP)]
  let delta = Math.abs(distance2d(ptF0, ptV1))
  if(delta > epsilon){
    ptV = ptV.map(x=> rotation(ptF1[0], ptF1[1], x[0], x[1], 360 - a))
  }else
    ptV = tmp

  // check for overlaps
  var ok = false
  for(var i = nLimit, l = V.lUNFOLD.length; i < l; i++){
    ok = !overlap(ptV, V.v2d[V.lUNFOLD[i]])
		if(!ok){
      V.cacheKO.push([nFace, nT])
      return false
    }
  } 
  
  if(ok){
		V.lTri.push(polygon({points:ptV}))
		var b = measureAggregateBoundingBox(V.lTri)
		var d = [ b[1][0]-b[0][0], b[1][1]-b[0][1] ]
		if( (d[0] > V.frame[0]) || (d[1] > V.frame[1])){
			V.lTri.pop()
			V.cacheKO.push([nFace, nT])
			return false
		}
	}
  
  V.v2d[nT] = ptV
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
  
  var a = l1S[1] - l2S[1],
			b = l1S[0] - l2S[0],
			numerator1 = ((l2E[0] - l2S[0]) * a) - ((l2E[1] - l2S[1]) * b),
			numerator2 = ((l1E[0] - l1S[0]) * a) - ((l1E[1] - l1S[1]) * b)
  a = numerator1 / denominator
  b = numerator2 / denominator
  
  if((a > 0 && a < 1) && (b > 0 && b < 1)){
		return true
	}else{
		return false
	}
}

function eq(p1, p2){ return distance2d(p1,p2) < epsilon}
function eq2(v1, v2){return Math.abs(v1 - v2) < epsilon}
function eq3(t1, t2, n ){
	return   (distance(t2[n], t1[0]) >= epsilon)
        && (distance(t2[n], t1[1]) >= epsilon)
        && (distance(t2[n], t1[2]) >= epsilon)
}

function suiv(n) { return n < 2 ? n+1 : 0}

function calcAngle(A,B,C) {
  var AB = Math.sqrt(Math.pow(B[0]-A[0],2)+ Math.pow(B[1]-A[1],2));    
  var BC = Math.sqrt(Math.pow(B[0]-C[0],2)+ Math.pow(B[1]-C[1],2)); 
  var AC = Math.sqrt(Math.pow(C[0]-A[0],2)+ Math.pow(C[1]-A[1],2));
    
  return Math.acos((BC*BC+AB*AB-AC*AC) / (2*BC*AB)) * (180 / Math.PI);   
}

function rotation(cx, cy, x, y, angle) {
  var radians = (Math.PI / 180) * angle
  
  return rotationRad(cx, cy, x, y, radians)
}
function rotationRad(cx, cy, x, y, angle) {
  var cos = Math.cos(angle),
			sin = Math.sin(angle)
    
  return [(cos * (x - cx)) + (sin * (y - cy)) + cx,
	        (cos * (y - cy)) - (sin * (x - cx)) + cy]
}

function distance(p1, p2) {
  var a = p2[0] - p1[0]
  var b = p2[1] - p1[1]
  var c = p2[2] - p1[2]
  
  return Math.sqrt(a * a + b * b + c * c)
}
function distance2d(p1, p2){
  var a = p2[0] - p1[0], b = p2[1] - p1[1]
  
  return Math.sqrt(a*a + b*b)
}

function centroid(pts){
  var a = pts[0], b = pts[1], c = pts[2]
  
  return [((a[0] + b[0] + c[0]) / 3), ((a[1] + b[1] + c[1]) / 3)]
}

function middle(a, b){
  return [((a[0] + b[0]) / 2), ((a[1] + b[1]) / 2)]
}

function digit(num, scale = 1){
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
  return np[num].map(x => x.map(y => y * scale))
}

function number(n, s, x, y){
 var ch = n.toString().split("").map(Number), r = [], dkX = 0
 for(var i = 0, il = ch.length; i < il; i++){
   var nl = line(digit(ch[i], s).map(v => [
     v[0]+ dkX + x - (6 * s) * il, 
     v[1]+ y -1.25 * s
    ]))
   r.push(nl)
   var b = measureBoundingBox(nl)
   dkX += b[1][0] - b[0][0] + 4 * s
 }
 
 return r
}

function getNeighbors (f){
  let V = []
  for(let i = 0, il = f.length; i < il; i++){
    V[i] = []
    for(let j = 0; j < 3; j++){
      let p1 = f[i][j], p2 = f[i][j == 2 ? 0 : j+1]
      let v = f.findIndex(function(el, idx){
  	    return (idx !== i) && el.includes(p1) && el.includes(p2)})
	  V[i].push(v)
    }
  }
  
  return V
}

function create2dTriangleFromFace (f, V){
  let pts3d = extractFacesVertices(f, V)
  let pts2d = d2ize(pts3d)
  
  return [pts2d, pts3d]
}
  
function extractFacesVertices (f, V) {
  return f.map(x=> V.vertices[x])
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


module.exports = { main, getParameterDefinitions }
