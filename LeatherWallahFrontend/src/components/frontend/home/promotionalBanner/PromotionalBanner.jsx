import Link from "next/link";

const PromotionalBanner = () => {
  return (
    <div className="py-4 md:py-10">
      <div className="max-w-[98%] mx-auto">
        <div className="relative overflow-hidden bg-secondary-900">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-700 to-transparent" />

          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-8 md:px-16 py-12 md:py-16 gap-8">
            {/* Left Content */}
            <div className="text-center md:text-left">
              <p className="text-accent-600 text-xs tracking-[0.3em] uppercase mb-3">
                Limited Time Offer
              </p>
              <h2 className="text-accent-100 text-3xl md:text-5xl font-bold leading-tight mb-4">
                Imported <br />
                <span className="text-accent-700">Genuine Leather</span>
              </h2>
              <p className="text-accent-300/60 text-sm md:text-base max-w-sm mb-8">
                Premium quality leather wallets, crafted with precision and
                passion. Built to last a lifetime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/shop"
                  className="bg-accent-700 hover:bg-accent-800 text-white text-sm font-semibold px-8 py-3 transition-colors duration-300 tracking-wider uppercase"
                >
                  Shop Now
                </Link>
                <Link
                  href="/shop"
                  className="border border-accent-700/40 hover:border-accent-600 text-accent-300 text-sm px-8 py-3 transition-colors duration-300 tracking-wider uppercase"
                >
                  View Collection
                </Link>
              </div>
            </div>

            {/* Right - Stats */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {[
                { number: "100%", label: "Genuine Leather" },
                { number: "5★", label: "Customer Rating" },
                { number: "2+", label: "Years Experience" },
                { number: "24/7", label: "Customer Support" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="text-center border border-accent-800/30 hover:border-accent-700/60 bg-secondary-800/50 px-6 py-5 transition-colors duration-300"
                >
                  <p className="text-accent-700 text-2xl md:text-3xl font-bold mb-1">
                    {stat.number}
                  </p>
                  <p className="text-accent-400/70 text-xs tracking-wider uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-700 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;
