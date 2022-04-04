/******* APPLICATION DEPLIEUR *******
 * 22-02-07 version initiale				*
 * 22-02-09 dépliage sur 1 page			*
 * 22-02-10 dépliage multi-page			*
 * 22-02-11	séparation par couleur	*
 * 22-02-12 regroupement des pièces *
 * 22-02-13 export PDF							*
 * 22-02-14 ajout du paramétrage		*
 * 					rendu avec marge				*
 * 22-02-24	version sans languettes	*
 ************************************/
function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
  document.getElementById("mySidebar").style.overflow = "hidden";
  document.getElementById("openNav").style.display = 'none';
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("openNav").style.display = "block";
}

function debut(){
	document.getElementById("fichierOBJ").addEventListener("change", chargeOBJ, false);
	document.getElementById("fichierPDF").addEventListener("change", sauvePDF, false);
	document.getElementById("bPDF").setAttribute('disabled', 'disabled')
	w3_open()
}

function chargeOBJ() {
	if(event.target.files){
		const fichier = event.target.files[0]
		window.document.title = `Le DEPLIEUR [${fichier.name}]`
		const lecteur = new FileReader()
		lecteur.addEventListener("load", deplie, false)
		lecteur.readAsText(fichier)
	}
}

function sauvePDF() {
	if(event.target.files){
		event.target.doc.save(event.target.files[0].name)
	}	
}

function lFind(L, n1, n2) { return L.find(x => x.n1 === n1 && x.n2 === n2) }

function ajouteTriangle(L, np, p, n1, nV){
	for (let i = 0; i < 3; i++)
		ajouteLigne(L, np, p[i], p[suiv(i)], n1, nV[i])
}

function ajouteLanguette(v, n1, n2){
	let lang = v.LANG
	if (!KOFind(lang, n1, n2) && !KOFind(lang, n2, n1))
		lang.push({n1:n1, n2:n2})
}

function KOFind(L, n1, n2) {
	return lFind(L, n1, n2) !== undefined
}

function estPose(vol, n){
	return vol.lPOSE.includes(n) || vol.POSE.includes(n)
}

function calculeCOP(V) { // remplit r pour chaque arête (n1, n2)
	let r = []
	for (let nFace = 0; nFace < V.voisins.length; nFace++) {
		[0,1,2].forEach( i => {
			let nV = V.voisins[nFace][i]
			let tri1 = V.v3d[nFace], tri2 = V.v3d[nV]
			let p = eq3(tri1, tri2, 0) ? tri2[0]
						: eq3(tri1, tri2, 1) ? tri2[1]
						: eq3(tri1, tri2, 2) ? tri2[2] : null
			cop = isCoplanar(V.v3d[nFace], p)
			
			r.push({n1:nFace, n2:nV, cop: cop})
		})
	}
	return r
}

