const jscad = require('@jscad/modeling')
const { line, cube, rectangle, circle, polygon, sphere } = jscad.primitives
const { measureBoundingBox, measureDimensions, measureAggregateBoundingBox, measureCenter } = jscad.measurements
const { rotateZ, translate, translateX, translateY, scale, center, align } = jscad.transforms
const { colorize, colorNameToRgb, cssColors } = jscad.colors
const { toPolygons } = jscad.geometries.geom3
const { union } = jscad.booleans
const { vec3 } = jscad.maths
//const { lerp } = jscad.maths.vec2
const { radToDeg, degToRad } = jscad.utils

const epsilon = 0.0001
 
function getParameterDefinitions () {
	var l = navigator.language, t
	if( /^fr\b/.test(navigator.language)) {
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
			'Exclure Faces',
			'Voir Volume',
			'Voir Cadre'
		]
	} else {
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
			'Exclude faces',
			'Show Model',
			'Show Frame'
		]
	}

	return [
		{name:'g1', type:'group', caption:t[0]},
		{name:'fileN', type:'text', caption:t[1], default:'c.obj'},
		{name:'Pscale', type:'number', caption:t[6], default:1},
		{name:'ShowVol', type:'checkbox', caption:t[15], checked:true},
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
		{name:'ShowFrame', type:'checkbox', caption:t[16], checked:true},
		{name:'Excld', type:'text', caption:t[14], initial:'', default:''}
	]
}

