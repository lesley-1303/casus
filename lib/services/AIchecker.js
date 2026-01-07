export async function AIchecker(rules, sections) {
    const prompt = `
    Je bent een expert in financiële verslaggeving. Je krijgt:

    1. Secties van een rapport:
    ${JSON.stringify(sections)}

    2. Regels die van toepassing kunnen zijn:
    ${JSON.stringify(rules)}

    Opdracht:
    - Bepaal voor elke sectie welke regels duidelijk van toepassing zijn op basis van de inhoud.
    - Neem alleen regels op die echt relevant zijn.
    - Geef het resultaat **uitsluitend als JSON** in dit exacte formaat:

    {
      "matches": [
        {
          "sectionId": <sectie-ID>,
          "matchingRuleIds": [<regel-ID>, ...]
        },
        ...
      ],
      "unmatchedRuleIds": [<regel-ID's die niet op een sectie van toepassing zijn>]
    }

    Notities:
    - Zet tabellen indien nodig om in tekst voordat je de regels matcht.
    - Verzin geen nieuwe sectie- of regel-ID's.
    - Als een sectie geen regels heeft, geef dan een lege array voor "matchingRuleIds".
    - **Geef verder geen tekst, alleen de JSON.**
    `;

    return prompt;


    // const response = await client.chat.completions.create({
    //     model: "gpt-5-mini",
    //     messages: [{ role: "user", content: prompt }],
    // });

    // const result = JSON.parse(response.choices[0].message.content);
}