function deplie() {
	const echN = 0.8
	const marge = 6 *pxmm()
	const formats = [
		 [210*1 *pxmm(), 297*1 *pxmm()] // A4
		,[297*1 *pxmm(), 210*2 *pxmm()] // A3
		,[210*2 *pxmm(), 297*2 *pxmm()] // A2
		,[297*2 *pxmm(), 210*4 *pxmm()] // A1
		,[210*4 *pxmm(), 297*4 *pxmm()] // A0
		
		,[300*1 *pxmm(), 300*1 *pxmm()] // Cricut tapis simple
		,[300*1 *pxmm(), 300*2 *pxmm()] // Cricut tapis double
]
	const nFormat = document.querySelector("#optFormat").selectedIndex
	
	let nFace = 0, nT, nPage = 0, ok
	w3_close()

	let vol = obj2jscad(this.result)
	//vol.vertices = vol.vertices.map(x=> x.map(y=> y*fZoom))
	vol.format = formats[nFormat]
	vol.marge = marge
	vol.echN = echN
	vol.vertices = vol.vertices.map(x=> x.map(y=> y*pxmm()))
	vol.voisins = getNeighbors(vol.faces)
	vol.v3d = vol.faces.map(f => f.map(x => vol.vertices[x]))
	vol.v2d = vol.v3d.map(d2ize)
	vol.cop = calculeCOP(vol)
	vol.LIGNES = []
	vol.NUMS = []
	vol.POSE = []
	vol.sPOSE = []
	vol.KO = []
	vol.LANG = []
	vol.LANG.parent = vol

	const { jsPDF } = window.jspdf
	let doc = new jsPDF()
	document.getElementById("fichierPDF").doc = doc
	const main = document.getElementById("main")
	const avecCouleurs = document.getElementById("voirCouleurs")
	const avecLanguettes = document.getElementById("voirLanguettes")
	const avecGroupes = document.getElementById("voirGroupes")
	const bPDF = document.getElementById("bPDF")
	bPDF.setAttribute('disabled', 'disabled')
	let hLANG = document.getElementById("hauteurLANG").value
	if (hLANG === "")hLANG = 5
	hLANG = hLANG /127*480
	let vLANG = 0.35
	const typeLANG = avecLanguettes.value
	if (avecGroupes.checked)
		vol.groups = vol.groups.map(x => x-1)
	else
		vol.groups = vol.groups.map(x => 0)

	// supprime anciens canvas
	main.querySelectorAll("canvas").forEach(c => main.removeChild(c))

	do { //Dépliage
		vol.TRIS = []	// pose prem face
		vol.lPOSE = [nFace]
		ajouteTriangle(vol.LIGNES, nPage, vol.v2d[nFace], nFace, vol.voisins[nFace])
		vol.TRIS.push(vol.v2d[nFace])
		console.log(`POSE:${nFace}`)
		let c_nf, c_nt, c_g = vol.groups[nFace]
		do {
			ok = false
			let defaut = null, lmax = 0
			for (let i = 0; !ok && i < vol.lPOSE.length; i++){
				for (let j = 0; !ok && j < 3; j++){
					c_nf = vol.lPOSE[i]
					c_nt = vol.voisins[c_nf][j]
					if (!estPose(vol, c_nt))
						if (!KOFind(vol.KO, c_nf, c_nt))
							if (!avecGroupes.checked || 
									(avecGroupes.checked && (vol.groups[c_nt] === c_g))) {
								//if (defaut === null)
								let lc = distance2d(vol.v2d[c_nf][j], vol.v2d[c_nf][suiv(j)])
								if (lc > lmax){
									defaut = {nf:c_nf, nt:c_nt}
									lmax = lc
								}
								let estCop = lFind(vol.cop, c_nf, c_nt)
								if (estCop.cop === 0) {
									ok = true
								} 
							}
				}
			}
			if (ok || (defaut !== null)){
				if (!ok) {
					nFace = defaut.nf
					nT = defaut.nt
				}
				else {
					nFace = c_nf
					nT = c_nt
				}
				let a = attache(vol, nFace, nT)
				ok = a.ok
				if (ok){
					vol.v2d[nT] = a.pt
					let t = []
					if (typeLANG > 0) {
						[0, 1, 2].filter(x => vol.voisins[nT][x] !== nFace).forEach(v => {
							let nV = vol.voisins[nT][v]
							if (ok) {
								let estPOSE = estPose(vol, nV)
								let estKO = KOFind(vol.KO, nT, nV)
								
								
								
								let a2 = attache(vol, nT, nV)
								if (!estPOSE && !estKO) {
									ok = a2.ok
									if (!ok) { // teste si languette ok
										let T = trapeze(a2.pt[0], a2.pt[1], hLANG, vLANG)
										ok = !checkOverlap(vol.TRIS, [T[0], T[1], T[2]])
											&& !checkOverlap(vol.TRIS, [T[0], T[2], T[3]])
										if (ok) {
											t.push(T)
										}
									}
								}
							}
						})
					}
					if (ok) {
						console.log(`attache ${nT}`)
						ajouteTriangle(vol.LIGNES, nPage, a.pt, nT, vol.voisins[nT])
						vol.lPOSE.push(nT)
						vol.TRIS.push(a.pt)
						t.forEach(T => {
							vol.TRIS.push([T[0], T[1], T[2]], [T[0], T[2], T[3]])
						})
					}
				} else {
					vol.KO.push({n1:nFace, n2:nT})
					ok = true
				}

			} else {
				vol.KO.push({n1:nFace, n2:nT})
			}
		} while (ok)
		// cherche s'il reste encore une facette à poser
		ok = false
		vol.POSE = vol.POSE.concat(vol.lPOSE)
		vol.sPOSE.push(vol.lPOSE)
		for (let i = 0 ; i < vol.faces.length; i++){
			ok = !vol.POSE.includes(i)
			if (ok){
				nFace = i
				nPage++
				i = vol.faces.length
			}
		}
	} while (ok)

	// recadre chaque page ds le coin haut-gauche
	for (let np = 0; np <= nPage; np++){
		const pLignes = vol.LIGNES.filter(l => l.p === np)
		if (pLignes.length > 0) {
			let pts = []
			pLignes.forEach(l => {
				let vl = lFind(vol.LANG, l.n1, l.n2)
				if (typeLANG === "2" || (typeLANG === "1" && vl !== undefined)) {
					Array.prototype.push.apply(pts, trapeze(l.p1, l.p2, hLANG, vLANG))
				} else
					pts.push(l.p1, l.p2)
			})
			let b = calcBoiteEnglobante(pts)
			// supprime
			vol.LIGNES = vol.LIGNES.filter(l => l.p !== np)
			// recadre
			pLignes.forEach(l => {
				vol.LIGNES.push({p:l.p, p1:[l.p1[0] -b[0][0], l.p1[1]-b[0][1]], 
					p2:[l.p2[0] -b[0][0], l.p2[1]-b[0][1]], n1:l.n1, n2:l.n2, nb:l.nb})
			})
			// deplace triangles
			vol.sPOSE[np].forEach(t => {
				vol.v2d[t] = vol.v2d[t].map(v => [v[0] -b[0][0], v[1] -b[0][1]])
			})
		}
	}

	const couls = Array.from(new Set(vol.groups))
	// regroupe les pieces en X
	couls.forEach(c => {
		ok = true
		do {
			let dp = [] // dimension du contenu de page
			for (let np = 0; np <= nPage; np++){
				const pLignes = vol.LIGNES.filter(l => l.p === np)
				if (pLignes.length > 0) {
					if (vol.groups[vol.sPOSE[np][0]] === c) {
						let pts = []
						pLignes.forEach(l => {
							if ( typeLANG === "2" || 
									(typeLANG === "1" && lFind(vol.LANG, l.n1, l.n2) !== undefined)) {
								Array.prototype.push.apply(pts, trapeze(l.p1, l.p2, hLANG, vLANG))
							} else
								pts.push(l.p1, l.p2)
						})
						let b = calcBoiteEnglobante(pts),
								db = dimensions(b[0], b[1])
						dp.push({page:np, b:b, x: db[0], y: db[1]})
					}
				}
			}
			dp.sort((a, b) => { return a.x < b.x ? -1 : 1 })
			if (dp.length < 2) {
				ok = false
			}
			else if ((dp[0].x + dp[1].x) < formats[nFormat][0]- marge*2) {
				deplaceLignes(vol, dp[0].page, dp[1].page, dp[1].b[1][0] - dp[0].b[0][0], 0)
			} else
				ok = false
		} while (ok)
	})
	// regroupe les pieces en Y
	couls.forEach(c => {
		ok = true
		do {
			let dp = [] // dimension du contenu de page
			for (let np = 0; np <= nPage; np++){
				const pLignes = vol.LIGNES.filter(l => l.p === np)
				if (pLignes.length > 0) {
					if (vol.groups[vol.sPOSE[np][0]] === c) {
						let pts = []
						pLignes.forEach(l => {
							if ( typeLANG === "2" ||
									(typeLANG === "1" && lFind(vol.LANG, l.n1, l.n2) !== undefined)) {
								Array.prototype.push.apply(pts, trapeze(l.p1, l.p2, hLANG, vLANG))
							} else
								pts.push(l.p1, l.p2)
						})
						let b = calcBoiteEnglobante(pts),
								db = dimensions(b[0], b[1])
						dp.push({page:np, b:b, x: db[0], y: db[1]})
					}
				}
			}
			dp.sort((a, b) => { return a.y < b.y ? -1 : 1 })
			if (dp.length < 2) {
				ok = false
			}
			else if ((dp[0].y + dp[1].y) < formats[nFormat][1] -marge*2) {
				deplaceLignes(vol, dp[0].page, dp[1].page, 0, dp[1].b[1][1] - dp[0].b[0][1])
			} else
				ok = false
		} while (ok)
	})
	// rendu
	let pageC = 0
	for (let np = 0; np <= nPage; np++){
		let pLignes = vol.LIGNES.filter(l => l.p === np)
		if (pLignes.length === 0)
			continue
		let pts = []
		pLignes.forEach(l => {
			let vl = lFind(vol.LANG, l.n1, l.n2)
			if (typeLANG === "2" || (typeLANG === "1" && vl !== undefined)) {
				Array.prototype.push.apply(pts, trapeze(l.p1, l.p2, hLANG, vLANG))
			} else
				pts.push(l.p1, l.p2)
			})

		let coul = vol.usemtl[vol.groups[vol.sPOSE[np][0]]]
	 if (coul !== undefined) {
		let b = calcBoiteEnglobante(pts)
		let page = document.createElement("canvas")
		page.setAttribute("id", "p" + np)
		page.setAttribute("width", formats[nFormat][0])
		page.setAttribute("height", formats[nFormat][1])
		main.appendChild(page)
		let ctx = document.getElementById("p"+ np).getContext("2d")

		pageC++
		if (pageC > 1){
			doc.addPage()
		}
		if (coul === 'default')
			coul = "white"
		vol.sPOSE[np].forEach(x => {
			let p = vol.v2d[x].map(x => [x[0] - b[0][0]+marge, x[1] - b[0][1]+marge])
			// n°
			ctx.strokeStyle = "blue"
			number(ctx, null, x, centroid(p), echN, null)
			if (avecCouleurs.checked) { // triangle
				ctx.fillStyle = coul
				ctx.beginPath()
				let c = couleurFr(coul).v, crgb = c.join(',')
				ctx.fillStyle = `rgba(${crgb}, 0.66)`
				ctx.moveTo(p[0][0], p[0][1])
				ctx.lineTo(p[1][0], p[1][1])
				ctx.lineTo(p[2][0], p[2][1])
				ctx.closePath()
				ctx.fill()
					
				doc.setDrawColor(coul)
				doc.setFillColor(coul)
				p = p.map(v => v.map(w => w/pxmm()))
				doc.triangle(p[0][0], p[0][1], p[1][0], p[1][1], p[2][0], p[2][1], "FD")
				doc.fillStroke()
			}
		})
		ctx.font = '20px serif';
		ctx.fillStyle = 'black'
		const coulF = couleurFr(coul).n
		ctx.fillText(`page ${pageC}` + (avecGroupes.checked ? ` (${coulF})` : '')
		, 100, formats[nFormat][1] - 30);

		for (let i = 0; i < pLignes.length; i++) {
			const l = pLignes[i]
			let estCop = lFind(vol.cop, l.n1, l.n2).cop
			let col = estCop ? estCop < 0 ? "maroon" : "green" : null
			let ptA = [l.p1[0]-b[0][0]+marge, l.p1[1]-b[0][1]+marge],
					ptB = [l.p2[0]-b[0][0]+marge, l.p2[1]-b[0][1]+marge],
					mmA = ptA.map(v => v/pxmm()),
					mmB = ptB.map(v => v/pxmm()),
					vOK = false

			if (l.nb === 1) {
				let vl1 = lFind(vol.LANG, l.n1, l.n2)
				if (typeLANG === "2" || (typeLANG === "1" && vl1 !== undefined)) {
					let t = trapeze(ptA, ptB, hLANG, vLANG)
					vOK = true
					defDash('red', ctx, doc)
					ctx.beginPath()
					ctx.strokeStyle = "red"
					ctx.moveTo(t[0][0], t[0][1]);
					[t[1],t[2],t[3]].forEach(n => ctx.lineTo(n[0], n[1]))
					ctx.stroke()

					doc.setDrawColor("red");
					t = t.map(v => v.map(w => w/pxmm()))
					doc.moveTo(t[0][0], t[0][1]);
					[t[1],t[2],t[3]].forEach(n => doc.lineTo(n[0], n[1]))
					doc.stroke()
				} else
					if (col === null)
						col = "red"
				doc.setDrawColor("black")
				ctx.strokeStyle = "black"
				number(ctx, doc, getNum(vol.NUMS, l.n1, l.n2), milieu(ptA, ptB), echN, direction(ptA, ptB), pxmm())
			}
			
			if (col) {
				if (!vOK && l.nb === 1) col = "red"
				defDash(col, ctx, doc)
				ctx.strokeStyle = col
				ctx.beginPath()
				ctx.moveTo(ptA[0], ptA[1])
				ctx.lineTo(ptB[0], ptB[1])
				ctx.stroke()

				doc.setDrawColor(col)
				doc.line(mmA[0], mmA[1], mmB[0], mmB[1])
				doc.stroke()
			}
		}
	 }
	}
	bPDF.removeAttribute("disabled")
}

