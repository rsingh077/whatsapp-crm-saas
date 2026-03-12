import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: ['/inbox/:path*', '/guests/:path*', '/campaigns/:path*', '/automation/:path*', '/analytics/:path*', '/settings/:path*'],
};
