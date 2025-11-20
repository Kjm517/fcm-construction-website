import Link from 'next/link';
import Image from 'next/image';

export default function NavigationBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
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
        </div>
      </div>
    </nav>
  );
}