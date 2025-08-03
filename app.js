// 로컬 스토리지 관리 클래스 (향후 데이터베이스 전환 대비)
class DataManager {
    constructor() {
        this.users = this.getFromStorage('users') || this.getDefaultUsers();
        this.friends = this.getFromStorage('friends') || [];
        this.adBanners = this.getFromStorage('adBanners') || this.getDefaultAds();
        this.notifications = this.getFromStorage('notifications') || [];
        this.emergencyContacts = this.getFromStorage('emergencyContacts') || ['119', '112', '행정센터'];
        this.currentUser = this.getFromStorage('currentUser') || null;
        this.userActivities = this.getFromStorage('userActivities') || {};
        this.kakaoFriends = this.getKakaoFriends(); // 카카오톡 친구 시뮬레이션
        
        // 초기 사용자가 없으면 기본 사용자 저장
        if (!this.getFromStorage('users')) {
            this.saveToStorage('users', this.users);
        }
        
        // 시뮬레이션을 위한 타이머 시작
        this.startActivitySimulation();
    }

    getFromStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // 카카오톡 친구 시뮬레이션 데이터
    getKakaoFriends() {
        return [
            { id: 'kakao1', name: '김민지', status: 'available' },
            { id: 'kakao2', name: '박서준', status: 'available' },
            { id: 'kakao3', name: '이지은', status: 'available' },
            { id: 'kakao4', name: '최우식', status: 'available' },
            { id: 'kakao5', name: '한소희', status: 'available' }
        ];
    }

    // 기본 사용자 데이터 (테스트용)
    getDefaultUsers() {
        return [
            {
                id: 1,
                name: '김철수',
                email: 'test@test.com',
                password: '123456',
                phone: '010-1234-5678',
                address: '서울시 강남구 테헤란로 123',
                detailAddress: '456호',
                birth: '1990-01-01',
                gender: 'male',
                bloodType: 'A+',
                medicalConditions: '',
                allergies: '',
                workplace: '테스트 회사',
                emergencyContact1: '010-9999-0001',
                emergencyName1: '부모님',
                emergencyContact2: '010-9999-0002',
                emergencyName2: '형제',
                specialNotes: '',
                postal: '12345',
                profilePic: null,
                joinDate: new Date().toISOString()
            },
            {
                id: 2,
                name: '이영희',
                email: 'friend1@test.com',
                password: '123456',
                phone: '010-2345-6789',
                address: '서울시 서초구 서초대로 789',
                detailAddress: '101호',
                profilePic: null,
                joinDate: new Date().toISOString()
            },
            {
                id: 3,
                name: '박민수',
                email: 'friend2@test.com',
                password: '123456',
                phone: '010-3456-7890',
                address: '서울시 송파구 올림픽로 456',
                detailAddress: '789호',
                profilePic: null,
                joinDate: new Date().toISOString()
            }
        ];
    }

    // 기본 광고 데이터
    getDefaultAds() {
        return {
            insurance: [
                { title: '건강보험', content: '든든한 건강 보장, 지금 가입하세요!', id: 1, url: '#' },
                { title: '생명보험', content: '가족을 위한 안전한 미래 준비', id: 2, url: '#' },
                { title: '의료실비보험', content: '병원비 걱정 끝! 실손보험 가입', id: 3, url: '#' }
            ],
            funeral: [
                { title: '상조서비스', content: '품격있는 마지막 배웅을 준비하세요', id: 4, url: '#' },
                { title: '장례지도사', content: '전문적인 장례 서비스 제공', id: 5, url: '#' },
                { title: '추모공원', content: '아름다운 안식처를 제공합니다', id: 6, url: '#' }
            ],
            lawyer: [
                { title: '상속 변호사', content: '원활한 상속 절차를 도와드립니다', id: 7, url: '#' },
                { title: '유언장 작성', content: '법적 효력 있는 유언장 작성 지원', id: 8, url: '#' },
                { title: '재산분할', content: '공정한 재산분할 상담', id: 9, url: '#' }
            ]
        };
    }

