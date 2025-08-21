import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailVerificationParams {
  to: string;
  firstName: string;
  verificationToken: string;
  baseUrl: string;
}

interface PasswordResetParams {
  to: string;
  firstName: string;
  resetToken: string;
  baseUrl: string;
}

export async function sendEmailVerification(params: EmailVerificationParams): Promise<boolean> {
  const verificationUrl = `${params.baseUrl}/verify-email?token=${params.verificationToken}`;
  
  try {
    await mailService.send({
      to: params.to,
      from: 'noreply@yourpodcastapp.com', // Change this to your domain
      subject: 'Potwierdź swój adres email - Podcast Marketplace',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Potwierdź swój adres email</h1>
          <p>Cześć ${params.firstName}!</p>
          <p>Dziękujemy za rejestrację w naszym marketplace podcastów. Aby dokończyć rejestrację, kliknij poniższy link:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Potwierdź email
            </a>
          </div>
          <p>Jeśli nie rejestrowałeś się w naszym serwisie, zignoruj ten email.</p>
          <p>Link jest ważny przez 24 godziny.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
        </div>
      `,
      text: `
        Potwierdź swój adres email
        
        Cześć ${params.firstName}!
        
        Dziękujemy za rejestrację w naszym marketplace podcastów. Aby dokończyć rejestrację, wejdź na następujący link:
        
        ${verificationUrl}
        
        Jeśli nie rejestrowałeś się w naszym serwisie, zignoruj ten email.
        Link jest ważny przez 24 godziny.
      `
    });
    return true;
  } catch (error) {
    console.error('SendGrid email verification error:', error);
    return false;
  }
}

export async function sendPasswordReset(params: PasswordResetParams): Promise<boolean> {
  const resetUrl = `${params.baseUrl}/reset-password?token=${params.resetToken}`;
  
  try {
    await mailService.send({
      to: params.to,
      from: 'noreply@yourpodcastapp.com', // Change this to your domain
      subject: 'Reset hasła - Podcast Marketplace',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Reset hasła</h1>
          <p>Cześć ${params.firstName}!</p>
          <p>Otrzymaliśmy prośbę o reset hasła do Twojego konta. Kliknij poniższy link aby ustawić nowe hasło:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Zresetuj hasło
            </a>
          </div>
          <p>Jeśli nie prosiłeś o reset hasła, zignoruj ten email.</p>
          <p>Link jest ważny przez 1 godzinę.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      `,
      text: `
        Reset hasła
        
        Cześć ${params.firstName}!
        
        Otrzymaliśmy prośbę o reset hasła do Twojego konta. Wejdź na następujący link aby ustawić nowe hasło:
        
        ${resetUrl}
        
        Jeśli nie prosiłeś o reset hasła, zignoruj ten email.
        Link jest ważny przez 1 godzinę.
      `
    });
    return true;
  } catch (error) {
    console.error('SendGrid password reset error:', error);
    return false;
  }
}