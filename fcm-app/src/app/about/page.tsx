import NavigationBar from '@/components/NavigationBar';
import Image from 'next/image';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <NavigationBar />
      
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">About FCM</h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Building Excellence Since 2019. We are a trusted construction and trading company 
              based in Cebu, dedicated to transforming visions into reality across the region and the Philippines.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Who We Are</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                FCM Trading and Services is a full-service construction company based in Cebu, 
                specializing in commercial and residential projects. With over 5 years of experience, 
                we've successfully completed 100+ projects primarily in Cebu and across the Philippines.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                <strong className="text-emerald-600">Most of our projects are located in Cebu</strong>, 
                where we've built strong relationships with local communities and established ourselves 
                as a trusted name in construction. Our deep understanding of Cebu's building landscape 
                allows us to deliver projects that meet local standards and exceed expectations.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Our expertise spans from material supply and design to comprehensive construction 
                and renovation services. We pride ourselves on delivering quality workmanship, 
                timely completion, and exceptional customer service.
              </p>
              <p className="text-gray-600 leading-relaxed">
                From small renovations to large-scale commercial developments in Cebu City and surrounding 
                areas, we bring the same level of dedication and attention to detail to every project we undertake.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-6 rounded-xl">
                <div className="text-4xl font-bold text-emerald-600 mb-2">100+</div>
                <div className="text-gray-700 font-semibold">Projects Completed</div>
                <div className="text-xs text-gray-500 mt-1">Mostly in Cebu</div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-xl">
                <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
                <div className="text-gray-700 font-semibold">Happy Clients</div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-xl">
                <div className="text-4xl font-bold text-emerald-600 mb-2">5+</div>
                <div className="text-gray-700 font-semibold">Years Experience</div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-xl">
                <div className="text-4xl font-bold text-emerald-600 mb-2">100%</div>
                <div className="text-gray-700 font-semibold">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Proudly Serving Cebu</h2>
            <p className="text-xl text-emerald-100 leading-relaxed">
              As a Cebu-based company, we've completed numerous projects across Cebu City, 
              Mandaue, Lapu-Lapu, Liloan, Carcar, and other municipalities in the province. 
              Our local presence ensures faster response times and better understanding of your needs.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  To deliver exceptional construction and trading services throughout Cebu and the Philippines 
                  that exceed client expectations through innovation, quality craftsmanship, and unwavering 
                  commitment to safety and sustainability.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To be the leading construction and trading company in Cebu and the Philippines, recognized for 
                  our integrity, excellence, and positive impact on the communities we serve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do and define who we are as a company.
            </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center group">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500 transition-colors duration-300">
                <svg className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quality</h3>
                <p className="text-gray-600 text-sm">
                Excellence in every detail, every time
                </p>
            </div>

            <div className="text-center group">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500 transition-colors duration-300">
                <svg className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Integrity</h3>
                <p className="text-gray-600 text-sm">
                Honest and transparent in all dealings
                </p>
            </div>

            <div className="text-center group">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500 transition-colors duration-300">
                <svg className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
                <p className="text-gray-600 text-sm">
                Embracing modern solutions and methods
                </p>
            </div>

            <div className="text-center group">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500 transition-colors duration-300">
                <svg className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reliability</h3>
                <p className="text-gray-600 text-sm">
                Delivering on promises, on time
                </p>
            </div>
            </div>
        </div>
        </section>

        <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What We Do</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
                Comprehensive construction and trading services tailored to your needs across Cebu and beyond.
            </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Material Supply</h3>
                <p className="text-gray-600">
                Quality construction materials sourced from trusted suppliers for all your building needs in Cebu.
                </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Design & Planning</h3>
                <p className="text-gray-600">
                Expert architectural design and project planning services to bring your vision to life.
                </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Construction</h3>
                <p className="text-gray-600">
                Full-scale construction services for commercial and residential projects of all sizes.
                </p>
            </div>
            </div>
        </div>
        </section>

      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Let's work together to turn your construction dreams into reality. Based in Cebu, ready to serve you.
          </p>
          <Link 
            href="/quotations"
            className="inline-block bg-emerald-500 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-emerald-600 transition shadow-lg"
          >
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}