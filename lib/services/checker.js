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
        const sectionsUseFulldata2 = JSON.stringify(sectionsUseFulldata)
        const allUsefulRuleData2 = JSON.stringify(allUsefulRuleData)

        //return AIchecker(allUsefulRuleData2, sectionsUseFulldata2)
        return {
            "matches": [
                {
                    "sectionId": 5,
                    "matchingRuleIds": [
                        "eba16a63-983e-4b3f-849a-c9a197eaca42"
                    ]
                },
                {
                    "sectionId": 20,
                    "matchingRuleIds": [
                        "820c87fd-d0f0-4fb5-8995-3bb1b883d099",
                        "6632dd25-12f6-4230-b1cc-7886bfc9b8a8",
                        "3746e705-a9eb-4ea2-943d-ad566ba8ea03",
                        "e9ba4fbd-9afe-4781-8d7d-7eb413b40cc1"
                    ]
                },
                {
                    "sectionId": 21,
                    "matchingRuleIds": []
                },
                {
                    "sectionId": 41,
                    "matchingRuleIds": [
                        "da261bc1-b961-4509-86c7-ad40f4e6c9f5",
                        "ed2e2df3-f1ac-483d-934b-9a363a68678f",
                        "a165d356-9e14-44c6-8fb4-471850523c07",
                        "c2a1e8e0-7f61-4e53-a7d6-f1d7d65e8935",
                        "c46db258-5039-4809-b4c2-85aa369e4932",
                        "e2f4c401-541f-4a7a-af05-ad0215d09807"
                    ]
                },
                {
                    "sectionId": 42,
                    "matchingRuleIds": [
                        "da261bc1-b961-4509-86c7-ad40f4e6c9f5",
                        "ed2e2df3-f1ac-483d-934b-9a363a68678f",
                        "a165d356-9e14-44c6-8fb4-471850523c07",
                        "c2a1e8e0-7f61-4e53-a7d6-f1d7d65e8935",
                        "c46db258-5039-4809-b4c2-85aa369e4932",
                        "e2f4c401-541f-4a7a-af05-ad0215d09807",
                        "64670539-1631-44cf-8950-66b8789eec11",
                        "e2b9511c-2243-4db6-b8f8-ff5962186013",
                        "b6db9c05-af2a-4bbf-902d-e981fea02e94"
                    ]
                },
                {
                    "sectionId": 43,
                    "matchingRuleIds": [
                        "da261bc1-b961-4509-86c7-ad40f4e6c9f5",
                        "ed2e2df3-f1ac-483d-934b-9a363a68678f",
                        "a165d356-9e14-44c6-8fb4-471850523c07",
                        "c2a1e8e0-7f61-4e53-a7d6-f1d7d65e8935",
                        "c46db258-5039-4809-b4c2-85aa369e4932",
                        "e2f4c401-541f-4a7a-af05-ad0215d09807"
                    ]
                },
                {
                    "sectionId": 44,
                    "matchingRuleIds": [
                        "a165d356-9e14-44c6-8fb4-471850523c07",
                        "c2a1e8e0-7f61-4e53-a7d6-f1d7d65e8935",
                        "e2f4c401-541f-4a7a-af05-ad0215d09807"
                    ]
                }
            ],
            "unmatchedRuleIds": [
                "3c5e3c7e-e436-48ba-a94c-1a41a2297268",
                "8c177fa5-902f-4f81-8935-64308c72733e",
                "2f6a05cf-75b4-4406-be42-d3ce61d0bf07",
                "53fd3be1-ee2f-46e5-b8d8-4b47aee859bc",
                "a281fc55-707c-497b-8da8-dc2ee8ff800e",
                "730b896e-dd4f-4e58-9215-b62004dc39a0",
                "f7c49861-d758-4fb7-aa7e-72e2e42313e5",
                "6c1c751c-3531-4a05-be34-b2d7f3214163",
                "b81847e5-97e6-4fb3-b158-09dc355183d0",
                "055f3da7-5e50-40b6-93d8-576ab67a4817",
                "a0787225-453f-48c5-bb57-e0bdd95d1912",
                "5510095d-b545-4bed-8b2e-8dee815e3764",
                "8ce1958d-5b59-4194-a411-52ef19f5431f",
                "e4f0b0e5-85fa-4cb6-ab0c-d103ae47aa7e",
                "ebb6cd58-6c52-4c4e-a19e-72c144d7868a",
                "5c470d1f-9ff9-4e8f-90a7-facd3a52ed82",
                "c6740746-28f0-4d6c-acbe-df21e734d870",
                "bb98480b-97d4-407f-84c3-0eed04149e95",
                "4d4395f5-2af1-431a-ad48-5aa75f0f4fc4",
                "6a895182-48a1-4058-a2ec-fd7af0a0cb3c",
                "59340f6f-22fd-4694-83b3-1202352d012e",
                "344fada0-9ac2-47df-b69a-ccd42874c95f",
                "4daf7e63-14bb-4953-8b94-eb51683d258f",
                "6962d106-e2d5-4bcd-9c45-00a1d65fb8be",
                "9be18bd4-31b8-474a-8b54-de56d3d1cf32",
                "fbc61dd3-0c04-4437-a780-1734f309f041",
                "d1045f0d-6605-40d0-8e84-0200885be832",
                "cb99d032-91e4-43fb-a2b5-3697b7171f2a",
                "c32894a5-3946-4db5-91f9-e85013a434c2",
                "c2389be6-ef12-4c81-964c-035ade88d9f5",
                "557e47fe-8c9d-41d8-9c3f-ab8ed3df9344"
            ]



            , sections
            , rules
        }
    } catch (err) {
        console.error("Failed to read or parse JSON file:", err);
        return [];
    }
}
