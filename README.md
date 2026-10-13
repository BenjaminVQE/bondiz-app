# Bondiz — application

Application de rencontre amicale : on like des profils, on matche, on discute,
puis on réserve une activité ensemble. Un seul code [Expo](https://expo.dev)
(React Native + `expo-router`) produit l'app iOS, l'app Android et la version
web installable (PWA).

Le backend est dans le dépôt `strapi-mydsu`.

## Démarrer

```bash
npm install
cp .env.dist .env   # puis renseigner l'adresse de l'API
```

| Variable | Rôle |
|---|---|
| `EXPO_PUBLIC_STRAPI_URL` | Adresse de l'API Strapi, `/api` compris (ex. `http://localhost:1337/api`) |
| `EXPO_PUBLIC_STRAPI_TOKEN` | Jeton d'API utilisé avant la connexion. Il est embarqué dans le bundle, donc lisible côté web |

Ces variables sont lues au moment du build : après un changement, il faut
relancer la commande.

## Lancer l'app

| Commande | Effet |
|---|---|
| `npm start` | Serveur de développement Expo (QR code, simulateurs) |
| `npm run ios` / `npm run android` | Ouvre directement le simulateur ou l'émulateur |
| `npm run web` | Version web en développement, avec rechargement à chaud |
| `npm run lint` | ESLint |

## Version web installable (PWA)

En développement (`npm run web`), le service worker n'est pas enregistré : le
cache gênerait le rechargement à chaud. Pour tester la vraie PWA (installation,
cache, notifications), il faut le build de production :

```bash
npm run build:web   # exporte le site statique dans dist/
npm run serve:web   # le sert sur http://localhost:8081
```

Dans Chrome, l'icône d'installation apparaît dans la barre d'adresse ; le
manifeste et le service worker se vérifient dans les outils de développement,
onglet « Application ». Après chaque modification du code, relancer
`npm run build:web` puis recharger la page.

### Ce qui compose la PWA

| Fichier | Rôle |
|---|---|
| `public/manifest.json` | Nom, couleurs, icônes et mode plein écran |
| `public/icons/` | Icônes de l'app (192, 512 et Apple) |
| `public/sw.js` | Service worker : cache et notifications |
| `app/+html.tsx` | Gabarit HTML : lien vers le manifeste, balises iOS |
| `utils/registerServiceWorker.ts` | Enregistrement du service worker (production uniquement) |

Stratégie de cache du service worker :

- pages : réseau d'abord, copie en cache en secours hors connexion. Une nouvelle
  version est donc visible dès le déploiement ;
- fichiers statiques d'Expo (noms hachés) : cache d'abord ;
- appels à l'API : jamais mis en cache.

### Code propre à chaque plateforme

Metro choisit `fichier.web.ts(x)` pour le web et `fichier.ts(x)` pour le natif.
C'est ce qui remplace les modules sans équivalent web :

| Module | Natif | Web |
|---|---|---|
| `utils/storage` | `expo-secure-store` | `localStorage` |
| `components/DatePickerModal` | `react-native-modal-datetime-picker` | champ date/heure du navigateur |
| `utils/push` | pas encore branché | Web Push |

`utils/upload.ts` (envoi d'image) et `utils/alert.ts` (boîtes d'alerte) gèrent
les deux cas dans le même fichier.

### Déploiement

Le dossier `dist/` se dépose sur n'importe quel hébergement statique en HTTPS
(obligatoire pour le service worker). Deux points à prévoir :

- l'adresse `/chat/<id>` doit être renvoyée vers la page du chat (règle de
  réécriture), sinon un clic sur une notification app fermée tombe sur une 404 ;
- l'API doit accepter les requêtes venant de l'origine du site (CORS).

## Notifications push

Disponibles sur la version web uniquement pour l'instant. Elles préviennent
d'un nouveau message et d'un nouveau match ; un clic ouvre la conversation.

- Activation : Paramètres → Notifications.
- Sur iPhone, il faut d'abord ajouter Bondiz à l'écran d'accueil (bouton
  Partager, puis « Sur l'écran d'accueil »).
- La déconnexion désabonne l'appareil.
- Le serveur doit avoir ses clés VAPID : voir le README de `strapi-mydsu`.

Pour les tester en local, lancer le backend avec ses clés VAPID, puis
reconstruire l'app en la pointant dessus :

```bash
EXPO_PUBLIC_STRAPI_URL=http://localhost:1337/api npm run build:web
npm run serve:web
```

Les notifications fonctionnent sur `localhost` dans Chrome et Firefox. Sur un
téléphone, il faut une adresse en HTTPS.

## Organisation du code

| Dossier | Contenu |
|---|---|
| `app/` | Écrans (un fichier par route) et `app/components/` |
| `components/` | Composants avec une variante par plateforme |
| `context/` | `AuthContext` : session, connexion, inscription |
| `services/` | `api.ts` : appels à Strapi |
| `utils/` | Stockage, envoi d'images, alertes, notifications, dates |
| `constants/` | Couleurs, styles, images |
| `public/` | Fichiers servis tels quels sur le web |
