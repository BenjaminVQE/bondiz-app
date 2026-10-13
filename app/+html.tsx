import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Gabarit HTML du build web (rendu uniquement côté Node, à l'export).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="description" content="Rencontre des amis autour d'activités près de chez toi." />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8432fe" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Bondiz" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: "body { background-color: #8432fe; }" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
