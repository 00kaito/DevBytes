import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { users } from '../shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

export class AuthService {
  // Hash password with bcrypt
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password with bcrypt
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate secure random token
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }


  // Generate password reset token with expiration
  static generatePasswordResetToken(): {
    token: string;
    expires: Date;
  } {
    return {
      token: this.generateToken(),
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };
  }


  // Verify password reset token
  static async verifyPasswordResetToken(token: string): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, token));

      if (!user) {
        return { success: false, message: 'Nieprawidłowy token resetowania hasła' };
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return { success: false, message: 'Token resetowania hasła wygasł' };
      }

      return { success: true, userId: user.id, message: 'Token jest prawidłowy' };
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      return { success: false, message: 'Błąd podczas weryfikacji' };
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const verification = await this.verifyPasswordResetToken(token);
      if (!verification.success || !verification.userId) {
        return verification;
      }

      const hashedPassword = await this.hashPassword(newPassword);

      await db
        .update(users)
        .set({
          passwordHash: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, verification.userId));

      return { success: true, message: 'Hasło zostało pomyślnie zmienione' };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, message: 'Błąd podczas zmiany hasła' };
    }
  }
}