var Triangles = [], Pages = [], Lignes = [], Nums = [], lec = [],
	vol, donnees, pCourante, sElOffset, sCoord, poseCourant, courant, pc,
	fZoom, tP1 = 9, tP2 = 6, rechEnCours = false, selEl = null, ok = false

const epsilon = 0.001, svgNS = "http://www.w3.org/2000/svg",
	map = document.getElementById("map"),
	SVG = document.getElementById("leSvg"),
	gLargeur = SVG.width.baseVal.value

function basculeMap(){
	etat = map.style.visibility
	map.style.visibility = etat == "visible" ? "hidden" : "visible" 
}
function volume(){
return {faces:[], vertices:[], groups:[]}
}
function chargeEchelle(){
	var ech = document.getElementById("echelle")
	if(ech.value == ''){ fZoom = 10 / 102.28 * 38.53 }
	else { fZoom = parseFloat(ech.value) }
	chargeVolume()
}
function initVolume(){
	const urlParams = new URLSearchParams(window.location.search)
	pc = urlParams.get("page")
  
  if(!vol){
		vol = volume()
				
		vol.vertices = vol.vertices.map(x=> x.map(y=> y*fZoom))
	}
		//filtre selon page
		var gN = [], cpt = []
		for(var i = 0; i < vol.groups.length; i++){
			var g = vol.groups[i]
			var ng = cpt.find(el => el.id ==g)
			if (ng === undefined){
				cpt.push({id:g, n:0})
				gN.push(0)
			} else {
				gN.push(++ng.n)
			}
		}
		vol.gN = gN	
}
function chargeVolume() {
	if(event.target.files){
		var fichier = event.target.files[0]
		var ext = fichier.name.split('.')[1].toUpperCase()
		var fnChargement = function () {
			vol = obj2jscad(this.result)
			vol.vertices = vol.vertices.map(x=> x.map(y=> y*fZoom))
			ok = true
			commencer()
			makeDraggable()
			redeploie()
		};
		const lecteur = new FileReader()
		lecteur.addEventListener("load", fnChargement, false)
		lecteur.readAsText(fichier)
	}
}
function obj2jscad(data){
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
let lf = d.filter(l => l.startsWith('g ') || l.startsWith('f '));
let faces = [], groupes = [], nfg = 0;
for(let i = 0; i < lf.length; i++){
  if(lf[i].startsWith('g ')){
    nfg++;
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
let sortie = { faces : faces, vertices: pts, groups: groupes }
return sortie
}
function debut(){
	document.getElementById("fichier").addEventListener("change", chargeVolume, false);
	document.getElementById("fichierD").addEventListener("change", chargeDonnees, false);
	SVG.addEventListener('contextmenu', e => e.preventDefault())
	chargeEchelle()
  initVolume()
	commencer()
	makeDraggable()
	redeploie()
}
function commencer(){
	if(!ok)return
	faitTableauManquants(pc, vol.faces.length, "lightCoral")
	basculeMap()
	var max = vol.faces.length -1
	var n = prompt("Commencer par quelle facette (0 - "+ max +") ?", "0")
	if (n != null) {
		n = parseInt(n)
		if( (n<0) || (n > max)){ n = getRandomInt(max) }
		if(vol.groups[n] == pc){
			courant = n
			donnees = { pages:[ [	{n:n, x:750, y:550, a:0} ] ] }
		} else {
			commencer()
		}
	}
}
function makeDraggable(){
//http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/	
  SVG.addEventListener('mousedown', startDrag)
  SVG.addEventListener('mousemove', drag)
  SVG.addEventListener('mouseup', endDrag)
  SVG.addEventListener('mouseleave', endDrag)
  function getMousePosition(evt) {
    var CTM = SVG.getScreenCTM()
    return {
			x: (evt.clientX - CTM.e) / CTM.a, 
			y: (evt.clientY - CTM.f) / CTM.d
    }
  }
function startDrag(evt) {
	if (evt.target.classList.contains('draggable')) {
		selEl = evt.target
		poseCourant = selEl.textContent
		courant = poseCourant
		sCoord = [
			parseFloat(selEl.getAttributeNS(null, "x")),
			parseFloat(selEl.getAttributeNS(null, "y"))
		]
		sElOffset = getMousePosition(evt)
		sElOffset.x -= parseFloat(sCoord[0])
		sElOffset.y -= parseFloat(sCoord[1])
	}
}
function drag(evt) {
	if (selEl) {
		evt.preventDefault();
    var coord = getMousePosition(evt)
    var nx = coord.x - sElOffset.x
    var ny = coord.y - sElOffset.y
    selEl.setAttributeNS(null, "x", nx);
    selEl.setAttributeNS(null, "y", ny);
	}
}
function endDrag(evt) {
  if(selEl){
		var coord = getMousePosition(evt)
		delta = [
		  sCoord[0] - parseFloat(selEl.getAttributeNS(null, "x")),
		  sCoord[1] - parseFloat(selEl.getAttributeNS(null, "y"))
		]
		t = donnees.pages[pCourante-1].find(x=>x.n == selEl.textContent)
		t.x -= delta[0]
		t.y -= delta[1]
		selEl = null
		redeploie()
	}
}
}
function bougePiece(dx, dy){
	if(!poseCourant){ poseCourant = courant }
	t = donnees.pages[pCourante-1].find(x=>x.n == poseCourant)
	t.x -= dx
	t.y -= dy
	redeploie()
}
function tourneTriangle(sens){
	if(courant > -1){
		var t = donnees.pages[pCourante-1].find(x=>x.n == courant)
		t.a = t.a + sens
		redeploie()
	}
}
function redesignNum(t, n){
	t.innerHTML = n
	t.setAttributeNS(null,"x", t.dataset.ptx)
	t.setAttributeNS(null,"y", t.dataset.pty)
	t.setAttributeNS(null,"font-size", (tP2 * 1.6) + "px")
	t.setAttributeNS(null,"fill", "black")	
}
function sauveSVG(){
// 1. Keep a DOM reference to the SVG element
	var elsT = document.getElementsByTagNameNS(svgNS, "text")
  l = Array.from(elsT)
  var t = l.filter(el => el.id.startsWith('T_'))
	var tT = l.filter(el => el.id.startsWith('TT_'))
	//if(tT.length == vol.faces.length){
	if(tT.length == vol.groups.filter(el=> el == pc).length){
		var nv = 0
		for(var i = 0; i < t.length; i++){
			n1 = t[i].id.split('_')
			n1.shift()
			t1 = l.find(el => el.id == 'T_' + n1[0] + '_' + n1[1])
			t2 = l.find(el => el.id == 'T_' + n1[1] + '_' + n1[0])
			if(t2 !== undefined){
				if(t1.innerHTML != t2.innerHTML){
					redesignNum(t1, nv)
					redesignNum(t2, nv)		
					nv++
				}
			}
		}
		tT.map(x=> x.parentNode.removeChild(x))
	}
// 2. Serialize element into plain SVG
	var serializedSVG = new XMLSerializer().serializeToString(SVG);
	const blob = new Blob([serializedSVG], {type: 'image/svg+xml'});
	let objectURL = window.URL.createObjectURL(blob);
	let anchor = document.createElement('a');
	anchor.href = objectURL;
	anchor.download = name;
	anchor.click();
	URL.revokeObjectURL(objectURL);
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
//return [[X0, gLargeur-Y0], [X1, gLargeur-Y1], [X2, gLargeur-Y2]]
return [[X0, Y0], [X1, Y1], [X2, Y2]]
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
function rad2deg(r){ return r * (180 / Math.PI)}
function rotation(cx, cy, x, y, angle) {
  var radians = (Math.PI / 180) * angle,
      cos = Math.cos(radians),
      sin = Math.sin(radians)
  return [(cos * (x - cx)) + (sin * (y - cy)) + cx,
					(cos * (y - cy)) - (sin * (x - cx)) + cy]
}
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function coordonneesDepuisDistances(d){
  var a = d[0], b = d[1], c = d[2], result = [0,0];
  if(a > 0){
    result[0] = (c*c - b*b + a*a) / (2*a);
  }
  result[1] = Math.sqrt(c*c - result[0]*result[0]);
  return result;
}
function centroid(pts){
  var a = pts[0], b = pts[1], c = pts[2] 
  return [((a[0] + b[0] + c[0]) / 3), ((a[1] + b[1] + c[1]) / 3)]
}
function milieu(a, b){
  return [((a[0] + b[0]) / 2), ((a[1] + b[1]) / 2)]
}
function calculeDistances(v, triangle){
  var p3A = v.vertices[triangle[0]]
  var p3B = v.vertices[triangle[1]]
  var p3C = v.vertices[triangle[2]]
  return [distance(p3B, p3C), distance(p3C, p3A), distance(p3A, p3B)]
}
function calculeAngles(d){
  var a = d[0], b = d[1], c = d[2]
  return [Math.acos((b*b + c*c - a*a) / (2 * b * c)),
					Math.acos((c*c + a*a - b*b) / (2 * c * a)),
					Math.acos((a*a + b*b - c*c) / (2 * a * b))]
}
function rechercheVoisin(nFace, rech, tableau){
  return tableau.findIndex(function(el, i){
		return (i!== nFace) 
				&& el.includes(rech[0]) && el.includes(rech[1])})
}
function troisiemePoint(triangle, pts){
  return triangle.findIndex(el => (el != pts[0]) && (el != pts[1]) )
}
function angle(p1, p2){
  var cx= p1[0], cy= p1[1], ex = p2[0], ey= p2[1]
  var dy = ey - cy
  var dx = ex - cx
  var theta = Math.atan2(dy, dx) // range (-PI, PI]
  return theta
}
function deplace(x, y, dx, x1, y1, x2, y2){ 
// https://stackoverflow.com/a/38994057
  var a = [x2 - x1, y2 - y1], mag = Math.sqrt(a[0]*a[0] + a[1]*a[1])
  if (mag == 0) { a[0] = a[1] = 0 }
  else {
		a[0] = a[0] / mag * dx
    a[1] = a[1] / mag * dx
  }
  return [x + a[0], y + a[1]]
}
function calculeAngleBAC(A, B, C){
  var AB = [B[0]-A[0], B[1]-A[1]]
  var AC = [C[0]-A[0], C[1]-A[1]]
  var ang = Math.atan2((AB[0]*AC[0])+(AB[1]*AC[1]), (AB[1]*AC[0])-(AB[0]*AC[1]))
  return ang
}
function ajouteRect(x, y, h, w, f, source = "leSvg"){
  var rect = document.createElementNS(svgNS, 'rect')
  rect.setAttributeNS(null, 'x', x);
  rect.setAttributeNS(null, 'y', y);
  rect.setAttributeNS(null, 'height', h);
  rect.setAttributeNS(null, 'width', w);
  rect.setAttributeNS(null, 'stroke', 'white');
  if(f){
    rect.setAttributeNS(null, 'fill', f);
    rect.setAttributeNS(null, 'fill-opacity', '0.7');
  }
  document.getElementById(source).appendChild(rect);
}
function ajouteNb(x, y, n, actif= true){
  var txt = document.createElementNS(svgNS, "text")
  txt.setAttributeNS(null,"x", x)
  txt.setAttributeNS(null,"y", y)
  txt.setAttributeNS(null,"fill", 'yellow')
  txt.setAttributeNS(null,"font-size", "9px")
  txt.setAttributeNS(null,"dominant-baseline", "middle")
  txt.setAttributeNS(null,"text-anchor", "middle")
  txt.innerHTML = n
	if(actif){
		txt.classList.add("chercher")
		txt.addEventListener('click', clicChercher);
	}
  document.getElementById("mm").appendChild(txt)
}
function ajouteLigne(pt1, pt2, coul = "white", source = "leSvg"){
  var lig = document.createElementNS(svgNS, 'line')
  lig.setAttributeNS(null, "x1", pt1[0])
  lig.setAttributeNS(null, "y1", pt1[1])
  lig.setAttributeNS(null, "x2", pt2[0])
  lig.setAttributeNS(null, "y2", pt2[1])
  lig.setAttributeNS(null, "stroke-width", 1)
  lig.setAttributeNS(null, "stroke", coul)
  if(coul == "maroon"){ 
		lig.setAttributeNS(null, "stroke-dasharray", 12)
  } else if (coul == "green"){
    lig.setAttributeNS(null, "stroke-dasharray", '1, 8')
  }
  document.getElementById(source).appendChild(lig)
}
function ajouteTexte(centre, t, coul = "white", source = "leSvg"){
  var txt = document.createElementNS(svgNS, "text")
  txt.setAttributeNS(null,"x", centre[0])
  txt.setAttributeNS(null,"y", centre[1])
  if(coul == "orange"){
    txt.setAttributeNS(null,"font-weight", "bolder")
    txt.classList.add("draggable")
  } else {
    txt.classList.add("detacher")
		txt.addEventListener('click', clicDetacher);
  }
  txt.setAttribute("id", "TT_" + t)
  txt.setAttributeNS(null,"fill", coul)
  txt.setAttributeNS(null,"font-size", tP1 + "px")
  txt.setAttributeNS(null,"dominant-baseline", "middle")
  txt.setAttributeNS(null,"text-anchor", "middle")
  txt.setAttributeNS(null,"z-index", 1)
  txt.innerHTML = t
  decoSiRecherche(txt, t)  
  document.getElementById(source).appendChild(txt)
}
function decoSiRecherche(txt, t){
  var r = document.getElementById("rech").value
  if(r &&(r == t)){
    txt.setAttributeNS(null,"font-weight", "bolder")
    txt.setAttributeNS(null,"fill", "red")
  }
}
function ajouteTexte2(pt1, pt2, pt3, p, t, coul = "yellow", source = "leSvg"){
  var typeAjout, g = vol.groups[t]
  if ((t > -1)&&(p > -1)){
		if(g == pc){
			typeAjout = 'A' // attacher
		} else {
			typeAjour = 'L'
		}
	}else{
		typeAjout = 'L' // longueur (externe)
	}		
	var svg = document.getElementById(source)
	var txt = document.createElementNS(svgNS, "text")
	centre = milieu(pt1, pt2)
	pt = deplace(centre[0], centre[1], tP2-3, centre[0], centre[1], pt3[0], pt3[1])
	txt.setAttributeNS(null,"x", pt[0])
	txt.setAttributeNS(null,"y", pt[1])
	pt4 = deplace(centre[0], centre[1], (tP2 * 1.6)-7, centre[0], centre[1], pt3[0], pt3[1])
	txt.dataset.ptx = pt4[0]
	txt.dataset.pty = pt4[1]
	if(typeAjout == 'A'){
		txt.classList.add("attacher")
		if (!poseCourant){
			poseCourant = courant
		}
		var v = donnees.pages[pCourante-1].find(x => x.n == poseCourant)
		if(v.lies){
			var v2 = v.lies.filter(x => x.l == t)
			if((t == poseCourant) || v2.length > 0){
				coul = "LightBlue"
			}
		}
		txt.setAttribute("id", "T_" + p+'_'+t)
	}else{
		coul = "green"
	}
	txt.setAttributeNS(null,"fill", coul)
	txt.setAttributeNS(null,"font-size", tP2 + "px")
	txt.setAttributeNS(null,"dominant-baseline", "middle")
	txt.setAttributeNS(null,"text-anchor", "middle")
	txt.setAttributeNS(null,"z-index", 2)  
	var a = rad2deg(angle(pt1, pt2))
	txt.setAttributeNS(null,"transform", "rotate(" 
		+ (a+180) + "," + pt[0] + "," + pt[1] +")")
	if(typeAjout == 'A'){
		txt.innerHTML = t
	}else{
		//txt.innerHTML = (distance2d(pt1, pt2) / 37.79527559055).toFixed(2)
		if (pc < g){
			txt.innerHTML = g + '.' + vol.gN[t]
		} else {
			txt.innerHTML = pc + '.' + vol.gN[p]			
		}
	}
	if(typeAjout == 'A'){
		decoSiRecherche(txt, t)
	}
	svg.appendChild(txt)
	
	if(typeAjout == 'A'){
		txt.setAttribute("tag", p + "," + t)
		txt.addEventListener('mousedown', clicAttacher)
	}
}
function prochainTriangle(){
	var c = Array.from(document.querySelectorAll(".attacher[fill~='yellow']"))
	var ll = c.map(x=> parseInt(x.id.split('_')[2]))
	var m = Math.min(...ll)
	var objet = c[ll.findIndex(x=> x == m)]
	if(!objet){
		bAuto.style.backgroundColor = "Green"
	}
	return objet
}
function auto(){
	var objet = prochainTriangle()
	if(objet) {
		var event = new MouseEvent('mousedown', {
			'view': window, 'bubbles': true, 'cancelable': true
		})
		objet.dispatchEvent(event)
	}
}
function clicAttacher(evt){
	el = evt.target
	b = evt.button
	d = el.getAttribute("tag").split(",").map(x=>parseInt(x))
	if(b == 2){
		document.getElementById("rech").value = d[1]
		redeploie()
	}
	else {
		if(!poseCourant){
			poseCourant = courant
		}
		if(d[1] != poseCourant){
			var t = donnees.pages[pCourante-1].find(x=>x.n == poseCourant)
			if(!('lies' in t)){ t.lies = [] }
			var lok = false
			var v = t.lies.findIndex(x => x.l == d[1])
			if(v > -1) {
				var v2 = t.lies.findIndex(x => x.p == d[1])
				if(v2 == -1){
					t.lies.splice(v, 1)
					lok = true
				}
			} else {
				lok = true
			}
			if(lok){
				t.lies.push({p:d[0], l:d[1]})
				redeploie()
			}
		}
	}
}
function clicDetacher(evt){
	var el = evt.target
	if(!poseCourant){
		poseCourant = courant
	}
	var t = donnees.pages[pCourante-1].find(x=>x.n == poseCourant)
	var l = t.lies.findIndex(x => x.l == el.textContent)
	var l2 = t.lies.filter(x => x.p == el.textContent)
	if((l > -1) && (l2.length == 0)){
		t.lies.splice(l, 1)
		redeploie()
	}
}
function clicChercher(evt){
	var el = evt.target
	document.getElementById("rech").value = el.innerHTML
	redeploie()
}
function debug_triangle(p){
  ajouteTexte(p[0], "a", "LightBlue")
  ajouteTexte(p[1], "b", "LightBlue")
  ajouteTexte(p[2], "c", "LightBlue")
}
function creePage(nP, l, h){
  return { num: nP, largeur: l, hauteur: h,
           trianglesPoses: [], triangles: [], lignes: [] }
}
function creeTriangle(nT, pT, fT, dT){
  var triangle = { num: nT, pts: pT, faces: fT }
  // recherche voisins
  var voisins = []
  for(var i = 0; i< fT.length; i++){
    var f1 = fT[i], f2 = fT[(i+1)%fT.length]
    voisins.push(rechercheVoisin(nT, [f1, f2], vol.faces))
  }
  triangle.voisins = voisins
  return triangle
}
function poseTriangle(nT, delta = [0,0], angle = 0){
  var triangle = vol.faces[nT]
  var pts = d2ize(triangle.map(x=> vol.vertices[x]))
  if (angle != 0){
      var c = centroid(pts)
      pts = pts.map(x => rotation(c[0], c[1], x[0], x[1], angle))
  }
  pts = pts.map(x => [x[0] + delta[0], x[1]+ delta[1]])
  var leT = creeTriangle(nT, pts, triangle)
  Triangles.push(leT)
  lec = lec.concat(nT)
  for(var i = 0; i < pts.length; i++){
    editeLigne(nT, leT.voisins[i], pts[i], pts[(i+1)%3], pts[(i+2)%3], 'C')
  }
  Nums.push({pt:centroid(pts), n:nT, c:"orange"})
}
function petit(a, b){ return Math.min(a, b)}
function grand(a, b){ return Math.max(a, b)}
function trouveTriangle(n){
  return Triangles.find(x => x.num === n)
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
function trouveLigneIndex(pN, gN){
  return Lignes.findIndex(x => (x.pN === pN) && (x.gN === gN))
}
function editeLigne(n1, n2, p1, p2, p3, etat){
  var pN = petit(n1, n2), gN = grand(n1, n2)
  var L = trouveLigneIndex(pN, gN)
  if(L === -1){
    Lignes.push({pN: pN, gN: gN, p1: p1, p2: p2, p3: p3, etat:etat, triP:n1, triV:n2})
  } else {
    if(etat != 'C'){
      Lignes[L].etat = etat
    } else {
      Lignes[L].p1b = p1
      Lignes[L].p2b = p2
      Lignes[L].p3b = p3
    }
  }
}
function traceLignes(){
  for(var i in Lignes){
		var L = Lignes[i]
		switch(L.etat){
			case 'C': coul = "red"
				break
			case 'M': coul = "maroon"
				break
			case 'V': coul = "green"
		}
		if(L.etat != 'P'){
			ajouteLigne(L.p1, L.p2, coul)
			if(L.etat == 'C'){
				ajouteTexte2(L.p1, L.p2, L.p3, L.triP, L.triV, "yellow")
				if(L.p1b){
					ajouteLigne(L.p1b, L.p2b, coul)
					ajouteTexte2(L.p1b, L.p2b, L.p3b, L.triV, L.triP, "yellow")
				}
			}
		}
	}
}
function traceNums(){
  for(var i in Nums){
    var num = Nums[i]
    var nb = comptePlis(num.n)
    if(num.c == "orange"){
      var c = num.c
    } else {
      var c = (nb < 3) ? num.c : "violet"
    }
    ajouteTexte(num.pt, num.n, c)
  }
}
function comptePlis(tN){
  var n = 0
  for(var i =0; i < Lignes.length; i++){
    var L = Lignes[i]
    if ( (L.etat != 'C') && ((L.pN == tN) || (L.gN == tN)) ){
      n++
    }
  }
  return n
}
function lie(l){
  lec = lec.concat(l)
  for(var i = 0; i < l.length-1; i++){
    lieTriangle(l[i], l[i+1])
  }
}
function lieTriangle(nTPose, nTALier){
  var tPose = trouveTriangle(nTPose)
  lec = lec.concat(nTALier)
  tALier = vol.faces[nTALier]
  nv2 = tPose.voisins.indexOf(nTALier)
  nv2b = (nv2 + 1) % 3
  var pts = d2ize(tALier.map(x=> vol.vertices[x]))
  var leT = creeTriangle(nTALier, pts, tALier)
  nv1 = leT.voisins.indexOf(nTPose)
  nv1b = (nv1 + 1) % 3
  // ALIGNEMENT P1.triangle sur P2.posé
  PT1 = pts[nv1], PT2 = pts[nv1b]
  PP1 = tPose.pts[nv2], PP2 = tPose.pts[nv2b], PP3 = tPose.pts[(nv2b+1)%3]
  dk = [ PP2[0] - PT1[0], PP2[1] - PT1[1] ]
  pts = pts.map(x => [x[0] + dk[0], x[1] + dk[1]])
  PT1 = pts[nv1], PT2 = pts[nv1b]
  // ROTATION
  var distance_milieu = distance2d(milieu(PT2, PP1), PT1)
  if(distance_milieu === 0){
    ang = 180
  } else {
    A = PT2, B = PT1, C = PP1
    var a = calculeAngles([distance2d(B,C), distance2d(A,C), distance2d(A,B)])
    if(!Number.isNaN(a[1])){
      ang = rad2deg(a[1])
    } else {
      ang = 0
    }    
  }
  sauvePts = pts
  pts = pts.map(x => rotation(PP2[0], PP2[1], x[0], x[1], ang))
  var dist2 = Math.abs(distance2d(pts[nv1b], tPose.pts[nv2]))
  if(dist2 > epsilon){
    pts = sauvePts.map(x => rotation(PP2[0], PP2[1], x[0], x[1], -ang))
  }
	Triangles.push(leT)
	lec = lec.concat(nTALier)
	leT.pts = pts
	for(var i = 0; i < pts.length; i++){
		editeLigne(nTALier, leT.voisins[i], pts[i], pts[(i+1)%3], pts[(i+2)%3], 'C')
	}
	Nums.push({pt:centroid(pts), n:nTALier, c:"white"})
	// coplanaire
	t1 = tPose.faces.map(x => vol.vertices[x])
	t2 = tALier.map(x => vol.vertices[x])
	cp = estCoplanaire(t1, t2[(nv1b + 1)%3])
	if (cp === 0){
		editeLigne(nTPose, nTALier, PP1, PP2, PP3, "P" )
	} else {
		if (cp < 0){
			coul = "maroon"
			editeLigne(nTPose, nTALier, PP1, PP2, PP3, "M" )
		} else {
			coul = "green"
			editeLigne(nTPose, nTALier, PP1, PP2, PP3, "V" )
		}
	}	 
}
function faitTableauManquants(nP, nbT, coul){
  const L = 20
  var x = 0, y = L
  l = [...new Set(lec)]; 
  var t = l.sort(function(a,b){return a > b})
  ajouteRect(L*2* parseInt(nP-1), 0, (L-4), L*2, coul,"mm")
  ajouteNb(L*2* parseInt(nP-1)+(L-1), 10, nP+":"+t.length, false)
  const xmx = Math.sqrt(nbT) - 1
  const xMax = L * ( xmx > 17 ? 17 : xmx)
  //map.style.width = (xMax)+"mm"
  //map.style.right = 0 //SVG.clientWidth
  //document.getElementById("mm").width = (xMax)+"mm"
  for(var i = 0; i < nbT; i++){
		var actif = vol.groups[i] == pc
    ajouteRect(x,y, L, L,'none',"mm")
    if(!actif){
			ajouteRect(x,y, L, L, "white","mm")
		} else if(t.indexOf(i)> -1){
      ajouteRect(x,y, L, L, coul,"mm")
    }
    ajouteNb(x+(L/2),y+(L/2), i, actif)
    if(x < xMax){
      x += L
    } else {
      x = 0
      y += L
    }
  }
}
function chargeDonnees(){
	var fichier = event.target.files[0]
	var fnChargeDonnees = function () {
		makeDraggable()
		donnees = JSON.parse(this.result)
		ok = true
		redeploie()
	}
	const lecteur = new FileReader()
	lecteur.addEventListener("load", fnChargeDonnees, false)
	lecteur.readAsText(fichier)
}
function redeploie(){
  var zp1 = document.getElementById('echPolice1')
  var zp2 = document.getElementById('echPolice2')
  tP1 = 9
  if(zp1.value){ tP1 = tP1 *	zp1.value }
  tP2 = 6
  if(zp2.value){ tP2 = tP2 *	zp2.value }
	if(donnees){
		// sauve scroll
		var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop
		nPage = 1
		pCourante = nPage
		initVolume()
		var elsT = document.getElementsByTagNameNS(svgNS, "text")
		var elsP = document.getElementsByTagNameNS(svgNS, "line")
		var elsR = document.getElementsByTagNameNS(svgNS, "rect")
		Array.from(elsT).concat(Array.from(elsP), Array.from(elsR))
		.map(x=> x.parentNode.removeChild( x ))
		Lignes = []
		Nums = []
		Triangles = []
		lec = []
		definitPage(nPage)
		faitTableauManquants("1", vol.faces.length, "lightcoral")
		// actions de finalisation
		traceLignes()
		traceNums()
		rech.focus()
		rechEnCours = false	
		// restore scroll
		document.documentElement.scrollTop = document.body.scrollTop = scrollLeft;
		document.documentElement.scrollLeft = document.body.scrollLeft = scrollTop;
  }
}	
function getJSON(path) {
// return JSON data from any file path (asynchronous)
  return fetch(path).then(response => response.json());
}
function sauveDonnees(){
	var JSONDonnees = JSON.stringify(donnees)
	download(JSONDonnees, 'donnees.json', 'application/json')
}
function sauveDonneesFixe(){
	donnees = {
		pages:[
			[	{n:0, x:750,y:550, a:0}
			]
		]
	}
	sauveDonnees()
}
function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
function definitPage(nP){
  var d = donnees.pages[nP-1]
	for(var i = 0; i < d.length; i++){
		var pose = d[i]
		poseTriangle(pose.n, [pose.x, pose.y], pose.a)
		if(!poseCourant){
		  poseCourant = pose.n
		  courant = pose.n
		}
		var lies = d[i].lies
		if(lies){
			lies[j]
			for(var j = 0; j < lies.length; j++){
				lieTriangle(lies[j].p, lies[j].l)
			}
		}
	}
}
