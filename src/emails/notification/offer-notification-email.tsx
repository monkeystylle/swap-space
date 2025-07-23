import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
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
        <Body className="font-sans bg-gray-50 m-0 p-0">
          <Container className="max-w-2xl mx-auto bg-white">
            {/* Header */}
            <Section className="bg-emerald-600 px-8 py-6">
              <Container className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Img
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNNiAzaDJhMiAyIDAgMCAxIDIgMnYxNGEyIDIgMCAwIDEtMiAySDZhMiAyIDAgMCAxLTItMlY1YTIgMiAwIDAgMSAyLTJ6IiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBhdGggZD0iTTE2IDNoMmEyIDIgMCAwIDEgMiAydjEwYTIgMiAwIDAgMS0yIDJoLTJhMiAyIDAgMCAxLTItMlY1YTIgMiAwIDAgMSAyLTJ6IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPgo="
                    alt="Swap Space Logo"
                    width="32"
                    height="32"
                    className="mr-3"
                  />
                  <Text className="text-3xl font-bold text-white m-0">
                    Swap Space
                  </Text>
                </div>
                <Text className="text-emerald-100 text-sm m-0">
                  Your barterplace for items and services
                </Text>
              </Container>
            </Section>

            {/* Main Content */}
            <Section className="px-8 py-8">
              <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
                🎉 You received a new offer!
              </Text>

              <Text className="text-lg text-gray-700 mb-4">
                Hi {ownerName},
              </Text>

              <Text className="text-base text-gray-600 mb-4 leading-relaxed">
                <strong className="text-gray-800">{offererName}</strong> is
                interested in your item and has made an offer on{' '}
                <strong className="text-emerald-600">{itemTitle}</strong>.
              </Text>

              {/* Offer Details Box */}
              <Section className="bg-gray-50 border-l-4 border-emerald-500 p-4 mb-6 rounded-r-lg">
                <Text className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Offer Details:
                </Text>
                <Text className="text-base text-gray-700 m-0 italic">
                  {offerContent}
                </Text>
              </Section>

              {/* CTA Button */}
              <Section className="text-center mb-8">
                <Button
                  href={itemUrl}
                  className="bg-emerald-600 rounded-lg text-white px-8 py-4 text-base font-semibold no-underline inline-block shadow-lg"
                >
                  View Offer
                </Button>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="px-8 py-3 bg-gray-100">
              <Container className="text-center">
                <Text className="text-xs text-gray-500 mb-2">
                  This email was sent to you because you have an active listing
                  on Swap Space.
                </Text>
                <Text className="text-xs text-gray-500 mb-2">
                  © 2024 Swap Space. All rights reserved.
                </Text>
                {/* Unsubscribe Links */}
                <Section className="mb-0">
                  <Text className="text-xs text-gray-500 mx-2 inline">
                    Unsubscribe
                  </Text>
                  <Text className="text-gray-400 inline mx-1 text-xs">|</Text>
                  <Text className="text-xs text-gray-500 mx-2 inline">
                    Privacy Policy
                  </Text>
                  <Text className="text-gray-400 inline mx-1 text-xs">|</Text>
                  <Text className="text-xs text-gray-500 mx-2 inline">
                    Contact Support
                  </Text>
                </Section>
              </Container>
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
