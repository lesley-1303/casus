import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function AIchecker(rules, sections) {
  const prompt = `
    Je bent een expert in financiële verslaggeving. Je krijgt:

    1. Secties van een rapport:
    ${JSON.stringify(sections)}

    2. Regels die van toepassing kunnen zijn:
    ${JSON.stringify(rules)}

    Opdracht:
    - Bepaal per sectie welke regels duidelijk van toepassing zijn.
    - Gebruik zowel tekst als tabellen in de sectie-inhoud.

    BELANGRIJK – verwerking van tabellen:
    - Als een sectie tabellen bevat:
      - Lees de kolomkoppen en rijen.
      - Leid hieruit af welke financiële posten, categorieën en toelichtingen worden gepresenteerd
        (bijvoorbeeld: voorraden, onderhanden werk, voorzieningen, balanswaarden, resultaten).
      - Behandel de tabelinhoud alsof deze volledig uitgeschreven tekst is.
    - Gebruik de betekenis van de tabel, niet alleen de losse woorden.

    BELANGRIJK – terminologie en synoniemen:
    - Beschouw categorieën als gelijkwaardig indien zij inhoudelijk hetzelfde betekenen,
      ook als de benaming niet exact overeenkomt.
    - Indien een regeltekst inhoudelijk voorkomt als rij-, kolom- of categoriebenaming
      in een tabel, geldt dit als een expliciete vermelding.


    Regels:
    - Neem alleen regels op die inhoudelijk duidelijk aansluiten bij de sectie (tekst én tabellen).
    - Verzin geen sectie- of regel-ID’s.
    - Als een sectie geen toepasselijke regels heeft, gebruik een lege array.

    Output:
    Geef het resultaat **uitsluitend als JSON**, exact in dit formaat:

    {
      "matches": [
        {
          "sectionId": <sectie-ID>,
          "matchingRuleIds": [<regel-ID>, ...]
        }
      ],
      "unmatchedRuleIds": [<regel-ID’s die op geen enkele sectie van toepassing zijn>]
    }

    Geef **geen uitleg, geen tekst, geen markdown** — alleen geldige JSON.
    `;

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const result = response.choices[0].message.content;
  return JSON.parse(result);
}