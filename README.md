# Qui gagnera les 2 points ?

Jeu de classe en français, inspiré du format Millionaire. HTML, CSS et JavaScript uniquement, sans installation.

## Lancer le jeu

Double-cliquez sur `index.html`. Choisissez votre élève dans la classe, passez en plein écran et cliquez sur **Commencer la partie**. Les polices et les sons fonctionnent hors ligne.

Cliquez sur une réponse, puis sur **Valider la réponse**. Après environ trois secondes de suspense, le résultat apparaît. Le professeur choisit quand passer à la question suivante. Une erreur termine la partie. Le million est un gain fictif : **les deux points sont attribués une seule fois, uniquement après dix bonnes réponses**, pas à chaque question.

## Charger vos dix questions

Cliquez sur **Charger mes questions** et choisissez votre JSON. Le chargement vérifie toutes les questions avant de remplacer la série actuelle. Les questions restent dans l’ordre du fichier ; placez les plus difficiles à la fin. Une nouvelle série pendant une partie demande confirmation avant de remettre la progression à zéro.

Format recommandé :

```json
{
  "title": "Mon quiz",
  "questions": [
    {
      "question": "Combien font 2 + 2 ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "B",
      "explanation": "2 + 2 = 4."
    }
  ]
}
```

Cet exemple montre une question. Le fichier complet doit en contenir exactement dix. `explanation` est facultatif. `correctAnswer` est la lettre A, B, C ou D. Le format `correctIndex` (entier de 0 à 3) est également accepté, ainsi qu’un tableau de questions sans objet parent. Les réponses peuvent aussi être un objet `{"A":"…","B":"…","C":"…","D":"…"}`.

Les questions livrées dans `questions.json` sont des exemples, signalés dans le jeu. Dans un fichier personnel, omettez `"demo": true`. Le chargement depuis l’interface fonctionne en double-cliquant sur la page. Si vous utilisez un serveur local, `questions.json` est lu automatiquement. Les modifications de ce fichier ne sont pas lues automatiquement en mode `file://` : utilisez le bouton de chargement.

## Jokers

- **50:50** : le professeur sélectionne les deux mauvaises réponses à retirer et confirme. Aucun choix automatique. Il peut annuler avant confirmation ; le joker est alors conservé. Choisissez bien les deux réponses incorrectes : le jeu respecte votre sélection.
- **Le professeur** : donnez un indice en personne, puis cliquez sur **Reprendre la question**.
- **Un ami** : laissez un camarade aider l’élève, puis reprenez la question.

Chaque joker est utilisable une fois par partie. Une nouvelle partie remet les trois jokers à disposition.

## Commandes

Souris ou clavier : A–D sélectionnent la réponse ; Entrée active le bouton ayant le focus, ou valide/continue quand aucun bouton n’a le focus. F active le plein écran. Échap annule une sélection 50:50 en cours et ferme les dialogues. Le bouton haut-parleur coupe les sons. Le mode d’emploi est accessible depuis la page.

Les sons sont des mélodies originales synthétisées avec Web Audio, déclenchées après un clic. Les mouvements tiennent compte du réglage système « réduire les animations ». Aucun service externe, enregistrement ni suivi des élèves.

## Fichiers

`index.html` : structure, mode d’emploi et questions de secours pour l’usage hors ligne. `style.css` : interface claire, responsive et adaptée au projecteur. `app.js` : règles, jokers, chargement et sons. `questions.json` : série de démonstration. `assets/fonts` : Barlow Semibold/Bold, fournies sous SIL Open Font License (voir `OFL.txt`).
