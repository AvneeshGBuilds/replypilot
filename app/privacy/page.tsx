export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026</p>

        <div className="prose prose-gray max-w-none text-sm text-gray-600 space-y-6">
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">1. What We Collect</h2>
            <p>We collect your Google account email, your Google Business review data, and your reply preferences. We do not collect payment information directly — payments are handled by Stripe.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">2. How We Use Your Data</h2>
            <p>We use your data solely to provide the ReplyPilot service — reading your reviews and generating AI replies. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">3. Google Data</h2>
            <p>ReplyPilot accesses your Google Business Profile data through Google's official API. We only request permissions necessary to read reviews and post replies. You can revoke access at any time through your Google account settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">4. AI Processing</h2>
            <p>Review text is sent to Google's Gemini AI to generate reply suggestions. By using ReplyPilot, you consent to this processing. Review data is not used to train AI models.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">5. Data Storage</h2>
            <p>Your data is stored securely in Google Firebase. We retain review data for as long as your account is active. You can request deletion of your data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">6. Cookies</h2>
            <p>We use cookies only for authentication purposes to keep you logged in. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">7. Contact</h2>
            <p>For privacy questions or data deletion requests, contact us at privacy@replypilot.com.</p>
          </section>
        </div>

        <a href="/" className="inline-block mt-8 text-sm text-blue-600 hover:underline">← Back to dashboard</a>
      </div>
    </main>
  );
}
