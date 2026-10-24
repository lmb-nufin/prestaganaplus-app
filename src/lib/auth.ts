
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { findUserByAssociateNumber } from './data';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ associateNumber: z.string(), nip: z.string().min(4) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { associateNumber, nip } = parsedCredentials.data;
          
          const user = await findUserByAssociateNumber(associateNumber);
          
          if (!user) {
            console.log(`[AUTH] User ${associateNumber} not found.`);
            return null;
          }

          const nipsMatch = user.nip === nip;

          if (nipsMatch) {
            console.log(`[AUTH] Successful login for ${associateNumber}`);
            return { 
                id: user.id,
                name: user.name, 
                associateNumber: user.associateNumber,
                email: user.email,
            };
          }
          
          console.log(`[AUTH] Invalid NIP for ${associateNumber}`);
          return null;
        }
        
        console.log('Invalid credentials format provided to authorize function.');
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.associateNumber && session.user) {
        session.user.associateNumber = token.associateNumber as string;
      }
      if (token.nip && session.user) {
        session.user.nip = token.nip as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user && user.associateNumber) {
        const dbUser = await findUserByAssociateNumber(user.associateNumber);
        if (dbUser) {
            token.associateNumber = dbUser.associateNumber;
            token.nip = dbUser.nip;
        }
      }
      return token;
    }
  },
 trustHost: true,
  secret: process.env.AUTH_SECRET,
});
