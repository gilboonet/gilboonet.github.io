function init(){

  donnees = [ // id , libelle, url
  ["S1A", "petit <b>dodo</b> en tranches de carton, <b>2015</b>"]
, ["S1B", "Script <b>jscad</b> de tranchage num&eacute;rique param&eacute;trique (ancienne version), vue 3d d'un mod&egrave;le d'<b>ours</b>"]
, ["S1C", "Depuis le m&ecirc;me script, vue 2d du m&ecirc;me mod&egrave;le, pi&egrave;ces &agrave; d&eacute;couper et assembler pour l'obtenir en 20 cm de haut avec du carton de 3 mm"]

, ["S2A", "<b>Lapin de Stanford</b> voxelis&eacute; en carton, <b>2016</b>"]
, ["S2B", "Script <b>jscad</b> de voxelisation d'un mod&egrave;le 3d"]
, ["S2C", "D&eacute;coupe des tranches &agrave; assembler pour obtenir la statue voxelis&eacute;e du <b>lapin de Stanford</b>"]

, ["S3A", "petit <b>ourson</b> en tranches de carton  entrecrois&eacute;es, <b>2016</b>"]
, ["S3B", "Script <b>jscad</b> g&eacute;n&eacute;rant des tranches entrecrois&eacute;es (ancienne version)"]
, ["S3C", "M&ecirc;me script, vue &eacute;clat&eacute;e montrant le mod&egrave;le et les tranches, une autre vue en 2d calcule les pi&egrave;ces &agrave; d&eacute;couper et assembler"]

, ["O1A", "Vases g&eacute;om&eacute;triques divers,<b>2017-2019</b>"]
, ["O1B", "Grand vase en cours de d&eacute;co., hauteur 57 cm, <b>2018</b>"]
, ["O1C", "Petit bol en carton &agrave; c&ocirc;t&eacute; de son mod&egrave;le 3d fait avec Wings3d, <b>2019</b>"]

, ["O2A", "Petite bo&icirc;te hexagonale avec couvercle sur une m&ecirc;me boite de plus grande taille, <b>2019</b>"]
, ["O2B", "Bo&icirc;te rectangulaire biseaut&eacute;e avec couvercle, avec &agrave; c&ocirc;t&eacute; son mod&egrave;le 3d Wings 3d, et son gabarit en pdf, <b>2019</b>"]
, ["O2C", "Bo&icirc;te losange au couvercle biseaut&eacute;, <b>2019</b>"]

, ["O3A", "Volumes ajour&eacute;s divers"]
, ["O3B", "Petit volume ajour&eacute; en cours de fabrication manuelle, avec son gabarit papier, <b>2019</b>"]
, ["O3C", "Petit bol carr&eacute; ajour&eacute;, d&eacute;coupe laser tr&egrave;s fine (&lt; 1 mm par endroits), <b>2015</b>"]

, ["O4A", "Cadres miroirs issus du script de cr&eacute;ation de biseaux &quot;diamant&eacute;s&quot;, <b>2019</b>"]
, ["O4B", "Cadre assembl&eacute; et &agrave; c&ocirc;t&eacute;, son mod&egrave;le 3d, <b>2016</b>"]
, ["O4C", "Mod&eacute;lisation en cours d'un cadre biseaut&eacute;, <b>2016</b>"]

];

 for (var i in donnees){
   creePanneau(donnees[i][0], donnees[i][1], "w3-card w3-green");
 }
}

function creePanneau(nom, texte, classe){

  var racine = document.getElementById(nom);

  var parent = document.createElement("div");

  parent.setAttribute("class", classe);

  racine.appendChild(parent);

  var cible = document.createElement("a");
  var img = nom +".jpg";

  cible.setAttribute("href", "img/" + img);
  cible.setAttribute("target", "_blank");

  parent.appendChild(cible);

  var elem = document.createElement("img");
  elem.setAttribute("src", "img/s/" + img);
  elem.setAttribute("style", "width:100%");

  cible.appendChild(elem);

  cible = document.createElement("div");
  cible.setAttribute("class", "w3-container");
  cible.innerHTML = texte;

  parent.appendChild(cible);
}
