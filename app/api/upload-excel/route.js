import { extractRulesFromExcel, saveRules} from '@/lib/services/ruleExtractService';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    const fileName = file.name || 'unknown.xlsx';
    if (!file) return new Response(JSON.stringify({ detail: 'No file uploaded' }), { status: 400 });

    const buffer = await file.arrayBuffer();
    const rulesJson = await extractRulesFromExcel(Buffer.from(buffer));
    const rules = await saveRules(rulesJson);

    return new Response(JSON.stringify({ message: 'Rules extracted', sheets: rules }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ detail: err.message || 'Extraction failed' }), { status: 500 });
  }
}
