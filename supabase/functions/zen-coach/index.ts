import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userMessage, financeContext, memory, userName, isRoastMode } = await req.json()

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Missing userMessage' }), { status: 400, headers: corsHeaders })
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY secret' }), { status: 500, headers: corsHeaders })
    }

    // STRICT Domain restriction system prompt
    const systemPrompt = `You are Zen 🌿, the ultra-intelligent, friendly personal finance AI Coach inside ZenBudget.
You are NOT a general-purpose ChatGPT assistant. You only answer questions related to personal finance, budgeting, spending, saving, or ZenBudget features.

CRITICAL RULES:
1. OUT-OF-DOMAIN: If the user asks about coding, history, politics, or general trivia, REFUSE politely. Say "Bro 😅 main ZenBudget ke andar tumhari money, budget aur spending manage karne ke liye hoon. Is type ke general questions main handle nahi karta."
2. LANGUAGE: If user types in Hinglish, reply in natural Hinglish. If English, use English. If Hindi, use Hindi.
3. FINANCIAL CONTEXT: Never invent numbers! Use the Exact Data provided below.
4. PERSONALITY: Be a smart money best friend. Friendly, non-judgmental, concise.

USER'S REAL DATA (Do not invent anything else):
- Name: ${userName || 'Buddy'}
- Income this month: ${financeContext?.totalIncome}
- Expenses this month: ${financeContext?.totalExpense}
- Flexible Money Left: ${financeContext?.remainingFlexible}
- Safe Daily Spending: ${financeContext?.dailySafeSpend}/day
- Top Expense: ${financeContext?.topCategory}
- Roast Mode Enabled: ${isRoastMode ? 'YES! Be slightly sarcastic and jokingly roast their spending if they overspent.' : 'NO. Be highly supportive.'}

Remember to keep answers short. Format:
1. Direct Answer
2. Insight
3. Helpful Action.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }]
      })
    })

    const data = await response.json()
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    return new Response(JSON.stringify({ response: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
