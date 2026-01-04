import { getAllByRuleType } from '@/lib/services/DataBaseServices/ruleService';
import { getUserIdFromRequest } from '@/lib/services/auth';

export async function GET(req) {
  try {
    getUserIdFromRequest(req); 
    
    const url = new URL(req.url);
    const rule_type_id = url.searchParams.get("rule_type_id");
    if (!rule_type_id) {
      return Response.json({ error: "Missing rule_type_id" }, { status: 400 });
    }

    const ruleTypes = await getAllByRuleType(rule_type_id);
    return Response.json(ruleTypes);

  } catch (error) {
    console.error("Auth error:", error);
    return Response.json(
      { error: error.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
