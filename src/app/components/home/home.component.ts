import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContentstackService } from '../../services/contentstack.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
})

export class HomeComponent implements OnInit {
  private readonly contentstackService = inject(ContentstackService);
  private readonly route = inject(ActivatedRoute);

  readonly page = signal<any>(null);
  readonly error = signal<string>('');

  getContent() {
    this.contentstackService.getEntryByUrl('page', '/').subscribe({
      next: (result) => {
        this.page.set(result);
      },
      error: (err) => {
        this.error.set('Error loading content. Please check your Contentstack configuration.');
        console.error('Contentstack error:', err);
      }
    });
  }

  ngOnInit() {
    // In SSR mode Live Preview reloads the page with its parameters on every edit
    this.contentstackService.applyLivePreview(this.route.snapshot.queryParams);
    this.getContent();
  }
}
