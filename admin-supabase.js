// 관리자 Supabase 데이터베이스 관리 클래스
class AdminSupabaseManager {
    constructor() {
        this.client = supabaseAdmin; // 관리자 권한 클라이언트 사용
        this.currentTab = 'all';
        this.currentAdTab = 'insurance';
        this.initializeAdmin();
    }

    async initializeAdmin() {
        await this.loadDashboardStats();
        await this.loadUsers();
        await this.loadAds();
        await this.loadNotifications();
        await this.loadEmergencyContacts();
    }

    // 대시보드 통계 로드
    async loadDashboardStats() {
        try {
            // 총 사용자 수
            const { count: totalUsers } = await this.client
                .from('users')
                .select('*', { count: 'exact', head: true });

            // 오늘 활동 사용자 수
            const today = new Date().toISOString().split('T')[0];
            const { count: activeUsers } = await this.client
                .from('user_activities')
                .select('user_id', { count: 'exact', head: true })
                .gte('activity_time', today);

            // 총 친구 연결 수
            const { count: totalConnections } = await this.client
                .from('friends')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // 미해결 알림 수
            const { count: pendingAlerts } = await this.client
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false);

            // 전체 알림 수
            const { count: totalNotifications } = await this.client
                .from('notifications')
                .select('*', { count: 'exact', head: true });

            // 통계 업데이트
            document.getElementById('total-users').textContent = totalUsers || 0;
            document.getElementById('active-users').textContent = activeUsers || 0;
            document.getElementById('total-connections').textContent = Math.floor((totalConnections || 0) / 2); // 양방향이므로 2로 나눔
            document.getElementById('pending-alerts').textContent = pendingAlerts || 0;
            document.getElementById('total-notifications').textContent = totalNotifications || 0;

        } catch (error) {
            console.error('통계 로드 오류:', error);
        }
    }

    // 사용자 목록 로드
    async loadUsers(filter = 'all') {
        const container = document.getElementById('users-container');
        container.innerHTML = '<div class="loading">사용자 목록을 불러오는 중...</div>';

        try {
            let query = this.client.from('users').select('*');

            // 필터 적용
            if (filter === 'active') {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const { data: activeUserIds } = await this.client
                    .from('user_activities')
                    .select('user_id')
                    .gte('activity_time', yesterday);

                const userIds = activeUserIds?.map(a => a.user_id) || [];
                if (userIds.length === 0) {
                    container.innerHTML = '<div style="text-align: center; color: #666;">활성 사용자가 없습니다.</div>';
                    return;
                }
                query = query.in('id', userIds);
            } else if (filter === 'inactive') {
                // 48시간 이상 비활성 사용자
                const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
                const { data: recentActiveUsers } = await this.client
                    .from('user_activities')
                    .select('user_id')
                    .gte('activity_time', twoDaysAgo);

                const activeUserIds = recentActiveUsers?.map(a => a.user_id) || [];
                if (activeUserIds.length > 0) {
                    query = query.not('id', 'in', `(${activeUserIds.join(',')})`);
                }
            }

            const { data: users, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            if (!users || users.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666;">사용자가 없습니다.</div>';
                return;
            }

            // 각 사용자의 마지막 활동 시간 조회
            const usersWithActivity = await Promise.all(users.map(async (user) => {
                const { data: lastActivity } = await this.client
                    .from('user_activities')
                    .select('activity_time')
                    .eq('user_id', user.id)
                    .order('activity_time', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    ...user,
                    last_activity: lastActivity?.activity_time
                };
            }));

            container.innerHTML = `
                <div style="overflow-x: auto; padding: 0 10px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>이메일</th>
                                <th>전화번호</th>
                                <th>가입일</th>
                                <th>마지막 활동</th>
                                <th>상태</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usersWithActivity.map(user => `
                                <tr>
                                    <td>${user.name}</td>
                                    <td>${user.email}</td>
                                    <td>${user.phone || '-'}</td>
                                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>${user.last_activity ? new Date(user.last_activity).toLocaleString() : '활동 없음'}</td>
                                    <td>
                                        <span class="status-badge ${this.getUserStatusClass(user.last_activity)}">
                                            ${this.getUserStatusText(user.last_activity)}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-small" onclick="adminManager.viewUserDetails('${user.id}')">상세</button>
                                        <button class="btn btn-small btn-danger" onclick="adminManager.deleteUser('${user.id}')">삭제</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('사용자 로드 오류:', error);
            container.innerHTML = '<div class="error">사용자 목록을 불러올 수 없습니다.</div>';
        }
    }

    getUserStatusClass(lastActivity) {
        if (!lastActivity) return 'status-unknown';
        
        const hoursAgo = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 24) return 'status-active';
        if (hoursAgo < 48) return 'status-warning';
        if (hoursAgo < 72) return 'status-danger';
        return 'status-critical';
    }

    getUserStatusText(lastActivity) {
        if (!lastActivity) return '알 수 없음';
        
        const hoursAgo = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 24) return '활성';
        if (hoursAgo < 48) return '주의';
        if (hoursAgo < 72) return '위험';
        return '응급';
    }

    // 사용자 상세 정보 보기
    async viewUserDetails(userId) {
        try {
            const { data: user, error } = await this.client
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // 사용자 친구 목록
            const { data: friends } = await this.client
                .from('friends')
                .select('friend:friend_id(*)')
                .eq('user_id', userId);

            // 최근 알림
            const { data: notifications } = await this.client
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            alert(`사용자 상세 정보:\n\n이름: ${user.name}\n이메일: ${user.email}\n전화번호: ${user.phone || '미등록'}\n주소: ${user.address || '미등록'}\n친구 수: ${friends?.length || 0}명\n최근 알림: ${notifications?.length || 0}건`);

        } catch (error) {
            console.error('사용자 상세 조회 오류:', error);
            alert('사용자 정보를 불러올 수 없습니다.');
        }
    }

    // 사용자 삭제
    async deleteUser(userId) {
        if (!confirm('정말로 이 사용자를 삭제하시겠습니까?\n모든 관련 데이터가 함께 삭제됩니다.')) {
            return;
        }

        try {
            const { error } = await this.client
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            alert('사용자가 삭제되었습니다.');
            await this.loadUsers(this.currentTab);
            await this.loadDashboardStats();

        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            alert('사용자 삭제에 실패했습니다.');
        }
    }

    // 광고 배너 로드
    async loadAds(category = 'insurance') {
        const container = document.getElementById('ads-container');
        container.innerHTML = '<div class="loading">광고 목록을 불러오는 중...</div>';

        try {
            const { data: ads, error } = await this.client
                .from('ad_banners')
                .select('*')
                .eq('category', category)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!ads || ads.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666;">등록된 광고가 없습니다.</div>';
                return;
            }

            container.innerHTML = `
                <div style="overflow-x: auto; padding: 0 10px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>제목</th>
                                <th>내용</th>
                                <th>클릭 수</th>
                                <th>상태</th>
                                <th>등록일</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ads.map(ad => `
                                <tr>
                                    <td>${ad.title}</td>
                                    <td>${ad.content.length > 50 ? ad.content.substring(0, 50) + '...' : ad.content}</td>
                                    <td>${ad.click_count || 0}</td>
                                    <td>
                                        <span class="status-badge ${ad.is_active ? 'status-active' : 'status-danger'}">
                                            ${ad.is_active ? '활성' : '비활성'}
                                        </span>
                                    </td>
                                    <td>${new Date(ad.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-small" onclick="adminManager.toggleAdStatus('${ad.id}', ${!ad.is_active})">
                                            ${ad.is_active ? '비활성화' : '활성화'}
                                        </button>
                                        <button class="btn btn-small btn-danger" onclick="adminManager.deleteAd('${ad.id}')">삭제</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('광고 로드 오류:', error);
            container.innerHTML = '<div class="error">광고 목록을 불러올 수 없습니다.</div>';
        }
    }

    // 광고 추가
    async addAd() {
        const category = document.getElementById('ad-category').value;
        const title = document.getElementById('ad-title').value;
        const content = document.getElementById('ad-content').value;
        const url = document.getElementById('ad-link').value;

        if (!title || !content) {
            alert('제목과 내용은 필수입니다.');
            return;
        }

        try {
            const { error } = await this.client
                .from('ad_banners')
                .insert({
                    category,
                    title,
                    content,
                    url: url || null,
                    is_active: true
                });

            if (error) throw error;

            // 폼 초기화
            document.getElementById('ad-title').value = '';
            document.getElementById('ad-content').value = '';
            document.getElementById('ad-link').value = '';

            alert('광고가 추가되었습니다.');
            await this.loadAds(this.currentAdTab);

        } catch (error) {
            console.error('광고 추가 오류:', error);
            alert('광고 추가에 실패했습니다.');
        }
    }

    // 광고 상태 토글
    async toggleAdStatus(adId, isActive) {
        try {
            const { error } = await this.client
                .from('ad_banners')
                .update({ is_active: isActive })
                .eq('id', adId);

            if (error) throw error;

            await this.loadAds(this.currentAdTab);

        } catch (error) {
            console.error('광고 상태 변경 오류:', error);
            alert('광고 상태 변경에 실패했습니다.');
        }
    }

    // 광고 삭제
    async deleteAd(adId) {
        if (!confirm('정말로 이 광고를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const { error } = await this.client
                .from('ad_banners')
                .delete()
                .eq('id', adId);

            if (error) throw error;

            alert('광고가 삭제되었습니다.');
            await this.loadAds(this.currentAdTab);

        } catch (error) {
            console.error('광고 삭제 오류:', error);
            alert('광고 삭제에 실패했습니다.');
        }
    }

    // 알림 목록 로드
    async loadNotifications(filter = 'all') {
        const container = document.getElementById('notifications-container');
        container.innerHTML = '<div class="loading">알림 목록을 불러오는 중...</div>';

        try {
            let query = this.client
                .from('notifications')
                .select(`
                    *,
                    user:user_id(name, email),
                    friend:friend_id(name, email)
                `);

            // 필터 적용
            if (filter === 'critical') {
                query = query.eq('type', 'critical');
            } else if (filter === 'recent') {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                query = query.gte('created_at', yesterday);
            }

            const { data: notifications, error } = await query
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (!notifications || notifications.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666;">알림이 없습니다.</div>';
                return;
            }

            container.innerHTML = `
                <div style="overflow-x: auto; padding: 0 10px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>발생시간</th>
                                <th>사용자</th>
                                <th>친구</th>
                                <th>유형</th>
                                <th>메시지</th>
                                <th>상태</th>
                                <th>처리</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${notifications.map(notification => `
                                <tr>
                                    <td>${new Date(notification.created_at).toLocaleString()}</td>
                                    <td>${notification.user?.name || '알 수 없음'}</td>
                                    <td>${notification.friend?.name || '알 수 없음'}</td>
                                    <td>
                                        <span class="status-badge ${this.getNotificationTypeClass(notification.type)}">
                                            ${this.getNotificationTypeText(notification.type)}
                                        </span>
                                    </td>
                                    <td>${notification.message.length > 50 ? notification.message.substring(0, 50) + '...' : notification.message}</td>
                                    <td>
                                        <span class="status-badge ${notification.is_read ? 'status-active' : 'status-warning'}">
                                            ${notification.is_read ? '읽음' : '미읽음'}
                                        </span>
                                    </td>
                                    <td>
                                        ${!notification.is_read ? 
                                            `<button class="btn btn-small" onclick="adminManager.markNotificationRead('${notification.id}')">읽음 처리</button>` : 
                                            '<span style="color: #666;">처리 완료</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('알림 로드 오류:', error);
            container.innerHTML = '<div class="error">알림 목록을 불러올 수 없습니다.</div>';
        }
    }

    getNotificationTypeClass(type) {
        const typeMap = {
            warning: 'status-warning',
            danger: 'status-danger',
            critical: 'status-critical'
        };
        return typeMap[type] || 'status-active';
    }

    getNotificationTypeText(type) {
        const typeMap = {
            warning: '주의',
            danger: '위험',
            critical: '응급'
        };
        return typeMap[type] || '일반';
    }

    // 알림 읽음 처리
    async markNotificationRead(notificationId) {
        try {
            const { error } = await this.client
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            await this.loadNotifications();
            await this.loadDashboardStats();

        } catch (error) {
            console.error('알림 읽음 처리 오류:', error);
            alert('알림 처리에 실패했습니다.');
        }
    }

    // 시스템 알림 발송
    async sendSystemNotification() {
        const message = document.getElementById('system-message').value;
        
        if (!message.trim()) {
            alert('메시지를 입력하세요.');
            return;
        }

        if (!confirm('모든 사용자에게 시스템 알림을 발송하시겠습니까?')) {
            return;
        }

        try {
            // 모든 사용자 조회
            const { data: users } = await this.client
                .from('users')
                .select('id');

            if (!users || users.length === 0) {
                alert('발송할 사용자가 없습니다.');
                return;
            }

            // 각 사용자에게 알림 생성
            const notifications = users.map(user => ({
                user_id: user.id,
                friend_id: null,
                type: 'system',
                message: `[시스템 알림] ${message}`
            }));

            const { error } = await this.client
                .from('notifications')
                .insert(notifications);

            if (error) throw error;

            document.getElementById('system-message').value = '';
            alert(`${users.length}명의 사용자에게 알림을 발송했습니다.`);

        } catch (error) {
            console.error('시스템 알림 발송 오류:', error);
            alert('시스템 알림 발송에 실패했습니다.');
        }
    }

    // 시스템 상태 점검
    async runSystemCheck() {
        const logContainer = document.getElementById('system-log');
        logContainer.innerHTML = '시스템 점검을 시작합니다...\n';

        try {
            // 데이터베이스 연결 확인
            const { data, error } = await this.client.from('users').select('count').limit(1);
            if (error) throw error;

            logContainer.innerHTML += '✅ 데이터베이스 연결: 정상\n';

            // 사용자 수 확인
            const { count: userCount } = await this.client
                .from('users')
                .select('*', { count: 'exact', head: true });

            logContainer.innerHTML += `✅ 총 사용자 수: ${userCount}명\n`;

            // 활성 사용자 확인
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count: activeCount } = await this.client
                .from('user_activities')
                .select('user_id', { count: 'exact', head: true })
                .gte('activity_time', yesterday);

            logContainer.innerHTML += `✅ 24시간 활성 사용자: ${activeCount}명\n`;

            // 미읽은 알림 확인
            const { count: unreadCount } = await this.client
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false);

            logContainer.innerHTML += `⚠️ 미읽은 알림: ${unreadCount}건\n`;

            logContainer.innerHTML += '\n시스템 점검이 완료되었습니다.';

        } catch (error) {
            logContainer.innerHTML += `❌ 오류 발생: ${error.message}\n`;
        }
    }

    // 오래된 데이터 정리
    async cleanupOldData() {
        if (!confirm('30일 이상 된 활동 기록과 읽은 알림을 삭제하시겠습니까?')) {
            return;
        }

        const logContainer = document.getElementById('system-log');
        logContainer.innerHTML = '데이터 정리를 시작합니다...\n';

        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            // 오래된 활동 기록 삭제
            const { error: activityError } = await this.client
                .from('user_activities')
                .delete()
                .lt('activity_time', thirtyDaysAgo);

            if (activityError) throw activityError;

            // 읽은 알림 삭제
            const { error: notificationError } = await this.client
                .from('notifications')
                .delete()
                .eq('is_read', true)
                .lt('created_at', thirtyDaysAgo);

            if (notificationError) throw notificationError;

            logContainer.innerHTML += '✅ 오래된 데이터 정리가 완료되었습니다.\n';

        } catch (error) {
            logContainer.innerHTML += `❌ 오류 발생: ${error.message}\n`;
        }
    }

    // 응급 상황 보고서 생성
    async generateEmergencyReport() {
        const logContainer = document.getElementById('system-log');
        logContainer.innerHTML = '응급 상황 보고서를 생성합니다...\n';

        try {
            // 72시간 이상 무응답 사용자
            const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
            
            const { data: recentActivities } = await this.client
                .from('user_activities')
                .select('user_id')
                .gte('activity_time', threeDaysAgo);

            const activeUserIds = recentActivities?.map(a => a.user_id) || [];
            
            let emergencyQuery = this.client.from('users').select('*');
            if (activeUserIds.length > 0) {
                emergencyQuery = emergencyQuery.not('id', 'in', `(${activeUserIds.join(',')})`);
            }

            const { data: emergencyUsers } = await emergencyQuery;

            logContainer.innerHTML += `⚠️ 72시간 이상 무응답 사용자: ${emergencyUsers?.length || 0}명\n`;

            if (emergencyUsers && emergencyUsers.length > 0) {
                logContainer.innerHTML += '\n응급 상황 사용자 목록:\n';
                emergencyUsers.forEach(user => {
                    logContainer.innerHTML += `- ${user.name} (${user.email})\n`;
                    logContainer.innerHTML += `  전화: ${user.phone || '미등록'}\n`;
                    logContainer.innerHTML += `  주소: ${user.address || '미등록'}\n\n`;
                });
            }

            logContainer.innerHTML += '응급 상황 보고서 생성이 완료되었습니다.';

        } catch (error) {
            logContainer.innerHTML += `❌ 오류 발생: ${error.message}\n`;
        }
    }

    // 비상 연락처 로드
    async loadEmergencyContacts() {
        const container = document.getElementById('emergency-contacts-container');
        container.innerHTML = '<div class="loading">비상 연락처 목록을 불러오는 중...</div>';

        try {
            const { data: contacts, error } = await this.client
                .from('emergency_contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!contacts || contacts.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666;">등록된 비상 연락처가 없습니다.</div>';
                return;
            }

            container.innerHTML = contacts.map(contact => `
                <div class="emergency-item">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; margin-bottom: 5px;">${contact.name}</div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 3px;">📞 ${contact.phone}</div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">🏷️ ${this.getEmergencyTypeText(contact.type)}</div>
                        ${contact.address ? `<div style="font-size: 12px; color: #666;">📍 ${contact.address}</div>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <button class="btn btn-small btn-danger" onclick="adminManager.deleteEmergencyContact('${contact.id}')">삭제</button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('비상 연락처 로드 오류:', error);
            container.innerHTML = '<div class="error">비상 연락처 목록을 불러올 수 없습니다.</div>';
        }
    }

    getEmergencyTypeText(type) {
        const typeMap = {
            fire: '소방서',
            police: '경찰서',
            admin: '행정기관',
            medical: '의료기관',
            other: '기타'
        };
        return typeMap[type] || '기타';
    }

    // 비상 연락처 추가
    async addEmergencyContact() {
        const name = document.getElementById('emergency-name').value;
        const phone = document.getElementById('emergency-phone').value;
        const type = document.getElementById('emergency-type').value;
        const address = document.getElementById('emergency-address').value;

        if (!name || !phone) {
            alert('기관명과 전화번호는 필수입니다.');
            return;
        }

        try {
            const { error } = await this.client
                .from('emergency_contacts')
                .insert({
                    name,
                    phone,
                    type,
                    address: address || null
                });

            if (error) throw error;

            // 폼 초기화
            document.getElementById('emergency-name').value = '';
            document.getElementById('emergency-phone').value = '';
            document.getElementById('emergency-type').value = 'fire';
            document.getElementById('emergency-address').value = '';

            alert('비상 연락처가 추가되었습니다.');
            await this.loadEmergencyContacts();

        } catch (error) {
            console.error('비상 연락처 추가 오류:', error);
            alert('비상 연락처 추가에 실패했습니다.');
        }
    }

    // 비상 연락처 삭제
    async deleteEmergencyContact(contactId) {
        if (!confirm('정말로 이 비상 연락처를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const { error } = await this.client
                .from('emergency_contacts')
                .delete()
                .eq('id', contactId);

            if (error) throw error;

            alert('비상 연락처가 삭제되었습니다.');
            await this.loadEmergencyContacts();

        } catch (error) {
            console.error('비상 연락처 삭제 오류:', error);
            alert('비상 연락처 삭제에 실패했습니다.');
        }
    }

    // 데이터 백업
    async backupData() {
        if (!confirm('모든 데이터를 백업하시겠습니까?\n백업 파일이 다운로드됩니다.')) {
            return;
        }

        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                users: [],
                friends: [],
                notifications: [],
                ad_banners: [],
                emergency_contacts: [],
                user_activities: [],
                notification_settings: []
            };

            // 모든 테이블 데이터 백업
            const tables = ['users', 'friends', 'notifications', 'ad_banners', 'emergency_contacts', 'user_activities', 'notification_settings'];
            
            for (const table of tables) {
                const { data, error } = await this.client
                    .from(table)
                    .select('*');
                
                if (error) {
                    console.warn(`${table} 백업 중 오류:`, error);
                } else {
                    backupData[table] = data || [];
                }
            }

            // JSON 파일로 다운로드
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ansimncare_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`데이터 백업이 완료되었습니다.\n총 ${Object.values(backupData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)}개의 레코드가 백업되었습니다.`);

        } catch (error) {
            console.error('데이터 백업 오류:', error);
            alert('데이터 백업에 실패했습니다.');
        }
    }

    // 데이터 초기화
    async resetData() {
        const confirmText = '정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.\n\n삭제하려면 "DELETE"를 입력하세요:';
        const userInput = prompt(confirmText);
        
        if (userInput !== 'DELETE') {
            alert('작업이 취소되었습니다.');
            return;
        }

        try {
            const tables = ['user_activities', 'notifications', 'friends', 'notification_settings', 'ad_banners', 'emergency_contacts'];
            let deletedCount = 0;

            for (const table of tables) {
                const { error } = await this.client
                    .from(table)
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

                if (error) {
                    console.warn(`${table} 초기화 중 오류:`, error);
                } else {
                    deletedCount++;
                }
            }

            alert(`데이터 초기화가 완료되었습니다.\n${deletedCount}개 테이블의 데이터가 삭제되었습니다.\n\n주의: 사용자(users) 테이블은 보안상 삭제되지 않았습니다.`);
            
            // 대시보드 새로고침
            await this.loadDashboardStats();
            await this.loadUsers();
            await this.loadAds();
            await this.loadNotifications();
            await this.loadEmergencyContacts();

        } catch (error) {
            console.error('데이터 초기화 오류:', error);
            alert('데이터 초기화에 실패했습니다.');
        }
    }

    // 데이터베이스 연결 테스트
    async testDatabaseConnection() {
        try {
            // Supabase 연결 상태 확인
            const { data, error } = await this.client
                .from('users')
                .select('count')
                .limit(1);

            if (error) throw error;

            // 추가 연결 정보 수집
            const { count: userCount } = await this.client
                .from('users')
                .select('*', { count: 'exact', head: true });

            const { count: tableCount } = await this.client
                .from('information_schema.tables')
                .select('*', { count: 'exact', head: true })
                .eq('table_schema', 'public');

            alert(`✅ 데이터베이스 연결 성공!\n\n연결 정보:\n- 호스트: ${this.client.supabaseUrl}\n- 상태: 정상 연결\n- 사용자 수: ${userCount || 0}명\n- 테이블 수: ${tableCount || 0}개\n- 연결 시간: ${new Date().toLocaleString()}`);

        } catch (error) {
            console.error('데이터베이스 연결 테스트 오류:', error);
            alert(`❌ 데이터베이스 연결 실패!\n\n오류 내용:\n${error.message}\n\n연결 설정을 확인해주세요.`);
        }
    }

    // 데이터베이스 마이그레이션
    async migrateToDB() {
        if (!confirm('데이터베이스 마이그레이션을 실행하시겠습니까?\n이 작업은 데이터베이스 구조를 업데이트합니다.')) {
            return;
        }

        try {
            alert('Supabase는 클라우드 데이터베이스이므로 별도의 마이그레이션이 필요하지 않습니다.\n\n현재 연결된 Supabase 데이터베이스가 이미 최신 상태입니다.\n\n필요한 경우 Supabase 대시보드에서 직접 테이블 구조를 수정할 수 있습니다.');

        } catch (error) {
            console.error('마이그레이션 오류:', error);
            alert('마이그레이션에 실패했습니다.');
        }
    }
}

