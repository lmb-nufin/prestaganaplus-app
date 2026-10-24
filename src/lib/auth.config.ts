
import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: 'login',
  },
   callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnPublicRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register';
      const isOnDashboard = nextUrl.pathname.startsWith('/');

      if (isOnPublicRoute) {
        if (isLoggedIn) {
          // If the user is logged in, redirect them to the dashboard if they try to access login/register.
          return Response.redirect(new URL('/', nextUrl));
        }
         // If not logged in, allow access to public routes.
        return true;
      } else {
        if (isLoggedIn) {
          // If the user is logged in, allow them to access non-public routes.
          return true;
        }
        // If the user is not logged in and tries to access a protected route, redirect to login.
        return false;
      }
    },
  },
  trustHost: true,
  providers: [], // Add providers in auth.ts
} satisfies NextAuthConfig;
