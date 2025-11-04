import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { getCurrencyCodeForGeography } from '../utils/currency';
import { fileToBase64 } from '../utils/fileUtils';
import type { BusinessData, ContentGenerationParams, CampaignForecast, AssetAnalysisResult, AssetFile, AbTestSuggestion, MarketingAnalysis, GroundedResponse, ProactiveAdvice, BudgetAnalysis, GeneratedImage, PlatformStrategy, Persona, SeoAnalysisResult, CalendarEntry, SeoAudit, CompetitiveSummary, DiscoveredProduct, KnowledgeBase, OptimizationSuggestion, OutreachProspect, PredictedMetrics, ActionItem, Task, AdCreativeVariation, PersonaFeedback, ResonanceReport, WebsiteAnalysisData, DiscoveredLinks, BudgetStrategy } from '../types';
import { Tab } from '../types';
import { generateGroundedContent } from './groundedModelService';

// FIX: Per coding guidelines, initialize GoogleGenAI directly with process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A robust, multi-stage cleaner for AI-generated text that is expected to be JSON.
 * It handles markdown fences and extraneous text around the JSON object.
 * @param rawText The raw string from the AI model.
 * @returns The parsed JSON object.
 */
const cleanAndParseJson = (rawText: string): any => {
    if (typeof rawText !== 'string') {
        console.error("cleanAndParseJson received a non-string value:", rawText);
        throw new Error("The AI returned a response with an invalid data type.");
    }

    // Stage 0: Remove non-printable characters except for common whitespace like tabs, newlines.
    // This helps sanitize the string from invisible characters that can break JSON.parse.
    let text = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    
    // Stage 1: Try to extract from markdown fences.
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        text = markdownMatch[1].trim();
    }

    // Stage 2: If it's still not valid JSON, find the first '{' or '[' and last '}' or ']'.
    // This is a more aggressive cleanup for cases where the AI adds conversational text.
    if (!text.startsWith('{') && !text.startsWith('[')) {
        const firstBracket = text.indexOf('{');
        const firstSquare = text.indexOf('[');

        let start = -1;
        if (firstBracket === -1) start = firstSquare;
        else if (firstSquare === -1) start = firstBracket;
        else start = Math.min(firstBracket, firstSquare);

        if (start !== -1) {
            const endChar = text[start] === '{' ? '}' : ']';
            const end = text.lastIndexOf(endChar);
            if (end > start) {
                text = text.substring(start, end + 1);
            }
        }
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("Failed to parse JSON after aggressive cleaning:", text);
        throw new Error("The AI returned a response that could not be parsed as JSON.");
    }
};


async function apiCallWithRetry<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  let delay = 1000; // start with 1 second

  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      attempt++;
      if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.toLowerCase().includes('rate limit'))) {
        if (attempt >= maxRetries) {
          console.error(`API call failed after ${maxRetries} attempts with rate limit error.`, error);
          throw new Error("Yugn AI is currently busy. Please wait a moment and try again.");
        }
        console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error("API call failed after multiple retries.");
}

export const classifyChatIntent = async (message: string): Promise<'question' | 'feedback'> => {
    const prompt = `
        You are an intent classification AI. Classify the user's message as either a 'question' or 'feedback'.

        - 'question': The user is asking for information, a definition, or an explanation (e.g., "What is ROAS?", "Explain brand archetypes").
        - 'feedback': The user is giving a command or a suggestion to change the marketing strategy (e.g., "Change the target age", "Focus more on Instagram").

        Message: "${message}"

        Respond with only 'question' or 'feedback'.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { temperature: 0 },
        });
        const result = response.text.trim().toLowerCase();
        if (result === 'question' || result === 'feedback') {
            return result as 'question' | 'feedback';
        }
        // Fallback for safety
        const isQuestiony = message.endsWith('?') || ['what', 'who', 'when', 'where', 'why', 'how', 'explain', 'define'].some(kw => message.toLowerCase().startsWith(kw));
        return isQuestiony ? 'question' : 'feedback';
    } catch (error) {
        console.error("Error classifying intent:", error);
        // Default to feedback if classification fails to maintain old behavior
        return 'feedback';
    }
};


export const generatePersonas = async (businessData: BusinessData, knowledgeBase?: string): Promise<Persona[]> => {
    const prompt = `
    You are Yugn AI, a world-class marketing strategist specializing in audience research. Your task is to generate three detailed target personas based on the provided business data.

    ${knowledgeBase ? `
    **Project Brain / Previous Learnings & Conversations:**
    This is a log of previous interactions and learnings for this project. You MUST use this information to better understand the user's preferences and context to generate a more tailored and intelligent response.
    \`\`\`
    ${knowledgeBase}
    \`\`\`
    ` : ''}

    **BUSINESS DATA:**
    \`\`\`json
    ${JSON.stringify(businessData, null, 2)}
    \`\`\`

    **CRITICAL INSTRUCTIONS:**
    1.  **Generate Three Personas:** Create exactly three distinct and detailed personas.
    2.  **Use Google Search (Grounding):** You MUST use the Google Search tool to find data to support your persona creation. This includes demographics, interests, and platform usage.
    3.  **Evidence-Based:** For each persona, provide at least two 'groundingSources'. Each source must have a URL from your web search and a 'justification' explaining how that source validates a specific trait (e.g., demographics, interests) of the persona.
    4.  **Actionable Targeting:** For each persona, provide a detailed 'metaTargeting' object with specific, actionable interests, behaviors, and life events for Meta ad platforms.
    5.  **JSON Output:** Your output must be a single, valid JSON object containing a "targetPersonas" array. Do not include any text or explanations outside of the JSON object.

    **JSON OUTPUT SCHEMA:**
    \`\`\`json
    {
      "targetPersonas": [
        {
          "name": "string (e.g., 'Sustainable Sarah')",
          "age": "string (e.g., '28-35')",
          "demographics": "string[]",
          "psychographics": "string[]",
          "interests": "string[]",
          "painPoints": "string[]",
          "platforms": "string[] (e.g., 'Instagram', 'Pinterest')",
          "metaTargeting": {
            "directInterests": "string[]",
            "indirectInterests": "string[]",
            "behaviors": "string[]",
            "lifeEvents?": "string[]"
          },
          "groundingSources": [
            {
                "url": "string (URL from web search)",
                "justification": "string (How this source validates a persona trait)"
            }
          ]
        }
      ]
    }
    \`\`\`
  `;
    try {
        const response = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        }));
        const result = cleanAndParseJson(response.text);
        return result.targetPersonas;
    } catch (error) {
        console.error("Error generating personas:", error);
        throw new Error("Failed to generate personas. The AI model may be temporarily unavailable.");
    }
};

export const generatePlatformsAndBudget = async (businessData: BusinessData, personas: Persona[], knowledgeBase?: string): Promise<{ platformRecommendations: PlatformStrategy[]; budgetStrategy: BudgetStrategy }> => {
    const currencyCode = getCurrencyCodeForGeography(businessData.geography);
    const prompt = `
    You are Yugn AI, an expert media planner and SEM strategist. Based on the business data and user-approved personas, recommend marketing platforms, a budget split, and a detailed Google Ads keyword strategy.

    ${knowledgeBase ? `
    **Project Brain / Previous Learnings & Conversations:**
    This is a log of previous interactions and learnings for this project. You MUST use this information to better understand the user's preferences and context.
    \`\`\`
    ${knowledgeBase}
    \`\`\`
    ` : ''}

    **BUSINESS DATA:**
    \`\`\`json
    ${JSON.stringify(businessData, null, 2)}
    \`\`\`
    
    **USER-APPROVED TARGET PERSONAS:**
    \`\`\`json
    ${JSON.stringify(personas, null, 2)}
    \`\`\`

    **CRITICAL INSTRUCTIONS:**
    1.  **Platform & Budget:** Recommend 3-5 platforms with priority, justification, and a budget split summing to 100%.
    2.  **Actionable Strategies:** For each platform, provide a 'contentFocus' and an 'adStrategy'.
    3.  **Advanced Google Ads Strategy:** If recommending Google Ads, you MUST generate a sophisticated keyword strategy:
        -   **Use Google Search:** Find high-intent keywords. Specifically analyze Google's "autosuggest" recommendations, "People Also Ask," and "Related searches" for the user's products.
        -   **Group Keywords:** Organize keywords into thematic 'keywordGroups' with a clear 'justification' for each group (e.g., 'High-Intent Purchase', 'Brand Terms').
        -   **Analyze Keywords:** For each keyword, determine its search 'intent' (e.g., 'Transactional') and assign a 'matchType' ('Broad', 'Phrase', 'Exact').
        -   **Negative Keywords:** Suggest a list of 'negativeKeywords' to avoid wasted ad spend.
    4.  **JSON Output:** Your output must be a single, valid JSON object with the specified structure. Do not include any surrounding text.

    **JSON OUTPUT SCHEMA:**
    \`\`\`json
    {
      "platformRecommendations": [
        {
          "platformName": "string",
          "priority": "string ('High' | 'Medium' | 'Low')",
          "justification": "string",
          "contentFocus": "string",
          "adStrategy": "string",
          "suggestedAdFormats": "string[]",
          "keyMetricsToWatch": "string[]",
          "googleAdsKeywords?": {
            "keywordGroups": [
              {
                "theme": "string (e.g., 'High-Intent Purchase Keywords')",
                "justification": "string (Why this group is important for the strategy)",
                "keywords": [
                  {
                    "keyword": "string",
                    "matchType": "string ('Broad' | 'Phrase' | 'Exact')",
                    "intent": "string ('Informational' | 'Commercial' | 'Transactional' | 'Navigational')"
                  }
                ]
              }
            ],
            "negativeKeywords": "string[]"
          }
        }
      ],
      "budgetStrategy": {
        "summary": "string",
        "platformSplits": [
          { "platformName": "string", "percentage": "number (integer)" }
        ]
      }
    }
    \`\`\`
    `;
    try {
        const response = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        }));
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error generating platforms and budget:", error);
        throw new Error("Failed to generate platform recommendations. The AI model may be temporarily unavailable.");
    }
};

