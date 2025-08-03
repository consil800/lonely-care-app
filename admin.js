// 관리자 페이지 전용 JavaScript
class AdminDataManager {
    constructor() {
        this.users = this.getFromStorage('users') || this.getDefaultUsers();
        this.friends = this.getFromStorage('friends') || [];
        this.adBanners = this.getFromStorage('adBanners') || this.getDefaultAds();
        this.notifications = this.getFromStorage('notifications') || [];
        this.emergencyContacts = this.getFromStorage('emergencyContacts') || this.getDefaultEmergencyContacts();
        this.userActivities = this.getFromStorage('userActivities') || {};
        this.currentAdTab = 'insurance';
        this.currentUserTab = 'all';
        this.currentNotificationTab = 'all';
        
        // 관리자 전용 설정
        this.dbSettings = this.getFromStorage('dbSettings') || {
            host: 'localhost',
            database: 'ansimncare_db',
            username: '',
            password: '',
            connected: false
        };
        
        this.initializeAdmin();
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
                profilePic: null,
                joinDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isActive: true
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
                joinDate: new Date().toISOString(),
                lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                isActive: true
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
                joinDate: new Date().toISOString(),
                lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                isActive: true
            }
        ];
    }

    getDefaultAds() {
        return {
            insurance: [
                { 
                    id: 1, 
                    title: '건강보험', 
                    content: '든든한 건강 보장, 지금 가입하세요!', 
                    imageUrl: '', 
                    linkUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                { 
                    id: 2, 
                    title: '생명보험', 
                    content: '가족을 위한 안전한 미래 준비', 
                    imageUrl: '', 
                    linkUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ],
            funeral: [
                { 
                    id: 3, 
                    title: '상조서비스', 
                    content: '품격있는 마지막 배웅을 준비하세요', 
                    imageUrl: '', 
                    linkUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                { 
                    id: 4, 
                    title: '장례지도사', 
                    content: '전문적인 장례 서비스 제공', 
                    imageUrl: '', 
                    linkUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ],
            lawyer: [
                { 
                    id: 5, 
                    title: '상속 변호사', 
                    content: '원활한 상속 절차를 도와드립니다', 
                    imageUrl: '', 
                    linkUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                { 
                    id: 6, 
                    title: '유언장 작성', 
                    content: '법적 효력 있는 유언장 작성 지원', 
                    imageUrl: '', 
                    linkUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ]
        };
    }

    getDefaultEmergencyContacts() {
        return [
            {
                id: 1,
                name: '소방서',
                phone: '119',
                type: 'fire',
                address: '',
                isActive: true,
                priority: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: '경찰서',
                phone: '112',
                type: 'police',
                address: '',
                isActive: true,
                priority: 2,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: '행정센터',
                phone: '1588-0000',
                type: 'admin',
                address: '',
                isActive: true,
                priority: 3,
                createdAt: new Date().toISOString()
            }
        ];
    }

    initializeAdmin() {
        // 초기 데이터가 없으면 저장
        if (!this.getFromStorage('users')) {
            this.saveToStorage('users', this.users);
        }
        if (!this.getFromStorage('adBanners')) {
            this.saveToStorage('adBanners', this.adBanners);
        }
        if (!this.getFromStorage('emergencyContacts')) {
            this.saveToStorage('emergencyContacts', this.emergencyContacts);
        }

        this.loadStats();
        this.loadUsers();
        this.loadAds();
        this.loadEmergencyContacts();
        this.loadNotifications();
        this.updateDBStatus();

        console.log('관리자 페이지가 초기화되었습니다.');
    }

    // 통계 로드
    loadStats() {
        document.getElementById('total-users').textContent = this.users.length;
        
        // 활동 회원수 (최근 24시간)
        const activeUsers = this.users.filter(user => {
            if (!user.lastLogin) return false;
            const lastLogin = new Date(user.lastLogin);
            const now = new Date();
            return (now - lastLogin) < 24 * 60 * 60 * 1000;
        }).length;
        
        document.getElementById('active-users').textContent = activeUsers;
        document.getElementById('total-connections').textContent = this.friends.length;
        
        // 긴급 알림 (최근 7일)
        const emergencyAlerts = this.notifications.filter(notification => {
            const createdAt = new Date(notification.timestamp || notification.createdAt);
            const now = new Date();
            return notification.type === 'critical' && (now - createdAt) < 7 * 24 * 60 * 60 * 1000;
        }).length;
        
        document.getElementById('emergency-alerts').textContent = emergencyAlerts;
        document.getElementById('total-notifications').textContent = this.notifications.length;
    }

    // 사용자 관리
    loadUsers() {
        const container = document.getElementById('users-container');
        let usersToShow = this.users;

        // 탭에 따른 필터링
        switch(this.currentUserTab) {
            case 'active':
                usersToShow = this.users.filter(user => {
                    if (!user.lastLogin) return false;
                    const lastLogin = new Date(user.lastLogin);
                    const now = new Date();
                    return (now - lastLogin) < 24 * 60 * 60 * 1000;
                });
                break;
            case 'inactive':
                usersToShow = this.users.filter(user => {
                    if (!user.lastLogin) return true;
                    const lastLogin = new Date(user.lastLogin);
                    const now = new Date();
                    return (now - lastLogin) >= 24 * 60 * 60 * 1000;
                });
                break;
        }

        if (usersToShow.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">사용자가 없습니다.</div>';
            return;
        }

        container.innerHTML = usersToShow.map(user => {
            const isRecentlyActive = user.lastLogin && (new Date() - new Date(user.lastLogin)) < 24 * 60 * 60 * 1000;
            const statusBadge = isRecentlyActive ? 
                '<span class="badge badge-success">활성</span>' : 
                '<span class="badge badge-warning">비활성</span>';
            
            return `
                <div class="user-item">
                    <div>
                        <div style="font-weight: bold; margin-bottom: 5px;">${user.name}</div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${user.email}</div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${user.phone || '전화번호 없음'}</div>
                        <div style="font-size: 12px; color: #666;">${user.address || '주소 없음'}</div>
                        <div style="font-size: 11px; color: #999; margin-top: 5px;">
                            가입일: ${new Date(user.joinDate).toLocaleDateString()}
                            ${user.lastLogin ? `| 최종 로그인: ${new Date(user.lastLogin).toLocaleString()}` : ''}
                        </div>
                    </div>
                    <div>
                        ${statusBadge}
                        <button class="btn btn-danger" style="margin-left: 10px; padding: 6px 12px; font-size: 12px;" 
                                onclick="deleteUser(${user.id})">삭제</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 광고 배너 관리
    loadAds() {
        const container = document.getElementById('ads-container');
        const ads = this.adBanners[this.currentAdTab] || [];
        
        if (ads.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">광고가 없습니다.</div>';
            return;
        }

        container.innerHTML = ads.map(ad => `
            <div class="ad-item">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; margin-bottom: 5px;">${ad.title}</div>
                        <div style="margin-bottom: 10px; color: #666;">${ad.content}</div>
                        ${ad.linkUrl ? `<div style="font-size: 12px; color: #007bff;">🔗 ${ad.linkUrl}</div>` : ''}
                        ${ad.imageUrl ? `<div style="font-size: 12px; color: #28a745;">🖼️ 이미지 있음</div>` : ''}
                        <div style="font-size: 11px; color: #999; margin-top: 5px;">
                            생성일: ${new Date(ad.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <span class="badge ${ad.isActive ? 'badge-success' : 'badge-danger'}">
                            ${ad.isActive ? '활성' : '비활성'}
                        </span>
                        <button class="btn btn-danger" style="margin-left: 10px; padding: 6px 12px; font-size: 12px;" 
                                onclick="deleteAd('${this.currentAdTab}', ${ad.id})">삭제</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 비상 연락처 관리
    loadEmergencyContacts() {
        const container = document.getElementById('emergency-contacts-container');
        
        if (this.emergencyContacts.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">비상 연락처가 없습니다.</div>';
            return;
        }

        const typeLabels = {
            fire: '소방서',
            police: '경찰서',
            admin: '행정기관',
            medical: '의료기관',
            other: '기타'
        };

        container.innerHTML = this.emergencyContacts.map(contact => `
            <div class="emergency-item">
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">${contact.name}</div>
                    <div style="font-size: 14px; color: #333; margin-bottom: 3px;">📞 ${contact.phone}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 3px;">
                        <span class="badge badge-info">${typeLabels[contact.type] || contact.type}</span>
                    </div>
                    ${contact.address ? `<div style="font-size: 12px; color: #666;">${contact.address}</div>` : ''}
                    <div style="font-size: 11px; color: #999; margin-top: 5px;">
                        우선순위: ${contact.priority || 0} | 생성일: ${new Date(contact.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                </div>
                <div>
                    <span class="badge ${contact.isActive ? 'badge-success' : 'badge-danger'}">
                        ${contact.isActive ? '활성' : '비활성'}
                    </span>
                    <button class="btn btn-danger" style="margin-left: 10px; padding: 6px 12px; font-size: 12px;" 
                            onclick="deleteEmergencyContact(${contact.id})">삭제</button>
                </div>
            </div>
        `).join('');
    }

    // 알림 관리
    loadNotifications() {
        const container = document.getElementById('notifications-container');
        let notificationsToShow = this.notifications;

        // 탭에 따른 필터링
        switch(this.currentNotificationTab) {
            case 'critical':
                notificationsToShow = this.notifications.filter(n => n.type === 'critical');
                break;
            case 'recent':
                const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
                notificationsToShow = this.notifications.filter(n => {
                    const timestamp = n.timestamp || n.createdAt;
                    return timestamp && timestamp > twentyFourHoursAgo;
                });
                break;
        }

        if (notificationsToShow.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">알림이 없습니다.</div>';
            return;
        }

        const typeLabels = {
            warning: '경고',
            severe: '심각',
            critical: '긴급',
            info: '정보'
        };

        const typeBadges = {
            warning: 'badge-warning',
            severe: 'badge-danger',
            critical: 'badge-danger',
            info: 'badge-info'
        };

        container.innerHTML = notificationsToShow.slice(0, 20).map(notification => `
            <div class="user-item" style="border-left-color: ${notification.type === 'critical' ? '#dc3545' : '#ffc107'};">
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">${notification.message}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                        대상: ${notification.friend || '시스템'}
                    </div>
                    <div style="font-size: 11px; color: #999;">
                        ${new Date(notification.timestamp || notification.createdAt).toLocaleString()}
                    </div>
                </div>
                <div>
                    <span class="badge ${typeBadges[notification.type]}">${typeLabels[notification.type]}</span>
                </div>
            </div>
        `).join('');
    }

    // 데이터베이스 상태 업데이트
    updateDBStatus() {
        const statusElement = document.getElementById('db-status');
        if (this.dbSettings.connected) {
            statusElement.textContent = '🟢 데이터베이스 연결됨';
            statusElement.className = 'db-status db-connected';
        } else {
            statusElement.textContent = '🔴 로컬 스토리지 모드';
            statusElement.className = 'db-status db-disconnected';
        }
    }
}

// 전역 변수
const adminManager = new AdminDataManager();

// 탭 관리 함수들
function showUserTab(tabName) {
    adminManager.currentUserTab = tabName;
    document.querySelectorAll('.tabs .tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    adminManager.loadUsers();
}

function showAdTab(tabName) {
    adminManager.currentAdTab = tabName;
    document.querySelectorAll('.tabs .tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    adminManager.loadAds();
}

function showNotificationTab(tabName) {
    adminManager.currentNotificationTab = tabName;
    document.querySelectorAll('.tabs .tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    adminManager.loadNotifications();
}

// 사용자 관리 함수들
function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const container = document.getElementById('users-container');
    
    if (!searchTerm) {
        adminManager.loadUsers();
        return;
    }

    const filteredUsers = adminManager.users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
    );

    if (filteredUsers.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">검색 결과가 없습니다.</div>';
        return;
    }

    container.innerHTML = filteredUsers.map(user => {
        const isRecentlyActive = user.lastLogin && (new Date() - new Date(user.lastLogin)) < 24 * 60 * 60 * 1000;
        const statusBadge = isRecentlyActive ? 
            '<span class="badge badge-success">활성</span>' : 
            '<span class="badge badge-warning">비활성</span>';
        
        return `
            <div class="user-item">
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">${user.name}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${user.email}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${user.phone || '전화번호 없음'}</div>
                    <div style="font-size: 12px; color: #666;">${user.address || '주소 없음'}</div>
                </div>
                <div>
                    ${statusBadge}
                    <button class="btn btn-danger" style="margin-left: 10px; padding: 6px 12px; font-size: 12px;" 
                            onclick="deleteUser(${user.id})">삭제</button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteUser(userId) {
    if (confirm('정말로 이 사용자를 삭제하시겠습니까? 모든 관련 데이터가 함께 삭제됩니다.')) {
        adminManager.users = adminManager.users.filter(user => user.id !== userId);
        adminManager.friends = adminManager.friends.filter(friend => 
            friend.user_id !== userId && friend.friend_id !== userId
        );
        
        adminManager.saveToStorage('users', adminManager.users);
        adminManager.saveToStorage('friends', adminManager.friends);
        
        adminManager.loadStats();
        adminManager.loadUsers();
        
        showAlert('사용자가 성공적으로 삭제되었습니다.', 'success');
    }
}

// 광고 배너 관리 함수들
function addAdBanner() {
    const category = document.getElementById('ad-category').value;
    const title = document.getElementById('ad-title').value;
    const content = document.getElementById('ad-content').value;
    const linkUrl = document.getElementById('ad-link').value;
    const imageUrl = document.getElementById('ad-image').value;

    if (!title || !content) {
        showAlert('제목과 내용을 입력하세요.', 'danger');
        return;
    }

    const newAd = {
        id: Date.now(),
        title,
        content,
        linkUrl,
        imageUrl,
        isActive: true,
        createdAt: new Date().toISOString()
    };

    if (!adminManager.adBanners[category]) {
        adminManager.adBanners[category] = [];
    }

    adminManager.adBanners[category].push(newAd);
    adminManager.saveToStorage('adBanners', adminManager.adBanners);

    // 폼 초기화
    document.getElementById('ad-title').value = '';
    document.getElementById('ad-content').value = '';
    document.getElementById('ad-link').value = '';
    document.getElementById('ad-image').value = '';

    adminManager.loadAds();
    showAlert('광고 배너가 성공적으로 추가되었습니다.', 'success');
}

function deleteAd(category, adId) {
    if (confirm('정말로 이 광고를 삭제하시겠습니까?')) {
        adminManager.adBanners[category] = adminManager.adBanners[category].filter(ad => ad.id !== adId);
        adminManager.saveToStorage('adBanners', adminManager.adBanners);
        adminManager.loadAds();
        showAlert('광고가 성공적으로 삭제되었습니다.', 'success');
    }
}

// 비상 연락처 관리 함수들
function addEmergencyContact() {
    const name = document.getElementById('emergency-name').value;
    const phone = document.getElementById('emergency-phone').value;
    const type = document.getElementById('emergency-type').value;
    const address = document.getElementById('emergency-address').value;

    if (!name || !phone) {
        showAlert('기관명과 전화번호를 입력하세요.', 'danger');
        return;
    }

    const newContact = {
        id: Date.now(),
        name,
        phone,
        type,
        address,
        isActive: true,
        priority: adminManager.emergencyContacts.length + 1,
        createdAt: new Date().toISOString()
    };

    adminManager.emergencyContacts.push(newContact);
    adminManager.saveToStorage('emergencyContacts', adminManager.emergencyContacts);

    // 폼 초기화
    document.getElementById('emergency-name').value = '';
    document.getElementById('emergency-phone').value = '';
    document.getElementById('emergency-address').value = '';

    adminManager.loadEmergencyContacts();
    showAlert('비상 연락처가 성공적으로 추가되었습니다.', 'success');
}

function deleteEmergencyContact(contactId) {
    if (confirm('정말로 이 비상 연락처를 삭제하시겠습니까?')) {
        adminManager.emergencyContacts = adminManager.emergencyContacts.filter(contact => contact.id !== contactId);
        adminManager.saveToStorage('emergencyContacts', adminManager.emergencyContacts);
        adminManager.loadEmergencyContacts();
        showAlert('비상 연락처가 성공적으로 삭제되었습니다.', 'success');
    }
}

// 알림 관리 함수들
function sendSystemNotification() {
    const message = document.getElementById('system-message').value;
    
    if (!message) {
        showAlert('메시지를 입력하세요.', 'danger');
        return;
    }

    const systemNotification = {
        id: Date.now(),
        type: 'info',
        friend: '시스템',
        message: `[시스템 공지] ${message}`,
        timestamp: Date.now()
    };

    adminManager.notifications.unshift(systemNotification);
    adminManager.saveToStorage('notifications', adminManager.notifications);

    document.getElementById('system-message').value = '';
    adminManager.loadNotifications();
    adminManager.loadStats();
    
    showAlert('시스템 알림이 발송되었습니다.', 'success');
}

// 데이터 관리 함수들
function backupData() {
    const backupData = {
        users: adminManager.users,
        friends: adminManager.friends,
        adBanners: adminManager.adBanners,
        notifications: adminManager.notifications,
        emergencyContacts: adminManager.emergencyContacts,
        userActivities: adminManager.userActivities,
        backupDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ansimncare_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert('데이터 백업이 완료되었습니다.', 'success');
}

function resetData() {
    if (confirm('⚠️ 경고: 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
        if (confirm('정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localStorage.clear();
            showAlert('모든 데이터가 초기화되었습니다. 페이지를 새로고침합니다.', 'warning');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
}

function testDatabaseConnection() {
    const host = document.getElementById('db-host').value;
    const dbName = document.getElementById('db-name').value;
    const username = document.getElementById('db-user').value;
    const password = document.getElementById('db-password').value;

    if (!host || !dbName || !username || !password) {
        showAlert('모든 데이터베이스 정보를 입력하세요.', 'danger');
        return;
    }

    // 실제 구현에서는 서버에 연결 테스트 요청
    showAlert('데이터베이스 연결 기능은 백엔드 서버 구축 후 구현됩니다.', 'warning');
    
    // 설정 저장
    adminManager.dbSettings = { host, database: dbName, username, password, connected: false };
    adminManager.saveToStorage('dbSettings', adminManager.dbSettings);
}

function migrateToDB() {
    showAlert('데이터베이스 마이그레이션 기능은 백엔드 서버 구축 후 구현됩니다.', 'warning');
}

// 유틸리티 함수들
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `<strong>${type === 'success' ? '✅' : type === 'danger' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</strong> ${message}`;
    
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('안심케어 관리자 페이지가 로드되었습니다.');
    
    // 5초마다 통계 업데이트
    setInterval(() => {
        adminManager.loadStats();
    }, 5000);
});