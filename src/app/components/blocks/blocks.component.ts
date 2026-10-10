import { Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Renders the modular blocks of a landing page. Each block is `{ <block uid>: { ...fields } }`;
 * `tags` is the entry's live preview `$` object, for the per-block edit tags.
 */
@Component({
  selector: 'app-blocks',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './blocks.component.html',
})
export class BlocksComponent {
  readonly blocks = input<any[]>([]);
  readonly tags = input<any>(null);

  /** The block's type: its only key, ignoring live preview metadata. */
  typeOf(item: any): string {
    return Object.keys(item ?? {}).find((k) => k !== '$' && k !== '_metadata') ?? '';
  }

  cslp(obj: any, field: string): string | null {
    return obj?.$?.[field]?.['data-cslp'] ?? null;
  }

  blockTag(index: number): string | null {
    return this.tags()?.['blocks__' + index]?.['data-cslp'] ?? null;
  }

  /** Internal links use the router; external ones a plain href. */
  isInternal(url: string | undefined): boolean {
    return !!url && url.startsWith('/');
  }
}