export const generateRemainingStrategy = async (businessData: BusinessData, personas: Persona[], platforms: PlatformStrategy[], knowledgeBase?: string): Promise<Omit<MarketingAnalysis, 'targetPersonas' | 'platformRecommendations' | 'budgetStrategy'>> => {
    const currencyCode = getCurrencyCodeForGeography(businessData.geography);
    const prompt = `
    You are Yugn AI, a master marketing strategist. You have already determined the Target Personas and Platform strategy. Now, generate the remaining components of a comprehensive marketing strategy.

    ${knowledgeBase ? `
    **Project Brain / Previous Learnings & Conversations:**
    This is a log of previous interactions and learnings for this project. You MUST use this information to better understand the user's preferences and context to generate a more tailored and intelligent response.
    \`\`\`
    ${knowledgeBase}
    \`\`\`
    ` : ''}

    **BUSINESS DATA:**
    \`\`\`json
    ${JSON.stringify(businessData, null, 2)}
    \`\`\`
    
    **USER-APPROVED TARGET PERSONAS:**
    \`\`\`json
    ${JSON.stringify(personas, null, 2)}
    \`\`\`
    
    **USER-APPROVED PLATFORMS:**
    \`\`\`json
    ${JSON.stringify(platforms, null, 2)}
    \`\`\`

    **CRITICAL INSTRUCTIONS:**
    1.  **Generate All Remaining Modules:** You MUST generate all of the following: 'strategicCore', 'competitorAnalysis', 'contentStrategy', 'kpis', 'adScheduling', 'phasedRollout', 'financialForecast', and 'riskAnalysis'.
    2.  **Advanced Modules are Mandatory:** The 'phasedRollout', 'financialForecast', and 'riskAnalysis' sections are not optional.
    3.  **Use Google Search:** Use search extensively for competitor analysis and to inform the content strategy and risk analysis.
    4.  **Financial Context:** The budget is in ${currencyCode}. All financial forecasts must be in this currency.
    5.  **Optional Modules:**
        - If 'industry' was not provided in the business data, generate an 'industryRecommendation'. Otherwise, omit it.
        - If 'brandVoiceSamples' or 'websiteUrl' are present, generate a 'brandVoiceDna'. Otherwise, omit it.
    6.  **JSON Output:** Your output must be a single, valid JSON object containing ONLY the requested fields. Do NOT include 'targetPersonas', 'platformRecommendations', or 'budgetStrategy' as they are already finalized.

    **JSON OUTPUT SCHEMA (DO NOT include fields that are already approved):**
    \`\`\`json
    {
      "brandVoiceDna?": { "lexicalSophistication": "string", "coreArchetypes": "string[]", "commonPhrases": "string[]", "sentenceStructure": "string" },
      "industryRecommendation?": { "recommendedIndustry": "string", "justification": "string" },
      "strategicCore": { "brandArchetype": "string", "archetypeJustification": "string", "strategicAngle": "string" },
      "competitorAnalysis": [ { "name": "string", "strengths": "string[]", "weaknesses": "string[]", "opportunityForUs": "string" } ],
      "contentStrategy": { "pillars": "string[]", "formats": "string[]", "frequency": "string", "topics": "string[]", "hashtags": "string[]" },
      "kpis": [ { "metric": "string", "description": "string", "target": "string" } ],
      "adScheduling": "string",
      "phasedRollout": [ { "title": "string", "focus": "string", "actionItems": [ { "item": "string", "category": "string" } ] } ],
      "financialForecast": { "summary": "string", "channelForecasts": [ { "platformName": "string", "projectedSpend": "string", "projectedKpis": [ { "metric": "string", "value": "string" } ] } ], "disclaimer": "string" },
      "riskAnalysis": { "risks": [ { "description": "string", "impact": "string" } ], "opportunities": [ { "description": "string", "impact": "string" } ] }
    }
    \`\`\`
    `;
    try {
        const response = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        }));
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error generating final strategy components:", error);
        throw new Error("Failed to generate the final strategy. The AI model may be temporarily unavailable.");
    }
};

export const generateMarketingStrategy = async (businessData: BusinessData, existingStrategy: MarketingAnalysis, feedback: string, knowledgeBase?: string): Promise<MarketingAnalysis> => {
    const prompt = `
        You are Yugn AI, a world-class marketing strategist. You have already generated an initial marketing strategy for a client. The client has provided feedback to refine it.
        Your task is to regenerate the *entire* marketing strategy JSON object, incorporating the user's feedback.

        ${knowledgeBase ? `
        **Project Brain / Previous Learnings & Conversations:**
        This is a log of previous interactions and learnings for this project. You MUST use this information to better understand the user's preferences and context to generate a more tailored and intelligent response.
        \`\`\`
        ${knowledgeBase}
        \`\`\`
        ` : ''}

        **Original Business Data:**
        \`\`\`json
        ${JSON.stringify(businessData, null, 2)}
        \`\`\`

        **Existing Strategy:**
        \`\`\`json
        ${JSON.stringify(existingStrategy, null, 2)}
        \`\`\`

        **User Feedback for Refinement:**
        "${feedback}"

        **CRITICAL INSTRUCTIONS:**
        1.  **Incorporate Feedback:** Directly address the user's feedback in the new strategy. For example, if they ask for influencer marketing, add it to the platform recommendations. If they want a different tone, adjust the content strategy.
        2.  **Maintain Structure:** The output MUST be the complete, valid JSON object for the entire strategy, just like the original. Do not output only the changed parts.
        3.  **Use Search for New Info:** If the feedback requires new information (e.g., "add recommendations for TikTok"), use Google Search to ensure the new recommendations are current and data-driven.
        4.  **No Commentary:** Your output must ONLY be the raw JSON object. Do not include any introductory text, explanations, or markdown formatting.

        **JSON OUTPUT SCHEMA (MUST MATCH EXACTLY):**
         \`\`\`json
        {
          "strategicCore": { "brandArchetype": "string", "archetypeJustification": "string", "strategicAngle": "string" },
          "competitorAnalysis": [ { "name": "string", "strengths": "string[]", "weaknesses": "string[]", "opportunityForUs": "string" } ],
          "targetPersonas": [ { "name": "string", "age": "string", "demographics": "string[]", "psychographics": "string[]", "interests": "string[]", "painPoints": "string[]", "platforms": "string[]", "metaTargeting": { "directInterests": "string[]", "indirectInterests": "string[]", "behaviors": "string[]" }, "groundingSources": [ { "url": "string", "justification": "string" } ] } ],
          "platformRecommendations": [ { "platformName": "string", "priority": "string", "justification": "string", "contentFocus": "string", "adStrategy": "string", "suggestedAdFormats": "string[]", "keyMetricsToWatch": "string[]", "googleAdsKeywords?": { "keywordGroups": [ { "theme": "string", "justification": "string", "keywords": [ { "keyword": "string", "matchType": "string", "intent": "string" } ] } ], "negativeKeywords": "string[]" } } ],
          "contentStrategy": { "pillars": "string[]", "formats": "string[]", "frequency": "string", "topics": "string[]", "hashtags": "string[]" },
          "kpis": [ { "metric": "string", "description": "string", "target": "string" } ],
          "budgetStrategy": { "summary": "string", "platformSplits": [ { "platformName": "string", "percentage": "number" } ] },
          "adScheduling": "string",
          "phasedRollout": [ { "title": "string", "focus": "string", "actionItems": [ { "item": "string", "category": "string" } ] } ],
          "financialForecast": { "summary": "string", "channelForecasts": [ { "platformName": "string", "projectedSpend": "string", "projectedKpis": [ { "metric": "string", "value": "string" } ] } ], "disclaimer": "string" },
          "riskAnalysis": { "risks": [ { "description": "string", "impact": "string" } ], "opportunities": [ { "description": "string", "impact": "string" } ] }
        }
        \`\`\`
    `;

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        }));

        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error refining marketing strategy:", error);
        if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
          throw error;
        }
        throw new Error("Failed to refine the strategy. The AI model may be temporarily unavailable.");
    }
};

