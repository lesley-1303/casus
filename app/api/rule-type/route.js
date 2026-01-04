import { getAllByImport } from '@/lib/services/DataBaseServices/ruleTypesServices';
import { getUserIdFromRequest } from '@/lib/services/auth';

export async function GET(req) {
  try {
    getUserIdFromRequest(req); 
    
    const url = new URL(req.url);
    const import_id = url.searchParams.get("import_id");
    if (!import_id) {
      return Response.json({ error: "Missing import_id" }, { status: 400 });
    }

    const ruleTypes = await getAllByImport(import_id);
    return Response.json(ruleTypes);

  } catch (error) {
    console.error("Auth error:", error);
    return Response.json(
      { error: error.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
