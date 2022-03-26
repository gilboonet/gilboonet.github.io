// fonctions depuis deplieur jscad2 22-02-12 
const epsilon = 0.0001

function degToRad(degrees) { return degrees * Math.PI / 180 }

function calcAngle (A,B,C) {
	let AB = Math.sqrt(Math.pow(B[0]-A[0], 2)+ Math.pow(B[1]-A[1], 2))
	let BC = Math.sqrt(Math.pow(B[0]-C[0], 2)+ Math.pow(B[1]-C[1], 2))
	let AC = Math.sqrt(Math.pow(C[0]-A[0], 2)+ Math.pow(C[1]-A[1], 2))
	let R = (BC*BC+AB*AB-AC*AC) / (2*BC*AB)
	if (R >  1) R = 1
	if (R < -1) R = -1
	return Math.acos(R)
}
function centroid (pts) {
	var a = pts[0], b = pts[1], c = pts[2]

	return [((a[0] + b[0] + c[0]) / 3), ((a[1] + b[1] + c[1]) / 3)]
}
function dimensions(p1, p2) { return [p2[0] - p1[0], p2[1] - p1[1]]}
function direction (p1, p2) {
	return Math.atan2(p2[1] - p1[1], p2[0] - p1[0])
}
function distance   (p1, p2) {
	var a = p2[0] - p1[0], b = p2[1] - p1[1], c = p2[2] - p1[2]
		return Math.sqrt(a * a + b * b + c * c)
}
function distance2d (p1, p2) {
//	var a = p2[0] - p1[0], b = p2[1] - p1[1]
//	return Math.sqrt(a * a + b * b)
	let d = dimensions(p1, p2)
	return Math.sqrt(d[0] * d[0] + d[1] * d[1])
}
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
function eq (p1, p2) {return distance2d(p1, p2) < epsilon}
function eq2 (v1, v2) {return Math.abs(v1 - v2) < epsilon}
function eq3 (t1, t2, n) {
	return (distance(t2[n], t1[0]) >= epsilon)
			&& (distance(t2[n], t1[1]) >= epsilon)
			&& (distance(t2[n], t1[2]) >= epsilon)
}
function getNeighbors (f) {
	let N = []
	for (let i = 0, il = f.length; i < il; i++) {
		N[i] = []
		for (let j = 0; j < 3; j++) {
			let p1 = f[i][j], p2 = f[i][suiv(j)]
			let n = f.findIndex(function(el, idx){
				return (idx !== i) && el.includes(p1) && el.includes(p2)})
		N[i].push(n)
		}
	}
	return N
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
function lerp(start, end, amt) { return (1-amt)*start+amt*end }
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
function milieu (a, b) {
	return [((a[0] + b[0]) / 2), ((a[1] + b[1]) / 2)]
}
function minX (a, b) { return a.x - b.x }
function minY (a, b) { return a.y - b.y }
function overlap (t1, t2) {
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
function rotation (cx, cy, x, y, angle) {
	var cos = Math.cos(angle),
			sin = Math.sin(angle)

	return [(cos * (x - cx)) + (sin * (y - cy)) + cx,
					(cos * (y - cy)) - (sin * (x - cx)) + cy]
}
function setExclusions (pex) {
	return pex.split(',').map(x => x.split('-').map(Number))
}
function suiv (n) {return n < 2 ? n + 1 : 0}
function toPolyhedron (O) {
	var p = toPolygons(O), r = {vertices:[], faces:[], color:[]}
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
		let fc = poly.color === undefined ? [1,1,1,1] : poly.color
		if (f.length == 3) {
		r.faces.push(f)
			r.color.push(fc)
		} else {
			for (var j = 1, jl = f.length -1; j < jl; j++) {
				r.faces.push([f[0], f[j], f[j+1]])
			r.color.push(fc)
			}
		}
	}
	return r
}
function trapeze (p1, p2, s, dt = 0.35) {
	const d = distance2d(p1, p2)
	const a = degToRad(90) - direction(p1, p2)
	if (d > 50) dt = dt/2
	if (d > 100) dt = dt/2

	var P = [
		rotation(p1[0], p1[1], p1[0],   p1[1], a),
		rotation(p1[0], p1[1], p1[0]+s, p1[1]+ d * dt, a),
		rotation(p1[0], p1[1], p1[0]+s, p1[1]+ d * (1 -dt), a),
		rotation(p1[0], p1[1], p1[0],   p1[1]+ d, a)
	]

	return P
}

function checkOverlap(base, p) {
	for (var i = 0, l = base.length; i < l; i++) {
		if (overlap(base[i], p))
			return true
	}
	return false
}

function max (L) {
	return L.reduce(function (a, b) { return Math.max(a, b)}, -Infinity)
}

function min (L) {
	return L.reduce(function (a, b) { return Math.min(a, b)}, Infinity)
}

function calcBoiteEnglobante (pts) {
	const ptsX = pts.map(p => p[0])
	const ptsY = pts.map(p => p[1])
	return [
		[min(ptsX), min(ptsY)],
		[max(ptsX), max(ptsY)]
	]
}

function couleurFr(cn){
	const couleurs =[
["Default", "noir", [0,0,0]],
["White", "blanc", [255,255,255]],
["Snow", "blanc neigeux", [255,250,250]],
["Honeydew", "miellé", [240,255,240]],
["MintCream", "blanc mentholé", [245,255,250]],
["Azure", "azurin", [240,255,255]],
["AliceBlue", "bleu Alice", [240,248,255]],
["GhostWhite", "blanc spectral", [248,248,255]],
["WhiteSmoke", "blanc fumée", [245,245,245]],
["Seashell", "coquillage", [255,245,238]],
["Beige", "beige", [245,245,220]],
["OldLace", "vieux blanc", [253,245,230]],
["FloralWhite", "blanc floral", [255,250,240]],
["Ivory", "ivoire", [255,255,240]],
["AntiqueWhite", "blanc antique", [250,235,215]],
["Linen", "blanc de lin", [250,240,230]],
["LavenderBlush", "lavande rougeâtre", [255,240,245]],
["MistyRose", "rose voilé", [255,228,225]],
["Gainsboro", "gris gainsboro", [220,220,220]],
["LightGrey", "gris clair", [119,135,153]],
["Silver", "argent", [192,192,192]],
["DarkGray", "gris clair", [169,169,169]],
["Gray", "gris", [128,128,128]],
["DimGray", "gris rabattu", [105,105,105]],
["LightSlateGray", "gris ardoise clair", [119,136,153]],
["SlateGray", "gris ardoise", [112,128,144]],
["DarkSlateGray", "gris ardoise sombre", [47,79,79]],
["Black", "noir", [0,0,0]],
["Cornsilk", "jaune maïs doux", [255,248,220]],
["BlanchedAlmond", "amande blanchi", [255,235,205]],
["Bisque", "bisque", [255,228,196]],
["NavajoWhite", "blanc navarro", [255,222,173]],
["Wheat", "blé", [245,222,179]],
["BurlyWood", "bois dur", [222,184,135]],
["Tan", "brun tané", [210,180,140]],
["RosyBrown", "bois de rose", [188,143,143]],
["SandyBrown", "brun sable", [244,164,96]],
["Goldenrod", "jaune paille", [218,165,32]],
["DarkGoldenrod", "jaune paille sombre", [184,134,11]],
["Peru", "pérou", [205,133,63]],
["Chocolate", "chocolat", [210,105,30]],
["SaddleBrown", "cuir", [139,69,19]],
["Sienna", "terre-de-sienne", [160,82,45]],
["Brown", "brun", [165,42,42]],
["Maroon", "marron", [128,0,0]],
["IndianRed", "rouge indien", [205,92,92]],
["LightCoral", "corail clair", [240,128,128]],
["Salmon", "saumon", [250,128,114]],
["DarkSalmon", "saumon sombre", [233,150,122]],
["LightSalmon", "saumon clair", [255,160,122]],
["Crimson", "pourpre", [220,20,60]],
["Red", "rouge", [255,0,0]],
["FireBrick", "rouge brique", [178,34,34]],
["DarkRed", "rouge sombre", [139,0,0]],
["Pink", "rose", [255,192,203]],
["LightPink", "rose clair", [255,182,193]],
["HotPink", "rose chaud", [255,105,180]],
["DeepPink", "rose profond", [255,20,147]],
["MediumVioletRed", "rouge violacé moyen", [199,21,133]],
["PaleVioletRed", "rouge violacé pâle", [219,112,147]],
["Coral", "corail", [255,127,80]],
["Tomato", "rouge tomate", [255,99,71]],
["OrangeRed", "rouge orangé", [255,69,0]],
["DarkOrange", "orange sombre", [255,140,0]],
["Orange", "orange", [255,165,0]],
["Gold", "or", [255,215,0]],
["Yellow", "jaune", [255,255,0]],
["LightYellow", "jaune clair", [255,255,224]],
["LemonChiffon", "jaune chiffoné", [255,250,205]],
["LightGoldenrodYellow", "jaune paille clair", [250,250,210]],
["PapayaWhip", "papaye délavé", [255,239,213]],
["Moccasin", "beige mocassin", [255,228,181]],
["PeachPuff", "pêche passé", [255,218,185]],
["PaleGoldenrod", "jaune paille pâle", [238,232,170]],
["Khaki", "kaki", [240,230,140]],
["DarkKhaki", "kaki sombre", [189,183,107]],
["Lavender", "lavande", [230,230,250]],
["Thistle", "chardon", [216,191,216]],
["Plum", "prune", [221,160,221]],
["Violet", "parme", [238,130,238]],
["Orchid", "orchidée", [218,112,214]],
["Fuchsia", "fuchsia", [255,0,255]],
["Magenta", "magenta", [255,0,255]],
["MediumOrchid", "orchidée moyen", [186,85,211]],
["MediumPurple", "lavande", [147,112,219]],
["BlueViolet", "parme bleuté", [138,43,226]],
["DarkViolet", "violet sombre", [148,0,211]],
["DarkOrchid", "orchidée sombre", [153,50,204]],
["DarkMagenta", "magenta sombre", [139,0,139]],
["Purple", "violet", [128,0,128]],
["Indigo", "indigo", [75,0,130]],
["SlateBlue", "bleu ardoise", [106,90,205]],
["DarkSlateBlue", "bleu ardoise sombre", [42,61,139]],
["GreenYellow", "jaune-vert", [173,255,47]],
["Chartreuse", "vert chartreuse", [127,255,0]],
["LawnGreen", "vert prairie", [124,252,0]],
["Lime", "citron vert", [0,255,0]],
["LimeGreen", "citron vert foncé", [50,205,50]],
["PaleGreen", "vert pâle", [152,251,152]],
["LightGreen", "vert clair", [144,238,144]],
["MediumSpringGreen", "vert printemps moyen", [0,250,154]],
["SpringGreen", "vert printemps", [0,255,127]],
["MediumSeaGreen", "vert océan moyen", [60,179,113]],
["SeaGreen", "vert océan", [0,255,127]],
["ForestGreen", "vert forêt", [34,139,34]],
["Green", "vert", [0,255,0]],
["DarkGreen", "vert sombre", [0,100,0]],
["YellowGreen", "vert jaunâtre", [154,205,50]],
["OliveDrab", "vert olive terne", [107,142,35]],
["Olive", "vert olive", [128,128,0]],
["DarkOliveGreen", "vert olive sombre", [85,107,47]],
["MediumAquamarine", "aigue-marine moyen", [102,205,170]],
["DarkSeaGreen", "vert océan sombre", [143,188,143]],
["LightSeaGreen", "vert océan clair", [32,178,170]],
["DarkCyan", "cyan sombre", [0,139,139]],
["Teal", "sarcelle", [0,128,128]],
["Aqua", "eau", [0,255,255]],
["Cyan", "cyan", [0,255,255]],
["LightCyan", "cyan clair", [224,225,255]],
["PaleTurquoise", "turquoise pâle", [175,238,238]],
["Aquamarine", "aigue-marine", [127,255,212]],
["Turquoise", "turquoise", [64,224,208]],
["MediumTurquoise", "turquoise moyen", [72,209,204]],
["DarkTurquoise", "turquoise sombre", [0,206,209]],
["CadetBlue", "pétrole clair", [95,158,160]],
["SteelBlue", "bleu acier", [70,130,180]],
["LightSteelBlue", "bleu acier clair", [176,196,222]],
["PowderBlue", "bleu poudré", [176,224,230]],
["LightBlue", "bleu clair", [173,216,230]],
["SkyBlue", "bleu ciel", [135,206,235]],
["LightSkyBlue", "bleu ciel clair", [135,206,250]],
["DeepSkyBlue", "bleu ciel profond", [0,191,255]],
["DodgerBlue", "bleu toile", [30,144,255]],
["CornflowerBlue", "bleuet", [100,149,237]],
["MediumSlateBlue", "bleu ardoise moyen", [123,104,238]],
["RoyalBlue", "bleu roi", [65,105,225]],
["Blue", "bleu", [0,0,255]],
["MediumBlue", "bleu moyen", [0,0,205]],
["DarkBlue", "bleu sombre", [0,0,139]],
["Navy", "bleu marine", [0,0,128]],
["MidnightBlue", "bleu nuit", [25,25,112]]
]

cn = cn.toLowerCase()
let i = couleurs.findIndex(c => c[0].toLowerCase() === cn)
return i === -1 ? {n:'?', v:[0,0,0]} : {n:couleurs[i][1], v:couleurs[i][2]}
 
}

function obj2jscad (data){
let d = data.split(/\n/);
// 1°) Lit les vertices ( v x y z)
let lv = d.filter(l => l.startsWith('v '));
let pts = lv.map(x => {
  var tmp = x.split(/\s/);
  tmp.shift();
  var v = tmp.filter(d => d.trim()).map(x => Math.round(Number(x) * 100) / 100);
  return v;
});
// 2°) Lit les faces (g puis [f v1// v2// v3//]... )
let lf = d.filter(l => l.startsWith('g ') || l.startsWith('f ')
	|| l.startsWith('usemtl '));
let faces = [], groupes = [], nfg = 0, usemtl = [];
for (let i = 0; i < lf.length; i++){
  if (lf[i].startsWith('g ')) {
    nfg++;
  } else if (lf[i].startsWith('usemtl ')) {
    let lfip = lf[i-1];
    if (!(lfip.startsWith('g '))) {
      nfg++;
    }
    usemtl.push(lf[i].split(' ')[1].trim())
  } else {
    var tmp = lf[i].split(/\s/);
    tmp.shift();
    let f = tmp.map(x => {
			var n = x.split(/\//);
			return Number(n[0])-1;
		});
		var nd = f[f.length -1];
		if ((nd == -1) || !(Number.isInteger(nd))){
			f.pop();
		}
    if(f.length == 3){
			faces.push(f);
		} else {
			for(j = 1; j< f.length-1; j++){
				faces.push([f[0], f[j], f[j+1]])
			}
		}
    groupes.push(nfg);
  }
}
console.log(groupes)
return { faces : faces, vertices: pts, groups: groupes, usemtl: usemtl }
}