export const explainPlatformChoice = async (businessData: BusinessData, platform: PlatformStrategy, personas: Persona[]): Promise<string> => {
  const prompt = `
    You are Yugn AI, a marketing expert. A user wants a deeper explanation for why a specific marketing platform was recommended for their business.
    Your task is to provide a concise, well-reasoned explanation in Markdown format.

    **Business Data:**
    \`\`\`json
    ${JSON.stringify(businessData, null, 2)}
    \`\`\`

    **Recommended Platform:**
    \`\`\`json
    ${JSON.stringify(platform, null, 2)}
    \`\`\`

    **Target Personas:**
    \`\`\`json
    ${JSON.stringify(personas, null, 2)}
    \`\`\`

    **Instructions:**
    1.  **Synthesize:** Connect the business goals, the platform's strengths, and the target personas' habits.
    2.  **Use Search:** Use Google Search to find 1-2 recent statistics or facts that support your reasoning (e.g., "According to a 2024 study, 78% of ${personas[0].name}-like users discover new products on ${platform.platformName}...").
    3.  **Format:** Use Markdown for clarity (bolding, bullet points).
    4.  **Tone:** Be authoritative but easy to understand.
    5.  **Output:** Provide only the explanation text, without any preamble.

    **Example Output Structure:**
    "Recommending **${platform.platformName}** is a strategic decision rooted in three key areas:

    *   **Audience Alignment:** The primary persona, **${personas[0].name}**, is highly active on this platform. [Insert statistic from web search here to support this]. Their interest in [Persona Interest] directly aligns with the content that performs best here.

    *   **Goal-Oriented:** To achieve the main business goal of **'${businessData.businessGoals}'**, ${platform.platformName}'s ad tools are ideal. [Explain a specific feature, e.g., its powerful lookalike audiences or lead generation forms].

    *   **Content Synergy:** The planned content pillars, such as **'${(businessData as any).contentPillars?.[0] || 'your primary content'}'**, resonate well with the platform's visual-first or professional nature."
  `;

  try {
    const response = await generateGroundedContent(prompt);
    return response.text;
  } catch (error) {
    console.error("Error explaining platform choice:", error);
    if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
      throw error;
    }
    throw new Error("Failed to get explanation from Yugn AI.");
  }
};


// ... rest of the file is unchanged ...
// NOTE: I've omitted the rest of the file content for brevity as it's not relevant to the user's request.
// The functions below this point (generatePostContent, analyzeAdCreative, etc.) are not modified.
// This is to keep the response focused and minimal as requested.

export const generatePostContent = async (
    params: ContentGenerationParams, 
    asset: AssetFile | null, 
    businessData?: BusinessData, 
    strategy?: MarketingAnalysis | null,
    feedback?: string,
    knowledgeBase?: string,
): Promise<string> => {
    let imageContext = '';
    if (asset) {
        const base64Image = await fileToBase64(asset.file);
        const analysis = await analyzeAdCreative({ mimeType: asset.file.type, data: base64Image });
        imageContext = `The user has attached an image. My analysis of the image is: "${analysis.feedback}". I should write copy that complements this visual.`;
    }

    const feedbackContext = feedback ? `The user provided feedback on the previous version: "${feedback}". I need to incorporate this feedback to improve the content.` : '';

    const prompt = `
        You are Yugn AI, an expert social media copywriter and marketing strategist. Your task is to generate compelling content based on the user's request and a specific marketing framework.

        **Project Brain (Knowledge Base):**
        ${knowledgeBase || 'No project-wide knowledge base provided.'}
        ---
        **Business Context:**
        ${businessData ? `Name: ${businessData.businessName}\nProducts: ${businessData.products}\nGoals: ${businessData.businessGoals}` : 'No specific business context provided.'}
        ---
        **Strategic Context:**
        ${strategy ? `Target Persona: ${params.personaName || strategy.targetPersonas[0]?.name}\nBrand Archetype: ${strategy.strategicCore?.brandArchetype}\nContent Pillars: ${strategy.contentStrategy?.pillars.join(', ')}` : 'No specific strategic context provided.'}
        ---
        ${imageContext ? `${imageContext}\n---` : ''}
        ${feedbackContext ? `${feedbackContext}\n---` : ''}

        **CRITICAL INSTRUCTIONS: CONTENT FRAMEWORK**
        You MUST generate content based on the **"${params.type}"** template. Adhere strictly to the structure and goal of this framework.

        - If template is **"Ad Copy (Pain-Agitate-Solution)"**:
            1. **Pain:** Identify a core pain point of the target persona from the provided context.
            2. **Agitate:** Elaborate on that pain, highlighting the frustration or negative consequences.
            3. **Solution:** Introduce the product/service as the clear and ideal solution to that pain.

        - If template is **"Ad Copy (AIDA Model)"**:
            1. **Attention:** Start with a bold, attention-grabbing headline or first sentence.
            2. **Interest:** Build interest by connecting with the persona's needs or desires.
            3. **Desire:** Create desire by highlighting the key benefits and unique value proposition.
            4. **Action:** End with a clear and compelling call to action.

        - If template is **"Social Media Post (Feature to Benefit)"**:
            1. Take a key product feature mentioned in the topic or business context.
            2. Clearly translate that feature into a tangible benefit for the customer.
            3. Frame the entire post around that benefit. For example, instead of "Our watch has a solar-powered movement," write "Never worry about changing a battery again. Our watch is powered by light."

        - If template is **"Persona-Targeted Post"**:
            1. Focus exclusively on the persona named: **${params.personaName || (strategy?.targetPersonas[0]?.name) || 'the primary customer'}**.
            2. Use language, address pain points, and mention interests that are specific to them. Be highly targeted and personal.

        - If template is **"Blog Post Intro (Problem/Promise)"**:
            1. **Problem:** Start by clearly stating a problem that the target persona faces.
            2. **Promise:** Promise that this blog post will provide the solution or a clear path to solving it.

        - If template is **"SEO-Optimized Answer"**:
            1. Treat the 'Topic' as a question.
            2. Structure the response as a direct, concise answer to that question, perfect for a search engine "featured snippet".
            3. Start with a direct summary sentence.
            4. Use the provided keywords naturally in the first couple of sentences.

        ---
        **USER REQUEST DETAILS:**
        - **Platform:** ${params.platform}
        - **Topic/Product:** ${params.topic}
        - **Tone of Voice:** ${params.tone}
        - **Keywords:** ${params.keywords}

        **Final Output Rules:**
        1. Generate the content directly based on the instructions.
        2. If it's a social media post, include relevant emojis and hashtags where appropriate.
        3. Do NOT include any preamble like "Here is the post content:". Just provide the raw text output.
    `;

     try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating post content:", error);
         if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
          throw error;
        }
        throw new Error("Failed to generate content. The AI model may be temporarily unavailable.");
    }
};

export const analyzeAdCreative = async (image: { mimeType: string, data: string }): Promise<AssetAnalysisResult> => {
    const prompt = `
      You are a world-class creative director specializing in digital advertising. Analyze the provided image and give it a rating and concise feedback based on established advertising principles.

      **Analysis Criteria:**
      - **Clarity:** Is the subject matter instantly recognizable?
      - **Brand Integration:** Is the branding clear but not intrusive?
      - **Visual Appeal:** Is the composition, lighting, and quality high?
      - **Call-to-Action (CTA) Potential:** Does the image naturally lead to an action?
      - **Distraction:** Are there elements that detract from the main message?

      **Output Format:**
      Your output MUST be a single, valid JSON object with the following structure. Do not add any text before or after the JSON.
      {
        "rating": "string ('Excellent' | 'Good' | 'Needs Improvement')",
        "feedback": "string (A single sentence summarizing the key strength or weakness)"
      }

      **Example:**
      {
        "rating": "Excellent",
        "feedback": "The image has a strong focal point and vibrant colors that grab attention, but the branding could be more prominent."
      }
    `;

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: image }, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        }));
        
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error analyzing ad creative:", error);
         if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
          throw error;
        }
        throw new Error("Failed to analyze creative. The AI model may be temporarily unavailable.");
    }
};

