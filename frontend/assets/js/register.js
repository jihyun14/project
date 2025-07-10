
document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소 선택 (HTML ID에 맞춰서 변경 및 추가)
    const registerForm = document.getElementById('register-form'); // 폼 ID 변경: signupForm -> register-form
    const submitBtn = document.getElementById('submit-btn'); // 제출 버튼 ID 추가
    const errorEl = document.getElementById('error-message'); // 에러 메시지 영역 ID 추가

    const usernameInput = document.getElementById('username');
    const idInput = document.getElementById('id'); // '아이디' 필드 추가
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password_confirm'); // ID 변경: confirm-password -> password_confirm
    const imageInput = document.getElementById('profile_image'); // ID 변경: profile-image -> profile_image
    // const bioInput = document.getElementById('bio'); // 현재 HTML에 bio 필드가 없으므로 주석 처리 또는 제거

    // 프로필 이미지 미리보기 관련 요소
    const profileImagePreview = document.getElementById('profile-image-preview');
    const profilePlaceholder = document.getElementById('profile-placeholder');
    const profilePreviewArea = document.querySelector('.profile-preview-area');

    // 비밀번호 토글 아이콘 관련 요소
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    // --- 프로필 이미지 미리보기 기능 ---
    if (imageInput && profileImagePreview && profilePlaceholder && profilePreviewArea) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];

            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImagePreview.src = e.target.result;
                    profilePreviewArea.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            } else {
                profileImagePreview.src = "#";
                profilePreviewArea.classList.remove('has-image');
            }
        });

        profilePreviewArea.addEventListener('click', function() {
            imageInput.click();
        });
    }

    // --- 비밀번호 토글 기능 ---
    function setupPasswordToggle(inputElement, toggleElement) {
        if (toggleElement) {
            toggleElement.addEventListener('click', function() {
                const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
                inputElement.setAttribute('type', type);

                // 아이콘 이미지 변경
                if (type === 'password') {
                    toggleElement.querySelector('img').src = 'assets/images/eye-slash-solid.svg';
                    toggleElement.querySelector('img').alt = '비밀번호 숨김';
                } else {
                    toggleElement.querySelector('img').src = 'assets/images/eye-solid.svg';
                    toggleElement.querySelector('img').alt = '비밀번호 보임';
                }
                inputElement.focus();
            });
        }
    }

    setupPasswordToggle(passwordInput, togglePassword);
    setupPasswordToggle(passwordConfirmInput, toggleConfirmPassword);


    // --- 회원가입 폼 제출 처리 및 유효성 검사 (서버 통신 로직 포함) ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => { // async 함수로 변경
            e.preventDefault();

            errorEl.innerText = ''; // 이전 에러 메시지 초기화
            submitBtn.disabled = true;
            submitBtn.innerText = '처리 중...';

            // 1. 클라이언트 측 유효성 검사
            if (usernameInput.value.trim().length < 2) {
                errorEl.innerText = '사용자 이름은 최소 2자 이상이어야 합니다.';
                submitBtn.disabled = false;
                submitBtn.innerText = '가입하기';
                usernameInput.focus();
                return;
            }

            // 아이디 유효성 검사 (필요에 따라 규칙 추가)
            if (idInput.value.trim().length < 4) {
                errorEl.innerText = '아이디는 최소 4자 이상이어야 합니다.';
                submitBtn.disabled = false;
                submitBtn.innerText = '가입하기';
                idInput.focus();
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value.trim())) {
                errorEl.innerText = '유효한 이메일 주소를 입력해주세요.';
                submitBtn.disabled = false;
                submitBtn.innerText = '가입하기';
                emailInput.focus();
                return;
            }

            const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (!passwordPattern.test(passwordInput.value)) {
                errorEl.innerText = '비밀번호는 최소 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.';
                submitBtn.disabled = false;
                submitBtn.innerText = '가입하기';
                passwordInput.focus();
                return;
            }

            if (passwordInput.value !== passwordConfirmInput.value) {
                errorEl.innerText = '비밀번호가 일치하지 않습니다.';
                submitBtn.disabled = false;
                submitBtn.innerText = '가입하기';
                passwordConfirmInput.focus();
                return;
            }

            // 2. 텍스트 데이터 추출 (프로필 이미지는 별도로 처리)
            const textData = {
                username: usernameInput.value.trim(),
                user_id: idInput.value.trim(), // '아이디' 필드 데이터 추가
                email: emailInput.value.trim(),
                password: passwordInput.value,
                password_confirm: passwordConfirmInput.value 
                // bio: bioInput ? bioInput.value.trim() : '' // HTML에 bio 필드가 없으므로 주석 처리
            };

            try {
                // 3. 텍스트 데이터로 회원가입 및 자동 로그인 요청
                const registerResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(textData)
                });

                if (!registerResponse.ok) {
                    const errorData = await registerResponse.json();
                    throw new Error(errorData.detail || '회원가입에 실패했습니다. 이미 존재하는 아이디 또는 이메일일 수 있습니다.');
                }

                // 4. 프로필 사진 파일이 있으면, 이어서 이미지 업로드 요청
                const imageFile = imageInput.files[0];
                if (imageFile) {
                    const imageFormData = new FormData();
                    imageFormData.append("file", imageFile);

                    const imageResponse = await fetch('/api/users/me/upload-image', {
                        method: 'POST',
                        body: imageFormData,
                        credentials: 'include' // 자동 로그인된 세션 쿠키를 보내기 위해 필수
                    });

                    if (!imageResponse.ok) {
                        console.error('이미지 업로드에 실패했지만, 회원가입은 완료되었습니다.');
                        // 사용자에게는 실패했다고 알리지 않거나, 경고 메시지만 보여줄 수 있음
                    }
                }

                // 성공 메시지 및 페이지 이동
                alert('회원가입이 완료되었습니다. 메인 페이지로 이동합니다.');
                window.location.href = '/index.html';

            } catch(error) {
                errorEl.innerText = error.message; // 에러 메시지 표시
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = '가입하기'; // 버튼 상태 원래대로 복구
            }
        });
    }
});