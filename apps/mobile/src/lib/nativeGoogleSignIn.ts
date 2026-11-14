import {GoogleSignin, isSuccessResponse} from "@react-native-google-signin/google-signin";

let isConfigured = false;

function getWebClientId() {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!webClientId) {
        throw new Error("Brakuje EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID w konfiguracji buildu aplikacji.");
    }

    return webClientId;
}

function configureGoogleSignIn() {
    if (isConfigured) return;

    GoogleSignin.configure({
        // Token musi miec odbiorce zgodnego z klientem OAuth skonfigurowanym
        // po stronie Better Auth. To jest identyfikator publiczny, nie sekret.
        webClientId: getWebClientId(),
    });
    isConfigured = true;
}

/**
 * Pobiera natywny token tozsamosci Google dla Androida.
 * Token nie jest logowany ani zapisywany w aplikacji.
 */
export async function getNativeGoogleIdToken() {
    configureGoogleSignIn();
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) return null;

    if (!response.data.idToken) {
        throw new Error("Google nie zwrocilo tokenu tozsamosci. Sprawdz konfiguracje klienta OAuth Web.");
    }

    return response.data.idToken;
}
