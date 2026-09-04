const OWNER_EMAIL = 'radziuk219@gmail.com';

export function isOwnerRequest(request: Request) {
  const email =
    request.headers.get('cf-access-authenticated-user-email') ??
    request.headers.get('oai-authenticated-user-email');
  return email?.trim().toLowerCase() === OWNER_EMAIL;
}