export const generateCreativeImprovementSuggestions = async (image: { mimeType: string, data: string }): Promise<string[]> => {
    const prompt = `
        You are a helpful creative strategist. I have an ad creative that "Needs Improvement" or is just "Good".
        Based on the provided image, give me 2-3 specific, actionable suggestions to make it "Excellent".
        Focus on concrete changes.

        **BAD examples:** "Make it more engaging", "Improve the branding"
        **GOOD examples:** "Crop the image to focus on the person's face", "Increase the color saturation by 15%", "Add a text overlay in the top-left corner with the headline 'Summer Sale'"

        **Output Format:**
        Your output MUST be a single, valid JSON object with the following structure. Do not add any text before or after the JSON.
        {
            "suggestions": "string[]"
        }
    `;
    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: image }, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        }));
        const result = cleanAndParseJson(response.text);
        return result.suggestions;
    } catch (error) {
        console.error("Error generating suggestions:", error);
        throw new Error("Failed to generate improvement ideas.");
    }
};

export const generateImageTags = async (image: { mimeType: string, data: string }): Promise<string[]> => {
    const prompt = `
        Analyze this image and generate 5-7 relevant, specific tags for it to be used in a digital asset management system.
        Focus on objects, concepts, style, and colors.

        **Output Format:**
        Your output MUST be a single, valid JSON object with the following structure. Do not add any text before or after the JSON.
        {
            "tags": "string[]"
        }

        **Example:**
        {
            "tags": ["wristwatch", "close-up", "luxury", "minimalist", "black and white", "product photography"]
        }
    `;
     try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: image }, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        }));
        const result = cleanAndParseJson(response.text);
        return result.tags;
    } catch (error) {
        console.error("Error generating tags:", error);
        throw new Error("Failed to generate image tags.");
    }
}

export const generateAdCopyForAsset = async (
    image: { mimeType: string, data: string },
    strategy: MarketingAnalysis,
    businessData: BusinessData
): Promise<Record<string, { persona: string, copy: string }[]>> => {
    const prompt = `
        You are Yugn AI, an expert creative director and copywriter. Your task is to generate platform-specific ad copy variations for an attached image, tailored to different target personas.

        **Marketing Strategy Context:**
        \`\`\`json
        ${JSON.stringify({
            // FIX: Access businessName and products from the businessData object, not the strategy object.
            businessName: businessData.businessName,
            products: businessData.products,
            strategicCore: strategy.strategicCore,
            targetPersonas: strategy.targetPersonas.map(p => ({ name: p.name, painPoints: p.painPoints })),
            highPriorityPlatforms: strategy.platformRecommendations.filter(p => p.priority === 'High').map(p => p.platformName)
        }, null, 2)}
        \`\`\`

        **Instructions:**
        1.  **Analyze the Image:** First, understand the visual content of the image.
        2.  **Focus on High-Priority Platforms:** Generate copy ONLY for the high-priority platforms listed in the context.
        3.  **Tailor to Personas:** For each platform, create a unique ad copy variation for EACH target persona. The copy should resonate with their specific pain points and motivations.
        4.  **Adhere to Platform Style:** Ensure the copy style is appropriate for the platform (e.g., professional for LinkedIn, visual-first for Instagram).
        5.  **Output Format:** Your output MUST be a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object. The keys of the object should be the platform names.

        **JSON OUTPUT SCHEMA (MUST MATCH EXACTLY):**
        \`\`\`json
        {
          "Platform Name 1": [
            {
              "persona": "Persona Name 1",
              "copy": "string (Ad copy for Persona 1 on Platform 1. Include a headline and body. Use markdown for formatting, like **Headline**\\nBody text...)"
            },
            {
              "persona": "Persona Name 2",
              "copy": "string (Ad copy for Persona 2 on Platform 1)"
            }
          ],
          "Platform Name 2": [
            {
              "persona": "Persona Name 1",
              "copy": "string (Ad copy for Persona 1 on Platform 1)"
            }
          ]
        }
        \`\`\`
    `;

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: image }, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        }));
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error generating ad copy for asset:", error);
        throw new Error("Failed to generate ad copy. The AI model may be busy or the request may have been blocked.");
    }
};


export const generateCampaignOptimizations = async (
    images: { mimeType: string; data: string }[],
    userContext: string,
    feedback?: string
): Promise<OptimizationSuggestion[]> => {
    const parts: any[] = images.map(img => ({ inlineData: img }));
    
    parts.push({
        text: `
        You are an expert digital advertising analyst. I've uploaded one or more screenshots from my ad campaigns.
        Analyze the data in the image(s) and provide specific, actionable optimization suggestions.

        ${userContext ? `**User-provided context:** "${userContext}"` : ''}
        ${feedback ? `**User's follow-up request:** "${feedback}"` : ''}

        **Instructions:**
        1.  Carefully examine all text and numbers in the images.
        2.  Identify both high-performing and low-performing areas.
        3.  Provide 3-5 concrete suggestions. For each, specify the platform, the suggestion, its potential impact, and a clear rationale.
        4.  If multiple platforms are shown, provide suggestions for each where appropriate.
        5.  Use Google Search to provide context if needed, e.g., "The average CTR for this industry is X%, so your Y% is above average."

        **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "optimizations": [
            {
              "platform": "string (e.g., 'Meta Ads', 'Google Ads')",
              "suggestion": "string (The specific action to take)",
              "impact": "string ('High' | 'Medium' | 'Low')",
              "rationale": "string (Why this suggestion is being made, based on the data)"
            }
          ]
        }
        `
    });

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: { 
                tools: [{googleSearch: {}}],
            }
        }));

        const result = cleanAndParseJson(response.text);
        return result.optimizations;

    } catch (error) {
        console.error("Error generating campaign optimizations:", error);
        if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
          throw error;
        }
        throw new Error("Failed to analyze campaign data. The AI may be busy or the image may be unreadable.");
    }
};

export const generateCampaignForecast = async (
    images: { mimeType: string; data: string }[],
    userContext: string
): Promise<CampaignForecast> => {
    const parts: any[] = images.map(img => ({ inlineData: img }));
    parts.push({
        text: `
        You are an expert media buyer and data forecaster. Analyze the provided campaign performance screenshots.
        Based on the historical data, generate a realistic performance forecast for the next 30 days, assuming a similar budget.

        ${userContext ? `**User-provided context:** "${userContext}"` : ''}

        **Instructions:**
        1.  Extract key metrics like CTR, CPC, Conversions, ROAS, etc., for each platform shown.
        2.  Project a likely performance range (e.g., "1.5% - 2.0%") for these key metrics for the next 30 days.
        3.  Provide an overall summary of what to expect.
        4.  Use Google Search to find industry benchmarks to contextualize your forecast.

        **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "forecastSummary": "string (A 1-2 sentence overview of the forecast)",
          "predictedMetrics": [
            {
              "platform": "string (e.g., 'Meta Ads')",
              "predictedCtr": "string (e.g., '1.8% - 2.2%')",
              "predictedCpc": "string (e.g., '$1.50 - $1.75')",
              "predictedConversions": "string (e.g., '45 - 60')",
              "predictedRoas": "string (e.g., '3.8x - 4.5x')"
            }
          ]
        }
      `
    });

     try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: { 
                tools: [{googleSearch: {}}],
            }
        }));

        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error generating campaign forecast:", error);
        if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
          throw error;
        }
        throw new Error("Failed to generate forecast. The AI may be busy or the image may be unreadable.");
    }
};

export const generateAbTestIdeas = async (
    images: { mimeType: string; data: string }[],
    platform: string,
    metrics: PredictedMetrics,
    userContext: string
): Promise<AbTestSuggestion[]> => {
     const parts: any[] = images.map(img => ({ inlineData: img }));
     parts.push({
        text: `
        You are a conversion rate optimization (CRO) specialist. Based on the provided campaign data and future forecast for **${platform}**, generate 2-3 creative A/B test ideas to improve performance.

        **Platform to Focus On:** ${platform}
        **User Context:** "${userContext}"
        **Forecasted Metrics for this platform:**
        \`\`\`json
        ${JSON.stringify(metrics, null, 2)}
        \`\`\`

        **Instructions:**
        1.  Create a clear hypothesis for each test.
        2.  Define what Variant A (Control) and Variant B (Challenger) would be.
        3.  Specify the primary metric to watch to determine a winner.
        4.  The ideas should be creative and directly related to improving the forecasted metrics.

         **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "abTestSuggestions": [
            {
              "hypothesis": "string (e.g., 'A more direct, benefit-focused headline will increase CTR.')",
              "variantA": "string (Control - what is likely being run now)",
              "variantB": "string (Challenger - the new idea to test)",
              "metricToWatch": "string (e.g., 'Click-Through Rate (CTR)')"
            }
          ]
        }
        `
     });

      try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: { 
                responseMimeType: "application/json"
            }
        }));

        const result = cleanAndParseJson(response.text);
        return result.abTestSuggestions;
    } catch (error) {
        console.error("Error generating A/B test ideas:", error);
        throw new Error("Failed to generate A/B test ideas.");
    }
};

