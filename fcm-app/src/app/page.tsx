'use client';

import Image from 'next/image';
import Link from 'next/link';
import NavigationBar from '@/components/NavigationBar';
import { useState, useRef } from 'react';

// Video Card Component with thumbnail and play button
function VideoCard({ 
  videoSrc, 
  thumbnailSrc, 
  title, 
  description 
}: { 
  videoSrc: string; 
  thumbnailSrc?: string;
  title: string; 
  description: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClick = () => {
    setIsPlaying(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition group">
      <div className="aspect-[4/3] relative overflow-hidden">
        {!isPlaying ? (
          <>
            {/* Thumbnail or first frame fallback */}
            <div className="absolute inset-0 bg-gray-900">
              {thumbnailSrc ? (
                <Image
                  src={thumbnailSrc}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-300"
                />
              ) : (
                <video
                  src={videoSrc}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
            </div>
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition duration-300" />
            {/* Play button */}
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 flex items-center justify-center z-10"
              aria-label="Play video"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-300">
                <svg 
                  className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
            {/* Video duration badge */}
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
              1:20
            </div>
          </>
        ) : (
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            controls
            playsInline
            onEnded={handleVideoEnd}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

// Project Card Component for consistency
function ProjectCard({
  images,
  title,
  description,
}: {
  images: { src: string; alt: string }[];
  title: string;
  description: string;
}) {
  const isSingleImage = images.length === 1;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition group">
      <div className={`aspect-[4/3] relative overflow-hidden ${!isSingleImage ? 'grid grid-cols-2 gap-0.5' : ''}`}>
        {isSingleImage ? (
          <Image
            src={images[0].src}
            alt={images[0].alt}
            fill
            className="object-cover group-hover:scale-110 transition duration-300"
          />
        ) : (
          images.map((image, index) => (
            <div key={index} className="relative overflow-hidden">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-110 transition duration-300"
              />
            </div>
          ))
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <NavigationBar />

      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/main1.png"
            alt="Construction Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Diversified Services.<br />
              Unvarying Quality.
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              We designed 100+ commercial & residential projects in Cebu & across the Philippines.
              Providing Construction & Renovation services to everyone.
            </p>
            <Link
              href="#projects"
              className="inline-block bg-emerald-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-emerald-600 transition shadow-lg hover:shadow-xl"
            >
              See Our Work
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                5+ Years of Trust<br />
                and Integrity
              </h2>
              <p className="text-lg text-gray-600">
                With our capabilities we have reached these within 5 years.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/images/customer-pic.png"
                    alt="Customers"
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <div className="text-4xl font-bold text-emerald-600">20+</div>
                  <div className="text-gray-600 font-semibold">Satisfied Clients</div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/images/building-pic.png"
                    alt="Projects"
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <div className="text-4xl font-bold text-emerald-600">100+</div>
                  <div className="text-gray-600 font-semibold">Projects Completed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <h3 className="text-center text-sm font-bold text-gray-500 tracking-wider mb-8">
              OUR TRUSTED CLIENTS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="flex items-center justify-center p-4">
                <Image
                  src="/images/mendero.png"
                  alt="Mendero Medical Center"
                  width={150}
                  height={80}
                  className="grayscale hover:grayscale-0 transition"
                />
              </div>
              <div className="flex items-center justify-center p-4">
                <Image
                  src="/images/jolibee.jpg"
                  alt="Jollibee"
                  width={150}
                  height={80}
                  className="grayscale hover:grayscale-0 transition"
                />
              </div>
              <div className="flex items-center justify-center p-4">
                <Image
                  src="/images/yellowcab.svg"
                  alt="Yellow Cab"
                  width={150}
                  height={80}
                  className="grayscale hover:grayscale-0 transition"
                />
              </div>
              <div className="flex items-center justify-center p-4">
                <Image
                  src="/images/marialuisa.jpg"
                  alt="Maria Luisa"
                  width={150}
                  height={80}
                  className="grayscale hover:grayscale-0 transition"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
            SOME OF OUR WORKS
          </h2>

          {/* Top row - 3 cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <ProjectCard
              images={[
                { src: '/images/img1.png', alt: 'Jollibee Bulacao' },
                { src: '/images/img2.png', alt: 'Jollibee Bulacao' },
              ]}
              title="Jollibee Bulacao"
              description="Exterior Wall Repaint & Glass Cleaning"
            />

            <ProjectCard
              images={[
                { src: '/images/img3.png', alt: 'Jollibee Naga' },
                { src: '/images/jb-naga.jpg', alt: 'Jollibee Naga' },
              ]}
              title="Jollibee Naga"
              description="Renovation of counter, Retiling, Signage cleaning, electrical repairs and more."
            />

            <ProjectCard
              images={[
                { src: '/images/jb-guadalupe.jpg', alt: 'Jollibee Guadalupe' },
              ]}
              title="Jollibee Guadalupe"
              description="Fixing electrical and repainting"
            />
          </div>

          {/* Bottom row */}
          <div className="grid md:grid-cols-3 gap-8">
            <ProjectCard
              images={[
                { src: '/images/jb-banilad.jpg', alt: 'Jollibee Banilad' },
              ]}
              title="Jollibee Banilad"
              description="Repainting of Jollibee Drive Thru"
            />

            <ProjectCard
              images={[
                { src: '/images/residential-1.jpg', alt: 'Residential Project' },
                { src: '/images/residential-2.jpg', alt: 'Residential Project' },
              ]}
              title="Residential Projects"
              description="Residential Construction and Renovation"
            />

            <VideoCard
              videoSrc="/images/villa-azalea.mp4"
              title="Villa Azalea"
              description="Residential Construction Project"
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Let us help you build. Request Now!
          </h2>
          <p className="text-xl mb-12 text-gray-300">
            High-level experience in creating spaces that positively impact people's lives.
          </p>
          <Link
            href="/quotations"
            className="inline-block bg-emerald-500 text-white px-10 py-4 rounded-lg font-bold hover:bg-emerald-600 transition shadow-lg text-lg"
          >
            Apply for a Project
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-6 flex flex-col items-center justify-center text-center">
          <Image
            src="/images/fcmlogowhite.png"
            alt="FCM Logo"
            width={100}
            height={40}
            className="mb-4"
          />
          <p className="text-gray-400">
            © 2019 FCM Trading and Services. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}