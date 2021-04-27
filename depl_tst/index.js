let vol, pt, voisins, fu, fu2, cacheKO, mode,
		fZoom = 1*10 / 102.28 * 38.53, dk = [0,0], tP1 = 9, tP2 = 6,
		epsilon = 0.0001
const svgNS = "http://www.w3.org/2000/svg"
const SVG = document.getElementById("leSvg")
const mode_voir = 'V', mode_calc = 'C'

/* moai
 let excl = [[13,9],[107,108]
]*/

/* gorille
let excl = [[187,167],[60,237],[235,24],[217,246],[248,206],[68,69],[157,87]
,[214,215],[238,181],[35,21],[184,54],[39,42],[210,18]
]*/

let excl = []
//,[]

/* titchat
let excl = [[92,133],[166,167],[99,111],[6,7],[150,186],[229,179],[194,150]
,[94,93],[106,75],[49,63],[160,129],[84,183],[81,128],[138,197],[133,29]
,[30,41]]*/

function attacher(nFace, nFP){
  let nV = voisins[nFace][nFP]
  let nVP = voisins[nV].findIndex(x => x === nFace)
  let r, ok = false
  
  //console.log('test', nFace, nFP, nV)
  if (excl.findIndex(x=> (x[0] == nFace) && (x[1] == nV)) > -1)return false
  
  if(fu.findIndex(x=> x === nV) > -1){
    return false
  }
  let ptF = pt[nFace], ptV = pt[nV],
      ptF0 = ptF[nFP], ptF1 = ptF[suiv(nFP)],
      ptV0 = ptV[nVP], ptV1 = ptV[suiv(nVP)],
      ptV2 = ptV[suiv(suiv(nVP))]

  let dkV = [-ptV0[0] + ptF1[0], -ptV0[1]+ptF1[1]]
	ptV = ptV.map(x=> [x[0] + dkV[0], x[1] + dkV[1]])
  ptV0 = ptV[nVP]
  ptV1 = ptV[suiv(nVP)]

  let a = calcAngle(ptF0, ptF1, ptV1)
  tmp = ptV.map(x=> rotation(ptF1[0], ptF1[1], x[0], x[1], a))
  ptV1 = tmp[suiv(nVP)]
  let delta = Math.abs(distance2d(ptF0, ptV1))
  if(delta > epsilon){
    ptV = ptV.map(x=> rotation(ptF1[0], ptF1[1], x[0], x[1], 360-a))
  }else
    ptV = tmp
  
  // verifie chevauchement
  let n, fPL = fu.length, vv = voisins[nV]
	for(let ci = 0; ci < fPL; ci++){
    n = fu[ci]
    ok = !overlap(ptV, pt[n])
    //console.log(n, nV, ok)
    if(!ok){
	  	cacheKO.push([nFace, nFP])
			break
		}
	}
  if(ok){
    //console.log(ok, nV)
    fu.push(nV)
    fu2.push([nFace, nV])
    pt[nV] = ptV
    if(mode=== mode_voir)pose(nV)
    return true
  }else{
    return false  
  }
}
function calcAngle(A,B,C) {
    var AB = Math.sqrt(Math.pow(B[0]-A[0],2)+ Math.pow(B[1]-A[1],2));    
    var BC = Math.sqrt(Math.pow(B[0]-C[0],2)+ Math.pow(B[1]-C[1],2)); 
    var AC = Math.sqrt(Math.pow(C[0]-A[0],2)+ Math.pow(C[1]-A[1],2));
    
    return Math.acos((BC*BC+AB*AB-AC*AC) / (2*BC*AB)) * (180 / Math.PI);   
}
function centroid(pts){
  var a = pts[0], b = pts[1], c = pts[2] 
  return [((a[0] + b[0] + c[0]) / 3), ((a[1] + b[1] + c[1]) / 3)]
}
function chargeVolume() {
	if(event.target.files){
		var fichier = event.target.files[0]
		var ext = fichier.name.split('.')[1].toUpperCase()
		var fnChargement = function () {
//console.log("charge volume...")			
			vol = obj2jscad(this.result)
			vol.vertices = vol.vertices.map(x=> x.map(y=> y*fZoom))
			//deplie()		
		}
		const lecteur = new FileReader()
		lecteur.addEventListener("load", fnChargement, false)
		lecteur.readAsText(fichier)
	}
}
function chercheVoisins(){
  let V = [];
  for(let i= 0; i< vol.faces.length; i++){
    V[i] = [];
    for(let j= 0; j<3; j++){
      let p1 = vol.faces[i][j], p2 = vol.faces[i][j==2 ? 0: j+1];
      let v = vol.faces.findIndex(function(el, idx){
  	    return (idx !== i) && el.includes(p1) && el.includes(p2)});
	  V[i].push(v);
    }
  }
  return V;
}
function debut(){
	document.getElementById("fichier").addEventListener("change", chargeVolume, false)
	document.getElementById("bTEST").addEventListener("click", deplie, false)
	document.getElementById("premFace").value = "";
	document.getElementById("premFace").addEventListener("dblclick", deplieUn, false)
	document.getElementById("premFace").addEventListener("change", deplieUn, false)
	document.getElementById("sRandom").addEventListener("click", deplieRnd, false)

	document.getElementById("sDonnees").addEventListener("click", sauveDonnees, false)
	dk[0] = SVG.width.baseVal.value /2
	dk[1] = SVG.height.baseVal.value /2
}
function distance2d(p1, p2){
  var a = p2[0] - p1[0]
  var b = p2[1] - p1[1]
  return Math.sqrt(a*a + b*b)
}
function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
function d2ize(p) {
  // https://stackoverflow.com/a/8051489
  var x0 = p[0][0], y0 = p[0][1], z0 = p[0][2],
      x1 = p[1][0], y1 = p[1][1], z1 = p[1][2],
      x2 = p[2][0], y2 = p[2][1], z2 = p[2][2],
      X0 = 0, Y0 = 0,
      X1 = Math.sqrt((x1 - x0)*(x1 - x0) + (y1 - y0)*(y1 - y0) + (z1 - z0)*(z1 - z0)),
      Y1 = 0,
      X2 = ((x1 - x0) * (x2 - x0) + (y1 - y0) * (y2 - y0) + (z1 - z0) * (z2 - z0)) / X1,
      Y2 = Math.sqrt((x2 - x0)*(x2 - x0) + (y2 - y0)*(y2 - y0) + (z2 - z0)*(z2 - z0) - X2*X2);
  return [[X0, Y0], [X1, Y1], [X2, Y2]]
}
function eq(p1, p2){ return distance2d(p1,p2) < epsilon}
function getFacePoints(n) {
  return vol.faces[n].map(x=>vol.vertices[x]);
}
function li(l1S, l1E, l2S, l2E){// true if the lines intersect
	if(eq(l1S, l2S)||eq(l1S, l2E)||eq(l1E, l2S)||eq(l1E, l2E)){
	  //console.log("pt(s) commun(s)")
	  return false
	}
		
	var denominator = ((l2E[1] - l2S[1]) * (l1E[0] - l1S[0])) 
	                - ((l2E[0] - l2S[0]) * (l1E[1] - l1S[1]))
  
  if(denominator === 0){
		return false
	}
  
  a = l1S[1] - l2S[1]
  b = l1S[0] - l2S[0]
  numerator1 = ((l2E[0] - l2S[0]) * a) - ((l2E[1] - l2S[1]) * b)
  numerator2 = ((l1E[0] - l1S[0]) * a) - ((l1E[1] - l1S[1]) * b)
  a = numerator1 / denominator;
  b = numerator2 / denominator;
  
  if((a > 0 && a < 1) && (b > 0 && b < 1)){
		return true
	}else{
		return false
	}
}
function ligne(pt1, pt2, coul = "white", source = SVG){
  var lig = document.createElementNS(svgNS, "line")
  lig.setAttributeNS(null, "x1", pt1[0])
  lig.setAttributeNS(null, "y1", pt1[1])
  lig.setAttributeNS(null, "x2", pt2[0])
  lig.setAttributeNS(null, "y2", pt2[1])
  lig.setAttributeNS(null, "stroke-width", 0.5)
  lig.setAttributeNS(null, "stroke", coul)
  /*if(coul == "maroon"){ 
		lig.setAttributeNS(null, "stroke-dasharray", 12)
  } else if (coul == "green"){
    lig.setAttributeNS(null, "stroke-dasharray", '1, 8')
  }*/
  source.appendChild(lig)
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
function pose(n){
	let p = pt[n]
	triangle(p)
	texte(centroid(p), n)
}
function rotation(cx, cy, x, y, angle) {
  var radians = (Math.PI / 180) * angle,
      cos = Math.cos(radians),
      sin = Math.sin(radians)
  return [(cos * (x - cx)) + (sin * (y - cy)) + cx,
	        (cos * (y - cy)) - (sin * (x - cx)) + cy]
}
function suiv(n) { return n < 2 ? n+1 : 0}
function texte(centre, t, coul = "white", source = SVG){
  var txt = document.createElementNS(svgNS, "text")
  txt.setAttributeNS(null,"x", centre[0])
  txt.setAttributeNS(null,"y", centre[1])
  txt.setAttribute("id", "TT_" + t)
  txt.setAttributeNS(null,"fill", coul)
  txt.setAttributeNS(null,"font-size", tP1+"px")
  txt.setAttributeNS(null,"dominant-baseline", "middle")
  txt.setAttributeNS(null,"text-anchor", "middle")
  txt.setAttributeNS(null,"z-index", 1)
  txt.innerHTML = t
  source.appendChild(txt)
}   
function triangle(p){
	ligne(p[0], p[1], 'yellow')
	ligne(p[1], p[2], 'yellow')
	ligne(p[2], p[0], 'yellow')
}

function trieFU(){
  let tfu = [], fmax = fu.length
	for(let i = 0; i <  fmax; i++){
		let fui = fu[i], ptF = pt[fui]
		for(let j = 0; j <= 2 ; j++){
			let p0 = ptF[j], p1 = ptF[suiv(j)]
			tfu.push([fui,j, distance2d(p0,p1)])
		}
	}
	if(mode ===0)return tfu
	//return tfu
	//return tfu.sort((a, b) => b[2] - a[2]) // plus grand
	//return tfu.sort((a, b) => a[2] - b[2]) // plus petit
	return tfu.sort(() => Math.random() - 0.5)
}	

function unw(mode = 0){
	let f2 = trieFU(mode)	
	let n =0, i, j
	let fmax = f2.length
	for(let k = 0; k < fmax; k++){
		let fi = f2[k]
		i = fi[0]
		j = fi[1]
		if(cacheKO.find(x=> (x[0] == i) && (x[1] == j)) === undefined)
		  if(attacher(i, j))
		    n++
	}
	return n
}
/*function unw(){
	let n =0;
	let fmax = fu.length
	for(let i = 0; i < fmax; i++){
		let fi = fu[i]
		for(let j = 0; j <= 2; j++){
		  if(cacheKO.find(x=> x[0] == fi && x[1] == j) === undefined)
		    if(attacher(fi, j))
		      n++
		}
	}
	return n
}*/
function sauveDonnees(){
	donnees = { pages:[ [	{n:fu[0], x:1000, y:1000, a:0} ] ] }
	
	var t = donnees.pages[0][0]
	
	t.lies = []
	fu2.forEach(x=> t.lies.push({p:x[0], l:x[1]}))
	
	var JSONDonnees = JSON.stringify(donnees)
	download(JSONDonnees, 'donnees.json', 'application/json')
}
function deplie(){
	let r = []
	mode = mode_calc
	
	for(let i=0; i< vol.faces.length; i++){
	  let t = deplieNum(i) 
	  r.push(t)
	  console.log(t)
	}
	  
	let t = r.sort((a, b) => b[1] - a[1])
	let s = t.map((x, index)=> x[0] + ' = '+ x[1])
	console.table(s)
	//console.log(r.sort((a, b) => b[1] - a[1]));
	mode = mode_voir
	deplieNum(r[0][0], true)
}

function deplieRnd(){
	mode = mode_voir
	let ncible = parseInt(document.getElementById("cible").value)
	if(isNaN(ncible))ncible = 0

	let n = parseInt(document.getElementById("premFace").value), rn
	if(!isNaN(n)){
	  let r = deplieNum(n, true, 1)
	  rn = r[1]
  	console.log(n + ' : ' + r[1] + ' / '+ vol.faces.length)
	}
	
	if(rn < ncible)deplieRnd()
}

function deplieUn(){
	mode = mode_voir
	let n = parseInt(document.getElementById("premFace").value)
	if(!isNaN(n)){
	  let r = deplieNum(n, true)
  	console.log(n + ' : ' + r[1] + ' / '+ vol.faces.length)
	}
}
function deplieNum(nF, voir = false, mode = 0){
  if(voir){
    var elsT = document.getElementsByTagNameNS(svgNS, "text")
	  var elsP = document.getElementsByTagNameNS(svgNS, "line")
	  //var elsR = document.getElementsByTagNameNS(svgNS, "rect")
	  Array.from(elsT).concat(Array.from(elsP))
	  .map(x=> x.parentNode.removeChild( x ))
  	//if(nF===-1)nF = parseInt(document.getElementById("premFace").value)
	}

//console.log("d2ize...")
	pt = vol.faces.map((f, index)=>d2ize(getFacePoints(index)))
	pt = pt.map(p=> p.map(c=> [c[0]+dk[0], c[1]+dk[1]]))
//console.log("voisins...")
	voisins = chercheVoisins()

//	console.log("debut depliage")
	fu = [nF] // faces depliees
	fu2 = [] // un dépliage (face posee, face depliee)
	cacheKO = []
	//nFaces = vol.faces.length
  if(voir)
	  pose(nF)
	
	let u
	do{
	  u = unw(mode)
//	  console.log(u, fu.length, '/', nFaces)
	}while(u>0);
	
	//console.log(nF, '=>',fu.length, '/', nFaces)
	return [nF, fu.length]
}

