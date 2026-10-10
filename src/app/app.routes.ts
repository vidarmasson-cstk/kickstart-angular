import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  // Every other URL is looked up as a landing page entry by its `url` field
  { path: '**', component: LandingPageComponent }
];
