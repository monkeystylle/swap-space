// app/disclaimer/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DisclaimerPage() {
  return (
    <div className="container-custom">
      <div className="max-w-4xl mx-auto py-6 sm:py-8 md:py-12">
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              Terms of Use
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Important information about using Swap Space
            </p>
          </div>

          <div className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none space-y-6 px-4">
            {/* Responsive prose sections */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                  Platform Responsibility
                </h2>
                <p className="text-foreground leading-relaxed text-sm sm:text-base">
                  Swap Space is a platform that facilitates connections between
                  users who wish to barter items and services. We provide the
                  technology and infrastructure to enable these connections, but
                  we are <strong>not responsible</strong> for the actual
                  transactions, exchanges, or interactions that occur between
                  users.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                  User Responsibility
                </h2>
                <p className="text-foreground leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                  By using Swap Space, you acknowledge and agree that:
                </p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2 text-foreground text-sm sm:text-base">
                  <li>
                    You are solely responsible for verifying the identity,
                    legitimacy, and trustworthiness of other users
                  </li>
                  <li>
                    You must exercise your own judgment when evaluating items,
                    services, and offers
                  </li>
                  <li>
                    You are responsible for conducting your own due diligence
                    before entering into any barter agreement
                  </li>
                  <li>
                    All negotiations, agreements, and exchanges are conducted at
                    your own risk
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Legal Disclaimer - Philippines
                </h2>
                <p className="text-foreground leading-relaxed">
                  In the Philippines, there is no specific law that outright
                  prohibits bartering (the exchange of goods or services without
                  using money). Bartering is generally allowed and is a
                  traditional practice in many communities, especially in rural
                  areas.
                </p>
                <p className="text-foreground leading-relaxed">
                  However, there are certain regulations and tax implications
                  that may apply to bartering, depending on the context:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-foreground">
                  <li>
                    <strong>Tax Implications</strong> – The Bureau of Internal
                    Revenue (BIR) considers barter transactions as taxable if
                    they involve business-related exchanges. The fair market
                    value of the goods or services exchanged may be subject to
                    income tax, value-added tax (VAT), or other applicable taxes
                    under the National Internal Revenue Code (Tax Reform Act of
                    1997).
                  </li>
                  <li>
                    <strong>Business Regulations</strong> – If bartering is
                    conducted as part of a business operation, it may need to
                    comply with local business permits and registration
                    requirements under the Philippine Business Laws.
                  </li>
                  <li>
                    <strong>Cross-Border Bartering</strong> – International
                    barter trade (e.g., between the Philippines and other
                    countries) may be subject to customs regulations under the
                    Customs Modernization and Tariff Act (CMTA).
                  </li>
                  <li>
                    <strong>Local Ordinances</strong> – Some local government
                    units (LGUs) may have specific rules on bartering,
                    especially in public markets or during special events.
                  </li>
                </ul>
                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border mt-4">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    Special Case: Barter Trade in Sulu and Tawi-Tawi
                  </h3>
                  <p className="text-foreground text-xs sm:text-sm leading-relaxed">
                    Historically, barter trade has been a significant economic
                    activity in the southern Philippines (particularly between
                    Sulu/Tawi-Tawi and neighboring countries like Malaysia and
                    Indonesia). The government regulates this through the
                    Mindanao Barter Council to ensure legality and prevent
                    smuggling.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-foreground leading-relaxed">
                  Swap Space explicitly disclaims any responsibility or
                  liability for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>
                    <strong>Fraudulent activities</strong> including but not
                    limited to scams, hoaxes, or misrepresentation of
                    items/services
                  </li>
                  <li>
                    <strong>Quality issues</strong> with items or services
                    exchanged between users
                  </li>
                  <li>
                    <strong>Failed transactions</strong> or disputes arising
                    from barter agreements
                  </li>
                  <li>
                    <strong>Personal safety</strong> during in-person meetings
                    or exchanges
                  </li>
                  <li>
                    <strong>Financial losses</strong> resulting from fraudulent
                    or unsuccessful transactions
                  </li>
                  <li>
                    <strong>Damaged, stolen, or counterfeit items</strong>{' '}
                    involved in exchanges
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Safety Recommendations
                </h2>
                <p className="text-foreground leading-relaxed">
                  While we cannot guarantee the safety or legitimacy of
                  transactions, we strongly recommend:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>
                    Meeting in public, well-lit locations for in-person
                    exchanges
                  </li>
                  <li>
                    Bringing a friend or family member to exchanges when
                    possible
                  </li>
                  <li>
                    Thoroughly inspecting items before completing exchanges
                  </li>
                  <li>
                    Trusting your instincts - if something feels wrong,
                    don&apos;t proceed
                  </li>
                  <li>
                    Reporting suspicious users or activities to proper
                    authorities
                  </li>
                  <li>Keeping records of your communications and agreements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Dispute Resolution
                </h2>
                <p className="text-foreground leading-relaxed">
                  Swap Space does not mediate disputes between users. Any
                  disagreements, conflicts, or legal issues arising from barter
                  transactions must be resolved directly between the involved
                  parties. We may, at our discretion, remove users who violate
                  our community guidelines, but this does not constitute an
                  endorsement of any particular user or transaction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Legal Compliance
                </h2>
                <p className="text-foreground leading-relaxed">
                  Users are responsible for ensuring their barter activities
                  comply with all applicable local, state, and federal laws.
                  This includes but is not limited to tax obligations, licensing
                  requirements, and regulations governing the exchange of
                  specific types of items or services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Changes to This Disclaimer
                </h2>
                <p className="text-foreground leading-relaxed">
                  We reserve the right to update this disclaimer at any time.
                  Continued use of Swap Space after changes are posted
                  constitutes acceptance of the updated terms.
                </p>
              </section>

              <div className="bg-muted/50 p-4 sm:p-6 rounded-lg border">
                <p className="text-foreground font-medium text-sm sm:text-base">
                  <strong>
                    By using Swap Space, you acknowledge that you have read,
                    understood, and agree to this disclaimer.
                  </strong>
                </p>
                <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-6 sm:pt-8 px-4">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
