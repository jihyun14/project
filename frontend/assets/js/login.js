// script.js (HTML 파일의 </body> 태그 바로 위에 <script src="script.js"></script>로 연결)

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form');

    loginForm.addEventListener('submit', function(event) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (usernameInput.value.trim() === '') {
            alert('사용자 이름 또는 이메일을 입력해주세요.');
            event.preventDefault(); // 폼 제출 방지
            usernameInput.focus();
            return;
        }

        if (passwordInput.value.trim() === '') {
            alert('비밀번호를 입력해주세요.');
            event.preventDefault(); // 폼 제출 방지
            passwordInput.focus();
            return;
        }

        // 비밀번호 길이 검사 (예시)
        if (passwordInput.value.length < 6) {
            alert('비밀번호는 최소 6자 이상이어야 합니다.');
            event.preventDefault(); // 폼 제출 방지
            passwordInput.focus();
            return;
        }

        // 여기에 추가적인 유효성 검사 로직을 넣을 수 있습니다.
        // 예: 이메일 형식 검사, 특수문자 포함 여부 등

        // 모든 검사를 통과하면 폼이 제출됩니다.
        // 실제 로그인 처리는 서버에서 이루어져야 합니다.
        // alert('로그인 시도...');
    });
});