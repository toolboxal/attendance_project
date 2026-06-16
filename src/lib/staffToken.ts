const STAFF_TOKEN_KEY = "asistir_staff_token";

export function getStaffAccessToken(): string {
	return localStorage.getItem(STAFF_TOKEN_KEY) ?? "";
}

export function clearStaffAccessToken(): void {
	localStorage.removeItem(STAFF_TOKEN_KEY);
}
