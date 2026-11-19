import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// PWA Elements: permite usar la cámara desde el navegador (ionic serve)
defineCustomElements(window);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    if (!environment.production) {
      console.error(err);
    }
  });
