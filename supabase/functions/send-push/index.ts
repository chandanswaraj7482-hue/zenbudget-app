import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleAuth } from 'https://esm.sh/google-auth-library@8.7.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body, tokens } = await req.json()

    if (!title || !body || !tokens || !Array.isArray(tokens)) {
      return new Response(JSON.stringify({ error: 'Missing title, body, or tokens array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Replace this string with the JSON content from serviceAccountKey.json
    // Ideally, store it in Supabase Secrets as FIREBASE_SERVICE_ACCOUNT and parse it:
    // const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')
    
    if (!serviceAccount.project_id) {
        return new Response(JSON.stringify({ error: 'Missing FIREBASE_SERVICE_ACCOUNT secret' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    })

    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    const promises = tokens.map(async (token) => {
      const response = await fetch(fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: { title, body },
            android: {
              notification: { sound: 'default' }
            }
          }
        })
      })
      return response.json()
    })

    const results = await Promise.all(promises)

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
