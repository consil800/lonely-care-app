// Supabase 데이터베이스 관리 클래스
class SupabaseDataManager {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    // 인증 상태 초기화
    async initializeAuth() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            this.currentUser = await this.getUserProfile(session.user.id);
        }

        // 인증 상태 변경 감지
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = await this.getUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
            }
        });
    }

    // 카카오 로그인
    async loginWithKakao(kakaoUserInfo) {
        try {
            // 카카오 사용자 정보로 Supabase 사용자 생성/업데이트
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('kakao_id', kakaoUserInfo.id)
                .single();

            if (existingUser) {
                // 기존 사용자 업데이트
                const { data, error } = await supabase
                    .from('users')
                    .update({
                        name: kakaoUserInfo.properties?.nickname || existingUser.name,
                        profile_pic: kakaoUserInfo.properties?.profile_image || existingUser.profile_pic,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingUser.id)
                    .select()
                    .single();

                if (error) throw error;
                this.currentUser = data;
                await this.updateUserActivity(data.id);
                return data;
            } else {
                // 새 사용자 생성
                const { data, error } = await supabase
                    .from('users')
                    .insert({
                        kakao_id: kakaoUserInfo.id,
                        name: kakaoUserInfo.properties?.nickname || '카카오 사용자',
                        email: kakaoUserInfo.kakao_account?.email || `kakao_${kakaoUserInfo.id}@kakao.com`,
                        phone: '010-0000-0000',
                        address: '주소를 입력해주세요',
                        is_kakao_user: true,
                        profile_pic: kakaoUserInfo.properties?.profile_image
                    })
                    .select()
                    .single();

                if (error) throw error;
                
                // 알림 설정 초기화
                await this.initializeNotificationSettings(data.id);
                
                this.currentUser = data;
                await this.updateUserActivity(data.id);
                return data;
            }
        } catch (error) {
            console.error('카카오 로그인 오류:', error);
            throw error;
        }
    }

    // 사용자 프로필 조회
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('사용자 프로필 조회 오류:', error);
            return null;
        }
    }

    // 사용자 프로필 업데이트
    async updateUserProfile(userId, profileData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    ...profileData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            this.currentUser = data;
            return data;
        } catch (error) {
            console.error('프로필 업데이트 오류:', error);
            throw error;
        }
    }

    // 현재 사용자 정보 새로고침
    async refreshCurrentUser() {
        if (!this.currentUser) return;
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;
            this.currentUser = data;
            return data;
        } catch (error) {
            console.error('사용자 정보 새로고침 오류:', error);
            throw error;
        }
    }

    // 사용자 활동 기록
    async updateUserActivity(userId, activityType = 'check_in') {
        try {
            const { error } = await supabase
                .from('user_activities')
                .insert({
                    user_id: userId,
                    activity_type: activityType
                });

            if (error) throw error;
        } catch (error) {
            console.error('활동 기록 오류:', error);
        }
    }

    // 친구 목록 조회
    async getFriends(userId) {
        try {
            const { data, error } = await supabase
                .from('friends')
                .select(`
                    *,
                    friend:friend_id(*)
                `)
                .eq('user_id', userId)
                .eq('status', 'active');

            if (error) throw error;
            return data.map(f => f.friend);
        } catch (error) {
            console.error('친구 목록 조회 오류:', error);
            return [];
        }
    }

    // 친구 추가
    async addFriend(userId, friendEmail) {
        try {
            // 친구 사용자 찾기
            const { data: friendUser, error: findError } = await supabase
                .from('users')
                .select('*')
                .eq('email', friendEmail)
                .single();

            if (findError || !friendUser) {
                throw new Error('해당 이메일로 가입된 사용자가 없습니다.');
            }

            if (friendUser.id === userId) {
                throw new Error('자신을 친구로 추가할 수 없습니다.');
            }

            // 이미 친구인지 확인
            const { data: existing } = await supabase
                .from('friends')
                .select('*')
                .eq('user_id', userId)
                .eq('friend_id', friendUser.id)
                .single();

            if (existing) {
                throw new Error('이미 추가된 친구입니다.');
            }

            // 친구 관계 생성 (양방향)
            const { error } = await supabase
                .from('friends')
                .insert([
                    { user_id: userId, friend_id: friendUser.id },
                    { user_id: friendUser.id, friend_id: userId }
                ]);

            if (error) throw error;
            return friendUser;
        } catch (error) {
            console.error('친구 추가 오류:', error);
            throw error;
        }
    }

    // 친구 삭제
    async removeFriend(userId, friendId) {
        try {
            const { error } = await supabase
                .from('friends')
                .delete()
                .or(`user_id.eq.${userId},user_id.eq.${friendId}`)
                .or(`friend_id.eq.${userId},friend_id.eq.${friendId}`);

            if (error) throw error;
        } catch (error) {
            console.error('친구 삭제 오류:', error);
            throw error;
        }
    }

    // 친구 상태 확인
    async getFriendStatus(friendId) {
        try {
            const { data, error } = await supabase
                .from('user_activities')
                .select('activity_time')
                .eq('user_id', friendId)
                .order('activity_time', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) return 'unknown';

            const lastActivity = new Date(data.activity_time);
            const now = new Date();
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

            if (hoursSinceActivity < 24) return 'active';
            if (hoursSinceActivity < 48) return 'warning';
            if (hoursSinceActivity < 72) return 'danger';
            return 'critical';
        } catch (error) {
            console.error('친구 상태 확인 오류:', error);
            return 'unknown';
        }
    }

    // 알림 생성
    async createNotification(userId, friendId, type, message) {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    friend_id: friendId,
                    type: type,
                    message: message
                });

            if (error) throw error;
        } catch (error) {
            console.error('알림 생성 오류:', error);
        }
    }

    // 알림 조회
    async getNotifications(userId, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    friend:friend_id(name)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('알림 조회 오류:', error);
            return [];
        }
    }

    // 알림 설정 초기화
    async initializeNotificationSettings(userId) {
        try {
            const { error } = await supabase
                .from('notification_settings')
                .insert({
                    user_id: userId
                });

            if (error && error.code !== '23505') throw error; // 중복 오류 무시
        } catch (error) {
            console.error('알림 설정 초기화 오류:', error);
        }
    }

    // 알림 설정 조회
    async getNotificationSettings(userId) {
        try {
            const { data, error } = await supabase
                .from('notification_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('알림 설정 조회 오류:', error);
            return null;
        }
    }

    // 알림 설정 업데이트
    async updateNotificationSettings(userId, settings) {
        try {
            const { error } = await supabase
                .from('notification_settings')
                .update({
                    ...settings,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (error) throw error;
        } catch (error) {
            console.error('알림 설정 업데이트 오류:', error);
            throw error;
        }
    }

    // 광고 배너 조회
    async getAdBanners(category) {
        try {
            const { data, error } = await supabase
                .from('ad_banners')
                .select('*')
                .eq('category', category)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('광고 배너 조회 오류:', error);
            return [];
        }
    }

    // 광고 클릭 수 증가
    async incrementAdClick(adId) {
        try {
            const { error } = await supabase.rpc('increment_ad_click', { ad_id: adId });
            if (error) throw error;
        } catch (error) {
            console.error('광고 클릭 수 증가 오류:', error);
        }
    }

    // 로그아웃
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            this.currentUser = null;
        } catch (error) {
            console.error('로그아웃 오류:', error);
            throw error;
        }
    }

    // 주기적 상태 확인 및 알림 생성
    async checkAndCreateAlerts() {
        if (!this.currentUser) return;

        try {
            const friends = await this.getFriends(this.currentUser.id);
            
            for (const friend of friends) {
                const status = await this.getFriendStatus(friend.id);
                
                // 최근 알림 확인
                const { data: recentAlert } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .eq('friend_id', friend.id)
                    .eq('type', status)
                    .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
                    .single();

                if (!recentAlert && status !== 'active' && status !== 'unknown') {
                    let message = '';
                    switch (status) {
                        case 'warning':
                            message = `${friend.name}님이 24시간 동안 응답하지 않습니다.`;
                            break;
                        case 'danger':
                            message = `⚠️ ${friend.name}님이 48시간 동안 응답하지 않습니다!`;
                            break;
                        case 'critical':
                            message = `🚨 긴급! ${friend.name}님이 72시간 동안 응답하지 않습니다!`;
                            break;
                    }
                    
                    if (message) {
                        await this.createNotification(this.currentUser.id, friend.id, status, message);
                    }
                }
            }
        } catch (error) {
            console.error('알림 확인 오류:', error);
        }
    }
}

// 전역 인스턴스 생성
const dbManager = new SupabaseDataManager();