// 전역 관리자 인스턴스
const adminManager = new AdminSupabaseManager();

// 탭 전환 함수들
function showTab(tabName) {
    // 모든 탭 비활성화
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // 선택된 탭 활성화
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // 탭별 데이터 로드
    switch(tabName) {
        case 'users':
            adminManager.loadUsers();
            break;
        case 'notifications':
            adminManager.loadNotifications();
            break;
        case 'ads':
            adminManager.loadAds();
            break;
        case 'system':
            // 시스템 탭은 별도 로드 없음
            break;
    }
}

function showUserTab(filter) {
    // 클릭된 탭의 부모 탭 그룹에서만 active 제거
    const clickedTab = event.target;
    const tabsContainer = clickedTab.closest('.tabs');
    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    
    adminManager.currentTab = filter;
    adminManager.loadUsers(filter);
}

function showAdTab(category) {
    // 클릭된 탭의 부모 탭 그룹에서만 active 제거
    const clickedTab = event.target;
    const tabsContainer = clickedTab.closest('.tabs');
    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    
    adminManager.currentAdTab = category;
    adminManager.loadAds(category);
}

function showNotificationTab(filter) {
    // 클릭된 탭의 부모 탭 그룹에서만 active 제거
    const clickedTab = event.target;
    const tabsContainer = clickedTab.closest('.tabs');
    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    
    adminManager.loadNotifications(filter);
}

