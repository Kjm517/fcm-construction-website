'use client';

import Link from 'next/link';
import NavigationBar from '@/components/NavigationBar';

export default function QuoteRequestSuccessPage() {

  return (
    <>
      <NavigationBar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-10 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-12 h-12 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quote Request Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your interest in our services.
            </p>
            <p className="text-base text-gray-700 mb-8 leading-relaxed">
              We have received your quote request and will review it shortly. Our team will contact you within 24-48 hours to discuss your project requirements and provide you with a detailed quotation.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-emerald-900 mb-3">
                What happens next?
              </h2>
              <ul className="text-left text-sm text-emerald-800 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Our team will review your project requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>We'll contact you via email or phone within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>We'll provide a detailed quotation based on your needs</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
              >
                Return to Home
              </Link>
              <Link
                href="/#projects"
                className="inline-block px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                View Our Projects
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

