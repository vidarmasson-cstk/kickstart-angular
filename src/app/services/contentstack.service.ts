import { Injectable, PLATFORM_ID, PendingTasks, TransferState, inject, makeStateKey } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as contentstack from '@contentstack/delivery-sdk';
import { Region, QueryOperation } from "@contentstack/delivery-sdk"
import { Observable, from, of } from 'rxjs';
import type { Page } from '../../../types'
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { environment } from '../../environments/environment';
import { IStackSdk } from '@contentstack/live-preview-utils';

type Stack = ReturnType<typeof contentstack.default.stack>;

/** Query parameters Live Preview adds to the URL in SSR mode. */
export type LivePreviewParams = Record<string, string | undefined>;

@Injectable({
  providedIn: 'root'
})

export class ContentstackService {
  private readonly stack: Stack;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly transferState = inject(TransferState);
  private readonly pendingTasks = inject(PendingTasks);
  private previewHash = '';

  constructor() {
    const { contentstack: config } = environment;

    this.stack = contentstack.default.stack({
      apiKey: config.apiKey,
      deliveryToken: config.deliveryToken,
      environment: config.environment,
      region: config.region as Region,
      host: config.contentDelivery,
      live_preview: {
        enable: true,
        preview_token: config.previewToken,
        host: config.previewHost
      }
    })

    // Live Preview runs in the browser only. In SSR mode it reloads the page with the preview hash in
    // the URL on every edit, and the server renders the draft (see applyLivePreview).
    if (config.preview && this.isBrowser) {
      ContentstackLivePreview.init({
        ssr: true,
        enable: true,
        mode: "builder",
        stackSdk: (this.stack as Stack).config as IStackSdk,
        stackDetails: {
          apiKey: config.apiKey,
          environment: config.environment,
          branch: 'main'
        },
        clientUrlParams: {
          host: config.applicationHost
        },
        editButton: {
          enable: true,
          exclude: ["outsideLivePreviewPortal"]
        }
      });
    }
  }

  /** Use the draft content Live Preview points at, when the URL carries its parameters. */
  applyLivePreview(params: LivePreviewParams) {
    if (!params['live_preview']) return;
    this.previewHash = params['live_preview'];
    this.stack.livePreviewQuery({
      live_preview: params['live_preview'],
      contentTypeUid: params['content_type_uid'],
      entryUid: params['entry_uid'],
      preview_timestamp: params['preview_timestamp'],
    });
  }

  getEntryByUrl(contentType: string, url: string): Observable<any> {
    const { contentstack: config } = environment;

    return this.cached(`entry:${contentType}:${url}`, () =>
      this.stack
        .contentType(contentType)
        .entry()
        .query()
        .where("url", QueryOperation.EQUALS, url)
        .find<Page>()
        .then((result: any) => {
          const entry = result.entries?.[0] ?? null;
          if (entry && config.preview) {
            contentstack.default.Utils.addEditableTags(entry, contentType, true);
          }

          return entry
        })
    );
  }

  /**
   * Title and URL of every entry of a content type, for navigation. Pages through the results:
   * the Delivery API returns at most 100 entries per request.
   */
  getNavigation(contentType: string): Observable<{ title: string; url: string }[]> {
    const PAGE = 100;
    const fetchAll = async () => {
      const all: { title: string; url: string }[] = [];
      for (let skip = 0; ; skip += PAGE) {
        const result: any = await this.stack
          .contentType(contentType)
          .entry()
          .only(['title', 'url'])
          .includeCount()
          .limit(PAGE)
          .skip(skip)
          .find<{ title: string; url: string }>();
        all.push(...(result.entries ?? []));
        if (!result.entries?.length || all.length >= (result.count ?? 0)) break;
      }
      return all.filter((e) => e.url).sort((a, b) => a.title.localeCompare(b.title));
    };
    return this.cached(`nav:${contentType}`, fetchAll);
  }

  /**
   * Server: fetch, and keep the server render waiting until the data is there; then hand the result to
   * the browser in the page. Browser: use the server's result once (no second request, no flash of
   * "Loading"), and fetch normally after that.
   */
  private cached<T>(name: string, fetcher: () => Promise<T>): Observable<T> {
    const key = makeStateKey<T>(`${name}:${this.previewHash}`);
    if (this.isBrowser && this.transferState.hasKey(key)) {
      const value = this.transferState.get(key, null as T);
      this.transferState.remove(key);
      return of(value);
    }
    const done = this.pendingTasks.add(); // the server render waits for this
    return from(fetcher().then((value) => {
      if (!this.isBrowser) this.transferState.set(key, value);
      return value;
    }).finally(done));
  }
}