function main (params) {
	function toPolyhedron (O) {
		function eq2 (v1, v2) {return Math.abs(v1 - v2) < epsilon}

		var p = toPolygons(O), r = {vertices:[], faces:[]}
		for (var i = 0, il = p.length; i < il; i++){
			var f = [], poly = p[i]
			for(j = 0, jl = poly.vertices.length; j < jl; j++){
				var v = poly.vertices[j]
				var n = r.vertices.findIndex(x =>
					eq2(x[0], v[0]) && eq2(x[1], v[1]) && eq2(x[2], v[2]))
				if (n === -1)
					n = r.vertices.push(v) -1
				f.push(n)
			}

			if (f.length == 3) {
				r.faces.push(f)
			} else {
				for (var j = 1, jl = f.length -1; j < jl; j++) {
					r.faces.push([f[0], f[j], f[j+1]])
				}
			}
		}
		return r
	}
	function getNeighbors (f) {
		let N = []
		for (let i = 0, il = f.length; i < il; i++) {
			N[i] = []
			for (let j = 0; j < 3; j++) {
				let p1 = f[i][j], p2 = f[i][j == 2 ? 0 : j + 1]
				let n = f.findIndex(function(el, idx){
					return (idx !== i) && el.includes(p1) && el.includes(p2)})
			N[i].push(n)
			}
		}

		return N
	}
	function createTriangles3dFromFaces () {
		return V.faces.map(f => f.map(x => V.vertices[x]))
	}
	function createTriangles2dFrom3d () {
		function d2ize (p) {
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

		return V.v3d.map( x => d2ize(x))
	}
	function setExclusions (pex) {
		V.cacheKO = pex.split(',').map(x => x.split('-').map(Number))
	}
	function pose (n) {
		function doLine (p1, p2, n, nf) {
			var l = V.lLINES.find(v => (eq(v[0], p1) && eq(v[1], p2))
															|| (eq(v[0], p2) && eq(v[1], p1)))
			if ( l === undefined) {
				V.lLINES.push([p1, p2, n, nf, 1])
			} else {
				l[4] = l[4] + 1
			}
		}

		var r = [], pts = V.v2d[n]
		V.lUNFOLD.push(n)
		if (V.ShowNums) {
			var c = centroid(pts)
			r.push(colorize(cssColors.blue, number(n, V.s2, c[0], c[1])))
		}
		for (var i = 0; i < 3; i++) {
			doLine(pts[i], pts[suiv(i)], V.voisins[n][i], n)
		}

		// look for flaps
		for (var i = 0; i < 3; i++) {
			var nV = V.voisins[n][i],
					nMin = Math.min(n, nV),
					nMax = Math.max(n, nV)

			if(V.lFlaps.findIndex(x => x.min === nMin && x.max === nMax) === -1){
				var ok = attach(n, nV, true)
				if (!ok && V.lATTACH.findIndex(x => x.f === nV && x.t === n) === -1) {
					var fPts = trapeze(pts[i], pts[suiv(i)], V.FlapH)
					var t1 = [fPts[0], fPts[1], fPts[2]],
							t2 = [fPts[2], fPts[3], fPts[0]]
					var ok = false
					if (checkOverlap(t1) && checkOverlap(t2)) {
						if (checkOutBounds(fPts)) {
							V.lTri.push(polygon({points:t1}))
							V.lTri.push(polygon({points:t2}))
							V.lPts.push(fPts)
							V.lFlaps.push({min: nMin, max: nMax, n:n, nT:nV})
						}
					}
				}
			}
		}

		return r
	}
	function checkOverlap(pts) {
		var ok = false
		for (var i = 0, l = V.lPts.length; i < l; i++) {
			ok = !overlap(pts, V.lPts[i])
			if (!ok)
				return false
		}
		return true
	}
	function checkOutBounds (pts) {
		var b = measureAggregateBoundingBox([V.lTri, polygon({points:pts})])
		var d = [ b[1][0] - b[0][0], b[1][1] - b[0][1] ]
		return (d[0] <= V.frame[0]) && (d[1] <= V.frame[1])
	}
	function candidates (first) {
		var r = []
		for (var i = first, l = V.lUNFOLD.length; i < l; i++) {
			var nFace = V.lUNFOLD[i]
			for (var j = 0; j < 3; j++) {
				var n = V.voisins[nFace][j]
				if (! V.lUNFOLD.includes(n)) {
					if (V.cacheKO.find(x => (x[0] === nFace) && (x[1] === n)) === undefined)
						r.push([nFace, n])
				}
			}
		}
		return r
	}
	function attach (nFace, nT, checkOnly = false) {
		function calcAngle (A,B,C) {
			var AB = Math.sqrt(Math.pow(B[0]-A[0],2)+ Math.pow(B[1]-A[1],2))
			var BC = Math.sqrt(Math.pow(B[0]-C[0],2)+ Math.pow(B[1]-C[1],2))
			var AC = Math.sqrt(Math.pow(C[0]-A[0],2)+ Math.pow(C[1]-A[1],2))

			return Math.acos((BC*BC+AB*AB-AC*AC) / (2*BC*AB))
		}

		if (V.lUNFOLD.includes(nT) || 
				V.lATTACH.findIndex(x => x.f === nT && x.t === nFace) > -1) {
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
		ptV = V.v2d[nT].map(v => [v[0] + dx, v[1] + dy])
		ptV0 = ptV[nVP]
		ptV1 = ptV[suiv(nVP)]

		// rotate neighbor
		let a = calcAngle(ptF0, ptF1, ptV1)
		let tmp = ptV.map(x => rotation(ptF1[0], ptF1[1], x[0], x[1], a))
		ptV1 = tmp[suiv(nVP)]
		let delta = Math.abs(distance2d(ptF0, ptV1))
		if (delta > epsilon) {
			ptV = ptV.map(x=> rotation(ptF1[0], ptF1[1], x[0], x[1], degToRad(360)-a))
		} else
			ptV = tmp

		if (checkOverlap(ptV)) { 
			if (!checkOutBounds(ptV)) {
				if (!checkOnly)
					V.cacheKO.push([nFace, nT])
				return false
			}
		} else {
			if (!checkOnly)
				V.cacheKO.push([nFace, nT])
			return false
		}
		if (!checkOnly){
			V.lPts.push(ptV)
			V.lTri.push(polygon({points:ptV}))			
			V.v2d[nT] = ptV
			V.lATTACH.push({f:nFace, t:nT})
		}

		return true
	}
	function render (){
		function middle (a, b) {
			return [((a[0] + b[0]) / 2), ((a[1] + b[1]) / 2)]
		}
		function colorLine (l) {
			function eq3 (t1, t2, n) {
				function distance (p1, p2) {
					var a = p2[0] - p1[0], b = p2[1] - p1[1], c = p2[2] - p1[2]

					return Math.sqrt(a * a + b * b + c * c)
				}
				return	 (distance(t2[n], t1[0]) >= epsilon)
							&& (distance(t2[n], t1[1]) >= epsilon)
							&& (distance(t2[n], t1[2]) >= epsilon)
			}
			function isCoplanar (t, p) {
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
			// equation of plane is: a*x + b*y + c*z = 0
			// checking if the 4th point satisfies  
			// the above equation  
				return a * x + b * y + c * z + d
			}

			var tri1 = V.v3d[l[2]], tri2 = V.v3d[l[3]]
			var p
					if (eq3(tri1, tri2, 0))
				p = tri2[0]
			else if (eq3(tri1, tri2, 1))
				p = tri2[1]
			else if (eq3(tri1, tri2, 2))
				p = tri2[2]

			var estCop = isCoplanar(V.v3d[l[2]], p)
			if (estCop) {
				col = estCop < 0 ? cssColors.maroon : cssColors.green
				return colorize(col, line([l[0], l[1]]))
			} else
				return null
		}
		function getLinkN (n1, n2) {
			var nMin = Math.min(n1, n2),
					nMax = Math.max(n1, n2)
			var n = V.lNums.findIndex(x => (x.min === nMin ) && (x.max === nMax))
			var isFirst = false
			if (n === -1) {
				n = V.lNums.push({min: nMin, max: nMax}) - 1
				isFirst = true
			}
			return {n: n, isFirst: isFirst}
		}

		var r = [], s = V.FlapH

		for (var i = 0, il = V.lLINES.length; i < il; i++) {
			var l = V.lLINES[i]
			if (l[4] === 1) {// border => add neighbour #
				var m = middle(l[0], l[1])
				var a = direction(l[0], l[1])
				var c = centroid(V.v2d[l[3]])
				var d1= distance2d(m, c)
				var num = getLinkN(l[2], l[3])
				var tmp = translate(m, rotateZ(a, number(num.n, V.s3, 0, 1)))
				var b = measureAggregateBoundingBox(tmp)
				var m2 = middle(b[0], b[1])
				var d2 = distance2d(m2, c)
				if (d1 < d2) {
					tmp = translate(m, rotateZ(a, number(num.n, V.s3, 0, -1)))
				}

				if (!V.ShowFlaps)
					r.push(colorize(cssColors.red, line([l[0], l[1]])))
				else {
					if (V.lFlaps.findIndex(x => x.n === l[2] && x.nT === l[3]) !== -1
					 || V.lFlaps.findIndex(x => x.min === Math.min(l[2], l[3])
								&& x.max === Math.max(l[2], l[3])) === -1
						) {
						r.push(colorize(cssColors.red, line([l[0], l[1]])))
					} else {
						var rl = colorLine(l)
						r.push(rl)
					}
				}  
				r.push(colorize(cssColors.black, tmp))
			} else {
				var rl = colorLine(l)
				if (rl !== null)
					r.push(rl)
			}
		}

		if (V.ShowFlaps) {
			for (var i = 0, l = V.lPts.length; i < l; i++){ // Add flaps
				var p = V.lPts[i]
				if (p.length  === 4){
					r.push(colorize(cssColors.red, line(p)))
				}
			}
		}

		return r
	}
	function findFaceToUnfold () {
		var r = -1, i = 0, l = V.faces.length
		while ( (i < l) && (r < 0)) {
			if (! V.lUNFOLD.includes(i)) {
				r = i
			} else
				i++
		}
		return r
	}
	function organize (P) { // center pieces in contiguous frames
		var r = []
		for (var i = 0, li = P.length; i < li; i++) {
			var rd = P[li-i-1].d
			var b = measureGroup(rd)
			var d = [b[2][0] + b[0] / 2, b[2][1] + b[1] / 2]
			var e = [(V.frame[0] * (i + 0.5)) - d[0] +1, (V.frame[1] * 0.5) - d[1] +1]
			r.push(translate(e, rd))
			r.push(translate([V.frame[0]* (i+0.5), V.frame[1]/2], 
				rectangle({size:V.frame})))
		}
		return r
	}
	function aggregatePieces (P) {// join small pieces
		function minX (a, b) { return a.x > b.x }
		function minY (a, b) { return a.y > b.y }
		const align_centerXY = ['center','center','none']

		var r = []
		for (var i = 0, l = P.length; i < l; i++) { // measure pieces
			var b = measureAggregateBoundingBox(P[i])
			r.push({d:align({modes:align_centerXY, grouped:true}, P[i]), 
							x: b[1][0] - b[0][0], y: b[1][1] - b[0][1]})
		}

		if (r.length > 1) {
			var ok = true
			do { // try to group smallest X pieces
				r.sort(minX)
				if ((r[0].x + r[1].x) < V.frame[0]) {
					r[0].d.push(translateX((r[0].x + r[1].x) / 2, r[1].d))
					r[0].d = align({modes:align_centerXY, grouped:true}, r[0].d)
					var b = measureGroup(r[0].d)
					r[0].x = b[0]
					r[0].y = b[1]
					r[1].d = null
					r.splice(1, 1)
				} else {
					ok = false
				}
			} while (ok)

			var ok = true
			do { // try to group smallest Y pieces
				r.sort(minY)
				if ((r[0].y + r[1].y) < V.frame[1]) {
					r[0].d.push(translateY((r[0].y + r[1].y) / 2, r[1].d))
					r[0].d = align({modes:align_centerXY, grouped:true}, r[0].d)
					var b = measureGroup(r[0].d)
					r[0].x = b[0]
					r[0].y = b[1]
					r[1].d = null
					r.splice(1, 1)
				} else {
					ok = false
				}
			} while (ok)
		}
		return r
	}
	function displayDims (v) {
		var r = []
		var b = measureDimensions(v)
		r.push(colorize(cssColors.black, number(Math.round(b[0]), 1, 100, -20)))
		r.push(colorize(cssColors.black, number(Math.round(b[1]), 1, 100, -50)))
		r.push(colorize(cssColors.black, number(Math.round(b[2]), 1, 100, -80)))

		return r
	}
	//function flapToggle(n)
// INITS
	const frameSizes = [
		[105, 148], // A6
		[148, 210], // A5
		[210, 297], // A4
		[297, 420], // A3
		[420, 594], // A3
		[594, 841], // A1
		[841, 1189],// A0
		[300, 300], // Cricut Small
		[300, 600]  // Cricut Large
	]

	const vf = require('./' + params.fileN)
	var V = toPolyhedron(vf[0])
	//var V = toPolyhedron(sphere({segments:8}))
	//var V = toPolyhedron(cube())

	V.lUNFOLD = [] // unfolded faces
	V.lNums   = [] // numbers of linked edges
	V.lFlaps	= [] // {min, max}
	V.lATTACH = []
	V.saveL		= []

	// Set parameters
	V.frame = params.FrameType.value === -1 // frame dimensions
		? [params.frameX, params.frameY] : frameSizes[params.FrameType]
	V.s  = params.Pscale
	V.s2 = params.Nscale * V.s / 30
	V.s3 = V.s2 * 0.6
	V.FlapH = params.FlapH
	//V.Flap2 = params.Flap2.split(',').map(Number)
	V.ShowFlaps = params.ShowFlaps
	V.ShowNums = params.ShowNums

	V.voisins = getNeighbors(V.faces)

	V.vertices = V.vertices.map(v => [v[0] * V.s, v[1] * V.s, v[2] * V.s])
	V.v3d = createTriangles3dFromFaces()
	V.v2d = createTriangles2dFrom3d()
	
	setExclusions(params.Excld)

// START UNFOLDING
	var r, rr = [], fT = params.firstTriangle, newCLimit = 0
	do {
		r = []
		V.lLINES = []
		V.lTri = []
		V.lPts = []
		r.push(pose(fT, params.ShowNums)) // display first triangle
		var ok = true
		while (ok) {
			var c = candidates(newCLimit), cl = c.length
			if (cl > 0) {
				for (var ai = 0, lok = true; lok && (ai < cl); ai++) {
					if (attach(c[ai][0], c[ai][1])) {
						ok = true
						r.push(pose(c[ai][1], params.ShowNums))
						lok = false
					}
				}
			} else
				ok = false
		}

		r.push(render())
		rr.push(r)
		newCLimit = V.lUNFOLD.length - 1
		fT = findFaceToUnfold()
		//V.saveL = V.saveL.concat(V.lLINES)
		V.saveL.push(V.lLINES)
	} while (fT > -1)

	var mf = V.lNums.filter(x =>
		V.lFlaps.findIndex(y => y.min === x.min && y.max === x.max) === -1)

	var nOK = 0, tmp
	
	for (var vsn = 0; vsn < V.saveL.length; vsn++) {
		for (var n = 0; n < mf.length; n++){
			var ll = []
			tmp = V.saveL[vsn].find(x => x[2] === mf[n].min && x[3] === mf[n].max)
			if(tmp !== undefined)
				ll.push(tmp)
			tmp = V.saveL[vsn].find(x => x[3] === mf[n].min && x[2] === mf[n].max)
			if(tmp !== undefined)
				ll.push(tmp)

			if(ll.length === 2){
				var pts = [ll[0][0], ll[0][1], ll[1][0], ll[1][1]]
				pts.sort(function(a,b){ return a[0] - b[0] || a[1] - b[1]})
				var AB = []
				var C = null
				for (var i = 0; i < pts.length; i++){
					var c = 0
					for (var j = 0; j < pts.length; j++){
						if (eq(pts[i], pts[j]))
							c++
					}
					if(c === 1)
						AB.push(pts[i])
					else
						if (C === null)
							C = pts[i]
				}
				if(C){
					AB[1] = [lerp(C[0], AB[1][0], 0.8), lerp(C[1], AB[1][1], 0.8)]
					rr[vsn].push(colorize(cssColors.red, line(AB)))
					nOK++
				}
			}
		}
	}

	console.log(nOK)
	
	var rr = organize(aggregatePieces(rr))

	var volS = scale([V.s, V.s, V.s], vf[0])
	if (params.ShowVol)
		rr.push(translateX(-100, volS))

	if (params.ShowDims)
		rr.push(displayDims(volS))

	console.log(V.lUNFOLD.length, '/', V.faces.length)

	return rr
}

function lerp(start, end, amt) { return (1-amt)*start+amt*end }
function measureGroup (g) { // return width, length, and min & max coordinates
	var b = measureAggregateBoundingBox(g)
	return [b[1][0] - b[0][0], b[1][1] - b[0][1], b[0], b[1]]
}
function overlap (t1, t2) {
	function li (l1S, l1E, l2S, l2E) {// true if the lines intersect
		if (eq(l1S, l2S) || eq(l1S, l2E) || eq(l1E, l2S) || eq(l1E, l2E)) {
			return false
		}

		var denominator = ((l2E[1] - l2S[1]) * (l1E[0] - l1S[0]))
										- ((l2E[0] - l2S[0]) * (l1E[1] - l1S[1]))

		if (denominator === 0) {
			return false
		}

		var a = l1S[1] - l2S[1],
				b = l1S[0] - l2S[0],
				numerator1 = ((l2E[0] - l2S[0]) * a) - ((l2E[1] - l2S[1]) * b),
				numerator2 = ((l1E[0] - l1S[0]) * a) - ((l1E[1] - l1S[1]) * b)
		a = numerator1 / denominator
		b = numerator2 / denominator

		if ((a > 0 && a < 1) && (b > 0 && b < 1)) {
			return true
		} else {
			return false
		}
	}

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
function eq (p1, p2) {return distance2d(p1, p2) < epsilon}
function suiv (n) {return n < 2 ? n + 1 : 0}
function rotation (cx, cy, x, y, angle) {
	var cos = Math.cos(angle),
			sin = Math.sin(angle)

	return [(cos * (x - cx)) + (sin * (y - cy)) + cx,
					(cos * (y - cy)) - (sin * (x - cx)) + cy]
}
function distance2d (p1, p2) {
	var a = p2[0] - p1[0], b = p2[1] - p1[1]

	return Math.sqrt(a * a + b * b)
}
function centroid (pts) {
	var a = pts[0], b = pts[1], c = pts[2]

	return [((a[0] + b[0] + c[0]) / 3), ((a[1] + b[1] + c[1]) / 3)]
}
function direction (p1, p2) {
	return Math.atan2(p2[1] - p1[1], p2[0] - p1[0])
}
function number (n, s, x, y) {
	function digit (num, scale = 1) {
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

	var ch = n.toString().split("").map(Number), r = [], dkX = 0
	for (var i = 0, il = ch.length; i < il; i++) {
		var nl = line(digit(ch[i], s).map(v => [
			v[0]+ dkX + x -(6*s)*il, 
			v[1]+ y -1.25*s
		]))
		r.push(nl)
		var b = measureBoundingBox(nl)
		dkX += b[1][0] - b[0][0] + 4 * s
	}

	return r
}
function trapeze (p1, p2, s) {
	const d = distance2d(p1, p2)
	const a = degToRad(90) - direction(p1, p2)

	var P = [
		rotation(p1[0], p1[1], p1[0],   p1[1], a),
		rotation(p1[0], p1[1], p1[0]+s, p1[1]+ d * 0.35, a),
		rotation(p1[0], p1[1], p1[0]+s, p1[1]+ d * 0.65, a),
		rotation(p1[0], p1[1], p1[0],   p1[1]+ d, a)
	]

	return P
}

module.exports = { main, getParameterDefinitions }
