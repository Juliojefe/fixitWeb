'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/app/providers/UserProvider';
import AuthLoading from '@/components/AuthLoading/AuthLoading';

export default function LandingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (user) {
      router.push('/explore');
    } else {
      setIsChecking(false);
    }
  }, [user, router]);

  // Smooth scroll to sections
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash) {
        const element = document.querySelector(window.location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('load', handleHash);
    return () => window.removeEventListener('load', handleHash);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(
        null,
        '',
        `#${sectionId}`
      );
    }
  };

  // Show loading spinner while checking auth
  if (isChecking) {
    return <AuthLoading message="Loading R3vly..." />;
  }

  return (
    <div className="min-h-screen bg-[#d2def9] text-black font-sans">
      {/* ==================== navigation ==================== */}
      <nav className="bg-white border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-8 py-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-x-2">
            <img
              src="favicon.ico"
              alt="R3vly"
              width={500}
              height={500}
              className="h-14 w-auto drop-shadow-md"
            />
          </div>

          {/* nav links */}
          <div className="hidden md:flex items-center gap-x-10 text-lg font-semibold">
            <a
              href="#community"
              onClick={(e) => handleNavClick(e, 'community')}
              className="hover:text-[#526fae] transition-colors"
            >
              Community
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="hover:text-[#526fae] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#for-mechanics"
              onClick={(e) => handleNavClick(e, 'for-mechanics')}
              className="hover:text-[#526fae] transition-colors"
            >
              For Mechanics
            </a>
            <a
              href="#explore"
              onClick={(e) => handleNavClick(e, 'explore')}
              className="hover:text-[#526fae] transition-colors"
            >
              Search
            </a>
            <a
              href="#reviews"
              onClick={(e) => handleNavClick(e, 'reviews')}
              className="hover:text-[#526fae] transition-colors"
            >
              Reviews
            </a>
          </div>

          {/* auth buttons */}
          <div className="flex items-center gap-x-4">
            <Link
              href="/login"
              className="px-6 py-2.5 text-base font-semibold border-2 border-black rounded-2xl hover:bg-[#526fae] hover:text-white hover:border-[#526fae] transition-all"
            >
              Log In
            </Link>
            <Link
              href="/signUp"
              className="px-8 py-2.5 bg-[#526fae] text-white text-base font-semibold border-2 border-black rounded-2xl hover:bg-[#3d5a96] transition-all shadow-md"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================== hero section ==================== */}
      <header className="max-w-screen-2xl mx-auto px-8 pt-16 pb-20 grid md:grid-cols-2 gap-16 items-center">
        {/* Left Text */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-x-2 bg-white border-2 border-black rounded-3xl px-6 py-2 text-sm font-semibold tracking-wider">
            <span className="text-[#526fae]">NEW</span>
            <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
            Car conversations that actually help
          </div>

          <h1 className="text-6xl md:text-7xl leading-none font-bold tracking-tighter">
            Ask car questions.<br />
            Get real answers.<br />
            <span className="text-[#526fae]">Find trusted mechanics.</span>
          </h1>

          <p className="text-2xl text-gray-700 max-w-lg">
            R3vly is a platform for car owners, enthusiasts, and mechanics to share advice, solve problems, and build real connections through conversation.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/signUp"
              className="px-10 py-5 bg-[#526fae] hover:bg-[#3d5a96] text-white text-2xl font-semibold rounded-3xl border-4 border-black shadow-xl transition-all active:scale-95 flex items-center gap-x-3"
            >
              Join R3vly
            </Link>

            <Link
              href="/explore"
              className="px-10 py-5 bg-white border-4 border-black text-2xl font-semibold rounded-3xl hover:bg-[#d2def9] transition-all flex items-center gap-x-3"
            >
              Explore as a guest
            </Link>
          </div>

          <div className="flex items-center gap-x-8 text-sm">
            <div className="flex items-center gap-x-2">
              <div className="flex -space-x-3">
                <div className="w-7 h-7 bg-[#526fae] border-2 border-white rounded-full flex items-center justify-center text-xs text-white">🚗</div>
                <div className="w-7 h-7 bg-orange-400 border-2 border-white rounded-full flex items-center justify-center text-xs">🔧</div>
              </div>
              <p className="font-medium">10k+ car people already talking</p>
            </div>
            <p className="text-[#526fae] font-semibold flex items-center gap-x-1">
              ★★★★☆ <span className="text-black">(4.9 average)</span>
            </p>
          </div>

          <p className="text-base font-medium text-gray-600 max-w-xs">
            Post questions, discover trusted advice, and connect with mechanics
          </p>
        </div>

        {/* mockup of R3vly feed */}
        <div className="relative mx-auto max-w-[520px] w-full">
          <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-2xl">
            {/* fake browser header */}
            <div className="h-11 bg-[#d2def9] border-b-4 border-black flex items-center px-4 gap-x-2">
              <div className="flex gap-x-1.5">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 text-center text-xs font-mono bg-white/70 mx-8 py-px rounded">r3vly.com/explore</div>
            </div>

            {/* fake feed content */}
            <div className="p-4 space-y-6 bg-[#d2def9]/30">
              {/* fake Post 1 - Repair question */}
              <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-inner">
                {/* header (UserCard style) */}
                <div className="flex items-center gap-x-3 mb-4">
                  <div className="w-9 h-9 bg-gray-200 border-2 border-black rounded-full overflow-hidden">
                    <img src="https://picsum.photos/id/1015/128/128" alt="" width={36} height={36} />
                  </div>
                  <div>
                    <div className="flex items-center gap-x-2">
                      <span className="font-semibold">Alex Rivera</span>
                      <img src="/icons/wrench.png" alt="Mechanic" width={20} height={20} className="drop-shadow" />
                    </div>
                    <span className="text-xs text-gray-500">San Jose, CA • 2h ago</span>
                  </div>
                  <button className="ml-auto px-4 py-1 text-xs font-semibold border-2 border-[#526fae] text-[#526fae] rounded-2xl hover:bg-[#526fae] hover:text-white transition-all">Follow</button>
                </div>

                <p className="text-lg leading-tight mb-4">
                  2018 Tacoma is making a loud clunk when I go over bumps in the front right. Anyone had this before? Shop quote is $1200 😭
                </p>

                <div className="bg-gray-100 border-2 border-black rounded-2xl h-64 flex items-center justify-center overflow-hidden mb-4">
                  <img
                    src="/images/tacoma.jpg"
                    alt="Truck suspension repair"
                    width={520}
                    height={260}
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-x-6">
                    <div className="flex items-center gap-x-1">
                      ❤️ <span className="font-medium">42</span>
                    </div>
                    <div className="flex items-center gap-x-1">
                      💬 <span className="font-medium">18</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-2 text-[#526fae]">
                    <span className="text-xs font-semibold">Verified Mechanic replied</span>
                    <img src="/icons/wrench.png" alt="" width={18} height={18} />
                  </div>
                </div>
              </div>

              {/* fake comment */}
              <div className="bg-white border-2 border-black rounded-2xl p-4 text-sm">
                <div className="flex gap-x-3">
                  <div className="text-[#526fae] font-bold">Mike the Mechanic</div>
                  <div className="text-gray-500">• just now</div>
                </div>
                <p className="mt-1">Common issue on 3rd gen Tacomas. Check your sway bar end links first. I can walk you through it in DMs if you want.</p>
              </div>
            </div>
          </div>

          {/* subtle floating badge */}
          <div className="absolute -top-4 -right-4 bg-white border-4 border-black text-[#526fae] font-bold text-xs px-6 py-2 rounded-3xl rotate-12 shadow-2xl flex items-center gap-x-2">
            <img src="/icons/wrench.png" alt="" width={24} height={24} />
            VERIFIED
          </div>
        </div>
      </header>

      {/* ==================== value strip ==================== */}
      <div className="bg-white border-t-4 border-b-4 border-black py-8">
        <div className="max-w-screen-2xl mx-auto px-8 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex flex-col items-center gap-y-2">
            <div className="text-4xl">❓</div>
            <p className="font-semibold">Ask repair questions</p>
          </div>
          <div className="flex flex-col items-center gap-y-2">
            <div className="text-4xl">🗣️</div>
            <p className="font-semibold">Get input from real enthusiasts</p>
          </div>
          <div className="flex flex-col items-center gap-y-2">
            <div className="text-4xl">🔧</div>
            <p className="font-semibold">Verified mechanics with wrench badges</p>
          </div>
          <div className="flex flex-col items-center gap-y-2">
            <div className="text-4xl">🔍</div>
            <p className="font-semibold">Searchable posts &amp; discussions</p>
          </div>
          <div className="flex flex-col items-center gap-y-2">
            <div className="text-4xl">⭐</div>
            <p className="font-semibold">Reviews, portfolios &amp; messaging</p>
          </div>
        </div>
      </div>

      {/* ==================== what is r3vly? ==================== */}
      <section id="community" className="scroll-mt-24 max-w-screen-2xl mx-auto px-8 py-20 border-b-4 border-black">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold tracking-tighter">A car community built for real conversation</h2>
          <p className="mt-6 text-2xl max-w-2xl mx-auto text-gray-700">
            R3vly combines community discussion, car knowledge sharing, and mechanic discovery in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white border-4 border-black rounded-3xl p-8">
            <div className="h-12 w-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center text-3xl mb-6 text-black shadow-sm">👤</div>
            <h3 className="text-3xl font-semibold mb-3">Built for owners who need help</h3>
            <p className="text-gray-600">Second opinions before expensive repairs. Real experiences from people who own the same car.</p>
          </div>
          <div className="bg-white border-4 border-black rounded-3xl p-8">
            <div className="h-12 w-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center text-3xl mb-6 text-black shadow-sm">🏎️</div>
            <h3 className="text-3xl font-semibold mb-3">Built for enthusiasts who want to share</h3>
            <p className="text-gray-600">Tips, builds, memes, and deep technical knowledge. The car culture you actually want to be part of.</p>
          </div>
          <div className="bg-white border-4 border-black rounded-3xl p-8">
            <div className="h-12 w-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center text-3xl mb-6 text-black shadow-sm">🔧</div>
            <h3 className="text-3xl font-semibold mb-3">Built for mechanics who want to grow</h3>
            <p className="text-gray-600">Build trust publicly, show your work, and turn conversations into customers.</p>
          </div>
        </div>
      </section>

      {/* ==================== how it works ==================== */}
      <section id="how-it-works" className="scroll-mt-24 max-w-screen-2xl mx-auto px-8 py-20 bg-white border-b-4 border-black">
        <h2 className="text-5xl font-bold tracking-tighter text-center mb-16">How R3vly works</h2>

        <div className="grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-[#d2def9] border-4 border-black rounded-3xl flex items-center justify-center text-5xl mb-6">1️⃣</div>
            <h3 className="text-3xl font-semibold mb-4">Post</h3>
            <ul className="space-y-4 text-left text-lg max-w-xs mx-auto">
              <li className="flex items-start gap-x-3">• Ask a question about your car</li>
              <li className="flex items-start gap-x-3">• Share repair progress</li>
              <li className="flex items-start gap-x-3">• Post useful tips, updates, or memes</li>
            </ul>
          </div>

          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-[#d2def9] border-4 border-black rounded-3xl flex items-center justify-center text-5xl mb-6">2️⃣</div>
            <h3 className="text-3xl font-semibold mb-4">Engage</h3>
            <ul className="space-y-4 text-left text-lg max-w-xs mx-auto">
              <li className="flex items-start gap-x-3">• Get comments from the community</li>
              <li className="flex items-start gap-x-3">• Hear from knowledgeable enthusiasts</li>
              <li className="flex items-start gap-x-3">• See verified mechanics join the conversation</li>
            </ul>
          </div>

          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-[#d2def9] border-4 border-black rounded-3xl flex items-center justify-center text-5xl mb-6">3️⃣</div>
            <h3 className="text-3xl font-semibold mb-4">Take Action</h3>
            <ul className="space-y-4 text-left text-lg max-w-xs mx-auto">
              <li className="flex items-start gap-x-3">• Save useful posts for later</li>
              <li className="flex items-start gap-x-3">• Follow people whose advice you trust</li>
              <li className="flex items-start gap-x-3">• Message a mechanic or another user directly</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ==================== for car owners and enthusiasts ==================== */}
      <section className="max-w-screen-2xl mx-auto px-8 py-20 border-b-4 border-black">
        <div className="grid md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-5">
            <h2 className="text-5xl font-bold tracking-tighter mb-6">Find answers, ideas, and your kind of people</h2>
            <ul className="space-y-6 text-xl">
              <li className="flex gap-x-4">✅ Ask repair questions and get second opinions</li>
              <li className="flex gap-x-4">✅ Search posts by problem, topic, or vehicle interest</li>
              <li className="flex gap-x-4">✅ Save useful threads for future reference</li>
              <li className="flex gap-x-4">✅ Follow creators, builders, and knowledgeable users</li>
              <li className="flex gap-x-4">✅ Enjoy both informative posts and car culture content</li>
            </ul>
          </div>

          {/* mock feed visual */}
          <div className="md:col-span-7 bg-white border-4 border-black rounded-3xl p-6 shadow-2xl">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {/* fake post card 1 */}
              <div className="bg-[#d2def9] border-2 border-black rounded-3xl w-80 flex-shrink-0 p-4 snap-center">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Brake job gone wrong?</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-2xl border border-black">DIY</span>
                </div>
                <p className="text-sm line-clamp-3 mb-6">Just replaced pads and rotors on my WRX and now it squeaks like crazy...</p>
                <div className="flex justify-between text-xs">
                  <div>14 comments</div>
                  <div className="text-[#526fae]">Saved by 87 people</div>
                </div>
              </div>

              {/* fake post card 2 */}
              <div className="bg-white border-2 border-black rounded-3xl w-80 flex-shrink-0 p-4 snap-center">
                <div className="flex items-center gap-x-2 mb-4">
                  <span className="font-semibold">Car meet this weekend</span>
                </div>
                <div className="h-40 bg-gray-200 border border-black rounded-2xl mb-4 flex items-center justify-center text-6xl">
                  <img
                    src="/images/meetUp.jpg"
                    alt="Truck suspension repair"
                    width={520}
                    height={260}
                    className="object-cover w-full h-full"
                  />
                </div>
                <p className="text-sm">Who’s coming to the Bay Area cruise? Bring your best mods</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== for mechanics ==================== */}
      <section id="for-mechanics" className="scroll-mt-24 max-w-screen-2xl mx-auto px-8 py-20 bg-white border-b-4 border-black">
        <div className="grid md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-5">
            <h2 className="text-5xl font-bold tracking-tighter mb-6">Build trust. Show your work. Grow your clientele.</h2>
            <ul className="space-y-6 text-xl">
              <li className="flex gap-x-4">🔧 Get a wrench badge to stand out in conversations</li>
              <li className="flex gap-x-4">📸 Build credibility by sharing advice publicly</li>
              <li className="flex gap-x-4">⭐ Create a profile with reviews from customers</li>
              <li className="flex gap-x-4">🖼️ Showcase past work and services</li>
              <li className="flex gap-x-4">📍 Display your location with a clean map</li>
              <li className="flex gap-x-4">💬 Let interested customers message you directly</li>
            </ul>
          </div>

          {/* mechanic profile mock */}
          <div className="md:col-span-7 bg-[#d2def9] border-4 border-black rounded-3xl p-8">
            <div className="bg-white border-2 border-black rounded-3xl p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-x-4">
                  <img
                    src="/images/mechanicGuy.jpg"
                    alt="Garcia Auto Repair"
                    className="w-16 h-16 border-2 border-black rounded-2xl object-cover flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-x-2">
                      <span className="text-2xl font-semibold">Garcia Auto Repair</span>
                      <img
                        src="/icons/wrench.png"
                        alt="Verified Mechanic"
                        width={32}
                        height={32}
                        className="drop-shadow-sm"
                      />
                    </div>
                    <p className="text-[#526fae]">4.98 • 142 reviews</p>
                  </div>
                </div>
                <button className="bg-[#526fae] text-white px-8 py-3 rounded-3xl text-sm font-semibold border-2 border-black hover:bg-[#3d5a96] transition-colors">
                  Message
                </button>
              </div>

              {/* mock past work gallery */}
              <div className="mt-8 border-2 border-black rounded-2xl bg-gray-100 p-8 relative h-80 overflow-hidden">
                <div className="text-center mb-8">
                  <p className="font-semibold text-xl">Past work gallery</p>
                </div>

                <div className="flex gap-6 justify-center">
                  <img
                    src="/images/workEx1.jpeg"
                    alt="Work example 1"
                    className="w-40 h-40 border border-black rounded-2xl object-cover shadow-md"
                  />
                  <img
                    src="/images/workEx2.jpeg"
                    alt="Work example 2"
                    className="w-40 h-40 border border-black rounded-2xl object-cover shadow-md"
                  />
                  <img
                    src="/images/workEx3.jpg"
                    alt="Work example 3"
                    className="w-40 h-40 border border-black rounded-2xl object-cover shadow-md"
                  />
                </div>

                <div className="absolute bottom-8 right-8 bg-white border-2 border-black text-xs px-5 py-3 rounded-3xl flex items-center gap-x-2 shadow-lg">
                  📍 Watsonville, CA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== trust and credability ==================== */}
      <section className="max-w-screen-2xl mx-auto px-8 py-20 border-b-4 border-black">
        <h2 className="text-5xl font-bold tracking-tighter text-center mb-16">Built to help people make better decisions</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="bg-white border-4 border-black rounded-3xl p-8 text-center">
            <span className="text-6xl block mb-6">✅</span>
            <h4 className="font-semibold text-2xl">Verified mechanics clearly distinguished</h4>
          </div>
          <div className="bg-white border-4 border-black rounded-3xl p-8 text-center">
            <span className="text-6xl block mb-6">⭐</span>
            <h4 className="font-semibold text-2xl">Public reviews help users choose with confidence</h4>
          </div>
          <div className="bg-white border-4 border-black rounded-3xl p-8 text-center">
            <span className="text-6xl block mb-6">🛠️</span>
            <h4 className="font-semibold text-2xl">Profiles show real work and reputation</h4>
          </div>
          <div className="bg-white border-4 border-black rounded-3xl p-8 text-center">
            <span className="text-6xl block mb-6">💬</span>
            <h4 className="font-semibold text-2xl">Open conversations = real experiences</h4>
          </div>
        </div>
      </section>

      {/* ==================== messaging section ==================== */}
      <section className="max-w-screen-2xl mx-auto px-8 py-20 bg-white border-b-4 border-black">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl font-bold tracking-tighter">From comments to real connection</h2>
            <p className="mt-6 text-2xl text-gray-700">When a conversation goes beyond the comments, users can message each other directly inside R3vly.</p>
            <ul className="mt-12 space-y-8">
              <li className="flex gap-x-6 items-start">
                <span className="text-4xl">🔧</span>
                <div>
                  <strong>Coordinate repairs with a mechanic</strong>
                </div>
              </li>
              <li className="flex gap-x-6 items-start">
                <span className="text-4xl">❓</span>
                <div>
                  <strong>Ask follow-up questions privately</strong>
                </div>
              </li>
              <li className="flex gap-x-6 items-start">
                <span className="text-4xl">🤝</span>
                <div>
                  <strong>Connect with other users more directly</strong>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#d2def9] border-4 border-black rounded-3xl p-6">
            <div className="bg-white border-2 border-black rounded-3xl p-8 text-center">
              <p className="font-mono text-xs tracking-widest mb-3">DIRECT MESSAGE THREAD</p>
              <div className="space-y-6">
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-[#526fae] text-white rounded-3xl rounded-tr-none px-6 py-4">Hey Mike, can you take a look at the photos I posted?</div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[70%] bg-gray-100 rounded-3xl rounded-tl-none px-6 py-4">Absolutely! That looks like a failing CV axle. I can get you in tomorrow at 9am.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== search ==================== */}
      <section id="explore" className="scroll-mt-24 max-w-screen-2xl mx-auto px-8 py-20 border-b-4 border-black">
        <h2 className="text-5xl font-bold tracking-tighter text-center mb-6">Search for what matters to you</h2>
        <p className="text-center text-2xl max-w-xl mx-auto mb-16">Find posts on repairs, upgrades, maintenance, and more. Discover useful content without digging through unrelated noise.</p>

        <div className="bg-white border-4 border-black rounded-3xl max-w-2xl mx-auto p-6">
          <div className="flex border-2 border-black rounded-3xl px-6 py-5 items-center bg-[#d2def9]">
            <span className="text-3xl mr-4">🔎</span>
            <input
              type="text"
              placeholder="Search brake noise, Honda Civic suspension, or #oilchange…"
              className="flex-1 bg-transparent outline-none text-xl placeholder:text-gray-500"
              readOnly
            />
          </div>
          <div className="flex gap-3 mt-6 flex-wrap">
            <span className="bg-[#d2def9] border border-black text-sm font-medium px-5 py-2 rounded-3xl">#brakes</span>
            <span className="bg-[#d2def9] border border-black text-sm font-medium px-5 py-2 rounded-3xl">#suspension</span>
            <span className="bg-[#d2def9] border border-black text-sm font-medium px-5 py-2 rounded-3xl">#DIY</span>
            <span className="bg-[#d2def9] border border-black text-sm font-medium px-5 py-2 rounded-3xl">#tacoma</span>
            <span className="bg-[#d2def9] border border-black text-sm font-medium px-5 py-2 rounded-3xl">#mechanic</span>
          </div>
        </div>
      </section>

      {/* ==================== mock social proof testimonials  ==================== */}
      <section id="reviews" className="scroll-mt-24 max-w-screen-2xl mx-auto px-8 py-20 bg-white border-b-4 border-black">
        <h2 className="text-5xl font-bold tracking-tighter text-center mb-16">Why people use R3vly</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* testimonial 1 - Sarah Chen (Owner) */}
          <div className="bg-[#d2def9] border-4 border-black rounded-3xl p-8">
            <p className="italic text-xl leading-tight">"I got a second opinion before paying for a $1,800 repair. Saved me $1,200 thanks to a verified mechanic who replied in the comments."</p>
            <div className="mt-12 flex items-center gap-x-4">
              <img
                src="/images/subaru.png"
                alt="Sarah Chen"
                className="w-12 h-12 border-2 border-black rounded-2xl object-cover flex-shrink-0"
              />
              <div>
                <div className="font-semibold">Sarah Chen</div>
                <div className="text-sm">2022 Subaru Outback owner • San Francisco</div>
              </div>
            </div>
          </div>

          {/* testimonial 2 - Marcus Torres (Enthusiast) */}
          <div className="bg-[#d2def9] border-4 border-black rounded-3xl p-8">
            <p className="italic text-xl leading-tight">"Finally a place where I can share my weekend builds AND get legit technical advice. The community here is gold."</p>
            <div className="mt-12 flex items-center gap-x-4">
              <img
                src="/images/miata.jpg"
                alt="Marcus Torres"
                className="w-12 h-12 border-2 border-black rounded-2xl object-cover flex-shrink-0"
              />
              <div>
                <div className="font-semibold">Marcus Torres</div>
                <div className="text-sm">Miata enthusiast • Long time member</div>
              </div>
            </div>
          </div>

          {/* testimonial 3 - Robert (Mechanic) */}
          <div className="bg-[#d2def9] border-4 border-black rounded-3xl p-8">
            <p className="italic text-xl leading-tight">"My wrench badge and public reviews have brought me 11 new customers this month. People trust the platform and trust me because of it."</p>
            <div className="mt-12 flex items-center gap-x-4">
              <img
                src="/images/robert.jpg"
                alt="Robert Garcia"
                className="w-12 h-12 border-2 border-black rounded-2xl object-cover flex-shrink-0"
              />
              <div>
                <div className="font-semibold">Robert Garcia</div>
                <div className="text-sm text-[#526fae]">Verified Mechanic • 87 reviews</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== join now ==================== */}
      <section className="bg-[#526fae] text-white py-24 border-t-4 border-b-4 border-black">
        <div className="max-w-screen-2xl mx-auto px-8 text-center">
          <h2 className="text-6xl font-bold tracking-tighter">Join the conversation that moves car culture forward</h2>
          <p className="mt-6 text-2xl max-w-xl mx-auto">Whether you need advice, want to help others, or want to grow your reputation as a mechanic, R3vly gives you a place to do it.</p>

          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <Link
              href="/signup"
              className="px-12 py-6 text-3xl font-semibold bg-white text-[#526fae] border-4 border-black rounded-3xl hover:scale-105 transition-transform"
            >
              Sign Up for R3vly
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== footer ==================== */}
      <footer className="bg-white border-t-4 border-black py-12">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-y-8">
            <div className="flex items-center gap-x-3">
              <img src="favicon.ico" alt="R3vly" width={50} height={50} />
              <span className="text-xs font-medium tracking-widest">CAR • COMMUNITY • CONNECT</span>
            </div>
            <p className="text-sm text-gray-500">© 2026 R3vly — built for car owners, mechanics, and enthusiasts</p>
          </div>
        </div>
      </footer>
    </div>
  );
}