    // 사용자 활동 시뮬레이션
    startActivitySimulation() {
        setInterval(() => {
            if (this.currentUser) {
                // 현재 사용자의 활동 업데이트
                this.updateUserActivity(this.currentUser.email);
                
                // 친구들의 활동도 랜덤하게 업데이트
                this.friends.forEach(friend => {
                    if (Math.random() > 0.3) { // 70% 확률로 활동
                        this.updateUserActivity(friend.email);
                    }
                });
                
                this.checkForAlerts();
            }
        }, 60000); // 1분마다 체크
    }

    updateUserActivity(email) {
        if (!this.userActivities[email]) {
            this.userActivities[email] = [];
        }
        
        const now = Date.now();
        this.userActivities[email].push(now);
        
        // 72시간 이전 데이터는 제거
        this.userActivities[email] = this.userActivities[email].filter(
            timestamp => now - timestamp < 72 * 60 * 60 * 1000
        );
        
        this.saveToStorage('userActivities', this.userActivities);
    }

    checkForAlerts() {
        const now = Date.now();
        this.friends.forEach(friend => {
            const activities = this.userActivities[friend.email] || [];
            const lastActivity = activities.length > 0 ? Math.max(...activities) : 0;
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

            if (hoursSinceActivity >= 72) {
                this.sendEmergencyAlert(friend, 'critical');
            } else if (hoursSinceActivity >= 48) {
                this.sendAlert(friend, 'severe');
            } else if (hoursSinceActivity >= 24) {
                this.sendAlert(friend, 'warning');
            }
        });
    }

    sendAlert(friend, level) {
        const alertKey = `${friend.email}-${level}`;
        const lastAlert = this.getFromStorage(`lastAlert-${alertKey}`);
        const now = Date.now();
        
        // 같은 레벨의 알림은 6시간마다만 발송
        if (lastAlert && now - lastAlert < 6 * 60 * 60 * 1000) {
            return;
        }

        const notification = {
            id: Date.now(),
            type: level,
            friend: friend.name,
            message: this.getAlertMessage(friend, level),
            timestamp: now
        };

        this.notifications.unshift(notification);
        this.saveToStorage('notifications', this.notifications);
        this.saveToStorage(`lastAlert-${alertKey}`, now);

        // 실제 앱에서는 푸시 알림 발송
        console.log(`알림 발송: ${notification.message}`);
    }

    sendEmergencyAlert(friend, level) {
        this.sendAlert(friend, level);
        
        // 공공기관에도 알림 발송
        this.emergencyContacts.forEach(contact => {
            console.log(`비상 연락처 ${contact}에 알림 발송: ${friend.name}님 응답 없음 (72시간)`);
        });
    }

    getAlertMessage(friend, level) {
        const messages = {
            warning: `${friend.name}님이 24시간 동안 응답하지 않습니다.`,
            severe: `⚠️ ${friend.name}님이 48시간 동안 응답하지 않습니다!`,
            critical: `🚨 긴급! ${friend.name}님이 72시간 동안 응답하지 않습니다!`
        };
        return messages[level];
    }

    getFriendStatus(friend) {
        const activities = this.userActivities[friend.email] || [];
        if (activities.length === 0) return 'unknown';
        
        const lastActivity = Math.max(...activities);
        const hoursSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60);

        if (hoursSinceActivity < 24) return 'active';
        if (hoursSinceActivity < 48) return 'warning';
        if (hoursSinceActivity < 72) return 'danger';
        return 'critical';
    }
}

// 전역 변수
const dataManager = new DataManager();
let currentAdTab = 'insurance';

// 하단 네비게이션 관련 함수
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
            loadKakaoFriends();
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

