import ShortenForm from "@/components/ShortenForm";

export default function Home() {
  return (
    <div className="flex-grow flex flex-col justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
      <div className="max-w-6xl mx-auto w-full flex flex-col items-center justify-center space-y-12 relative z-10">
        
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">
            Scale <br /> The Web
          </h1>
          <p className="text-lg md:text-2xl font-bold uppercase max-w-2xl mx-auto text-gray-800">
            Anonymous, distributed URL shortener with rich analytics.
          </p>
        </div>

        <ShortenForm />

        <div className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t-heavy">
          <div className="p-6 border-heavy bg-[#f8f8f8]">
            <h3 className="text-2xl font-black uppercase mb-4">1. Paste</h3>
            <p className="font-bold text-sm uppercase text-gray-600">Paste your long, ugly URL into the input field above.</p>
          </div>
          <div className="p-6 border-heavy bg-[#f8f8f8]">
            <h3 className="text-2xl font-black uppercase mb-4">2. Shorten</h3>
            <p className="font-bold text-sm uppercase text-gray-600">Get a clean, distributed short link instantly.</p>
          </div>
          <div className="p-6 border-heavy bg-[#f8f8f8]">
            <h3 className="text-2xl font-black uppercase mb-4">3. Track</h3>
            <p className="font-bold text-sm uppercase text-gray-600">View rich analytics and track clicks effortlessly.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
