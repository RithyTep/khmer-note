import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  const isLocalDev = process.env.NODE_ENV === "development";

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col lg:flex-row relative overflow-hidden selection:bg-blue-100">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 xl:px-20 w-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl">
              <span className="font-serif font-bold text-3xl text-gray-900">K</span>
            </div>
            <span className="text-white text-2xl font-semibold tracking-tight">Camnova</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            កំណត់ត្រារបស់អ្នក
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              សុវត្ថិភាព និងងាយស្រួល
            </span>
          </h1>

          <p className="text-gray-400 text-lg xl:text-xl leading-relaxed max-w-md mb-12">
            រៀបចំគម្រោង កិច្ចការ និង Kanban បន្ទះក្នុងកន្លែងមួយ។
            ចូលគណនីដើម្បីចាប់ផ្តើម។
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>គ្រប់គ្រងគម្រោងបានស្រួល</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Kanban បន្ទះសម្រាប់ការងារ</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>ធ្វើសមកាលកម្មគ្រប់ឧបករណ៍</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 text-center text-gray-600 text-sm">
          © 2024 Camnova. All rights reserved.
        </div>
      </div>

      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex flex-col relative">
        <nav className="lg:hidden fixed top-0 left-0 w-full p-4 flex items-center gap-3 z-50 bg-white/80 backdrop-blur-sm">
          <div className="w-8 h-8 bg-gray-900 rounded-[4px] flex items-center justify-center text-white shrink-0">
            <span className="font-serif font-bold text-lg">K</span>
          </div>
          <div className="flex items-center text-gray-500 hover:bg-gray-100 px-2 py-1 rounded transition-colors cursor-pointer gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span className="text-xs font-medium">Khmer (KH)</span>
          </div>
        </nav>

        <nav className="hidden lg:flex fixed top-0 right-0 w-1/2 xl:w-[45%] p-6 items-center justify-end gap-4 z-50">
          <div className="flex items-center text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors cursor-pointer gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span className="text-sm font-medium">Khmer (KH)</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </nav>

        <div className="lg:hidden absolute inset-0 flex justify-center pt-32 px-4 -z-10 opacity-40 select-none pointer-events-none">
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="h-10 bg-gray-100 w-1/3 rounded-md mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 w-full rounded-full"></div>
              <div className="h-4 bg-gray-100 w-[95%] rounded-full"></div>
              <div className="h-4 bg-gray-100 w-[90%] rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-100 w-1/4 rounded-md mt-6 mb-2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 w-full rounded-full"></div>
              <div className="h-4 bg-gray-100 w-[98%] rounded-full"></div>
              <div className="h-4 bg-gray-100 w-[85%] rounded-full"></div>
            </div>
          </div>
        </div>

        <main className="flex-grow flex flex-col p-4 sm:p-6 lg:p-8 xl:p-12 w-full items-center justify-center pt-20 lg:pt-0">
          <div className="w-full max-w-[420px] lg:max-w-[400px] xl:max-w-[420px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] lg:shadow-none border border-gray-100 lg:border-0 p-8 sm:p-10 lg:p-0 flex flex-col items-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gray-100 rounded-xl text-gray-600 flex items-center justify-center text-3xl lg:text-4xl font-semibold mb-6">
              K
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-center text-gray-900 mb-2 leading-tight">
              ចូលគណនីដើម្បីប្រើប្រាស់
            </h1>
            <p className="text-gray-500 text-center mb-8 lg:mb-10">
              <span className="font-bold text-gray-900">Camnova</span>
            </p>

            {isLocalDev && (
              <form
                action={async () => {
                  "use server";
                  await signIn("local-dev", { redirectTo: "/" });
                }}
                className="w-full mb-4"
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 lg:py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-sm lg:text-base font-medium">
                    Local Development Login
                  </span>
                </button>
              </form>
            )}

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
              className="w-full"
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 lg:py-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all group shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm lg:text-base font-medium text-gray-700">
                  បន្តជាមួយ Google
                </span>
              </button>
            </form>

            {isLocalDev ? (
              <div className="w-full flex items-center gap-4 my-6 lg:my-8">
                <hr className="flex-1 border-gray-200" />
                <span className="text-xs text-emerald-600 font-medium">DEV MODE</span>
                <hr className="flex-1 border-gray-200" />
              </div>
            ) : (
              <div className="w-full flex items-center gap-4 my-6 lg:my-8">
                <hr className="flex-1 border-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">ឬ</span>
                <hr className="flex-1 border-gray-200" />
              </div>
            )}

            <p className="text-sm text-gray-500 text-center leading-relaxed">
              {isLocalDev ? (
                <>Click &quot;Local Development Login&quot; to sign in instantly<br />without Google authentication</>
              ) : (
                <>ចូលគណនីដោយប្រើ Google របស់អ្នក<br />ដើម្បីរក្សាទុកកំណត់ត្រារបស់អ្នកដោយសុវត្ថិភាព</>
              )}
            </p>
          </div>

          <div className="mt-8 lg:mt-12 text-center max-w-sm">
            <p className="text-xs text-gray-400 leading-relaxed">
              ដោយបន្ត អ្នកទទួលស្គាល់ថាអ្នកយល់និងយល់ព្រម{" "}
              <a href="#" className="underline hover:text-gray-600 decoration-gray-300 transition-colors">
                លក្ខខណ្ឌ
              </a>{" "}
              និង{" "}
              <a href="#" className="underline hover:text-gray-600 decoration-gray-300 transition-colors">
                គោលការណ៍ឯកជនភាព
              </a>
            </p>
          </div>

          <div className="mt-12 lg:mt-16 flex items-center gap-4 text-gray-500">
            <a href="#" className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
              <div className="w-4 h-4 bg-gray-300 rounded-[2px] flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">K</span>
              </div>
              <span className="text-xs font-normal">តើ Camnova ជាអ្វី?</span>
            </a>
            <span className="text-gray-300 text-xs">·</span>
            <a href="#" className="text-xs font-normal hover:text-gray-800 transition-colors">
              ជំនួយ
            </a>
            <span className="text-gray-300 text-xs">·</span>
            <a href="#" className="text-xs font-normal hover:text-gray-800 transition-colors">
              លក្ខខណ្ឌ
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
