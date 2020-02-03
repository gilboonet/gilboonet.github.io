function getParameterDefinitions() {
    return [
        { name: 't0', type:'group', caption:'TRANCHAGE'},
        { name: 'ech', type: 'number', initial: 1, caption: 'Echelle' }, 
        { name: 'nbC', type: 'int', initial: 3, caption: 'Nb Colonnes' }, 
        { name: 'nbL', type: 'int', initial: 3, caption: 'Nb Lignes' },
        { name: 'eC',  type: 'int', initial: 3, caption: 'Ep. Carton (mm)' },
        { name: 'mode',type: 'choice', initial: 1, caption:'Mode', captions:['Vue 3d','Vue 3d éclatee', 'Vue 2d'], values:[30,31,2]},
//        { name: 'mode',type: 'choice', initial: 2, caption:'Mode', captions:['Vue 2d'], values:[2]},
        { name: 't1',  type: 'group', caption:'Gabarit'},
        { name: 'larg', type: 'number', initial: 210, caption: 'Largeur (mm)' }, 
        { name: 'haut', type: 'number', initial: 297, caption: 'Hauteur (mm)' }
    ];
}
function main(){

var r2d = [], v, tmp, i, b, tr, d, bz;
var nLignes = [], nColonnes = [], rL = [], rC = [], urL, urC;

// volume
//var v = center(true, scale(5, vol().csg));
v = center(true, scale(params.ech, rotate([90, 0, 0], vol())));
b = v.getBounds();
d = b[1].minus(b[0]);
var vb = b, vd = d;

for(i = 0.5; i< params.nbL; i++){ // lignes
  tr =rotate([-90,0,0], faitLigne(i, v, vb, vd, params.nbL, params.eC));
  bz = tr.getBounds()[0].z;
  tr = union(vol2surf(tr, bz));
  tr= translate([0,bz +3, 0], rotate([90,0,0], tr.extrude({offset:[0,0,params.eC]})));
  rL = rL.concat(tr);
}
urL = union(rL);

for(i = 0.5; i < params.nbC; i++){ // colonnes
  tr =rotate([0,90,0], faitColonne(i, v, vb, vd, params.nbC, params.eC));
  bz = tr.getBounds()[0].z;
  tmp = vol2surf(tr, bz).concat();
  for(j = 0; j < tmp.length; j++){
    tr = tmp[j];
    tr= translate([-bz, 0, 0], rotate([180,-90,0], tr.extrude({offset:[0,0,params.eC]})));
    rC = rC.concat(tr);
  }
}
urC = union(rC);

// encoches
tmp = scission3d(urC.intersect(urL));
var miH = [], miB = [], miT = [];
for(i = 0; i< tmp.length; i++){
  var tt = diviseVolume(tmp[i], vd);
  miH.push(tt[1]);
  miB.push(tt[2]);
  miT.push(tt[0]);
}

var umiH = union(miH), umiB = union(miB);
if (params.mode == 2){ // rendu 2d
  var r = [],n, t2, t3, h;
  for(n=0; n< rL.length; n++){
      t2 = rL[n].subtract(miT);
      t3 = t2.union(rL[n].intersect(umiH));
    r.push(translate([-params.larg*n,0], square({size:[params.larg+4, params.haut+4], center:true}).subtract(square({size:[params.larg, params.haut], center:true}))));
    r.push(translate([-params.larg*n,0], tourneEt2d(t3, [90,0,0])));
  }

  h = params.haut;
  for(n=0; n< rC.length; n++){
    t2 = rC[n].subtract(miT);
    t3 = t2.union(rC[n].intersect(umiB));
    r.push(translate([-params.larg*n, h], square({size:[params.larg+4, params.haut+4], center:true}).subtract(square({size:[params.larg, params.haut], center:true}))));
    r.push(translate([-params.larg*n, h], tourneEt2d(t3, [0,-90,0])));
  }
  
  return r;
    
} else { // rendu 3d
  var ee, cv;
  if (params.mode == 30){
    ee = 0;
    cv = [1,0,0,0.2];
  } else {
    ee = 1.2;
    cv = "crimson";
  }
  return [color("tan", translate([-3,vd.y* ee,vd.z/2], urC.subtract(miT).union(miB)))
         ,color("orange", translate([-3,-vd.y * ee,vd.z/2], urL.subtract(miT).union(miH)))
         ,color(cv, translate([0,0,vd.z/2],v))
    ];
}

}

function tourneEt2d(vol, angle){
  var t = rotate(angle, vol);
  var b = t.getBounds();
  return union(vol2surf(t, b[0].z));
}

