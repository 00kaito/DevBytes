// EmailLabs.io configuration
if (!process.env.EMAILLABS_APP_KEY || !process.env.EMAILLABS_SECRET_KEY) {
  throw new Error("EMAILLABS_APP_KEY and EMAILLABS_SECRET_KEY environment variables must be set");
}

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
    const credentials = Buffer.from(`${process.env.EMAILLABS_APP_KEY}:${process.env.EMAILLABS_SECRET_KEY}`).toString('base64');
    
    const emailData = new URLSearchParams({
      from: process.env.EMAILLABS_FROM_EMAIL || 'noreply@your-domain.com',
      from_name: 'DevPodcasts',
      to: JSON.stringify({ [params.to]: { message_id: `verification_${Date.now()}` } }),
      subject: 'Potwierdź swój adres email - DevPodcasts',
      smtp_account: process.env.EMAILLABS_SMTP_ACCOUNT || '1.default.smtp',
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
      text: `Potwierdź swój adres email\n\nCześć ${params.firstName}!\n\nDziękujemy za rejestrację w naszym marketplace podcastów. Aby dokończyć rejestrację, wejdź na następujący link:\n\n${verificationUrl}\n\nJeśli nie rejestrowałeś się w naszym serwisie, zignoruj ten email.\nLink jest ważny przez 24 godziny.`
    });

    const response = await fetch('https://api.emaillabs.net.pl/api/sendmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: emailData.toString()
    });

    const result = await response.json();
    
    if (response.ok && result.status === 'success') {
      return true;
    } else {
      console.error('EmailLabs email verification error:', result);
      return false;
    }
  } catch (error) {
    console.error('EmailLabs email verification error:', error);
    return false;
  }
}

export async function sendPasswordReset(params: PasswordResetParams): Promise<boolean> {
  const resetUrl = `${params.baseUrl}/reset-password?token=${params.resetToken}`;
  
  try {
    const credentials = Buffer.from(`${process.env.EMAILLABS_APP_KEY}:${process.env.EMAILLABS_SECRET_KEY}`).toString('base64');
    
    const emailData = new URLSearchParams({
      from: process.env.EMAILLABS_FROM_EMAIL || 'noreply@your-domain.com',
      from_name: 'DevPodcasts',
      to: JSON.stringify({ [params.to]: { message_id: `password_reset_${Date.now()}` } }),
      subject: 'Reset hasła - DevPodcasts',
      smtp_account: process.env.EMAILLABS_SMTP_ACCOUNT || '1.default.smtp',
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
      text: `Reset hasła\n\nCześć ${params.firstName}!\n\nOtrzymaliśmy prośbę o reset hasła do Twojego konta. Wejdź na następujący link aby ustawić nowe hasło:\n\n${resetUrl}\n\nJeśli nie prosiłeś o reset hasła, zignoruj ten email.\nLink jest ważny przez 1 godzinę.`
    });

    const response = await fetch('https://api.emaillabs.net.pl/api/sendmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: emailData.toString()
    });

    const result = await response.json();
    
    if (response.ok && result.status === 'success') {
      return true;
    } else {
      console.error('EmailLabs password reset error:', result);
      return false;
    }
  } catch (error) {
    console.error('EmailLabs password reset error:', error);
    return false;
  }
}