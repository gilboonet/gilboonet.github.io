const jscad = require('@jscad/modeling')
const { curves, maths, extrusions, primitives, transforms, booleans, 
	colors, geometries, measurements, utils } = jscad
const { bezier } = curves
const { slice, extrudeLinear } = extrusions
const { cuboid, polygon, polyhedron } = primitives
const { intersect, subtract,union } = booleans
const { center, scale, translateX, translateY, translateZ, translate
		,rotateX, rotateY, rotateZ } = transforms
const { colorize } = colors
const { geom3, poly3 } = geometries
const { vec3 } = maths
const { measureBoundingBox, measureArea } = measurements
const { degToRad } = utils

function main () {
  var vol = center({axes:[true,true,true]}, rotateX(degToRad(90), table()));
  var r = [], rH = [];
  
  //r= vol;

  console.log(measureBoundingBox(vol));
  
  const ep = 1.2;
  
  var trH = translateZ(0, cuboid({size: [ep, 32, 32]}));
  for (var i = -15; i< 16; i += 4){
	  var t = intersect(vol, translateX(i, trH));
	  if (t.polygons.length > 0)
			rH.push(colorize([0, 1, 0, 1], t));
	}
  rV = [];
  var trV = translateZ(0, cuboid({size: [32, ep, 32]}));
  for (var i = -15; i< 16; i += 4){
	  var t = intersect(vol, translateY(i, trV));
	  if (t.polygons.length > 0)
			rV.push(colorize([0,0,1, 1], t));
	}

	var ur = union(intersect(union(rH), union(rV)));
	var tmp = scission3d(ur)  
	var eS = [], eH = [], eV = [];
	for(var i in tmp){
		var p = tmp[i];
		var b = measureBoundingBox(p), 
				d = vec3.subtract(b[1], b[0]);
		var c1 = translate([b[0][0], b[0][1] + ep/2, b[0][2]], 
					cuboid({size: [d[0], d[1]*2, d[2]]}));
		var c2 = translate([b[0][0] + ep/2, b[0][1], b[1][2]], 
					cuboid({size: [d[0]*2, d[1], d[2]]}));
		
		eH.push(intersect(tmp[i], c1));
		eV.push(intersect(tmp[i], c2));
	}
	
	// tranchage
	rH = rH.map(x=> subtract(x, eV));
	rV = rV.map(x=> subtract(x, eH));
	
	// 3d
	r.push(colorize([0,1,0], translateX(-70, vol)));
	r.push(colorize([1,0,0], translateX(32-70, rH)));
	r.push(colorize([0,0,1], translateX(-32-70, rV)));
	
	
	// 2d
	for(var i = 0; i< rH.length; i++){
		b = measureBoundingBox(rH[i]);
		tmp = union(vol2surf(rH[i], 'x', b[0][0]));
		r.push(translateX(32*i, tmp));
	}
	for(var i = 0; i< rV.length; i++){
		b = measureBoundingBox(rV[i]);
		tmp = union(vol2surf(rV[i], 'y', b[0][1]));
		r.push(translate([32*i, -32], tmp));
	}
		
	return r;
}

function rndColors(){return [Math.random(), Math.random(), Math.random()];}

///
function sortNb	(E){ // returns E numerically sorted and deduplicated
	return E.sort(function(a, b) {return a-b}).filter(
	    function(item, pos, ary) {return !pos || item != ary[pos - 1]});
}