export const getLatestGoogleUpdates = async (): Promise<GroundedResponse> => {
    return generateGroundedContent("What are the latest major Google Search algorithm updates or news for SEO professionals in the last 3 months? Summarize the top 2-3 most important ones.");
};

export const generateProactiveAdvice = async (businessData: BusinessData, strategy: MarketingAnalysis): Promise<ProactiveAdvice[]> => {
    const prompt = `
        You are Yugn AI, an expert marketing advisor. You have access to a client's business data and their current marketing strategy.
        Your task is to proactively scan for potential risks, missed opportunities, or strategic misalignments.
        Provide 2-4 high-impact pieces of advice.

        **Business Data:**
        \`\`\`json
        ${JSON.stringify(businessData, null, 2)}
        \`\`\`

        **Current Strategy:**
        \`\`\`json
        ${JSON.stringify(strategy, null, 2)}
        \`\`\`

        **Instructions:**
        1.  Critically evaluate the alignment between the business goals, target personas, and platform recommendations.
        2.  Identify potential blind spots. For example, is a major competitor ignored? Is a key platform missing? Is the content strategy too generic for the persona?
        3.  Use Google Search to find recent trends or data that might impact this strategy. For example, "Is LinkedIn's organic reach declining in 2024?" or "Best marketing channels for B2B SaaS".
        4.  Frame your output as an "observation" and a "recommendation".
        5.  Relate each piece of advice to a specific area of the app (e.g., 'strategy', 'content', 'campaigns', 'seo').

        **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "advice": [
            {
              "observation": "string (A concise description of the issue or opportunity)",
              "recommendation": "string (A specific, actionable recommendation to address the observation)",
              "impact": "string ('High' | 'Medium' | 'Low')",
              "area": "string ('strategy' | 'content' | 'campaigns' | 'seo')"
            }
          ]
        }
    `;
    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
            }
        }));

        const result = cleanAndParseJson(response.text);
        return result.advice;
    } catch (error) {
        console.error("Error generating proactive advice:", error);
        throw new Error("Failed to generate proactive advice.");
    }
}

export const analyzeBudgetAppropriateness = async (
    data: { budget: string; industry: string; goal: string; geography: string; currencyCode: string; companySize: string },
    currentFeedback: BudgetAnalysis | null
): Promise<BudgetAnalysis> => {

    const lastFeedback = currentFeedback ? `The last feedback I gave was: "${currentFeedback.feedback}". The user may have adjusted the budget since then.` : '';

    const prompt = `
        You are a marketing budget analyst. Based on the provided data, analyze the monthly marketing budget.

        **Data:**
        - Industry: ${data.industry}
        - Primary Goal: ${data.goal}
        - Geographic Focus: ${data.geography}
        - Company Size: ${data.companySize}
        - Budget: ${data.budget} ${data.currencyCode}

        ${lastFeedback}

        **Instructions:**
        1.  Use Google Search to find typical marketing budget ranges (as a % of revenue or absolute numbers) for a company of this size and industry.
        2.  Consider the goal. "Increase Brand Awareness" might require a larger budget than "Improve Customer Retention".
        3.  Consider the geography. A national or international campaign is more expensive than a local one.
        4.  Rate the budget as 'Low', 'Moderate', 'Competitive', or 'High'.
        5.  Provide a single sentence of feedback explaining your rating.
        6.  Suggest a more appropriate budget range.

        **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "rating": "string ('Low' | 'Moderate' | 'Competitive' | 'High')",
          "feedback": "string (A single sentence of feedback)",
          "suggestedBudgetRange": "string (e.g., '8,000 - 12,000 ${data.currencyCode}')"
        }
    `;

    try {
         const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
            }
        }));
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error analyzing budget:", error);
        throw new Error("Failed to analyze budget.");
    }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<GeneratedImage[]> => {
    try {
        const response: GenerateImagesResponse = await apiCallWithRetry(() => ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        }));

        // The API is expected to generate alt text, but we'll create a fallback.
        // FIX: The type from the generateImages response may not include altText.
        // This uses a type assertion to safely access it if it exists at runtime,
        // otherwise it uses the fallback, preventing a compile-time error.
        const generatedImages = response.generatedImages.map(img => ({
            image: img.image,
            altText: (img as { altText?: string }).altText || `AI generated image for prompt: ${prompt.substring(0, 50)}...`,
        }));
        
        return generatedImages;

    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
          throw error;
        }
        throw new Error("Failed to generate image. The AI model may be temporarily unavailable or the prompt may have been blocked.");
    }
};

export const discoverBrandDigitalPresence = async (url: string): Promise<DiscoveredLinks> => {
    const prompt = `
        You are an expert web researcher. Your task is to find the official social media and blog presence for the company associated with the provided website URL.

        **Website to Analyze:** ${url}

        **CRITICAL INSTRUCTIONS:**
        1.  **Use Google Search:** You MUST use the Google Search tool to find the official links. Use queries like "'[Brand Name]' official blog", "'[Brand Name]' LinkedIn page", etc.
        2.  **Verify Links:** Ensure the links you find are official by cross-referencing them from the main website if possible.
        3.  **Return Specific Links:** Find the primary, official links for the following platforms: Blog, LinkedIn, Instagram, and Twitter/X.
        4.  **JSON Output:** Your output MUST be a single, valid JSON object with no surrounding text or markdown. Use the specified keys. If a link for a specific platform is not found, return an empty string for its value.

        **JSON OUTPUT SCHEMA:**
        {
          "blog": "string (The URL to the official blog, or '')",
          "linkedin": "string (The URL to the official LinkedIn page, or '')",
          "instagram": "string (The URL to the official Instagram profile, or '')",
          "twitter": "string (The URL to the official Twitter/X account, or '')"
        }
    `;

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
            }
        }));
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error discovering brand digital presence:", error);
        throw new Error("Failed to discover social media links. The AI may be busy or the site may be blocking crawlers.");
    }
};

export const discoverProductsFromWebsiteUrl = async (url: string): Promise<DiscoveredProduct[]> => {
    const prompt = `
        You are an expert e-commerce and website analyst. Your task is to thoroughly analyze the provided website URL and identify all of its main products or services.

        **Website to Analyze:** ${url}

        **CRITICAL INSTRUCTIONS:**
        1.  **Comprehensive Discovery:** Your goal is to be as comprehensive as possible. Use the search tool to look for navigation links like "Products," "Shop," "Services," "Pricing," or "Solutions" to find product listing pages.
        2.  **Extract All Main Offerings:** Identify the primary products or services offered. Extract as many as you can find, up to a maximum of 10 distinct offerings to maintain focus.
        3.  **Focus on Offerings:** Concentrate on tangible products or clearly defined service offerings. Ignore pages like "About Us," "Contact," "Blog," or career pages.
        4.  **Handle Single Product Pages:** If the URL is a page for a single product, return just that one product.
        5.  **Empty Result:** If you genuinely cannot find any clear products or services, return an empty array for the "products" key.

        **Output Format:**
        Your output MUST be a single, valid JSON object with no surrounding text or markdown. The structure must be:
        {
          "products": [
            {
              "name": "string (The name of the product/service)",
              "description": "string (A concise, one-sentence description)"
            }
          ]
        }
    `;

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
            }
        }));
        const result = cleanAndParseJson(response.text);
        return result.products;
    } catch (error) {
        console.error("Error discovering products:", error);
        throw new Error("Failed to analyze the website for products. The site may be inaccessible or heavily reliant on JavaScript.");
    }
};

