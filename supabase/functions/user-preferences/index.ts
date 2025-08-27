/**
 * Supabase Edge Function for secure user preferences management
 * Verifies Privy JWT and manages database operations with proper security
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Verify Privy JWT using JWKS
 */
async function verifyPrivyToken(token: string): Promise<any> {
  try {
    // Privy's JWKS endpoint - you'll need to get this from Privy
    // This is a placeholder - replace with actual Privy JWKS URL
    const PRIVY_JWKS_URL = Deno.env.get('PRIVY_JWKS_URL') || 'https://auth.privy.io/.well-known/jwks.json'
    
    // Fetch JWKS
    const JWKS = jose.createRemoteJWKSet(new URL(PRIVY_JWKS_URL))
    
    // Verify the JWT
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: Deno.env.get('PRIVY_ISSUER') || 'https://auth.privy.io',
      audience: Deno.env.get('PRIVY_APP_ID'), // Your Privy App ID
    })
    
    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    throw new Error('Invalid token')
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify Privy JWT
    const jwtPayload = await verifyPrivyToken(token)
    
    if (!jwtPayload?.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token payload' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = jwtPayload.sub // Privy user ID
    
    // Validate Privy user ID format
    if (!userId.startsWith('did:privy:')) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const action = pathParts[pathParts.length - 1] // Last part of path

    // Handle different actions
    switch (req.method) {
      case 'GET': {
        // Get user preferences
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          throw error
        }

        return new Response(
          JSON.stringify({ data: data || null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'POST':
      case 'PUT': {
        // Update or create preferences
        const body = await req.json()
        
        // Remove any user_id from body to prevent injection
        delete body.user_id
        
        // First, check if record exists
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', userId)
          .single()

        let result
        if (existing) {
          // Update existing record
          result = await supabase
            .from('user_preferences')
            .update({
              ...body,
              user_id: userId,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single()
        } else {
          // Insert new record
          result = await supabase
            .from('user_preferences')
            .insert({
              ...body,
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()
        }

        if (result.error) throw result.error

        return new Response(
          JSON.stringify({ data: result.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PATCH': {
        // Partial update
        const body = await req.json()
        
        // Remove any user_id from body
        delete body.user_id
        
        const { data, error } = await supabase
          .from('user_preferences')
          .update({
            ...body,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        // Delete preferences
        const { error } = await supabase
          .from('user_preferences')
          .delete()
          .eq('user_id', userId)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default: {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: Deno.env.get('DENO_ENV') === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})