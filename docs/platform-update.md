# ONROAD: Astana platform update

## User workflows

- Public routes: `/home`, `/catalog`, `/planner`. Old `/index.html`, `/cars.html`, `/campaign.html` redirect to the new routes.
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

- Mercedes-Benz S-Class photograph supplied by the project owner, copied unchanged to `public/photos/mercedes-s-class.png`. ONROAD placement is an HTML/SVG overlay, explicitly labelled as a mockup. The user must hold publishing rights to the photograph before commercial use.
- Demonstration 3D asset: Car Concept by Eric Chadwick, Darmstadt Graphics Group GmbH (2024), distributed in Khronos glTF Sample Assets and based on a public-domain model by Unity Fan. Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept . License: CC BY 4.0; see `public/models/LICENSE.md`. Demo is not presented as an individual owner's exact car.
- Viewer: @google/model-viewer, https://modelviewer.dev/examples/annotations/ . Model loading is deferred until requested except for assigned vehicle models. Reduced motion disables rotation and page animations.
- Legal FAQ reference: Kazakhstan Law on Advertising, Article 12, https://adilet.zan.kz/rus/docs/Z030000508_ . Legal pages remain prototype drafts, with operator details and commercial compliance review outstanding.
- Resend's sending-domain restriction: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain . The resend.dev test sender does not support arbitrary new users.

## Scope boundaries

No payment processing, bank transfer, guaranteed earnings or automatic creation of a matching 3D vehicle model. Actual model files must be provided by an administrator with suitable usage rights. Uploaded model coordinates are configured manually. Availability and dates still require campaign approval.

## Dependencies

SMTP uses Nodemailer 10.1.1 or later. The NextAuth optional Nodemailer peer is overridden to the same patched package so npm does not install an older mailer. Authentication uses CredentialsProvider; NextAuth EmailProvider is not enabled. Production runtime is Node 22 (Nodemailer requires Node 20+). Release notes: https://github.com/nodemailer/nodemailer/releases/tag/v10.1.1 .

## Validation performed locally

Production compilation and TypeScript validation (`npm run build`) completed. Both additive migrations were applied to the local `onroad_dev` database. Browser inspection confirmed the supplied Mercedes photo, a rendered and rotatable GLB with selectable hotspots, and KK / EN remaining selected after navigation to the planner. No end-to-end email delivery or cloud deployment has been completed for this update; those require configured sender credentials. No automated test suite was added or run.
