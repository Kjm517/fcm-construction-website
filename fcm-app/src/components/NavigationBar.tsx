'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NavigationBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center z-10">
            <Image 
              src="/images/fcmlogo.png" 
              alt="FCM Logo" 
              width={120} 
              height={50}
              className="h-12 w-auto"
            />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#home" className="text-gray-700 hover:text-emerald-600 font-medium transition">
              Home
            </Link>
            <Link href="/#projects" className="text-gray-700 hover:text-emerald-600 font-medium transition">
              Projects
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 font-medium transition">
              About
            </Link>
            <Link href="/quotations" className="bg-emerald-500 text-white px-6 py-2 rounded-md hover:bg-emerald-600 transition font-semibold">
              Get Quote
            </Link>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-800 hover:text-emerald-600 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-md z-10"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              <Link 
                href="/#home" 
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-emerald-600 font-medium transition py-2"
              >
                Home
              </Link>
              <Link 
                href="/#projects" 
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-emerald-600 font-medium transition py-2"
              >
                Projects
              </Link>
              <Link 
                href="/about" 
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-emerald-600 font-medium transition py-2"
              >
                About
              </Link>
              <Link 
                href="/quotations" 
                onClick={() => setIsMenuOpen(false)}
                className="bg-emerald-500 text-white px-6 py-2 rounded-md hover:bg-emerald-600 transition font-semibold text-center"
              >
                Get Quote
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}