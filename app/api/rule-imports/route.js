import { getAllByUser } from '@/lib/services/DataBaseServices/ruleImportService';
import { getUserIdFromRequest } from '@/lib/services/auth';

export async function GET(req) {
  try {
    const user_id = getUserIdFromRequest(req);

    const rule_imports = await getAllByUser(user_id);
    return Response.json(rule_imports);

  } catch (error) {
    console.error("Auth error:", error);

    return Response.json(
      { error: error.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
