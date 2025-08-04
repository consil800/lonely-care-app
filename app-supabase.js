// 카카오 SDK 초기화
const KAKAO_JS_KEY = 'dd74fd58abbb75eb58df11ecc92d6727';

// 전역 변수
let currentAdTab = 'insurance';

// 앱 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 카카오 SDK 초기화
    if (window.Kakao && !Kakao.isInitialized()) {
        Kakao.init(KAKAO_JS_KEY);
        console.log('카카오 SDK 초기화 완료:', Kakao.isInitialized());
    }
    
    // Supabase 인증 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (session || dbManager.currentUser) {
        // 로그인된 상태
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('bottom-nav').style.display = 'flex';
        showMainPage('friends-page');
    }
    
    // 주기적 상태 확인 (5분마다)
    setInterval(() => {
        if (dbManager.currentUser) {
            dbManager.checkAndCreateAlerts();
        }
    }, 5 * 60 * 1000);
    
    console.log('안심케어 앱이 초기화되었습니다.');
});

// 카카오 로그인 함수
async function loginWithKakao() {
    if (!window.Kakao || !Kakao.isInitialized()) {
        alert('카카오 SDK가 초기화되지 않았습니다. JavaScript 키를 확인해주세요.');
        return;
    }
    
    Kakao.Auth.login({
        throughTalk: false,
        success: function(authObj) {
            console.log('카카오 로그인 성공:', authObj);
            
            // 사용자 정보 요청
            Kakao.API.request({
                url: '/v2/user/me',
                success: async function(response) {
                    console.log('사용자 정보:', response);
                    
                    try {
                        // Supabase에 사용자 정보 저장
                        const user = await dbManager.loginWithKakao(response);
                        
                        // 로그인 후 친구 관리 페이지로 이동
                        document.getElementById('login-page').classList.remove('active');
                        document.getElementById('bottom-nav').style.display = 'flex';
                        showMainPage('friends-page');
                        
                        // 프로필 설정 안내
                        if (user.address === '주소를 입력해주세요') {
                            setTimeout(() => {
                                alert(`${user.name}님, 환영합니다!\n프로필 설정에서 정보를 업데이트해주세요.`);
                            }, 500);
                        }
                    } catch (error) {
                        console.error('DB 저장 오류:', error);
                        alert('로그인 중 오류가 발생했습니다.');
                    }
                },
                fail: function(error) {
                    console.error('사용자 정보 요청 실패:', error);
                    alert('사용자 정보를 가져오는데 실패했습니다.');
                }
            });
        },
        fail: function(err) {
            console.error('카카오 로그인 실패:', err);
            alert('카카오 로그인에 실패했습니다.');
        }
    });
}

