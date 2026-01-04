// apps/backend/src/modules/google-oauth/index.ts

export { GoogleOAuthToken, IGoogleOAuthToken, GoogleScope } from './GoogleOAuthToken';
export { googleOAuthService, GoogleOAuthService } from './google-oauth.service';
export { googleOAuthController } from './google-oauth.controller';
export { default as googleOAuthRoutes } from './google-oauth.routes';
