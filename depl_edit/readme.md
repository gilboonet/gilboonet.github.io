# Editeur graphique de gabarit de dépliage
**depl_edit** est une application **JavaScript** qui permet de créer de façon semi-automatique le gabarit/plan d'un volume dans le but de le reproduire sur carton par découpage, pliage et assemblage. C'est un outil créé dans le cadre du cartonnage numérique pour la création de statues et d'objets en facettes de carton ainsi que pour la création de l'habillage en facettes de carton de mobilier.

## Interface
![](depl_interface.png)

## Volume
Le volume doit être au format .obj triangularisé. Les dimensions du gabarit correspondront à une unité du volume pour 1 mm. Le paramètre **Echelle (D)** (1 par défaut) peut être modifié (recharger le volume après l'avoir modifié) pour créer un gabarit à une échelle différente de celle du volume.

## Volume en une pièce
Un volume simple peut être déplié en une seule pièce, de cette façon :
- accès à l'application depuis le navigateur internet : [ici](https://gilboonet.github.io/depl_edit/depl_edit2.html?page=1)
- clic sur **.OBJ (B)**, sélection du volume
- La facette de départ est demandée : "Commencer par quelle facette (0 - 11) ?" (cas d'un volume avec 12 facettes), la première facette disponible est proposée par défaut, mais vous pouvez en choisir une autre.
- Après validation de la facette de départ, celle-ci est posée et le dépliage peut commencer.
- Sur le bord droit apparait la grille des numéros de facettes, avec celles dépliées en surbrillance. Le dépliage consiste à poser toutes les facettes restantes.

### Mode semi-automatique
- Le plus souvent il suffit alors de lancer un dépliage semi-automatique en cliquant sur le bouton **semi-auto (S)** qui va tenter de déplier toutes les facettes tant qu'elles sont accessibles. Attention, cette opération ne détecte pas les recouvrements (contrairement à la version de dépliage automatique en OpenJSCAD).

### Edition
Voici les différentes opérations possibles :
- déplacer la pièce en cours de dépliage soit en cliquant sur l'un des boutons **M,N,O,P**, soit en glissant-déplaçant le n° de la première facette qui est en orange.
- tourner la pièce en cours de dépliage en cliquant sur l'un des boutons **I,J,K,L**
- 

## Coloriage de zones à déplier séparément
