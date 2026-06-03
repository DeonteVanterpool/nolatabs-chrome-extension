export function firebaseError(errorCode: string, errorMessage: string): string {
    return `Firebase error ${errorCode}: ${errorMessage}`;
}
