export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026</p>

        <div className="prose prose-gray max-w-none text-sm text-gray-600 space-y-6">
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
            <p>By using ReplyPilot, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">2. What ReplyPilot Does</h2>
            <p>ReplyPilot uses AI to generate suggested replies to your Google Business reviews. You are responsible for reviewing and approving all replies before they are posted, unless you enable auto-post mode.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">3. Your Responsibilities</h2>
            <p>You are solely responsible for all content posted to your Google Business profile through ReplyPilot. You agree to review AI-generated replies for accuracy and appropriateness. ReplyPilot is not responsible for any damage caused by posted replies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">4. Auto-Post Mode</h2>
            <p>If you enable auto-post mode, replies will be posted to Google automatically without your review. Use this feature at your own risk. You can disable it at any time from your dashboard.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">5. Account Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or misuse the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">6. Limitation of Liability</h2>
            <p>ReplyPilot is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">7. Contact</h2>
            <p>For questions about these terms, contact us at support@replypilot.com.</p>
          </section>
        </div>

        <a href="/" className="inline-block mt-8 text-sm text-blue-600 hover:underline">← Back to dashboard</a>
      </div>
    </main>
  );
}
