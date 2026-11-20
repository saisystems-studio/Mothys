// // ---------------------------------------------------------------------------
// // NEXUS INTEGRATION PLACEHOLDER
// // Registration (and Nexus login / password recovery) belong to the external
// // Nexus system. Its API documentation has not been supplied, so no endpoints
// // are invented here. Replace the bodies below once the documentation exists.
// // ---------------------------------------------------------------------------

// export const NEXUS_NOT_CONFIGURED_MESSAGE =
//   'Nexus integration is not configured yet, so this request cannot be sent. Please contact your administrator.'

// function notConfigured() {
//   const error = new Error(NEXUS_NOT_CONFIGURED_MESSAGE)
//   error.userMessage = NEXUS_NOT_CONFIGURED_MESSAGE
//   error.nexusNotConfigured = true
//   return error
// }

// // Expected payload (from the registration screen): { name, email, contactNumber }
// export async function registerWithNexus() {
//   throw notConfigured()
// }

// export async function requestPasswordRecovery() {
//   throw notConfigured()
// }
