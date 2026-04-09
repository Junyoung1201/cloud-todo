export const ERROR_MESSAGES = {
    // 공통 에러
    COMMON: {
        SERVER_ERROR: '서버 오류가 발생했습니다.',
        UNAUTHORIZED: '인증이 필요합니다.',
        ACCESS_TOKEN_REQUIRED: '액세스 토큰이 필요합니다.',
    },

    // 인증 관련 에러
    AUTH: {
        // 회원가입
        USER_ALREADY_EXISTS: '이미 존재하는 사용자입니다.',
        EMAIL_TOO_LONG: '이메일은 255자 이하여야 합니다.',
        PASSWORD_LENGTH_INVALID: '비밀번호는 6-72자 사이여야 합니다.',
        USERNAME_TOO_LONG: '사용자 이름은 100자 이하여야 합니다.',

        // 로그인
        INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
        INVALID_EMAIL_FORMAT: '잘못된 이메일 형식입니다.',
        INVALID_PASSWORD_FORMAT: '잘못된 비밀번호 형식입니다.',
        AUTH_ERROR: "인증 오류",

        // 이메일 변경
        EMAIL_ALREADY_IN_USE: '이미 사용 중인 이메일입니다.',

        // 비밀번호 변경
        CURRENT_PASSWORD_INCORRECT: '현재 비밀번호가 일치하지 않습니다.',
        NEW_PASSWORD_LENGTH_INVALID: '새 비밀번호는 6-72자 사이여야 합니다.',

        // 2FA
        TWO_FACTOR_ALREADY_ENABLED: '이미 2차 인증이 활성화되어 있습니다.',
        TWO_FACTOR_NOT_ENABLED: '2차 인증이 활성화되어 있지 않습니다.',
        TWO_FACTOR_INVALID_CODE: '인증 코드가 올바르지 않습니다.',
        TWO_FACTOR_REQUIRED: '2차 인증이 필요합니다.',
    },

    // TODO 리스트 관련 에러
    TODO_LIST: {
        NOT_FOUND: '할 일 리스트를 찾을 수 없습니다.',
        TITLE_TOO_LONG: '리스트 제목은 255자 이하여야 합니다.',
        INVALID_LIST_IDS: 'listIds는 배열이어야 합니다.',
    },

    // TODO 관련 에러
    TODO: {
        NOT_FOUND: '할 일을 찾을 수 없습니다.',
        TITLE_TOO_LONG: 'TODO 제목은 1000자 이하여야 합니다.',
        INVALID_TODO_IDS: 'todoIds는 배열이어야 합니다.',
    },
};

export const SUCCESS_MESSAGES = {
    AUTH: {
        ACCOUNT_DELETED: '계정이 삭제되었습니다.',
        PASSWORD_CHANGED: '비밀번호가 변경되었습니다.',
        TWO_FACTOR_ENABLED: '2차 인증이 활성화되었습니다.',
        TWO_FACTOR_DISABLED: '2차 인증이 비활성화되었습니다.',
    },
};