export const analyzeWebsiteForAnalysisData = async (url: string, verifiedLinks?: Partial<DiscoveredLinks>): Promise<WebsiteAnalysisData> => {
    const hasVerifiedLinks = verifiedLinks && Object.values(verifiedLinks).some(v => v);

    const discoveryAndAnalysisInstructions = hasVerifiedLinks
    ? `
        **1. Analysis Phase:**
        - Analyze the content from the main website (${url}) and the following verified sources you MUST use web search for:
        ${verifiedLinks.blog ? `  - Blog: ${verifiedLinks.blog}\n` : ''}
        ${verifiedLinks.linkedin ? `  - LinkedIn: ${verifiedLinks.linkedin}\n` : ''}
        ${verifiedLinks.instagram ? `  - Instagram: ${verifiedLinks.instagram}\n` : ''}
        ${verifiedLinks.twitter ? `  - Twitter/X: ${verifiedLinks.twitter}\n` : ''}
        - For blogs, read the 2-3 most recent articles. For social media, read the 3-5 most recent posts. Pay close attention to language, formality, topics, and tone.
    `
    : `
        **1. Discovery Phase (Using Google Search Tool):**
        - First, use the Google Search tool to find the brand's official digital presence for the website: ${url}. Search for official blog, LinkedIn, Instagram, and Twitter/X accounts.
        - You MUST verify that these links are the official brand accounts.

        **2. Analysis Phase:**
        - **Website:** Read the 'Home', 'About Us', and main 'Product/Service' pages for the foundational brand message.
        - **Blog/Socials:** Analyze the 2-3 most recent posts/articles on the platforms you discovered.
    `;

    const prompt = `
        You are an expert marketing and brand analyst. Your task is to conduct a brand voice analysis and extract key marketing information to pre-fill a form.

        **CRITICAL INSTRUCTIONS (MULTI-STEP PROCESS):**
        ${discoveryAndAnalysisInstructions}

        **Synthesis Phase:**
        - Synthesize ALL of your findings into a single, cohesive analysis.
        - **Brand Voice Sample:** Draft a representative paragraph (2-3 sentences) that captures the *overall* voice you observed across all platforms.
        - **Suggest Industry:** Based on all content, suggest the most specific and accurate industry category.
        - **Marketing Keywords:** Create a summary of recurring themes, hashtags, and value propositions you observed across all channels.
        - **Platform Nuances:** Briefly note if the voice changes between platforms (e.g., 'More professional on LinkedIn, more playful on Instagram'). If no significant difference, state that the voice is consistent.

        **Output Format:**
        Your output MUST be a single, valid JSON object with no surrounding text or markdown.

        **JSON OUTPUT SCHEMA:**
        {
          "brandVoiceSample": "string (A 2-3 sentence paragraph capturing the brand's overall voice)",
          "suggestedIndustry": "string (e.g., 'HealthTech', 'Fashion & Apparel')",
          "marketingKeywords": "string (A summary of key marketing phrases and themes from all platforms)",
          "platformNuances": "string (A brief note on how the brand's voice varies between platforms, or if it is consistent.)"
        }
    `;

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        }));
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error analyzing website for prefill:", error);
        throw new Error("Failed to analyze the website. The site may be inaccessible or heavily reliant on JavaScript.");
    }
};

export const summarizeDiscoveredProduct = async (product: DiscoveredProduct, businessName: string): Promise<string> => {
    const prompt = `
        You are a marketing copywriter. You are given the name of a product/service and a short description, extracted from a website.
        Your task is to combine this information into a slightly more descriptive, compelling summary (2-3 sentences) suitable for a 'Products/Services' input field in a marketing strategy tool.
        
        **Business Name:** ${businessName}
        **Product Name:** ${product.name}
        **Product Description:** ${product.description}

        **Example:**
        - Input: Business: "Aethel Watches", Product: "The Minimalist", Description: "A classic timepiece with a clean dial."
        - Output: "Aethel Watches offers 'The Minimalist', a classic timepiece with a clean, uncluttered dial. It is designed for modern professionals who appreciate understated elegance and sustainable craftsmanship."

        Output only the raw summary text, with no preamble.
    `;
    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        }));
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing product:", error);
        throw new Error("Failed to generate product summary.");
    }
}

export const summarizeStrategyForKnowledgeBase = async (strategy: MarketingAnalysis): Promise<string> => {
    const prompt = `
        Summarize the key points of the following marketing strategy into a concise, fact-based "Project Brain" entry.
        Extract only the most critical information. Use bullet points.
        - Core Strategy: (Archetype and Angle)
        - Primary Personas: (Names and key characteristics)
        - Top 3 Platforms: (List the high/medium priority platforms)
        - Main Goal: (From the KPIs)
        - Key Content Pillars: (List them)

        **Strategy Document:**
        \`\`\`json
        ${JSON.stringify(strategy, null, 2)}
        \`\`\`

        Output only the summary text. No preamble.
    `;
    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error summarizing strategy:", error);
        throw new Error("Failed to summarize strategy.");
    }
};

export const buildOrchestratedKnowledgeBase = async function*(): AsyncGenerator<{ stage: string; status: 'running' | 'complete'; result?: string }, void, unknown> {
    const documents = [
        {
            name: "Fundamentals Document",
            content: "Core marketing concepts: AIDA, 4Ps, SWOT, SMART goals, Funnel stages (TOFU, MOFU, BOFU)."
        },
        {
            name: "Advanced Strategies Document",
            content: "Advanced topics: Account-Based Marketing (ABM), Flywheel model, Growth loops, Community-led growth, Product-led growth (PLG)."
        },
        {
            name: "Analytics & KPIs Document",
            content: "Key metrics: CAC, LTV, ROAS, CTR, CVR, Churn Rate. Attribution models: First-touch, Last-touch, Linear, Time-decay."
        }
    ];

    let combinedKnowledge = "Core Marketing Knowledge Base:\n\n";

    yield { stage: "Parsing Training Methodology", status: 'running' };
    await sleep(500);
    yield { stage: "Parsing Training Methodology", status: 'complete' };

    for (const doc of documents) {
        yield { stage: `Analyzing ${doc.name}`, status: 'running' };
        await sleep(1000); // Simulate analysis
        combinedKnowledge += `**${doc.name.split(' ')[0]} Section:**\n- ${doc.content}\n\n`;
        yield { stage: `Analyzing ${doc.name}`, status: 'complete' };
    }

    yield { stage: "Synthesizing Knowledge Base", status: 'running' };
    await sleep(800);
    yield { stage: "Synthesizing Knowledge Base", status: 'complete', result: combinedKnowledge.trim() };
};

export const generateContentCalendar = async (strategy: MarketingAnalysis, creativeMessage?: string): Promise<CalendarEntry[]> => {
    const creativeContext = creativeMessage
        ? `\n**Key Creative Focus:** The user has selected a winning ad creative. You MUST generate all content calendar topics to be variations or expansions of this central theme: "${creativeMessage}". This is the core idea to build the entire month's content around.`
        : '';

    const prompt = `
        You are an expert content strategist. Based on the provided marketing strategy, generate a content calendar for the next 30 days.
        ${creativeContext}
        
        **Marketing Strategy:**
        \`\`\`json
        ${JSON.stringify(strategy, null, 2)}
        \`\`\`

        **Instructions:**
        1.  ${creativeMessage ? 'Center ALL topics around the "Key Creative Focus".' : 'Use the Content Strategy (pillars, formats, frequency) as your primary guide.'}
        2.  Create a realistic number of entries based on the specified frequency.
        3.  Distribute the content across the recommended platforms.
        4.  Generate specific, engaging topics for each entry that align with the content pillars and target personas.
        5.  Ensure the \`date\` is in "YYYY-MM-DD" format, starting from tomorrow's date.
        
        **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "calendar": [
            {
              "id": "string (A unique ID, e.g., 'cal-item-1')",
              "date": "string (YYYY-MM-DD)",
              "platform": "string (e.g., 'Instagram')",
              "topic": "string (A specific topic, e.g., 'Behind the Scenes: How our sustainable leather is sourced')",
              "contentType": "string (e.g., 'Carousel Post', 'Blog Post')",
              "status": "To Do"
            }
          ]
        }
    `;

    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        }));
        
        const result = cleanAndParseJson(response.text);

        // Add tomorrow's date to relative date strings
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return result.calendar.map((item: any, index: number) => {
            const entryDate = new Date(tomorrow);
            // Simple logic to spread posts over the month
            entryDate.setDate(tomorrow.getDate() + Math.floor(index * (30 / result.calendar.length)));
            return { ...item, date: entryDate.toISOString().split('T')[0] };
        });

    } catch (error) {
        console.error("Error generating content calendar:", error);
        throw new Error("Failed to generate content calendar.");
    }
};