function deplaceLignes(vol, page0, page1, dx, dy) {
	vol.LIGNES.filter(l => l.p === page0).forEach(l => { 
		vol.LIGNES.push({p:page1, n1:l.n1, n2:l.n2, nb:l.nb
		 , p1:[l.p1[0] +dx, l.p1[1] +dy], p2:[l.p2[0] +dx, l.p2[1] +dy]
		})
	})
	// supprime
	vol.LIGNES = vol.LIGNES.filter(l => l.p != page0)
	// deplace triangles en X
	vol.sPOSE[page0].forEach(t => {
		vol.v2d[t] = vol.v2d[t].map(v => [v[0] +dx, v[1] +dy])
		vol.sPOSE[page1].push(t)
	})
	vol.sPOSE[page0] = []
}

function attache (vol, nFace, nT) {
	let nVP = vol.voisins[nT].findIndex(x => x === nFace),
			ptV = Array.from(vol.v2d[nT]),
			ptV0 = ptV[nVP], 
			ptV1 = ptV[suiv(nVP)]
	let nFP = vol.voisins[nFace].findIndex(x => x === nT),
			ptF = Array.from(vol.v2d[nFace]),
			ptF0 = ptF[nFP],
			ptF1 = ptF[suiv(nFP)]
	// rapproche
	let d = dimensions(ptV0, ptF1)
	ptV = ptV.map(v => [v[0] + d[0], v[1] + d[1]])
	ptV1 = ptV[suiv(nVP)]
	// tourne
	let a = calcAngle(ptF0, ptF1, ptV1)
	let ptVr = ptV.map(x => rotation(ptF1[0], ptF1[1], x[0], x[1], a))
	ptV1 = ptVr[suiv(nVP)]
	ptV = Math.abs(distance2d(ptF0, ptV1)) > epsilon
		? ptV.map(x=> rotation(ptF1[0], ptF1[1], x[0], x[1], degToRad(360)-a))
		: ptVr
	// test recouvrement
	let ok = true
	if (vol.LIGNES.length > 0)
		ok = !checkOverlap(vol.TRIS, ptV)
	if (ok) {
		// test débordement de la page
		let tmp = Array.from(vol.TRIS)
		tmp.push(ptV)
		let b = calcBoiteEnglobante(tmp.flat()),
				db = dimensions(b[0], b[1])
		ok = (db[0] <= vol.format[0] - vol.marge*2) 
			&& (db[1] <= vol.format[1] - vol.marge*2)
	}
	return {ok:ok, pt:ptV}
}