function scission3d	(geom){
  var i,Pl, j,i1,j1,ok,ti,tj,z,zz = [], P, RScission, til, tjl, tii1, zzl, zzdl;
// construit table de correspondance entre Polygones (P)
// build polygons lookup table
  //P = geom.toPolygons();
  P = geom.polygons;
  
  RScission = [];
  Pl = P.length;
  for (i = 0; i < Pl; i++){
	ti = P[i].vertices;
	z = [];
	for (j = 0; j < Pl; j++){
      tj = P[j].vertices;
	  ok = false;
	  for (i1 = 0; i1 < ti.length; i1++){
	    tii1 = ti[i1];
		for(j1 = 0; j1 < tj.length; j1++)
		  if (!ok)ok = vec3.distance(tii1, tj[j1]) < 0.01;
	  }
	  if (ok)z.push(parseInt(j));
	}
	z = sortNb(z);
	zz.push({e:0, d:z});
  }

// regroupe les correspondances des polygones se touchant
// boucle ne s'arrêtant que quand deux passages retournent le même nb de polygones
// merge lookup data from linked polygons as long as possible
  ok = false;
  nElOk = 0;
  do {
    lnElOk = nElOk;
	nElOk = 0;
	for (i = 0; i < zz.length; i++){
	  if (zz[i].e >= 0) {
	    nElOk++;
		for (j = 0; j < zz[i].d.length; j++){
		  a = zz[i].d[j];
		  if (zz[a].e >= 0)
		    if (i != a) {
			  zz[i].d = sortNb(zz[i].d.concat(zz[a].d));
			  zz[a].e = -1;
			}
		}
	  }
	}
	ok = lnElOk == nElOk;
  }while (!ok);

// construit le tableau des CSG à retourner
// build array of CSG to return
  for (i = 0, zzl = zz.length; i < zzl; i++) {
    if (zz[i].e >= 0) {
			z = [];
			for (j = 0, zzdl = zz[i].d.length; j < zzdl; j++){
				z.push(P[zz[i].d[j]]);
			}
			if(z.length > 0) {
			RScission.push(geom3.create(z));
			}
	  }
  }

  return RScission;
}
// retourne la surface formee par le volume avec l'axe z (à 0)
function vol2surf(vol, axe, orig = 0){ // axe = 'x' | 'y' | 'z'
var n, pts, ok, P, i, pt;
let S = [];
var X, Y, Z;

for(n = 0; n < vol.polygons.length; n++){
  pts = [];
  P = vol.polygons[n];
  ok = true;
  switch(axe){
		case 'x':
			X = 1; Y = 2; Z = 0;
			break;
		case 'y':
			X = 0; Y = 2; Z = 1;
			break;
		case 'z':
			X = 0; Y = 1; Z = 2;
			break;
	}
  for(i=0; (i < P.vertices.length) && ok; i++){
    pt = P.vertices[i];
    if(Math.abs(pt[Z] - orig)< 0.05){
      pts.push([pt[X], pt[Y]]);
    } else {
      ok = false;
    }
  }
  if (ok){
    if(axe == 'x'){
			S.push(polygon({points:pts.reverse()}));
		} else {
			S.push(polygon({points:pts}));
		}
  }
}

return S;
}

///

function extrudeWobble (height) {
  const squareSlice = slice.fromPoints([[10, 10], [-10, 10], [-10, -10], [10, -10]])

  const xCurve = bezier.create([1, 2, 0.4, 1])
  const yCurve = bezier.create([1, 2, 0.5])

  return extrusions.extrudeFromSlices({
    numberOfSlices: 20,
    isCapped: true,
    callback: function (progress, count, base) {
      let newslice = slice.transform(maths.mat4.fromTranslation([0, 0, height * progress]), base)
      newslice = slice.transform(maths.mat4.fromScaling([
        bezier.valueAt(progress, xCurve),
        bezier.valueAt(progress, yCurve),
        1
      ]), newslice)
      return newslice
    }
  }, squareSlice)
}