// 로그아웃
async function logout() {
    try {
        // 카카오 로그아웃
        if (dbManager.currentUser && dbManager.currentUser.is_kakao_user) {
            if (window.Kakao && Kakao.Auth.getAccessToken()) {
                Kakao.Auth.logout();
            }
        }
        
        // Supabase 로그아웃
        await dbManager.logout();
        
        // 화면 전환
        document.getElementById('bottom-nav').style.display = 'none';
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('login-page').classList.add('active');
    } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// 하단 네비게이션 페이지 전환
function showMainPage(pageId) {
    // 모든 페이지 숨기기
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 선택된 페이지 보이기
    document.getElementById(pageId).classList.add('active');
    
    // 네비게이션 활성화 상태 업데이트
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    // 페이지에 따른 네비게이션 활성화
    const navMap = {
        'friends-page': 'nav-friends',
        'status-page': 'nav-status',
        'ads-page': 'nav-ads',
        'notifications-page': 'nav-notifications',
        'profile-page': 'nav-profile'
    };
    
    if (navMap[pageId]) {
        document.getElementById(navMap[pageId]).classList.add('active');
    }
    
    // 페이지별 데이터 로드
    switch(pageId) {
        case 'friends-page':
            loadFriends();
            loadMyInviteCode();
            break;
        case 'status-page':
            loadFriendStatus();
            break;
        case 'ads-page':
            loadAds();
            break;
        case 'notifications-page':
            loadNotifications();
            loadNotificationSettings();
            break;
        case 'profile-page':
            loadProfile();
            break;
    }
}

// 친구 목록 로드
async function loadFriends() {
    if (!dbManager.currentUser) return;
    
    const container = document.getElementById('friends-container');
    container.innerHTML = '<div style="text-align: center; color: #666;">로딩 중...</div>';
    
    try {
        const friends = await dbManager.getFriends(dbManager.currentUser.id);
        
        if (friends.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666;">추가된 친구가 없습니다.</div>';
            return;
        }
        
        container.innerHTML = friends.map(friend => `
            <div class="friend-item">
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-email">${friend.email}</div>
                    <div style="font-size: 12px; color: #666;">${friend.address || '주소 미등록'}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn btn-small btn-danger" onclick="removeFriend('${friend.id}')">삭제</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('친구 목록 로드 오류:', error);
        container.innerHTML = '<div style="text-align: center; color: #dc3545;">친구 목록을 불러올 수 없습니다.</div>';
    }
}

// 친구 추가
async function addFriend() {
    const email = document.getElementById('friend-email').value;
    
    if (!email || !dbManager.currentUser) {
        alert('친구의 이메일을 입력하세요.');
        return;
    }
    
    try {
        const friend = await dbManager.addFriend(dbManager.currentUser.id, email);
        document.getElementById('friend-email').value = '';
        alert(`${friend.name}님이 친구로 추가되었습니다.`);
        loadFriends();
    } catch (error) {
        alert(error.message || '친구 추가에 실패했습니다.');
    }
}

// 친구 삭제
async function removeFriend(friendId) {
    if (!confirm('이 친구를 삭제하시겠습니까?')) return;
    
    try {
        await dbManager.removeFriend(dbManager.currentUser.id, friendId);
        loadFriends();
    } catch (error) {
        alert('친구 삭제에 실패했습니다.');
    }
}

// 친구 상태 로드
async function loadFriendStatus() {
    if (!dbManager.currentUser) return;
    
    const container = document.getElementById('status-container');
    container.innerHTML = '<div style="text-align: center; color: #666;">로딩 중...</div>';
    
    try {
        const friends = await dbManager.getFriends(dbManager.currentUser.id);
        
        if (friends.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666;">추가된 친구가 없습니다.<br>친구를 추가하여 안전상태를 확인해보세요.</div>';
            return;
        }
        
        const statusPromises = friends.map(async friend => {
            const status = await dbManager.getFriendStatus(friend.id);
            return { friend, status };
        });
        
        const friendsWithStatus = await Promise.all(statusPromises);
        
        container.innerHTML = friendsWithStatus.map(({ friend, status }) => {
            const statusInfo = getStatusInfo(status);
            
            return `
                <div class="friend-item">
                    <div class="friend-info">
                        <div class="friend-name">${friend.name}</div>
                        <div class="friend-email">${friend.email}</div>
                    </div>
                    <div class="friend-status ${statusInfo.class}">${statusInfo.text}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('친구 상태 로드 오류:', error);
        container.innerHTML = '<div style="text-align: center; color: #dc3545;">친구 상태를 불러올 수 없습니다.</div>';
    }
}

function getStatusInfo(status) {
    const statusMap = {
        active: { text: '🟢 정상', class: 'status-active' },
        warning: { text: '🟡 주의', class: 'status-warning' },
        danger: { text: '🔴 위험', class: 'status-danger' },
        critical: { text: '🟣 응급', class: 'status-critical' },
        custom: { text: '🔵 커스텀', class: 'status-custom' },
        unknown: { text: '❓ 알수없음', class: 'status-inactive' }
    };
    return statusMap[status] || statusMap.unknown;
}

// 광고 배너 로드
async function loadAds() {
    const container = document.getElementById('ads-container');
    container.innerHTML = '<div style="text-align: center; color: #666;">로딩 중...</div>';
    
    try {
        const ads = await dbManager.getAdBanners(currentAdTab);
        
        if (ads.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666;">등록된 광고가 없습니다.</div>';
            return;
        }
        
        container.innerHTML = ads.map(ad => `
            <div class="ad-banner">
                <div class="ad-content" onclick="openAd('${ad.id}', '${ad.url}', '${ad.title}')">
                    <div class="ad-title">${ad.title}</div>
                    <div class="ad-subtitle">${ad.content}</div>
                    <div style="font-size: 12px; color: #007bff; margin-top: 10px;">자세히 보기 ▶</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('광고 로드 오류:', error);
        container.innerHTML = '<div style="text-align: center; color: #dc3545;">광고를 불러올 수 없습니다.</div>';
    }
}

// 광고 탭 전환
function showAdTab(tabName) {
    currentAdTab = tabName;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    loadAds();
}

// 광고 클릭
async function openAd(adId, url, title) {
    try {
        await dbManager.incrementAdClick(adId);
        alert(`${title} 광고를 클릭하셨습니다.\n실제 앱에서는 해당 페이지로 이동합니다.`);
        // window.open(url, '_blank');
    } catch (error) {
        console.error('광고 클릭 처리 오류:', error);
    }
}

// 알림 로드
async function loadNotifications() {
    const container = document.getElementById('recent-notifications');
    
    if (!dbManager.currentUser) {
        container.innerHTML = '<div style="text-align: center; color: #666;">로그인이 필요합니다.</div>';
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; color: #666;">로딩 중...</div>';
    
    try {
        const notifications = await dbManager.getNotifications(dbManager.currentUser.id);
        
        if (notifications.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">알림이 없습니다.<br>친구들의 안전 상태에 문제가 생기면 여기에 알림이 표시됩니다.</div>';
            return;
        }
        
        container.innerHTML = notifications.map(notification => `
            <div class="notification-item">
                <div class="notification-time">${new Date(notification.created_at).toLocaleString()}</div>
                <div class="notification-message">${notification.message}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    ${getNotificationTypeText(notification.type)}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('알림 로드 오류:', error);
        container.innerHTML = '<div style="text-align: center; color: #dc3545;">알림을 불러올 수 없습니다.</div>';
    }
}

function getNotificationTypeText(type) {
    const typeMap = {
        warning: '24시간 무응답 경고',
        danger: '48시간 무응답 위급',
        critical: '72시간 무응답 응급상황'
    };
    return typeMap[type] || '일반 알림';
}

// 알림 설정 로드
async function loadNotificationSettings() {
    if (!dbManager.currentUser) return;
    
    try {
        const settings = await dbManager.getNotificationSettings(dbManager.currentUser.id) || {
            push_notifications: true,
            friend_notifications: true,
            emergency_notifications: true,
            critical_notifications: true,
            emergency_call_notifications: true
        };
        
        document.getElementById('push-notifications').checked = settings.push_notifications;
        document.getElementById('friend-notifications').checked = settings.friend_notifications;
        document.getElementById('emergency-notifications').checked = settings.emergency_notifications;
        document.getElementById('critical-notifications').checked = settings.critical_notifications;
        document.getElementById('emergency-call-notifications').checked = settings.emergency_call_notifications;
    } catch (error) {
        console.error('알림 설정 로드 오류:', error);
    }
}

// 알림 설정 저장
async function saveNotificationSettings() {
    if (!dbManager.currentUser) return;
    
    const settings = {
        push_notifications: document.getElementById('push-notifications').checked,
        friend_notifications: document.getElementById('friend-notifications').checked,
        emergency_notifications: document.getElementById('emergency-notifications').checked,
        critical_notifications: document.getElementById('critical-notifications').checked,
        emergency_call_notifications: document.getElementById('emergency-call-notifications').checked
    };
    
    try {
        await dbManager.updateNotificationSettings(dbManager.currentUser.id, settings);
        alert('알림 설정이 저장되었습니다.');
    } catch (error) {
        alert('설정 저장에 실패했습니다.');
    }
}

// 프로필 로드
async function loadProfile() {
    if (!dbManager.currentUser) return;
    
    const user = dbManager.currentUser;
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-birth').value = user.birth || '';
    document.getElementById('profile-gender').value = user.gender || '';
    document.getElementById('profile-address').value = user.address || '';
    document.getElementById('profile-detail-address').value = user.detail_address || '';
    document.getElementById('profile-postal').value = user.postal || '';
    document.getElementById('emergency-contact1').value = user.emergency_contact1 || '';
    document.getElementById('emergency-name1').value = user.emergency_name1 || '';
    document.getElementById('emergency-contact2').value = user.emergency_contact2 || '';
    document.getElementById('emergency-name2').value = user.emergency_name2 || '';
    document.getElementById('blood-type').value = user.blood_type || '';
    document.getElementById('medical-conditions').value = user.medical_conditions || '';
    document.getElementById('allergies').value = user.allergies || '';
    document.getElementById('workplace').value = user.workplace || '';
    document.getElementById('special-notes').value = user.special_notes || '';
    
    // 카카오 프로필 사진 표시 (기본 정보 섹션)
    const profilePicElement = document.getElementById('profile-pic-preview');
    if (profilePicElement) {
        profilePicElement.src = user.profile_pic || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9Ijc1IiB5PSI4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7sgqzsp4Ag7JeG7J2MPC90ZXh0Pgo8L3N2Zz4K';
    }
    
    // 영정사진 표시 (영정사진 섹션)
    const memorialPicElement = document.getElementById('memorial-pic-preview');
    if (memorialPicElement) {
        memorialPicElement.src = user.memorial_pic || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9Ijc1IiB5PSI4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7sg4Dsp4Ag7JeG7J2MPC90ZXh0Pgo8L3N2Zz4K';
    }
}

// 프로필 업데이트
async function updateProfile() {
    if (!dbManager.currentUser) return;
    
    const profileData = {
        name: document.getElementById('profile-name').value,
        phone: document.getElementById('profile-phone').value,
        birth: document.getElementById('profile-birth').value,
        gender: document.getElementById('profile-gender').value,
        address: document.getElementById('profile-address').value,
        detail_address: document.getElementById('profile-detail-address').value,
        postal: document.getElementById('profile-postal').value,
        emergency_contact1: document.getElementById('emergency-contact1').value,
        emergency_name1: document.getElementById('emergency-name1').value,
        emergency_contact2: document.getElementById('emergency-contact2').value,
        emergency_name2: document.getElementById('emergency-name2').value,
        blood_type: document.getElementById('blood-type').value,
        medical_conditions: document.getElementById('medical-conditions').value,
        allergies: document.getElementById('allergies').value,
        workplace: document.getElementById('workplace').value,
        special_notes: document.getElementById('special-notes').value
    };
    
    // 필수 항목 체크
    if (!profileData.name || !profileData.phone || !profileData.address) {
        alert('이름, 전화번호, 주소는 필수 항목입니다.');
        return;
    }
    
    try {
        await dbManager.updateUserProfile(dbManager.currentUser.id, profileData);
        alert('프로필이 업데이트되었습니다.\n응급상황 시 이 정보가 국가기관에 제공됩니다.');
    } catch (error) {
        alert('프로필 업데이트에 실패했습니다.');
    }
}

// 초대 코드 생성 및 카카오톡 공유
async function generateAndShareInviteCode() {
    if (!dbManager.currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }

    try {
        // 6자리 초대 코드 생성
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 기존 초대 코드 비활성화 (선택사항)
        try {
            await supabase
                .from('invite_codes')
                .update({ is_active: false })
                .eq('inviter_id', dbManager.currentUser.id)
                .eq('is_active', true);
        } catch (err) {
            console.log('기존 초대 코드 비활성화 스킵');
        }
        
        // 새 초대 코드 저장
        const { data, error } = await supabase
            .from('invite_codes')
            .insert({
                code: code,
                inviter_id: dbManager.currentUser.id,
                inviter_name: dbManager.currentUser.name,
                expires_at: new Date(Date.now() + 24*60*60*1000).toISOString(), // 24시간 유효
                is_active: true
            })
            .select();

        if (error) throw error;
        
        // 초대 코드 표시
        document.getElementById('my-invite-code').textContent = code;
        
        // 카카오톡 공유
        if (window.Kakao) {
            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: '안심케어 친구 초대',
                    description: `${dbManager.currentUser.name}님이 안심케어에 초대했습니다.\n초대 코드: ${code}`,
                    imageUrl: 'https://raw.githubusercontent.com/kakao/kakao-js-sdk/master/assets/kakao.png',
                    link: {
                        mobileWebUrl: window.location.origin,
                        webUrl: window.location.origin,
                    },
                },
                buttons: [
                    {
                        title: '안심케어 참여하기',
                        link: {
                            mobileWebUrl: window.location.origin,
                            webUrl: window.location.origin,
                        },
                    },
                ],
            });
        }
        
    } catch (error) {
        console.error('초대 코드 생성 오류:', error);
        alert('초대 코드 생성에 실패했습니다.');
    }
}

