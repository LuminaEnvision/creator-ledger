import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, createAdminClient, errorResponse, corsHeaders } from '../_shared/auth.ts'

/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 * 
 * This Edge Function maintains a long-lived connection and polls the database
 * for new notifications, sending them to the client via SSE.
 * 
 * Usage: GET /subscribe-notifications
 * Headers: Authorization: Bearer <token>
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse()
  }

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // Authenticate user - support both Authorization header and token query param
    // (EventSource doesn't support custom headers)
    let walletAddress: string
    
    const url = new URL(req.url)
    const tokenParam = url.searchParams.get('token')
    
    if (tokenParam) {
      // Extract token from query param (for EventSource compatibility)
      const modifiedReq = new Request(req.url, {
        method: req.method,
        headers: {
          ...Object.fromEntries(req.headers.entries()),
          'Authorization': `Bearer ${tokenParam}`
        }
      })
      walletAddress = await authenticateUser(modifiedReq)
    } else {
      // Try normal Authorization header
      walletAddress = await authenticateUser(req)
    }
    
    // Create admin client
    const supabase = createAdminClient()
    
    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let lastNotificationId: string | null = null
        let isActive = true

        // Send initial connection message
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

        // Poll for new notifications every 2 seconds
        const pollInterval = setInterval(async () => {
          if (!isActive) {
            clearInterval(pollInterval)
            return
          }

          try {
            // Fetch new notifications since last check
            let query = supabase
              .from('user_notifications')
              .select('*')
              .eq('wallet_address', walletAddress)
              .order('created_at', { ascending: false })
              .limit(10)

            // If we have a last notification ID, only fetch newer ones
            if (lastNotificationId) {
              query = query.gt('id', lastNotificationId)
            }

            const { data: notifications, error } = await query

            if (error) {
              console.error('Error fetching notifications:', error)
              return
            }

            // Send new notifications
            if (notifications && notifications.length > 0) {
              for (const notification of notifications) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`)
                )
                // Update last notification ID
                if (!lastNotificationId || notification.id > lastNotificationId) {
                  lastNotificationId = notification.id
                }
              }
            }

            // Send heartbeat every 30 seconds to keep connection alive
            const now = Date.now()
            if (!(globalThis as any).lastHeartbeat) {
              (globalThis as any).lastHeartbeat = now
            }
            if (now - (globalThis as any).lastHeartbeat > 30000) {
              controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'))
              ;(globalThis as any).lastHeartbeat = now
            }
          } catch (err) {
            console.error('Error in notification polling:', err)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Polling error' })}\n\n`)
            )
          }
        }, 2000) // Poll every 2 seconds

        // Cleanup on close
        req.signal?.addEventListener('abort', () => {
          isActive = false
          clearInterval(pollInterval)
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error in subscribe-notifications:', error)
    
    // Handle authentication errors
    if (error.message?.includes('UNAUTHORIZED')) {
      return errorResponse(error.message, 403)
    }
    
    return errorResponse(error.message || 'Internal server error', 500)
  }
})

