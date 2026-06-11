import { NextResponse } from "next/server";

export { GET } from "@/app/api/artists/[mbid]/concerts/route";

// Alias for build-time route typing compatibility.
// Some tooling/build steps may reference the singular "artist" route.
// The canonical implementation lives in:
//   app/api/artists/[mbid]/concerts/route.ts


