const SIGNED_OUT_SESSION_KEY = "asistir_signed_out";

export function markSignedOut() {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(SIGNED_OUT_SESSION_KEY, "1");
}

export function hasSignedOutFlag() {
	if (typeof window === "undefined") return false;
	return sessionStorage.getItem(SIGNED_OUT_SESSION_KEY) === "1";
}

export function clearSignedOutFlag() {
	if (typeof window === "undefined") return;
	sessionStorage.removeItem(SIGNED_OUT_SESSION_KEY);
}