function Cube1_default() {
	let Points = [
			[-1.825000000,-2.000000000,-1.825000000],
			[-1.825000000,-2.000000000,1.825000000],
			[1.825000000,-2.000000000,-1.825000000],
			[1.825000000,-2.000000000,1.825000000],
			[-1.375000000,-2.000000000,1.375000000],
			[-1.375000000,-2.000000000,-1.375000000],
			[1.375000000,-2.000000000,-1.375000000],
			[1.375000000,-2.000000000,1.375000000],
			[-1.825000000,-2.000000000,-1.375000000],
			[-1.825000000,-2.000000000,1.375000000],
			[-1.375000000,-2.000000000,-1.825000000],
			[1.375000000,-2.000000000,-1.825000000],
			[-1.375000000,-2.000000000,1.825000000],
			[1.375000000,-2.000000000,1.825000000],
			[1.825000000,-2.000000000,-1.375000000],
			[1.825000000,-2.000000000,1.375000000],
			[-1.759375000,-0.712500000,-1.759375000],
			[-1.759375000,-0.712500000,1.759375000],
			[1.759375000,-0.712500000,-1.759375000],
			[1.759375000,-0.712500000,1.759375000],
			[-0.850000000,-1.000000000,1.250000000],
			[-1.250000000,-1.000000000,0.850000000],
			[-1.250000000,-1.000000000,-0.850000000],
			[-0.850000000,-1.000000000,-1.250000000],
			[0.850000000,-1.000000000,-1.250000000],
			[1.250000000,-1.000000000,-0.850000000],
			[0.850000000,-1.000000000,1.250000000],
			[1.250000000,-1.000000000,0.850000000],
			[-1.900000000,-1.000000000,-0.750000000],
			[-1.900000000,-1.000000000,0.750000000],
			[-0.750000000,-1.000000000,-1.900000000],
			[0.750000000,-1.000000000,-1.900000000],
			[-0.750000000,-1.000000000,1.900000000],
			[0.750000000,-1.000000000,1.900000000],
			[1.900000000,-1.000000000,-0.750000000],
			[1.900000000,-1.000000000,0.750000000],
			[-1.900000000,-2.000000000,-1.600000000],
			[-1.837500000,-1.350000000,-1.837500000],
			[-1.600000000,-2.000000000,-1.900000000],
			[-1.837500000,-1.350000000,1.837500000],
			[-1.600000000,-2.000000000,1.900000000],
			[1.900000000,-2.000000000,-1.600000000],
			[1.837500000,-1.350000000,-1.837500000],
			[1.837500000,-1.350000000,1.837500000],
			[-1.300000000,-1.458333333,-1.062500000],
			[1.062500000,-1.458333333,-1.300000000],
			[1.300000000,-1.458333333,1.062500000],
			[-1.062500000,-1.458333333,1.300000000],
			[-1.862500000,-1.475000000,-1.162500000],
			[-2.000000000,-1.000000000,0.000000000],
			[-2.000000000,-1.000000000,0.600000000],
			[-1.900000000,-2.000000000,1.600000000],
			[-1.162500000,-1.475000000,-1.862500000],
			[0.000000000,-1.000000000,-2.000000000],
			[0.600000000,-1.000000000,-2.000000000],
			[1.600000000,-2.000000000,-1.900000000],
			[-1.162500000,-1.475000000,1.862500000],
			[0.000000000,-1.000000000,2.000000000],
			[0.600000000,-1.000000000,2.000000000],
			[1.600000000,-2.000000000,1.900000000],
			[1.862500000,-1.475000000,-1.162500000],
			[2.000000000,-1.000000000,0.000000000],
			[2.000000000,-1.000000000,0.600000000],
			[1.900000000,-2.000000000,1.600000000],
			[-1.600000000,-2.000000000,-1.300000000],
			[-1.300000000,-2.000000000,-1.600000000],
			[1.600000000,-2.000000000,-1.300000000],
			[1.300000000,-2.000000000,-1.600000000],
			[1.300000000,-2.000000000,1.600000000],
			[1.600000000,-2.000000000,1.300000000],
			[-1.600000000,-2.000000000,1.300000000],
			[-1.300000000,-2.000000000,1.600000000],
			[-1.500000000,-0.008737306,-1.500000000],
			[-1.500000000,-0.008737306,1.500000000],
			[1.500000000,-0.008737306,-1.500000000],
			[1.500000000,-0.008737306,1.500000000],
			[-1.300000000,-1.458333333,1.062500000],
			[-1.062500000,-1.458333333,-1.300000000],
			[1.300000000,-1.458333333,-1.062500000],
			[1.062500000,-1.458333333,1.300000000],
			[-2.000000000,-1.000000000,-0.600000000],
			[-1.862500000,-1.475000000,1.162500000],
			[-0.600000000,-1.000000000,-2.000000000],
			[1.162500000,-1.475000000,-1.862500000],
			[-0.600000000,-1.000000000,2.000000000],
			[1.162500000,-1.475000000,1.862500000],
			[2.000000000,-1.000000000,-0.600000000],
			[1.862500000,-1.475000000,1.162500000],
			[-1.000000000,-1.000000000,1.000000000],
			[-1.987500000,-0.850000000,1.075000000],
			[-1.600000000,-1.000000000,-0.800000000],
			[-1.000000000,-1.000000000,-1.000000000],
			[1.987500000,-0.850000000,1.075000000],
			[1.600000000,-1.000000000,-0.800000000],
			[-0.800000000,-1.000000000,-1.600000000],
			[1.075000000,-0.850000000,1.987500000],
			[-0.800000000,-1.000000000,1.600000000],
			[-1.987500000,-0.850000000,-1.075000000],
			[1.075000000,-0.850000000,-1.987500000],
			[1.000000000,-1.000000000,-1.000000000],
			[0.800000000,-1.000000000,-1.600000000],
			[1.600000000,-1.000000000,0.800000000],
			[1.000000000,-1.000000000,1.000000000],
			[0.800000000,-1.000000000,1.600000000],
			[1.987500000,-0.850000000,-1.075000000],
			[-1.075000000,-0.850000000,1.987500000],
			[-1.600000000,-1.000000000,0.800000000],
			[-1.075000000,-0.850000000,-1.987500000],
			[0.000000000,-0.400000000,2.000000000],
			[0.000000000,-0.400000000,-2.000000000],
			[2.000000000,-0.400000000,0.000000000],
			[-2.000000000,-0.400000000,0.000000000],
			[-1.100000000,-1.333333333,1.100000000],
			[-1.950000000,-1.400000000,1.500000000],
			[-1.600000000,-1.500000000,-1.050000000],
			[-1.100000000,-1.333333333,-1.100000000],
			[1.950000000,-1.400000000,1.500000000],
			[1.600000000,-1.500000000,-1.050000000],
			[-1.050000000,-1.500000000,-1.600000000],
			[1.500000000,-1.400000000,1.950000000],
			[-1.050000000,-1.500000000,1.600000000],
			[-1.950000000,-1.400000000,-1.500000000],
			[1.500000000,-1.400000000,-1.950000000],
			[1.100000000,-1.333333333,-1.100000000],
			[1.050000000,-1.500000000,-1.600000000],
			[1.600000000,-1.500000000,1.050000000],
			[1.100000000,-1.333333333,1.100000000],
			[1.050000000,-1.500000000,1.600000000],
			[1.950000000,-1.400000000,-1.500000000],
			[-1.500000000,-1.400000000,1.950000000],
			[-1.600000000,-1.500000000,1.050000000],
			[-1.500000000,-1.400000000,-1.950000000],
			[-2.000000000,-0.008737306,0.000000000],
			[0.000000000,-0.008737306,2.000000000],
			[2.000000000,-0.008737306,0.000000000],
			[0.000000000,-0.008737306,-2.000000000],
			[0.000000000,-0.008737306,0.000000000],
			[1.250000000,-1.000000000,0.000000000],
			[1.000000000,-1.000000000,0.000000000],
			[-1.000000000,-1.000000000,0.000000000],
			[-1.250000000,-1.000000000,0.000000000],
			[0.000000000,-1.000000000,1.250000000],
			[0.000000000,-1.000000000,1.000000000],
			[0.000000000,-1.000000000,0.000000000],
			[0.000000000,-1.000000000,-1.000000000],
			[0.000000000,-1.000000000,-1.250000000]
		];
	let Polygons = [
			[0,38,36],
			[1,40,129,39],
			[1,51,40],
			[2,42,128,41],
			[2,55,122,42],
			[3,63,116,43],
			[4,76,112,47],
			[5,77,115,44],
			[6,67,66],
			[6,78,123,45],
			[7,69,68],
			[7,79,126,46],
			[8,64,114,48],
			[9,70,51],
			[9,81,130,70],
			[10,38,131,52],
			[10,65,38],
			[11,83,122,55],
			[12,71,120,56],
			[13,68,59],
			[13,85,127,68],
			[14,41,128,60],
			[14,66,41],
			[15,87,116,63],
			[16,97,111,72],
			[17,105,108,73],
			[18,98,109,74],
			[19,92,110,75],
			[20,88,142,141],
			[21,88,112,76],
			[21,140,139,88],
			[22,91,139,140],
			[23,91,115,77],
			[23,145,144,91],
			[24,99,144,145],
			[25,99,123,78],
			[25,137,138,99],
			[26,102,126,79],
			[26,141,142,102],
			[27,102,138,137],
			[28,90,80],
			[29,50,106],
			[29,89,111,50],
			[29,106,130,81],
			[30,107,109,82],
			[31,54,109,98],
			[31,98,122,83],
			[31,100,54],
			[32,96,84],
			[33,58,103],
			[33,95,108,58],
			[33,103,127,85],
			[34,104,110,86],
			[35,62,110,92],
			[35,92,116,87],
			[35,101,62],
			[36,38,65,64],
			[36,64,8],
			[36,121,37,0],
			[37,121,97,16],
			[37,131,38,0],
			[39,113,51,1],
			[39,129,105,17],
			[40,51,70,71],
			[40,71,12],
			[41,55,2],
			[41,66,67,55],
			[42,122,98,18],
			[43,116,92,19],
			[43,119,59,3],
			[44,114,64,5],
			[44,115,91,22],
			[45,123,99,24],
			[45,124,67,6],
			[46,125,69,7],
			[46,126,102,27],
			[47,112,88,20],
			[47,120,71,4],
			[48,114,90,28],
			[48,121,36,8],
			[49,106,50],
			[49,111,80],
			[50,111,49],
			[51,113,81,9],
			[52,118,65,10],
			[52,131,107,30],
			[53,94,82],
			[53,109,54],
			[55,67,11],
			[56,120,96,32],
			[56,129,40,12],
			[57,103,58],
			[57,108,84],
			[58,108,57],
			[59,63,3],
			[59,68,69,63],
			[59,119,85,13],
			[60,117,66,14],
			[60,128,104,34],
			[61,93,86],
			[61,110,62],
			[63,69,15],
			[64,65,5],
			[65,118,77,5],
			[66,117,78,6],
			[67,124,83,11],
			[68,127,79,7],
			[69,125,87,15],
			[70,130,76,4],
			[71,70,4],
			[72,109,107,16],
			[72,135,109],
			[73,111,89,17],
			[73,132,111],
			[73,133,132],
			[74,110,104,18],
			[74,134,110],
			[74,135,134],
			[75,108,95,19],
			[75,133,108],
			[75,134,133],
			[76,130,106,21],
			[77,118,94,23],
			[78,117,93,25],
			[79,127,103,26],
			[80,111,97,28],
			[81,113,89,29],
			[82,94,30],
			[82,109,53],
			[83,124,100,31],
			[84,108,105,32],
			[85,119,95,33],
			[86,93,34],
			[86,110,61],
			[87,125,101,35],
			[88,139,143,142],
			[89,113,39,17],
			[90,114,44,22],
			[91,144,143,139],
			[93,61,137,25],
			[93,117,60,34],
			[94,53,145,23],
			[94,118,52,30],
			[95,119,43,19],
			[96,120,47,20],
			[97,121,48,28],
			[99,138,143,144],
			[100,124,45,24],
			[101,125,46,27],
			[102,142,143,138],
			[103,57,141,26],
			[104,128,42,18],
			[105,129,56,32],
			[106,49,140,21],
			[107,131,37,16],
			[108,133,73],
			[109,135,74],
			[110,134,75],
			[111,132,72],
			[132,135,72],
			[132,136,135],
			[133,136,132],
			[134,136,133],
			[135,136,134],
			[137,61,62,101,27],
			[140,49,80,90,22],
			[141,57,84,96,20],
			[145,53,54,100,24]
		];
	let Colors = [
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000],
			[0.833333,0.742857,0.644444,1.000000]
		];
	return {points:Points,polygons:Polygons};
}

function table() {
	
	var a = Cube1_default();
	
	var tmp = [];
	for(var i = 0; i < a.polygons.length; i++){
		if (measureArea(a.polygons[i]) < 0){
			a.polygons[i] = a.polygons[i].reverse();
		}
		for(var j = 1; j< a.polygons[i].length-1; j++){
			tmp.push([a.polygons[i][0], a.polygons[i][j], a.polygons[i][j+1]]);
		}
	}
	
	return scale([8,8,8], polyhedron({points:a.points, faces:tmp}));
	
}



module.exports = { main }