// 초대 코드로 친구 추가
async function addFriendByInviteCode() {
    const inviteCode = document.getElementById('friend-invite-code').value.toUpperCase();
    
    if (!inviteCode || !dbManager.currentUser) {
        alert('초대 코드를 입력하세요.');
        return;
    }
    
    try {
        // 초대 코드 확인
        const { data: invite, error: inviteError } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', inviteCode)
            .eq('is_active', true)
            .maybeSingle();
            
        if (inviteError || !invite) {
            alert('유효하지 않은 초대 코드입니다.');
            return;
        }
        
        // 만료 시간 확인
        if (new Date(invite.expires_at) < new Date()) {
            alert('만료된 초대 코드입니다.');
            return;
        }
        
        // 자기 자신 초대 방지
        if (invite.inviter_id === dbManager.currentUser.id) {
            alert('자신의 초대 코드는 사용할 수 없습니다.');
            return;
        }
        
        // 이미 친구인지 확인
        const { data: existingFriend } = await supabase
            .from('friends')
            .select('*')
            .eq('user_id', dbManager.currentUser.id)
            .eq('friend_id', invite.inviter_id)
            .maybeSingle();
            
        if (existingFriend) {
            alert('이미 친구로 등록된 사용자입니다.');
            return;
        }
        
        // 친구 관계 생성 (양방향)
        const { error } = await supabase
            .from('friends')
            .insert([
                { 
                    user_id: dbManager.currentUser.id, 
                    friend_id: invite.inviter_id,
                    status: 'active'
                },
                { 
                    user_id: invite.inviter_id, 
                    friend_id: dbManager.currentUser.id,
                    status: 'active'
                }
            ]);

        if (error) throw error;
        
        // 초대 코드 사용 처리
        await supabase
            .from('invite_codes')
            .update({ 
                is_active: false,
                used_by: dbManager.currentUser.id,
                used_at: new Date().toISOString()
            })
            .eq('id', invite.id);
        
        // 알림 생성
        await dbManager.createNotification(
            invite.inviter_id,
            dbManager.currentUser.id,
            'friend_added',
            `${dbManager.currentUser.name}님이 초대를 수락하여 친구가 되었습니다.`
        );
        
        document.getElementById('friend-invite-code').value = '';
        alert(`${invite.inviter_name}님과 친구가 되었습니다!`);
        loadFriends();
        
    } catch (error) {
        console.error('친구 추가 오류:', error);
        alert('친구 추가에 실패했습니다.');
    }
}

