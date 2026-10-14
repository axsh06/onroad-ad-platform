# ONROAD: Astana platform update

## User workflows

- Public routes: `/home`, `/catalog`, `/planner`, `/studio`. Old `/index.html`, `/cars.html`, `/campaign.html` redirect to the new routes.
- Shared RU / KK / EN locale is stored in a SameSite cookie, used by server rendering and synced across browser tabs. Public pages, forms and role dashboards share the setting.
- Astana is the active city. Almaty and Shymkent are marked coming soon. New vehicle submissions are restricted to Astana on the server.
- Owner: account → email verification → `/dashboard/add-car` → PENDING → manual review. NEEDS_INFO and REJECTED applications support additional photos and a reply, returning to PENDING.
- Admin: pending, more information, approved and rejected cars; custom review message; explicit email-send status; retry failed messages. Approval publishes the car through the same API used by catalog, homepage and planner.
- Buyer: own requests, catalog and estimates from actual available placement prices. Interest sharing explicitly tells the buyer that their company name and date become visible to the owner.
- Confirmed placement occupancy is calculated from booking end dates. Expired bookings do not permanently lock a placement; conflicting date ranges are still rejected at confirmation.
- Catalog search and pagination query the database, including the planner’s “Load more” list.
- Placement types for new cars: LEFT_DOOR, RIGHT_DOOR, HOOD, REAR_BODY. Legacy types and bookings remain intact. Windows are excluded from standard placement.
- Admin can upload a self-contained GLB up to 4 MB per car, set hotspots by clicking the model, then save coordinates. Models use the same private storage and access rules as vehicle photos.

## Email activation — required before accepting new registrations

Choose a transactional provider or SMTP mailbox. Set `EMAIL_FROM` and either `RESEND_API_KEY` (verified sending domain required) or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` in Vercel Production environment variables. Redeploy afterwards. Never commit credentials.

New accounts require email verification. Six-digit codes expire after ten minutes and are stored as HMAC hashes. Attempts and sends are rate limited in PostgreSQL. Resending requires the account password. No development backdoor or code echo is available. Existing accounts retain their previous access; the migration does not falsely mark their emails verified.

Registration returns 503 when the email provider is unconfigured. Moderation still saves the decision in the owner's account, recording FAILED when the email cannot be sent. It never reports a failed email as sent. Admin can retry failed messages.

RateBucket records are expiry-tagged; expired rows may be periodically removed by maintenance. Do not expose credentials or verification hashes to clients.

## Assets and sources

- Mercedes-Benz S-Class photograph supplied by the project owner, copied unchanged to `public/photos/mercedes-s-class.png`. This was the previous photo-studio example; the current studio uses the supplied Porsche photographs. The homepage hero uses a generated W223 brand visualization at `public/photos/hero-w223-astana.png`, following the requested original composition. See `docs/design/visual-direction.md` for the exact prompt. The hero is not an interactive W223 model.
- The “Be part of the movement” section uses the owner-approved Range Rover photograph with the ONROAD front-door decal at `public/photos/range-rover-onroad.png`. The image is served through Next.js Image optimization, with responsive CSS framing that keeps the car and door logo visible. It is a brand placement illustration, not a catalog listing.
- Demonstration 3D asset: 2018 BMW M5 (F90) by OUTPISTON, supplied by the project owner, replacing Car Concept. The unchanged GLB embeds CC BY-NC-SA 4.0 attribution; see `public/models/README.md`. It is included for the noncommercial prototype and requires separate permission or replacement before commercial use. Homepage markers follow the actual front door, hood and rear-window surfaces. The rear-window demonstration does not change existing bookable rear-body slots. Demo is not presented as an individual owner's exact car.
- Viewer: @google/model-viewer, https://modelviewer.dev/examples/annotations/ . Model loading is deferred until requested except for assigned vehicle models. Reduced motion disables rotation and page animations.
- Legal FAQ reference: Kazakhstan Law on Advertising, Article 12, https://adilet.zan.kz/rus/docs/Z030000508_ . Legal pages were rewritten on 14 October 2026 with sections, navigation and RU / KK / EN copy matching implemented workflows. The green prototype banners were removed. The owner authorised publication of onroad.kz@gmail.com for service and data requests; this does not configure outbound email. Full legal operator identity / registration details have not yet been supplied. Kazakhstan data-localisation compliance is unresolved; the privacy page discloses the current foreign infrastructure. The update is not a compliance certification or a change to the noncommercial hosting scope.
- Resend's sending-domain restriction: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain . The resend.dev test sender does not support arbitrary new users.

## Scope boundaries

### Porsche 3D decal studio — 14 October 2026

`/studio` opens the owner-supplied Porsche 911 Carrera 4S in a browser-only
Three.js editor. The four preview areas are left door, right door, hood and rear
window. Decals are projected onto the actual body/glass geometry and clipped to
the selected area. This does not add a rear-window slot to bookable inventory.

Upload PNG, JPEG or WebP (up to 8 MB / 8192 px), with transparent PNG/WebP
recommended. Images are resized locally to at most 1536 px and never uploaded.
Up to 12 decals can be added, selected, moved within their panel, resized,
rotated, faded, deleted, undone or redone. The camera supports orbit, zoom and
zone views. PNG export uses the current camera and includes model attribution.
The source model and CC BY-SA 4.0 attribution are documented in
`public/models/README.md`. UI text supports RU, KK and EN.

The photo editor remains available in the Photo preview tab. Switching
tabs preserves the current session in each editor, but refreshing/leaving the
page clears the 3D design. Download the PNG first. This is a visual mockup;
physical sizing, installation and rear-window suitability require separate
agreement. The approximately 24 MB model loads on opening the studio; a retry
and photo alternative are offered if WebGL or loading is unavailable.

### Porsche photographs — 2D preview

`/studio#photo` opens the 2D editor without loading the 3D model until that tab
is selected. Three supplied photographs were processed with the built-in image
editing tool: scenery removed, transparent alpha retained, clarity enhanced.
Assets and exact prompts: `public/photos/porsche-studio/README.md`.

