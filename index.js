function init(){

var donnees = [ // id,  titre, texte, [textePhotoA,textePhotoB,textePhotoC]
["S1", "Statues en tranches sur un axe", "Technique basique et n&eacute;cessitant le plus de carton, donne un bon rendu, peut servir pour faire un moule.",
  ["petit <b>dodo</b> en tranches de carton, <b>2015</b>"
  ,"Script <b>jscad</b> de tranchage num&eacute;rique param&eacute;trique (ancienne version), vue 3d d'un mod&egrave;le d'<b>ours</b>"
  ,"Depuis le m&ecirc;me script, vue 2d du m&ecirc;me mod&egrave;le, pi&egrave;ces &agrave; d&eacute;couper et assembler pour l'obtenir en 20 cm de haut avec du carton de 3 mm"]
],
["S2", "Statues voxelis&eacute;es en tranches sur un axe", 'rendu "pixellis&eacute;", n&eacute;cessite de voxeliser (discr&eacute;tiser) le mod&egrave;le 3d, mais apr&egrave;s les calculs sont grandement simplifi&eacute;s',
  ["<b>Lapin de Stanford</b> voxelis&eacute; en carton, <b>2016</b>"
  ,"Script <b>jscad</b> de voxelisation d'un mod&egrave;le 3d"
  ,"D&eacute;coupe des tranches &agrave; assembler pour obtenir la statue voxelis&eacute;e du <b>lapin de Stanford</b>"]
],
["S3", "Statues en tranches sur deux axes", "le tranchage sur deux axes : &eacute;conome en carton mais le rendu est peu d&eacute;taill&eacute;, parfait pour un squelette de meuble",
  ["petit <b>ourson</b> en tranches de carton  entrecrois&eacute;es, <b>2016</b>"
  ,"Script <b>jscad</b> g&eacute;n&eacute;rant des tranches entrecrois&eacute;es (ancienne version)"
  ,"M&ecirc;me script, vue &eacute;clat&eacute;e montrant le mod&egrave;le et les tranches, une autre vue en 2d calcule les pi&egrave;ces &agrave; d&eacute;couper et assembler"]
],

["O1", "Vases / Bols", "",
  ["Vases g&eacute;om&eacute;triques divers,<b>2017-2019</b>"
  ,"Grand vase en cours de d&eacute;co., hauteur 57 cm, <b>2018</b>"
  ,"Petit bol en carton &agrave; c&ocirc;t&eacute; de son mod&egrave;le 3d fait avec Wings3d, <b>2019</b>"]
],
["O2", "Bo&icirc;tes", "",
  ["Petite bo&icirc;te hexagonale avec couvercle sur une m&ecirc;me boite de plus grande taille, <b>2019</b>"
  ,"Bo&icirc;te rectangulaire biseaut&eacute;e avec couvercle, avec &agrave; c&ocirc;t&eacute; son mod&egrave;le 3d Wings 3d, et son gabarit en pdf, <b>2019</b>"
  ,"Bo&icirc;te losange au couvercle biseaut&eacute;, <b>2019</b>"]
],
["O3", "Volumes ajour&eacute;s", "",
  ["Volumes ajour&eacute;s divers"
  ,"Petit volume ajour&eacute; en cours de fabrication manuelle, avec son gabarit papier, <b>2019</b>"
  ,"Petit bol carr&eacute; ajour&eacute;, d&eacute;coupe laser tr&egrave;s fine (&lt; 1 mm par endroits), <b>2015</b>"]
],
["O4", "Cadres", "",
  ["Cadres miroirs issus du script de cr&eacute;ation de biseaux &quot;diamant&eacute;s&quot;, <b>2019</b>"
  ,"Cadre assembl&eacute; et &agrave; c&ocirc;t&eacute;, son mod&egrave;le 3d, <b>2016</b>"
  ,"Mod&eacute;lisation en cours d'un cadre biseaut&eacute;, <b>2016</b>"]
]
];

for(var i in donnees){
  var parent = document.getElementById(donnees[i][0]);
  parent.setAttribute("class", "w3-container");

  var titre = document.createElement("h3");
  titre.id = donnees[i][1]
  titre.innerHTML = "<br/>" + donnees[i][1];
  parent.appendChild(titre);

  if(donnees[i][2]){
    var texte = document.createElement('p');
    texte.innerHTML = donnees[i][2];
    parent.appendChild(texte);
  }

  for(var j=0; j<donnees[i][3].length; j++){
    creePanneau(parent, donnees[i][0]+ String.fromCharCode(65+j), "w3-third", donnees[i][3][j], "w3-card w3-green");
  }
}

}

  function creePanneau(racine, nom, clBase, texte, classe){

    var base = document.createElement("div");
    base.setAttribute("class", clBase);

    racine.appendChild(base);

    var parent = document.createElement("div");
    parent.setAttribute("class", classe);

    base.appendChild(parent);

    var cible = document.createElement("a");
    var img = nom +".jpg";
    cible.setAttribute("href", "img/" + img);
    cible.setAttribute("target", "_blank");

    parent.appendChild(cible);

    var elem = document.createElement("img");
    elem.src = "img/s/" + img;
    elem.setAttribute("style", "width:100%");

    cible.appendChild(elem);

    cible = document.createElement("div");
    cible.setAttribute("class", "w3-container");
    cible.innerHTML = texte;

    parent.appendChild(cible);
  }
