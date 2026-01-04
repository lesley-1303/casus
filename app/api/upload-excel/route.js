import { extractRulesFromExcel, saveRules } from '@/lib/services/ruleExtractService';
import { getUserIdFromRequest } from '@/lib/services/auth';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) return new Response(JSON.stringify({ detail: 'No file uploaded' }), { status: 400 });
    const fileName = file.name || 'unknown.xlsx';

    const buffer = await file.arrayBuffer();
    const rulesJson = await extractRulesFromExcel(Buffer.from(buffer));
    const user_id = getUserIdFromRequest(req);
    const rules = await saveRules(rulesJson, fileName, user_id);

    return new Response(JSON.stringify({ message: 'Rules extracted', sheets: rules }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return Response.json(
      { detail: err.message || 'Extraction failed' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
