// 3600초 기반 초단위 분산 모니터링 Edge Function
// 매초마다 특정 절대 초에 해당하는 친구들만 처리 (0~3599)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Supabase 클라이언트 생성 (서비스 롤 사용)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 요청에서 절대 초 정보 가져오기 (없으면 현재 절대 초 사용)
    const { target_second } = await req.json().catch(() => ({}))
    
    let absoluteSecond: number
    if (target_second !== undefined) {
      absoluteSecond = target_second % 3600
    } else {
      const now = new Date()
      const currentMinute = now.getMinutes()
      const currentSecond = now.getSeconds()
      absoluteSecond = (currentMinute * 60 + currentSecond) % 3600
    }

    console.log(`🕐 3600초 분산 모니터링 시작: ${absoluteSecond}초 (${Math.floor(absoluteSecond/60)}분 ${absoluteSecond%60}초)`)

    // 3600초 분산 모니터링 함수 호출
    const { data: monitoringResult, error: monitoringError } = await supabase.rpc(
      'check_monitoring_alerts_by_second',
      { target_second: absoluteSecond }
    )

    if (monitoringError) {
      console.error('❌ 3600초 모니터링 함수 실행 오류:', monitoringError)
      throw monitoringError
    }

    console.log('✅ 3600초 분산 모니터링 알림 생성 완료:', monitoringResult)

    // FCM 큐 처리
    const { data: queueResult, error: queueError } = await supabase.rpc('process_fcm_queue')
    
    if (queueError) {
      console.error('❌ FCM 큐 처리 오류:', queueError)
      throw queueError
    }

    console.log('📤 FCM 큐 처리 완료')

    // 최근 통계 정보 조회
    const { data: stats } = await supabase
      .from('fcm_notification_queue')
      .select('processed')
      .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString()) // 최근 2분

    const totalProcessed = stats?.filter(s => s.processed).length || 0
    const totalPending = stats?.filter(s => !s.processed).length || 0

    return new Response(
      JSON.stringify({
        success: true,
        absolute_second: absoluteSecond,
        minute: Math.floor(absoluteSecond / 60),
        second: absoluteSecond % 60,
        timestamp: new Date().toISOString(),
        processed_friend_relations: monitoringResult?.processed_friend_relations || 0,
        processing_time_seconds: monitoringResult?.processing_time_seconds || 0,
        total_processed_notifications: totalProcessed,
        total_pending_notifications: totalPending,
        message: `3600초 분산 모니터링 완료 (${Math.floor(absoluteSecond/60)}분 ${absoluteSecond%60}초)`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ 3600초 분산 모니터링 오류:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        absolute_second: 'unknown'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
배포: 
supabase functions deploy distributed-monitoring

테스트:
curl -X POST https://your-project.supabase.co/functions/v1/distributed-monitoring \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"target_minute": 0}'
*/