function defDash(col, ctx, doc){
	const dash = [
		['red',		[[], 0], [[], 0]],
		['maroon',[[5,5], 0],	[[5/pxmm(),5/pxmm()], 0]],
		['green',	[[4,2,1,2], 6],	[[4/pxmm(),2/pxmm(),1/pxmm(),2/pxmm()], 6/pxmm()]]
	]

	let d = dash.find(d => d[0] === col)
	ctx.setLineDash(d[1][0], d[1][1])
	doc.setLineDash(d[2][0], d[2][1])
}

function pxmm () {return 480/127} 

function getNum (L, n1, n2)  {
	let n = Math.min(n1, n2), N = Math.max(n1, n2),
			l = L.findIndex(x => (x.n === n) && (x.N === N))

	if (l === -1)
		l = L.push({n:n, N:N}) -1
	return l
}

function ajouteNum (L, p, n, pt, col, ech) {
	L.push({p:p, n:n, pt:pt, col:col, ech:ech})
}

function ajouteLigne (L, p, p1, p2, n1, n2){
	// cherche si ligne existe
	let l = L.find(x => (x.p === p) && 
		((eq(x.p1, p1) && eq(x.p2, p2)) || (eq(x.p1, p2) && eq(x.p2, p1))))
	if (l !== undefined)
		l.nb++
	else
		L.push({p:p, p1:p1, p2:p2, n1:n1, n2:n2, nb:1})
}

