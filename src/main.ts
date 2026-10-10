import { provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes, withInMemoryScrolling } from '@angular/router';
import { App } from './app/app.component';
import { HomeComponent } from './app/components/home/home.component';
import { LandingPageComponent } from './app/components/landing-page/landing-page.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // Every other URL is looked up as a landing page entry by its `url` field
  { path: '**', component: LandingPageComponent }
];

bootstrapApplication(App, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }))
  ]
}).catch(err => console.error(err));
