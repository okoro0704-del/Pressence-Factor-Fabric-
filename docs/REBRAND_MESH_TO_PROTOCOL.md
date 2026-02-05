# Rebrand: Mesh → Protocol

Global rebrand from **Mesh** to **Protocol** has been applied across the codebase.

## Completed

- **UI text, labels, placeholders**: "Sovereign Mesh" → "Sovereign Protocol", "Mesh Node" → "Protocol Node", loading messages "Connecting to Mesh..." → "Initializing Protocol...", "Reconnecting to Mesh" → "Reconnecting to Protocol", "Articles of the Mesh" → "Articles of the Protocol", "BROADCAST TO MESH" → "BROADCAST TO PROTOCOL", etc.
- **Component & variable naming**: `meshReconnecting` → `protocolReconnecting`, `MyMesh` → `MyProtocol`, `articlesOfTheMesh` / `ARTICLES_OF_THE_MESH` → `articlesOfTheProtocol` / `ARTICLES_OF_THE_PROTOCOL`.
- **Documentation & comments**: Comments and docs updated to Protocol terminology where they referred to the product/brand.
- **Loading states**: "Establishing Secure Connection to Mesh..." → "Initializing Protocol...", "Syncing with Local Mesh..." → "Initializing Protocol...", "Reconnecting to Mesh..." → "Reconnecting to Protocol...".

## Visual branding — manual replacement

**SVG icons or images that contain the word "Mesh"** should be replaced manually:

- Search the repo for SVG files or image assets that include the text "Mesh" (e.g. logos, badges).
- Replace with "Protocol" or updated artwork. No such assets were automatically modified to avoid breaking layout or references.

## Left unchanged (for compatibility)

- **API paths**: e.g. `POST /api/command-center/broadcast-mesh` and `POST /api/mesh/*` are unchanged to avoid breaking clients.
- **Database table names**: e.g. `mesh_peer_advertisements`, `mesh_encrypted_hops` — renaming would require a migration and backend updates; can be done in a follow-up if desired.
- **Backend folder/file names**: `backend/src/mesh/`, `meshSync.ts`, `meshSchema.sql` — same reason; internal comments in those files refer to "Protocol" where it is the brand; technical "mesh network" wording may remain where it describes the network topology.

## Files to check for any remaining "Mesh" brand usage

- `web/` — UI and components (rebrand applied).
- `docs/` — Summary and deployment docs updated.
- `backend/` — Comments and log messages updated; function names like `broadcastToMesh` kept for API compatibility.