// 페이지 로드 시 내 초대 코드 표시
async function loadMyInviteCode() {
    if (!dbManager.currentUser) return;
    
    try {
        const { data: activeCode, error } = await supabase
            .from('invite_codes')
            .select('code')
            .eq('inviter_id', dbManager.currentUser.id)
            .eq('is_active', true)
            .maybeSingle();
            
        if (!error && activeCode) {
            document.getElementById('my-invite-code').textContent = activeCode.code;
        } else {
            document.getElementById('my-invite-code').innerHTML = '<span style="color: #999; font-size: 14px;">초대 코드를 생성하세요</span>';
        }
    } catch (error) {
        console.error('초대 코드 로드 오류:', error);
        document.getElementById('my-invite-code').innerHTML = '<span style="color: #999; font-size: 14px;">초대 코드를 생성하세요</span>';
    }
}

// 파일 업로드 처리 (Supabase Storage 사용)
async function handleFileUpload(input) {
    const file = input.files[0];
    if (!file || !dbManager.currentUser) return;
    
    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하로 제한됩니다.');
        input.value = '';
        return;
    }
    
    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        input.value = '';
        return;
    }
    
    try {
        // 고유한 파일명 생성
        const fileExt = file.name.split('.').pop();
        const fileName = `${dbManager.currentUser.id}/memorial_${Date.now()}.${fileExt}`;
        
        // Supabase Storage에 업로드 (임시로 Base64로 저장)
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64Data = e.target.result;
            
            try {
                // 데이터베이스에 Base64 데이터로 저장 (memorial_pic 컬럼)
                await dbManager.updateUserProfile(dbManager.currentUser.id, {
                    memorial_pic: base64Data
                });
                
                // 즉시 미리보기 업데이트
                const memorialPicElement = document.getElementById('memorial-pic-preview');
                if (memorialPicElement) {
                    memorialPicElement.src = base64Data;
                }
                
                alert('영정사진이 업로드되었습니다.');
                input.value = ''; // 파일 입력 초기화
                
                // 사용자 정보 새로고침
                await dbManager.refreshCurrentUser();
            } catch (error) {
                console.error('파일 업로드 오류:', error);
                alert('파일 업로드에 실패했습니다.');
                input.value = '';
            }
        };
        
        reader.onerror = function() {
            alert('파일 읽기에 실패했습니다.');
            input.value = '';
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('파일 처리 오류:', error);
        alert('파일 처리에 실패했습니다.');
        input.value = '';
    }
}