export const generateOutreachMessages = async (persona: Persona, linkedInUrl: string, businessData: BusinessData): Promise<Omit<OutreachProspect, 'id' | 'linkedInUrl' | 'personaName'>> => {
    const prompt = `
      You are an AI-powered sales development representative (SDR) and an expert in personalized outreach.
      Your task is to analyze a prospect's LinkedIn profile and generate 2-3 hyper-personalized connection request messages or InMails.

      **Your Company's Info:**
      - Name: ${businessData.businessName}
      - Offering: ${businessData.products}

      **Target Persona Profile (Who you think this prospect is):**
      \`\`\`json
      ${JSON.stringify(persona, null, 2)}
      \`\`\`

      **Prospect's LinkedIn URL (Use Google Search on this):**
      ${linkedInUrl}

      **Instructions:**
      1.  **Analyze Profile:** Use Google Search on the provided LinkedIn URL to find the prospect's name, current role, company, and recent activity (posts, comments).
      2.  **Personalize:** For each message, find a *specific*, non-generic "hook" from their profile. This could be a shared connection, a recent post they made, an article they wrote, or their company's recent news.
      3.  **Craft Message:** Write a concise, compelling message that references the hook and connects it to your company's offering in a natural way.
      4.  **Output Format:** Your output MUST be a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

      **JSON OUTPUT SCHEMA:**
      \`\`\`json
      {
          "prospectName": "string (The prospect's full name)",
          "prospectSummary": "string (A one-sentence summary, e.g., 'Director of Marketing at Acme Corp, recently posted about Q3 growth.')",
          "messages": [
              {
                  "hook": "string (The specific piece of information used for personalization)",
                  "message": "string (The personalized outreach message)"
              }
          ]
      }
      \`\`\`
    `;
    // FIX: A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value.
    // Added the API call and return logic.
    try {
        const response: GenerateContentResponse = await apiCallWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        }));
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error generating outreach messages:", error);
        if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
          throw error;
        }
        throw new Error("Failed to generate outreach messages. The AI may be busy or the URL may be inaccessible.");
    }
};

// --- START OF seoService.ts content ---
interface SeoOrchestrationUpdate {
    task: string;
    status: 'running' | 'complete';
    result?: SeoAnalysisResult;
}

export async function* generateOrchestratedSeoAnalysis(url: string, keywords: string, competitors: string): AsyncGenerator<SeoOrchestrationUpdate, void, unknown> {
    const competitorUrls = competitors.split(',').map(c => c.trim()).filter(Boolean);
    const tasks = [`Auditing Your Site: ${url}`];
    competitorUrls.forEach(c => tasks.push(`Auditing Competitor: ${c}`));
    tasks.push("Synthesizing Action Plan & Strategy");

    for (let i = 0; i < tasks.length - 1; i++) {
        yield { task: tasks[i], status: 'running' };
        await sleep(1000 + Math.random() * 2000); // Simulate network/analysis time
        yield { task: tasks[i], status: 'complete' };
    }

    yield { task: tasks[tasks.length - 1], status: 'running' };

    const prompt = `
        You are Yugn AI, a world-class SEO expert. Your task is to perform a comprehensive SEO audit for a given website, analyze its competitors, and provide a strategic action plan.

        **Primary URL to Analyze:** ${url}
        ${keywords ? `**Primary Target Keywords:** ${keywords}` : ''}
        ${competitorUrls.length > 0 ? `**Competitor URLs to Analyze:** ${competitorUrls.join(', ')}` : ''}

        **CRITICAL INSTRUCTIONS:**
        1.  **Use Google Search Extensively:** You MUST use the Google Search tool for all analysis. This includes crawling the URLs, finding technical SEO data (like sitemaps, robots.txt), estimating backlink profiles, and analyzing SERP features for the target keywords.
        2.  **Structured JSON Output:** Your entire output MUST be a single, valid JSON object that strictly adheres to the schema below. Do not include any text or explanations outside of the JSON object.
        3.  **Actionable & Prioritized Plan:** The action plan items must be concrete and specific. Assign a realistic impact ('High', 'Medium', 'Low') and effort ('Easy', 'Medium', 'Hard') to each.
        4.  **Competitive Analysis:** If competitor URLs are provided, you MUST perform an audit for each one and then generate a 'competitiveSummary' comparing the user's site to the aggregate competitor data. If no competitors are provided, omit the 'competitorAnalyses' and 'competitiveSummary' fields.
        5.  **Keyword Intelligence:** If keywords are provided, you MUST generate the 'keywordIntelligence' and 'serpAnalysis' objects. Determine the SERP intent and identify content gaps. If no keywords, omit these fields.
        6.  **Realistic Scoring:** Provide a score (0-100) for each main category (On-Page, Technical, Content, Backlinks) based on your findings.
        7.  **Simulate Failure:** If the provided URL is a non-standard or clearly fake URL like "example.com" or "test.com", you must respond with a JSON object containing only \`{"auditStatus": "Failed", "failureReason": "The provided URL appears to be a placeholder or is inaccessible. Please provide a real, publicly accessible URL for analysis."}\`.

        **JSON OUTPUT SCHEMA:**
        \`\`\`json
        {
          "userSiteAnalysis": {
            "onPage": { "score": "number", "summary": "string", "titleTag": { "status": "string", "details": "string" }, "metaDescription": { "status": "string", "details": "string" }, "headerHierarchy": { "status": "string", "details": "string" }, "imageSeo": { "status": "string", "details": "string" }, "internalLinking": { "status": "string", "details": "string" } },
            "technical": { "score": "number", "summary": "string", "robotsTxt": { "status": "string", "details": "string" }, "sitemap": { "status": "string", "details": "string" }, "coreWebVitals": { "status": "string", "details": "string", "lcp": "string?", "cls": "string?", "inp": "string?" }, "structuredData": { "status": "string", "details": "string" } },
            "content": { "score": "number", "summary": "string" },
            "backlinks": { "score": "number", "summary": "string", "estimatedReferringDomains": "number?", "authorityScore": "string?", "anchorTextThemes": "string[]?", "profileHealthSummary": "string?" },
            "keywordIntelligence?": { "serpIntent": "string?", "serpIntentAnalysis": "string?", "peopleAlsoAsk": "string[]?", "contentGapAnalysis": { "summary": "string", "missingTopics": "string[]" } },
            "serpAnalysis?": { "dominantFeatures": "string[]", "strategicRecommendation": "string" },
            "actionPlan": { "summary": "string", "items": [ { "recommendation": "string", "category": "string", "impact": "string", "effort": "string" } ] }
          },
          "competitorAnalyses?": [ { "url": "string", "onPage": { "score": "number", "summary": "string" }, "technical": { "score": "number", "summary": "string" }, "content": { "score": "number", "summary": "string" }, "backlinks": { "score": "number", "summary": "string" } } ],
          "competitiveSummary?": { "comparison": "string", "opportunities": [ { "opportunity": "string", "description": "string" } ] }
        }
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        const result: SeoAnalysisResult = cleanAndParseJson(response.text);
        
        if (result.userSiteAnalysis?.auditStatus === 'Failed') {
            throw new Error(result.userSiteAnalysis.failureReason || 'The SEO audit failed.');
        }

        yield { task: tasks[tasks.length - 1], status: 'complete', result };

    } catch (error) {
        console.error("Error in SEO orchestration:", error);
        if (error instanceof Error && error.message.startsWith("Yugn AI is currently busy")) {
            throw error;
        }
        throw new Error("Failed to generate SEO analysis. The website may be blocking crawlers or the AI model is temporarily unavailable.");
    }
}

export const performManualSeoAudit = async (htmlContent: string, url: string, keywords: string): Promise<SeoAudit> => {
     const prompt = `
        You are Yugn AI, a world-class SEO expert. You are provided with the raw HTML source code of a webpage. Your task is to perform an SEO audit based SOLELY on this HTML content.

        **URL of the page:** ${url}
        ${keywords ? `**Primary Target Keywords:** ${keywords}` : ''}

        **Instructions:**
        1.  **Analyze HTML Only:** Do not use Google Search or any external tools. Your analysis must come from the provided HTML.
        2.  **Extract Key Elements:** Find and analyze the <title> tag, meta description, <h1> and other header tags, image <img> tags for alt text, and internal links (<a> tags).
        3.  **Infer Technical Details:** Check for a canonical tag, meta robots tag. You cannot check Core Web Vitals, sitemap, or robots.txt from just the HTML, so state that in the details for those checks.
        4.  **Content & Backlinks:** You cannot analyze content quality or backlinks from HTML alone. Provide a score of 0 and state this limitation in the summary.
        5.  **Actionable Plan:** Based on your direct HTML analysis, create a small, targeted action plan.

        **JSON OUTPUT SCHEMA (MUST MATCH EXACTLY):**
         \`\`\`json
        {
            "onPage": { "score": "number", "summary": "string", "titleTag": { "status": "string", "details": "string" }, "metaDescription": { "status": "string", "details": "string" }, "headerHierarchy": { "status": "string", "details": "string" }, "imageSeo": { "status": "string", "details": "string" }, "internalLinking": { "status": "string", "details": "string" } },
            "technical": { "score": "number", "summary": "string", "robotsTxt": { "status": "Not Found", "details": "Cannot be determined from HTML." }, "sitemap": { "status": "Not Found", "details": "Cannot be determined from HTML." }, "coreWebVitals": { "status": "Not Found", "details": "Cannot be determined from HTML." }, "structuredData": { "status": "string", "details": "string" } },
            "content": { "score": 0, "summary": "Content quality and E-E-A-T cannot be assessed from HTML source code alone." },
            "backlinks": { "score": 0, "summary": "Backlink profile cannot be assessed from HTML source code alone." },
            "actionPlan": { "summary": "string", "items": [ { "recommendation": "string", "category": "string", "impact": "string", "effort": "string" } ] }
        }
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Error in manual SEO audit:", error);
        throw new Error("Failed to analyze HTML for SEO audit.");
    }
}

export const generateSeoCopySuggestion = async (
    type: 'title' | 'meta description',
    context: { url: string; keywords: string; currentText: string }
): Promise<string[]> => {
    const prompt = `
        You are an SEO copywriter expert. Generate 3 compelling, SEO-optimized options for a page's ${type}.

        **Page URL:** ${context.url}
        **Target Keywords:** ${context.keywords}
        ${context.currentText !== 'N/A' ? `**Current ${type}:** "${context.currentText}"` : ''}

        **Instructions:**
        1.  Incorporate the primary keywords naturally.
        2.  For titles, keep it under 60 characters.
        3.  For meta descriptions, keep it under 160 characters and include a call-to-action.
        4.  Create options with slightly different angles (e.g., one benefit-focused, one question-based).
        5.  Use Google Search on the URL to understand the page's content and purpose to inform your suggestions.

        **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "suggestions": [
            "string (Option 1)",
            "string (Option 2)",
            "string (Option 3)"
          ]
        }
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        const result = cleanAndParseJson(response.text);
        return result.suggestions;
    } catch (error) {
        console.error("Error generating SEO copy:", error);
        throw new Error("Failed to generate SEO copy suggestions.");
    }
};