Side, front and rear views have independent in-memory canvases. The side-door,
hood and rear-window polygons clip decals to their preview surfaces. Up to 12
decals per angle support upload, selection, movement, size, rotation, opacity,
removal and PNG export at 1600 × 1000. The placement guide is omitted from
exports. Transparent PNG/WebP is recommended; JPEG and simple SVG also work.
Files are processed locally, limited to 8 MB. Custom photographs still support
free placement. Switching views or RU/KK/EN keeps the artwork; closing or
refreshing the page clears it. The photos are retouched visual references,
not print templates or verified catalog inventory.

No payment processing, bank transfer, guaranteed earnings or automatic creation of a matching 3D vehicle model. Actual model files must be provided by an administrator with suitable usage rights. Uploaded model coordinates are configured manually. Availability and dates still require campaign approval.

## Dependencies

SMTP uses Nodemailer 10.1.1 or later. The NextAuth optional Nodemailer peer is overridden to the same patched package so npm does not install an older mailer. Authentication uses CredentialsProvider; NextAuth EmailProvider is not enabled. Production runtime is Node 22 (Nodemailer requires Node 20+). Release notes: https://github.com/nodemailer/nodemailer/releases/tag/v10.1.1 .

## Validation performed locally

Production compilation and TypeScript validation (`npm run build`) completed. Both additive migrations were applied to the local `onroad_dev` database. Browser inspection confirmed the supplied Mercedes photo, a rendered and rotatable GLB with selectable hotspots, and KK / EN remaining selected after navigation to the planner. On 14 October 2026, the owner explicitly requested publication before email setup: source commit `5e597c1` reached Vercel Production / Ready and both new migrations were successfully applied to Neon. New registrations remain unavailable with a clear message until the sender is configured. End-to-end email delivery has not been completed. No automated test suite was added or run.