function updateProfilePic(input) {
    handleFileUpload(input);
}

// 영정사진 URL 직접 입력 함수
async function updateProfilePicUrl() {
    if (!dbManager.currentUser) return;
    
    const imageUrl = prompt('영정사진 URL을 입력하세요:', 'https://picsum.photos/200/200');
    
    if (!imageUrl || imageUrl.trim() === '') return;
    
    try {
        await dbManager.updateUserProfile(dbManager.currentUser.id, {
            memorial_pic: imageUrl.trim()
        });
        
        // 즉시 미리보기 업데이트
        const memorialPicElement = document.getElementById('memorial-pic-preview');
        if (memorialPicElement) {
            memorialPicElement.src = imageUrl.trim();
        }
        
        alert('영정사진이 업데이트되었습니다.');
    } catch (error) {
        console.error('영정사진 업데이트 오류:', error);
        alert('영정사진 업데이트에 실패했습니다.');
    }
}

// 친구 목록 권한 요청
function requestFriendsPermission() {
    Kakao.Auth.login({
        scope: 'friends,talk_message',
        success: function(authObj) {
            console.log('추가 권한 획득 성공');
            loadKakaoFriends();
        },
        fail: function(err) {
            console.error('추가 권한 획득 실패:', err);
            alert('권한 요청에 실패했습니다.');
        }
    });
}

// 실제 카카오톡 친구 초대
function inviteRealKakaoFriend(friendId, friendName) {
    alert(`${friendName}님께 초대 메시지를 보내는 기능은 카카오 비즈니스 채널 연동 후 사용 가능합니다.`);
}