export const summarizeSeoAuditForKnowledgeBase = async (analysis: SeoAnalysisResult): Promise<string> => {
    const prompt = `
        Summarize the key findings of the following SEO audit into a concise, fact-based "Project Brain" entry.
        Extract only the most critical information. Use bullet points.
        - Overall SEO Health: (Good, Average, Poor - based on scores)
        - Top 3 High-Impact Recommendations: (List the top 3 from the action plan)
        - Main Content Gaps: (From the keyword intelligence section)
        - Primary Competitive Disadvantage: (From the competitive summary)

        **SEO Audit Document:**
        \`\`\`json
        ${JSON.stringify(analysis, null, 2)}
        \`\`\`

        Output only the summary text. No preamble.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing SEO audit:", error);
        throw new Error("Failed to summarize SEO audit.");
    }
};

interface ResonanceOrchestrationUpdate {
    stage: string;
    status: 'running' | 'complete';
    result?: ResonanceReport;
}

export async function* runResonanceTest(businessData: BusinessData, personas: Persona[], coreMessage?: string): AsyncGenerator<ResonanceOrchestrationUpdate, void, unknown> {
    const stages = [
        "Generating diverse ad creative concepts...",
        `Persona Grounding: Finding real-world data for ${personas[0].name}...`,
        `Simulating feedback from ${personas[0].name}...`,
        ...(personas.length > 1 ? [`Persona Grounding: Finding real-world data for ${personas[1].name}...`, `Simulating feedback from ${personas[1].name}...`] : []),
        "Analyzing results & determining winning creative..."
    ];

    for (let i = 0; i < stages.length - 1; i++) {
        yield { stage: stages[i], status: 'running' };
        await sleep(1500 + Math.random() * 1500); // Simulate network/analysis time
        yield { stage: stages[i], status: 'complete' };
    }
    yield { stage: stages[stages.length - 1], status: 'running' };

    const prompt = `
        You are Yugn AI, an expert in creative strategy and audience psychology. Your task is to conduct an "AI Resonance Test". This involves three steps:
        1.  Generate 3 diverse ad creative variations (headline and body) for a business.
        2.  Simulate feedback for EACH creative from the perspective of EACH provided target persona. This feedback MUST be grounded in real-world data.
        3.  Analyze the feedback to provide a summary and declare a "winning creative".

        **Business Data:**
        \`\`\`json
        ${JSON.stringify(businessData, null, 2)}
        \`\`\`

        **Target Personas:**
        \`\`\`json
        ${JSON.stringify(personas, null, 2)}
        \`\`\`
        
        ${coreMessage ? `**Core Message/CTA:** The user wants the ad creatives to be centered around this specific message: "${coreMessage}". You MUST use this as the foundation for the creatives.` : ''}

        **CRITICAL INSTRUCTIONS:**
        1.  **Diverse Creatives:** The 3 generated creatives must be distinct. For example: one benefit-focused, one pain-point focused, one story-driven. ${coreMessage ? 'All creatives must still incorporate the user-provided core message.' : ''}
        2.  **High-Quality, Evidence-Based Feedback:** For each piece of persona feedback you generate, you MUST use the Google Search tool to find a real-world statistic, study, or article that supports your simulated feedback.
            - **Source Quality:** Prioritize reputable sources such as major market research firms (e.g., Nielsen, Gartner), academic institutions, reputable news outlets (e.g., Reuters, Forbes), or government data portals (e.g., Pew Research Center). AVOID using personal blogs, forums, or unverified sources for statistical claims.
            - **Data Population:** You MUST populate the \`groundingFact\` with a statistic/finding from your web search to provide evidence. If a strong, reputable source cannot be found, you may omit this field.
            - **Relevance:** The feedback should reflect the persona's traits, and the \`groundingFact\` must provide external validation for why that trait is relevant to the ad creative.
        3.  **Persona-Specific Feedback:** The feedback for each creative MUST be unique to each persona, reflecting their specific pain points, values, and psychographics.
        4.  **Unique IDs:** You MUST assign a unique \`id\` to each creative and use that \`creativeId\` in the persona feedback objects to link them.
        5.  **JSON Output:** Your entire output MUST be a single, valid JSON object that strictly adheres to the schema below.

        **JSON OUTPUT SCHEMA:**
        \`\`\`json
        {
          "generatedCreatives": [
            { "id": "string (e.g., 'creative-1')", "theme": "string (e.g., 'Benefit-focused')", "headline": "string", "body": "string" }
          ],
          "personaFeedback": [
            { 
                "creativeId": "string", 
                "personaName": "string", 
                "feedback": "string (1-2 sentences of feedback)", 
                "resonanceScore": "number (1-10)",
                "groundingFact?": "string (A real-world statistic or fact from your web search that justifies this feedback. Omit if no strong source is found.)",
                "groundingUrl?": "string (The direct URL of the source for the groundingFact.)"
            }
          ],
          "analysisSummary": "string (A paragraph explaining which creative won and why, based on the persona feedback)",
          "winningCreativeId": "string (The ID of the creative with the best overall feedback)"
        }
        \`\`\`
    `;

     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        const result: ResonanceReport = cleanAndParseJson(response.text);
        yield { stage: stages[stages.length - 1], status: 'complete', result };
    } catch (error) {
        console.error("Error in Resonance Test:", error);
        throw new Error("Failed to run Resonance Test. The AI model may be temporarily unavailable.");
    }
}

export const generateCreativeVariations = async (creative: AdCreativeVariation): Promise<string[]> => {
    const prompt = `
        You are an expert ad copywriter. A user has a "winning" ad creative and wants more variations of it.
        Based on the provided headline, body, and theme, generate 3-5 new, distinct variations of the ad copy.
        Each variation should be a complete piece of copy (headline and body). Maintain the core message but try different angles.

        **Winning Creative to Vary:**
        - **Theme:** ${creative.theme}
        - **Headline:** ${creative.headline}
        - **Body:** ${creative.body}

        **Instructions:**
        1.  Create 3-5 unique variations.
        2.  Format each variation as a single string, using markdown for the headline (e.g., "**New Headline**\\nNew body copy...").
        3.  Do not repeat the original copy.

        **Output Format:**
        Your output MUST be a single, valid JSON object. Do not add any text before or after the JSON.
        The format should be:
        {
          "variations": [
            "string (Variation 1: **Headline**\\nBody...)",
            "string (Variation 2: **Headline**\\nBody...)"
          ]
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });
        const result = cleanAndParseJson(response.text);
        return result.variations;
    } catch (error) {
        console.error("Error generating creative variations:", error);
        throw new Error("Failed to generate variations.");
    }
};
// --- END OF seoService.ts content ---
