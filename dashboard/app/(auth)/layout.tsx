export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-brand-900 p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">ClientFlow</span>
          </div>
        </div>

        <div className="space-y-8">
          <blockquote className="text-xl text-brand-100 leading-relaxed">
            &ldquo;ClientFlow helped us close 3 enterprise deals in our first month. The AI-powered outreach is incredibly personalized.&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-brand-700 flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <div>
              <p className="text-white font-medium">Jane Doe</p>
              <p className="text-brand-300 text-sm">CEO, FashionForward</p>
            </div>
          </div>
        </div>

        <div className="flex gap-8 text-brand-300 text-sm">
          <div>
            <p className="text-3xl font-bold text-white">2x</p>
            <p>More replies</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">40%</p>
            <p>Meeting rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">$0</p>
            <p>Upfront cost</p>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-20">
        {children}
      </div>
    </div>
  );
}