function faitColonne(i, V, vb, vd, nbC, ec){
  var tNc1 = [[0, vb[0].x],[nbC, vb[1].x]];
  var b2 = lookup(i, tNc1);
  var tmp = translate([b2 -ec, vb[0].y, -vd.z/2], cube({size:[ec, vd.y, vd.z], center:false}));
  return V.intersect(tmp);
}

function faitLigne(i, V, vb, vd, nbL, ec){
  var tNl1 = [[0, vb[0].y],[nbL, vb[1].y]];
  var b2 = lookup(i, tNl1);
  var tmp = translate([vb[0].x, b2 -ec, -vd.z/2], cube({size:[vd.x, ec, vd.z], center:false}));
  return V.intersect(tmp);
}

function diviseVolume(vol, volD){
    var b = vol.getBounds();
    var d = b[1].minus(b[0]);
    var cDemi = cube({size:[d.x, d.y, d.z/2], center:false});
    var cTout = translate(b[0], cube({size:[d.x, d.y, volD.z], center:false}));    
    return [cTout,
            vol.intersect(translate(b[0], cDemi)),
            vol.intersect(translate([b[0].x, b[0].y, b[0].z + d.z/2], cDemi))
    ];
}

function sortNb		(E){ // returns E numerically sorted and deduplicated
	return E.sort(function(a, b) {return a-b}).filter(
	    function(item, pos, ary) {return !pos || item != ary[pos - 1]});
}

function compare3d	(v1, v2){ // returns true if V1 and V2 are at the same position
	return (v1.pos.x == v2.pos.x) && (v1.pos.y == v2.pos.y) && (v1.pos.z == v2.pos.z);
}

function scission3d	(geom){
  var i,Pl, j,i1,j1,ok,ti,tj,z,zz = [], P, RScission, til, tjl, tii1, zzl, zzdl;
// construit table de correspondance entre Polygones (P)
// build polygons lookup table
  P = geom.toPolygons();
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
		  if (!ok)ok = compare3d(tii1, tj[j1]);
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
	  for (j = 0, zzdl = zz[i].d.length; j < zzdl; j++)
	    z.push(P[zz[i].d[j]]);
	  RScission.push(CSG.fromPolygons(z));
	}
  }

  return RScission;
}
// retourne la surface formee par le volume avec l'axe z (à 0)
function vol2surf(vol, orig = 0){
var n, pts, ok, P, i, pt;
let S = [];

for(n = 0; n < vol.polygons.length; n++){
  pts = [];
  P = vol.polygons[n];
  ok = true;
  for(i=0; (i < P.vertices.length) && ok; i++){
    pt = P.vertices[i].pos;
    if(Math.abs(pt.z - orig)< 0.05){
      pts.push([pt.x, pt.y]);
    } else {
      ok = false;
    }
  }
  if (ok){
    S.push(polygon(pts));
  }
}

return S;
}

function poseAPlat(p){
  const v1 = p.vertices[0].pos, v2 = p.vertices[1].pos, v3 = p.vertices[2].pos;
  const tC = new CSG.Connector(v1, v2.minus(v1), p.plane.normal);
  const z0xC = new CSG.Connector([0, 0, 0], [0,v2.minus(v1).length(), 0.2], [0, 0, 1]);
  const tb = tC.getTransformationTo(z0xC, false, 0);
  let pp = (CSG.fromPolygons([p]).transform(tb)).polygons[0];

  let p2 = pp.vertices.map(v => new CSG.Vector2D(v.pos._x, v.pos._y));
  let poly2D = new CSG.Path2D(p2, true);
  return poly2D;
}

// volume : ici profil 1/4 => + miroir * extrusion = meuble
function vol2(){
    return scale([0.75,1.5,1], sphere(40).subtract(translate([6,2,2],sphere(36))));
}
function vol(){
var poly = [];

// ming
poly.push(polygon([[0,-43],[7,-43],[7,-6],[28,-6],[35,-25],[44,-43],[63,-43],[43,-8],[36,25],[53,31],[45,41],[36,37],[29,36],[0,36]]));
poly.push(polygon([[7,23],[23,23],[26,4],[7,4]]));
var demi = poly[0].subtract(poly[1]);
var entier = demi.union(demi.mirroredX());

// test asym
//poly.push(polygon([[0,-32],[4,12],[13,20],[44,22],[61,-5],[49,-32]]));
//poly.push(polygon([[14,10],[39,11],[48,-7],[40,-24],[11,-24]]));
//var entier = poly[0].subtract(poly[1]);


return entier.extrude({offset:[0,0,60]});
}
