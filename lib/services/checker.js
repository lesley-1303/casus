import fs from 'fs/promises';
import { AIchecker } from './AIchecker';

export async function checkRules(rules, ruleTypeName, path) {
    try {
        if (!path) throw new Error("Path is required");

        const fileData = await fs.readFile(path, 'utf-8');
        const jsonData = JSON.parse(fileData);

        function matches(item) {
            if (!item) return false;

            if (item.title && String(item.title).toLowerCase().includes(ruleTypeName.toLowerCase())) {
                return true;
            }

            if (item.content) {
                if (typeof item.content === 'string') {
                    return item.content.toLowerCase().includes(ruleTypeName.toLowerCase());
                }
                if (Array.isArray(item.content)) {
                    return item.content.some(matches);
                }
            }

            if (item.type === "text" && typeof item.text === 'string') {
                return item.text.toLowerCase().includes(ruleTypeName.toLowerCase());
            }

            if (item.type === "table") {
                const headerMatch =
                    Array.isArray(item.headers) &&
                    item.headers.some(h =>
                        typeof h === "string" &&
                        h.trim() !== "" &&
                        h.toLowerCase().includes(ruleTypeName.toLowerCase())
                    );

                const dataMatch =
                    Array.isArray(item.data) &&
                    item.data.some(row =>
                        Array.isArray(row) &&
                        row.some(cell =>
                            typeof cell === "string" &&
                            cell.trim() !== "" &&
                            cell.toLowerCase().includes(ruleTypeName.toLowerCase())
                        )
                    );

                return headerMatch || dataMatch;
            }

            return false;
        }

        const sections = jsonData.content.filter(matches);
        const sectionsUseFulldata = sections.map(s => ({
            id: s.id,
            content: s.content
        }));

        const allUsefulRuleData = rules.map(r => ({
            id: r.id,
            rule: r.rule
        }));

        const matches = await AIchecker(JSON.stringify(allUsefulRuleData), JSON.stringify(sectionsUseFulldata));
        return {
            matches
            , sections
            , rules
        }
    } catch (err) {
        console.error("Failed to read or parse JSON file:", err);
        return [];
    }
}
