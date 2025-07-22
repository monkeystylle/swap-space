import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

type OfferNotificationEmailProps = {
  ownerName: string;
  offererName: string;
  itemTitle: string;
  offerContent: string;
  itemUrl: string;
};

const OfferNotificationEmail = ({
  ownerName,
  offererName,
  itemTitle,
  offerContent,
  itemUrl,
}: OfferNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans m-8">
          <Container>
            <Section className="text-center">
              <Text className="text-2xl font-bold text-gray-800 mb-4">
                New Offer on Your Item!
              </Text>
            </Section>
            <Section>
              <Text className="text-lg text-gray-700 mb-2">
                Hello {ownerName},
              </Text>
              <Text className="text-base text-gray-600 ">
                <strong>{offererName}</strong> has made an offer on your item{' '}
                <strong>&ldquo;{itemTitle}&rdquo;</strong>.
              </Text>
              <Text className="text-base text-gray-600 mb-4">
                Offer details: &ldquo;{offerContent}&rdquo;
              </Text>
            </Section>
            <Section>
              <Button
                href={itemUrl}
                className="bg-blue-600 rounded text-white px-6 py-3 text-base font-medium"
              >
                View Offer
              </Button>
            </Section>
            <Section className="mt-8 ">
              <Text className="text-sm text-gray-500">
                This is an automated message from Swap Space. Please do not
                reply to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

OfferNotificationEmail.PreviewProps = {
  ownerName: 'John Doe',
  offererName: 'Jane Smith',
  itemTitle: 'Vintage Guitar',
  offerContent:
    'I would like to trade my camera for your guitar. Is it still available?',
  itemUrl: 'http://localhost:3000/item/abc123',
} as OfferNotificationEmailProps;

export default OfferNotificationEmail;