function number (ctx, doc, n, C, ech, angle) {
	const digit = [
	[[0,0],[0,16],[7,16],[7,0],[0,0]],
	[[0,8],[7,16],[7,0]],
	[[0,12],[0,16],[7,16],[7,8],[0,8],[0,0],[7,0]],
	[[0,13],[0,16],[6,16],[7,11],[4,8],[7,5],[6,0],[0,0],[0,3]],
	[[7,8],[0,8],[5,16],[5,1]],
	[[7,16],[0,16],[0,8],[7,8],[7,0],[0,0]],
	[[7,16],[0,8],[0,0],[7,0],[7,8],[0,8]],
	[[0,16],[7,16],[0,0]],
	[[4,9],[2,12],[2,16],[6,16],[6,12],[4,9],[7,7],[7,0],[1,0],[1,7],[4,9]],
	[[7,8],[0,8],[0,16],[7,16],[7,0],[0,0]]
]
	const ch = n.toString().split('').map(Number)
	ctx.setLineDash([])
	ctx.beginPath()

	if (doc !== null) {
		doc.setDrawColor("black")
		doc.setLineDash([])
	}
	for (let i = 0; i < ch.length; i++){
		let d = digit[ch[i]].map(x => [ech*(x[0] + 10*i-5*ch.length), ech * (-x[1]-2)])
		if(angle !== null && angle !== Math.PI)
			d = d.map(x => rotation(0, 0, x[0], x[1], Math.PI - angle))
		d = d.map(x => [x[0] + C[0], x[1] + C[1]])
		let prem = d.shift()
		ctx.moveTo(prem[0], prem[1])
		d.forEach(v => ctx.lineTo(v[0], v[1]))

		if (doc !== null) {
			let chemin = [{op:"m", c:[prem[0]/pxmm(), prem[1]/pxmm()]}]
			d.forEach(v => chemin.push({op:"l", c:[v[0]/pxmm(), v[1]/pxmm()]}))
			doc.path(chemin)
		}
	}
	if (doc !== null) {
		doc.stroke()
	}
	ctx.stroke()
}
