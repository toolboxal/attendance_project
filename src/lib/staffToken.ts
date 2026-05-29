export function getStaffAccessToken(): string {
	return localStorage.getItem("asistir_staff_token") ?? "";
}
