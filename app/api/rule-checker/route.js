import { getUserIdFromRequest } from '@/lib/services/auth';
import { checkRules } from '@/lib/services/checker';

export async function POST(req) {
  try {

    await getUserIdFromRequest(req);

    const body = await req.json();
    const { rules, ruleTypeName, path } = body;

    const ruleIds = await checkRules(rules, ruleTypeName, path);

    return new Response(
      JSON.stringify({
        success: true,
        ruleIds,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in rule check:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unauthorized" }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