// 카카오 로그인 함수 (실제 구현)
function loginWithKakao() {
    // 실제 카카오 SDK를 사용한 로그인 구현
    if (!window.Kakao || !Kakao.isInitialized()) {
        alert('카카오 SDK가 초기화되지 않았습니다. JavaScript 키를 확인해주세요.');
        return;
    }
    
    Kakao.Auth.login({
        throughTalk: false, // 카카오톡 앱 연동 비활성화 (웹 브라우저에서만 진행)
        success: function(authObj) {
            console.log('카카오 로그인 성공:', authObj);
            
            // 사용자 정보 요청
            Kakao.API.request({
                url: '/v2/user/me',
                success: function(response) {
                    console.log('사용자 정보:', response);
                    
                    // 카카오 사용자 정보로 앱 사용자 생성/업데이트
                    const kakaoUser = {
                        id: response.id,
                        kakaoId: response.id,
                        name: response.properties?.nickname || '카카오 사용자',
                        email: response.kakao_account?.email || `kakao_${response.id}@kakao.com`,
                        phone: '010-0000-0000',
                        address: '주소를 입력해주세요',
                        detailAddress: '',
                        profilePic: response.properties?.profile_image || null,
                        joinDate: new Date().toISOString(),
                        isKakaoUser: true
                    };
                    
                    // 기존 카카오 사용자 확인
                    let existingUser = dataManager.users.find(u => u.kakaoId === response.id);
                    
                    if (!existingUser) {
                        // 새 카카오 사용자 생성
                        dataManager.users.push(kakaoUser);
                        dataManager.saveToStorage('users', dataManager.users);
                        existingUser = kakaoUser;
                    } else {
                        // 기존 사용자 정보 업데이트
                        existingUser.name = kakaoUser.name;
                        existingUser.profilePic = kakaoUser.profilePic;
                        dataManager.saveToStorage('users', dataManager.users);
                    }
                    
                    // 로그인 처리
                    dataManager.currentUser = existingUser;
                    dataManager.saveToStorage('currentUser', existingUser);
                    dataManager.updateUserActivity(existingUser.email);
                    
                    // 로그인 후 친구 관리 페이지로 이동
                    document.getElementById('login-page').classList.remove('active');
                    document.getElementById('bottom-nav').style.display = 'flex';
                    showMainPage('friends-page');
                    
                    // 프로필 설정 안내
                    if (existingUser.address === '주소를 입력해주세요') {
                        setTimeout(() => {
                            alert(`${existingUser.name}님, 환영합니다!\n프로필 설정에서 정보를 업데이트해주세요.`);
                        }, 500);
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

// 카카오 로그아웃 함수
function logoutKakao() {
    if (window.Kakao && Kakao.Auth.getAccessToken()) {
        Kakao.API.request({
            url: '/v1/user/unlink',
            success: function(response) {
                console.log('카카오 로그아웃 성공:', response);
            },
            fail: function(error) {
                console.error('카카오 로그아웃 실패:', error);
            }
        });
        
        Kakao.Auth.setAccessToken(undefined);
    }
}

function register() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const phone = document.getElementById('reg-phone').value;
    const address = document.getElementById('reg-address').value;
    const detailAddress = document.getElementById('reg-detail-address').value;

    if (!name || !email || !password || !phone || !address) {
        alert('모든 필수 정보를 입력하세요.');
        return;
    }

    if (dataManager.users.find(u => u.email === email)) {
        alert('이미 가입된 이메일입니다.');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        phone,
        address,
        detailAddress,
        profilePic: null,
        joinDate: new Date().toISOString()
    };

    dataManager.users.push(newUser);
    dataManager.saveToStorage('users', dataManager.users);
    
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
    showLogin();
}

function logout() {
    // 카카오 로그아웃 처리
    if (dataManager.currentUser && dataManager.currentUser.isKakaoUser) {
        logoutKakao();
    }
    
    dataManager.currentUser = null;
    dataManager.saveToStorage('currentUser', null);
    document.getElementById('bottom-nav').style.display = 'none';
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('login-page').classList.add('active');
}

// 카카오톡 친구 관련 함수
function loadKakaoFriends() {
    const container = document.getElementById('kakao-friends-list');
    
    // 실제 카카오톡 친구 목록 가져오기
    if (window.Kakao && Kakao.Auth.getAccessToken()) {
        container.innerHTML = '<div style="text-align: center; color: #666; background: white; padding: 10px; border-radius: 8px;">친구 목록을 불러오는 중...</div>';
        
        Kakao.API.request({
            url: '/v1/api/talk/friends',
            success: function(response) {
                console.log('카카오톡 친구 목록:', response);
                
                if (response.elements && response.elements.length > 0) {
                    container.innerHTML = response.elements.map(friend => `
                        <div class="kakao-friend-item">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${friend.profile_thumbnail_image ? 
                                    `<img src="${friend.profile_thumbnail_image}" alt="${friend.profile_nickname}" style="width: 40px; height: 40px; border-radius: 50%;">` : 
                                    '<div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">👤</div>'
                                }
                                <div>
                                    <div style="font-weight: bold;">${friend.profile_nickname}</div>
                                    <div style="font-size: 12px; color: #666;">카카오톡 친구</div>
                                </div>
                            </div>
                            <button class="btn btn-small" onclick="inviteRealKakaoFriend('${friend.id}', '${friend.profile_nickname}')">초대</button>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<div style="text-align: center; color: #666; background: white; padding: 10px; border-radius: 8px;">카카오톡 친구가 없거나 권한이 없습니다.<br><small>카카오 개발자 사이트에서 "카카오톡 친구 목록 가져오기" 권한을 확인하세요.</small></div>';
                }
            },
            fail: function(error) {
                console.error('친구 목록 가져오기 실패:', error);
                // 권한이 없을 경우 동의 화면으로 이동
                if (error.code === -402) {
                    container.innerHTML = `
                        <div style="text-align: center; color: #666; background: white; padding: 20px; border-radius: 8px;">
                            <div style="margin-bottom: 10px;">친구 목록을 가져오려면 추가 권한이 필요합니다.</div>
                            <button class="btn btn-small" onclick="requestFriendsPermission()">권한 요청하기</button>
                        </div>
                    `;
                } else {
                    container.innerHTML = '<div style="text-align: center; color: #666; background: white; padding: 10px; border-radius: 8px;">친구 목록을 가져올 수 없습니다.</div>';
                }
            }
        });
    } else {
        // 로그인되지 않은 경우 기존 더미 데이터 표시
        if (dataManager.kakaoFriends.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; background: white; padding: 10px; border-radius: 8px;">카카오톡 친구가 없습니다.</div>';
            return;
        }

        container.innerHTML = dataManager.kakaoFriends.map(friend => `
            <div class="kakao-friend-item">
                <div>
                    <div style="font-weight: bold;">${friend.name}</div>
                    <div style="font-size: 12px; color: #666;">카카오톡 친구</div>
                </div>
                <button class="btn btn-small" onclick="inviteKakaoFriend('${friend.id}', '${friend.name}')">초대</button>
            </div>
        `).join('');
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
    // 카카오톡 메시지 보내기
    Kakao.API.request({
        url: '/v1/api/talk/friends/message/default/send',
        data: {
            receiver_uuids: [friendId],
            template_object: {
                object_type: 'text',
                text: '안심케어 앱에 초대합니다! 서로의 안전을 확인하고 도움을 주고받을 수 있는 앱입니다.',
                link: {
                    web_url: window.location.href,
                    mobile_web_url: window.location.href
                },
                button_title: '앱 시작하기'
            }
        },
        success: function(response) {
            console.log('초대 메시지 전송 성공:', response);
            alert(`${friendName}님께 안심케어 앱 초대 메시지를 보냈습니다!`);
        },
        fail: function(error) {
            console.error('초대 메시지 전송 실패:', error);
            alert('메시지 전송에 실패했습니다. 카카오톡 메시지 권한을 확인해주세요.');
        }
    });
}

function inviteKakaoFriend(friendId, friendName) {
    // 시뮬레이션: 카카오톡 친구를 앱에 초대
    alert(`${friendName}님께 안심케어 앱 초대 메시지를 보냈습니다!`);
    
    // 카카오 친구 목록에서 제거 (초대 완료)
    dataManager.kakaoFriends = dataManager.kakaoFriends.filter(f => f.id !== friendId);
    loadKakaoFriends();
}

// 친구 관리 함수
function addFriend() {
    const email = document.getElementById('friend-email').value;
    
    if (!email) {
        alert('친구의 이메일을 입력하세요.');
        return;
    }

    const friendUser = dataManager.users.find(u => u.email === email);
    if (!friendUser) {
        alert('해당 이메일로 가입된 사용자가 없습니다.');
        return;
    }

    if (friendUser.email === dataManager.currentUser.email) {
        alert('자신을 친구로 추가할 수 없습니다.');
        return;
    }

    if (dataManager.friends.find(f => f.email === email)) {
        alert('이미 추가된 친구입니다.');
        return;
    }

    const friendConnection = {
        id: Date.now(),
        email: friendUser.email,
        name: friendUser.name,
        phone: friendUser.phone,
        address: friendUser.address,
        addedDate: new Date().toISOString()
    };

    dataManager.friends.push(friendConnection);
    dataManager.saveToStorage('friends', dataManager.friends);
    
    document.getElementById('friend-email').value = '';
    loadFriends();
    alert(`${friendUser.name}님이 친구로 추가되었습니다.`);
}

function loadFriends() {
    const container = document.getElementById('friends-container');
    if (dataManager.friends.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666;">추가된 친구가 없습니다.</div>';
        return;
    }

    container.innerHTML = dataManager.friends.map(friend => `
        <div class="friend-item">
            <div class="friend-info">
                <div class="friend-name">${friend.name}</div>
                <div class="friend-email">${friend.email}</div>
                <div style="font-size: 12px; color: #666;">${friend.address || '주소 미등록'}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button class="btn btn-small btn-danger" onclick="removeFriend('${friend.email}')">해지</button>
                <button class="btn btn-small btn-danger" onclick="deleteFriend('${friend.email}')">삭제</button>
            </div>
        </div>
    `).join('');
}

function removeFriend(email) {
    if (confirm('이 친구와의 연결을 해지하시겠습니까?\n(해지 후 다시 추가할 수 있습니다)')) {
        const friend = dataManager.friends.find(f => f.email === email);
        if (friend) {
            alert(`${friend.name}님과의 연결이 해지되었습니다.`);
            // 실제로는 연결만 일시 중단하고 기록은 유지할 수 있음
            dataManager.friends = dataManager.friends.filter(f => f.email !== email);
            dataManager.saveToStorage('friends', dataManager.friends);
            loadFriends();
        }
    }
}

function deleteFriend(email) {
    if (confirm('이 친구를 완전히 삭제하시겠습니까?\n(모든 기록이 삭제되며 복구할 수 없습니다)')) {
        const friend = dataManager.friends.find(f => f.email === email);
        if (friend) {
            // 친구 삭제 및 관련 데이터 정리
            dataManager.friends = dataManager.friends.filter(f => f.email !== email);
            delete dataManager.userActivities[email]; // 활동 기록도 삭제
            
            dataManager.saveToStorage('friends', dataManager.friends);
            dataManager.saveToStorage('userActivities', dataManager.userActivities);
            
            alert(`${friend.name}님이 완전히 삭제되었습니다.`);
            loadFriends();
        }
    }
}

// 친구 상태 관리 함수
function loadFriendStatus() {
    const container = document.getElementById('status-container');
    if (dataManager.friends.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666;">추가된 친구가 없습니다.<br>친구를 추가하여 안전상태를 확인해보세요.</div>';
        return;
    }

    container.innerHTML = dataManager.friends.map(friend => {
        const status = dataManager.getFriendStatus(friend);
        const statusInfo = getStatusInfo(status);
        const activities = dataManager.userActivities[friend.email] || [];
        const lastActivity = activities.length > 0 ? new Date(Math.max(...activities)).toLocaleString() : '활동 기록 없음';
        
        // 시간 계산
        const hoursSinceActivity = activities.length > 0 ? 
            (Date.now() - Math.max(...activities)) / (1000 * 60 * 60) : 999;

        return `
            <div class="friend-item">
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-email">마지막 활동: ${lastActivity}</div>
                    <div style="font-size: 12px; color: #666;">
                        ${hoursSinceActivity < 999 ? `${Math.floor(hoursSinceActivity)}시간 전` : '활동 없음'}
                    </div>
                </div>
                <div class="friend-status ${statusInfo.class}">${statusInfo.text}</div>
            </div>
        `;
    }).join('');
}

function getStatusInfo(status) {
    const statusMap = {
        active: { text: '🟢 정상', class: 'status-active' },
        inactive: { text: '⚪ 비활성', class: 'status-inactive' },
        warning: { text: '🟡 주의', class: 'status-warning' },
        danger: { text: '🔴 위험', class: 'status-danger' },
        critical: { text: '🟣 응급', class: 'status-critical' },
        unknown: { text: '❓ 알수없음', class: 'status-inactive' }
    };
    return statusMap[status] || statusMap.unknown;
}

// 광고 관리 함수
function showAdTab(tabName) {
    currentAdTab = tabName;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    loadAds();
}

function loadAds() {
    const container = document.getElementById('ads-container');
    const ads = dataManager.adBanners[currentAdTab] || [];
    
    container.innerHTML = ads.map(ad => `
        <div class="ad-banner">
            <div class="ad-content" onclick="openAd('${ad.url}', '${ad.title}')">
                <div class="ad-title">${ad.title}</div>
                <div class="ad-subtitle">${ad.content}</div>
                <div style="font-size: 12px; color: #007bff; margin-top: 10px;">자세히 보기 ▶</div>
            </div>
        </div>
    `).join('');
}

function openAd(url, title) {
    alert(`${title} 광고를 클릭하셨습니다.\n실제 앱에서는 해당 페이지로 이동합니다.`);
    // 실제 구현 시: window.open(url, '_blank');
}

// 알림 관리 함수
function loadNotificationSettings() {
    const settings = dataManager.getFromStorage('notificationSettings') || {
        pushNotifications: true,
        friendNotifications: true,
        emergencyNotifications: true,
        criticalNotifications: true,
        emergencyCallNotifications: true
    };
    
    document.getElementById('push-notifications').checked = settings.pushNotifications;
    document.getElementById('friend-notifications').checked = settings.friendNotifications;
    document.getElementById('emergency-notifications').checked = settings.emergencyNotifications;
    document.getElementById('critical-notifications').checked = settings.criticalNotifications;
    document.getElementById('emergency-call-notifications').checked = settings.emergencyCallNotifications;
}

function saveNotificationSettings() {
    const settings = {
        pushNotifications: document.getElementById('push-notifications').checked,
        friendNotifications: document.getElementById('friend-notifications').checked,
        emergencyNotifications: document.getElementById('emergency-notifications').checked,
        criticalNotifications: document.getElementById('critical-notifications').checked,
        emergencyCallNotifications: document.getElementById('emergency-call-notifications').checked
    };
    
    dataManager.saveToStorage('notificationSettings', settings);
    alert('알림 설정이 저장되었습니다.');
}

function loadNotifications() {
    const container = document.getElementById('recent-notifications');
    const recentNotifications = dataManager.notifications.slice(0, 10);
    
    if (recentNotifications.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">알림이 없습니다.<br>친구들의 안전 상태에 문제가 생기면 여기에 알림이 표시됩니다.</div>';
        return;
    }

    container.innerHTML = recentNotifications.map(notification => `
        <div class="notification-item">
            <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
            <div class="notification-message">${notification.message}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                ${getNotificationTypeText(notification.type)}
            </div>
        </div>
    `).join('');
}

function getNotificationTypeText(type) {
    const typeMap = {
        warning: '24시간 무응답 경고',
        severe: '48시간 무응답 위급',
        critical: '72시간 무응답 응급상황'
    };
    return typeMap[type] || '일반 알림';
}

// 프로필 관리 함수
function loadProfile() {
    if (dataManager.currentUser) {
        const user = dataManager.currentUser;
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-birth').value = user.birth || '';
        document.getElementById('profile-gender').value = user.gender || '';
        document.getElementById('profile-address').value = user.address || '';
        document.getElementById('profile-detail-address').value = user.detailAddress || '';
        document.getElementById('profile-postal').value = user.postal || '';
        document.getElementById('emergency-contact1').value = user.emergencyContact1 || '';
        document.getElementById('emergency-name1').value = user.emergencyName1 || '';
        document.getElementById('emergency-contact2').value = user.emergencyContact2 || '';
        document.getElementById('emergency-name2').value = user.emergencyName2 || '';
        document.getElementById('blood-type').value = user.bloodType || '';
        document.getElementById('medical-conditions').value = user.medicalConditions || '';
        document.getElementById('allergies').value = user.allergies || '';
        document.getElementById('workplace').value = user.workplace || '';
        document.getElementById('special-notes').value = user.specialNotes || '';
    }
}

function updateProfile() {
    if (!dataManager.currentUser) return;

    const updatedData = {
        name: document.getElementById('profile-name').value,
        phone: document.getElementById('profile-phone').value,
        birth: document.getElementById('profile-birth').value,
        gender: document.getElementById('profile-gender').value,
        address: document.getElementById('profile-address').value,
        detailAddress: document.getElementById('profile-detail-address').value,
        postal: document.getElementById('profile-postal').value,
        emergencyContact1: document.getElementById('emergency-contact1').value,
        emergencyName1: document.getElementById('emergency-name1').value,
        emergencyContact2: document.getElementById('emergency-contact2').value,
        emergencyName2: document.getElementById('emergency-name2').value,
        bloodType: document.getElementById('blood-type').value,
        medicalConditions: document.getElementById('medical-conditions').value,
        allergies: document.getElementById('allergies').value,
        workplace: document.getElementById('workplace').value,
        specialNotes: document.getElementById('special-notes').value
    };

    // 필수 항목 체크
    if (!updatedData.name || !updatedData.phone || !updatedData.address) {
        alert('이름, 전화번호, 주소는 필수 항목입니다.');
        return;
    }

    Object.assign(dataManager.currentUser, updatedData);
    
    // users 배열에서도 업데이트
    const userIndex = dataManager.users.findIndex(u => u.email === dataManager.currentUser.email);
    if (userIndex !== -1) {
        Object.assign(dataManager.users[userIndex], updatedData);
        dataManager.saveToStorage('users', dataManager.users);
    }
    
    dataManager.saveToStorage('currentUser', dataManager.currentUser);
    alert('프로필이 업데이트되었습니다.\n응급상황 시 이 정보가 국가기관에 제공됩니다.');
}

// 파일 업로드 관련 함수
function handleFileUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 실제 앱에서는 서버에 업로드하고 URL을 받아옴
            console.log('프로필 사진 업로드됨:', file.name);
            alert('사진이 업로드되었습니다.');
        };
        reader.readAsDataURL(file);
    }
}

function updateProfilePic(input) {
    handleFileUpload(input);
}

// 카카오 SDK 초기화 (여기에 실제 JavaScript 키를 입력하세요)
const KAKAO_JS_KEY = 'dd74fd58abbb75eb58df11ecc92d6727'; // 카카오 JavaScript 키

// 앱 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 카카오 SDK 초기화
    if (window.Kakao && !Kakao.isInitialized()) {
        Kakao.init(KAKAO_JS_KEY);
        console.log('카카오 SDK 초기화 완료:', Kakao.isInitialized());
    }
    
    // 저장된 사용자 정보가 있으면 자동 로그인하여 친구 관리 페이지로 이동
    if (dataManager.currentUser) {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('bottom-nav').style.display = 'flex';
        showMainPage('friends-page');
    }
    
    console.log('안심케어 앱이 초기화되었습니다.');
    console.log('현재 사용자:', dataManager.currentUser);
    
    // 테스트용 알림 생성 (실제 환경에서는 제거)
    if (dataManager.currentUser && dataManager.notifications.length === 0) {
        const testNotifications = [
            {
                id: Date.now() - 3600000,
                type: 'warning',
                friend: '이영희',
                message: '이영희님이 24시간 동안 응답하지 않습니다.',
                timestamp: Date.now() - 3600000
            },
            {
                id: Date.now() - 7200000,
                type: 'severe',
                friend: '박민수',
                message: '⚠️ 박민수님이 48시간 동안 응답하지 않습니다!',
                timestamp: Date.now() - 7200000
            }
        ];
        dataManager.notifications = testNotifications;
        dataManager.saveToStorage('notifications', dataManager.notifications);
    }
});