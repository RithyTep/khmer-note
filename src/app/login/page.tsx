import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function LoginPage() {
  const session = await auth();
  const isLocalDev = process.env.NODE_ENV === "development";
  const t = await getTranslations("login");

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen w-full relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-100/20 rounded-full blur-3xl" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full p-5 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-white/50 flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="Camnova Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="text-sm font-medium text-neutral-800 tracking-tight">Camnova</span>
        </div>

        <LanguageSwitcher />
      </nav>

      {/* Background document skeleton */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="w-full max-w-3xl px-12 opacity-[0.04]">
          <div className="space-y-8">
            <div className="h-8 bg-neutral-900 w-2/5 rounded-lg" />
            <div className="space-y-3">
              <div className="h-3 bg-neutral-900 w-full rounded-full" />
              <div className="h-3 bg-neutral-900 w-[94%] rounded-full" />
              <div className="h-3 bg-neutral-900 w-[88%] rounded-full" />
            </div>
            <div className="h-6 bg-neutral-900 w-1/4 rounded-lg mt-10" />
            <div className="space-y-3">
              <div className="h-3 bg-neutral-900 w-full rounded-full" />
              <div className="h-3 bg-neutral-900 w-[91%] rounded-full" />
              <div className="h-3 bg-neutral-900 w-[85%] rounded-full" />
            </div>
            <div className="flex gap-3 mt-10">
              <div className="h-8 w-20 bg-neutral-900 rounded-lg" />
              <div className="h-8 w-24 bg-neutral-900 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Center Modal */}
      <main className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[420px]">
          {/* Glass card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.02),0_12px_50px_rgba(0,0,0,0.08)] p-10 border border-white/80">
            {/* Logo with glow effect */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 flex items-center justify-center overflow-hidden shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="Camnova Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2 tracking-tight">
                {t("welcome")}
              </h1>
              <p className="text-neutral-500 text-sm">
                {t("subtitle")}
              </p>
            </div>

            {/* Auth Buttons */}
            <div className="space-y-3">
              {isLocalDev && (
                <form
                  action={async () => {
                    "use server";
                    await signIn("local-dev", { redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/10 hover:shadow-xl hover:shadow-neutral-900/15 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Development Login</span>
                  </button>
                </form>
              )}

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-neutral-200/80 text-sm font-medium rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-neutral-700">{t("continueWithGoogle")}</span>
                </button>
              </form>
            </div>

            {/* Divider with text */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
            </div>

            {/* Features list */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{t("feature1")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{t("feature2")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{t("feature3")}</span>
              </div>
            </div>

            {/* Terms */}
            <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
              {t("termsPrefix")}{" "}
              <a href="#" className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors">
                {t("termsOfService")}
              </a>
              {" "}{t("and")}{" "}
              <a href="#" className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors">
                {t("privacyPolicy")}
              </a>
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-neutral-400">
            <div className="flex items-center gap-1.5 text-[11px]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{t("secure")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{t("dataProtection")}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full p-5 flex items-center justify-center gap-3 text-neutral-400 text-xs bg-gradient-to-t from-[#faf9f7] to-transparent">
        <a href="#" className="flex items-center gap-1.5 hover:text-neutral-600 transition-colors">
          <div className="w-4 h-4 rounded overflow-hidden opacity-60">
            <Image
              src="/logo.png"
              alt="Camnova"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <span>{t("whatIsCamnova")}</span>
        </a>
        <span className="text-neutral-300">·</span>
        <a href="#" className="hover:text-neutral-600 transition-colors">{t("help")}</a>
        <span className="text-neutral-300">·</span>
        <a href="#" className="hover:text-neutral-600 transition-colors">{t("terms")}</a>
        <span className="text-neutral-300">·</span>
        <a href="#" className="hover:text-neutral-600 transition-colors">{t("privacy")}</a>
      </footer>
    </div>
  );
}