// 폼 함수들
function addAdBanner() {
    adminManager.addAd();
}

function addEmergencyContact() {
    adminManager.addEmergencyContact();
}

function sendSystemNotification() {
    adminManager.sendSystemNotification();
}

function runSystemCheck() {
    adminManager.runSystemCheck();
}

function cleanupOldData() {
    adminManager.cleanupOldData();
}

function generateEmergencyReport() {
    adminManager.generateEmergencyReport();
}

function backupData() {
    adminManager.backupData();
}

function resetData() {
    adminManager.resetData();
}

function testDatabaseConnection() {
    adminManager.testDatabaseConnection();
}

function migrateToDB() {
    adminManager.migrateToDB();
}

// 검색 함수
async function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    
    if (!searchTerm.trim()) {
        adminManager.loadUsers(adminManager.currentTab);
        return;
    }

    try {
        const { data: users, error } = await adminManager.client
            .from('users')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('users-container');
        
        if (!users || users.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666;">검색 결과가 없습니다.</div>';
            return;
        }

        // 검색 결과 표시 (loadUsers와 동일한 형식)
        const usersWithActivity = await Promise.all(users.map(async (user) => {
            const { data: lastActivity } = await adminManager.client
                .from('user_activities')
                .select('activity_time')
                .eq('user_id', user.id)
                .order('activity_time', { ascending: false })
                .limit(1)
                .single();

            return {
                ...user,
                last_activity: lastActivity?.activity_time
            };
        }));

        container.innerHTML = `
            <div style="overflow-x: auto; padding: 0 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>이메일</th>
                            <th>전화번호</th>
                            <th>가입일</th>
                            <th>마지막 활동</th>
                            <th>상태</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usersWithActivity.map(user => `
                            <tr>
                                <td>${user.name}</td>
                                <td>${user.email}</td>
                                <td>${user.phone || '-'}</td>
                                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                <td>${user.last_activity ? new Date(user.last_activity).toLocaleString() : '활동 없음'}</td>
                                <td>
                                    <span class="status-badge ${adminManager.getUserStatusClass(user.last_activity)}">
                                        ${adminManager.getUserStatusText(user.last_activity)}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-small" onclick="adminManager.viewUserDetails('${user.id}')">상세</button>
                                    <button class="btn btn-small btn-danger" onclick="adminManager.deleteUser('${user.id}')">삭제</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        console.error('검색 오류:', error);
    }
}