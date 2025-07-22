import OfferNotificationEmail from '@/emails/notification/offer-notification-email';
import { resend } from '@/lib/resend';

export const sendOfferNotificationEmail = async (
  ownerName: string,
  ownerEmail: string,
  offererName: string,
  itemTitle: string,
  offerContent: string,
  itemUrl: string
) => {
  try {
    const result = await resend.emails.send({
      from: 'Swap Space <noreply@swap-space-app.com>',
      to: ownerEmail,
      subject: `New offer on your item: ${itemTitle}`,
      react: OfferNotificationEmail({
        ownerName,
        offererName,
        itemTitle,
        offerContent,
        itemUrl,
      }),
    });

    return result;
  } catch (error) {
    console.error('Failed to send offer notification email:', error);
    throw error;
  }
};
