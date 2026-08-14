export function isVerificationEndpointEnabled(environment: string | undefined): boolean {
  return environment === 'development' || environment === 'test'
}
