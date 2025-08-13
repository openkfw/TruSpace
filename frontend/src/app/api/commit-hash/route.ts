import { getCommitHash } from "@/lib/getCommitHash";

export async function GET() {
   return new Response(getCommitHash(), { status: 200 });
}
