import React from "react";
import { LogIn, UserPlus, Mail, Lock, User, Plus, Ghost, Shield, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface AuthComponentProps {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  loginMode: "initial" | "email-login" | "email-signup";
  setLoginMode: (mode: "initial" | "email-login" | "email-signup") => void;
  loginError: string | null;
  guestUsername: string;
  setGuestUsername: (name: string) => void;
  guestAvatar: string | null;
  emailForm: any;
  setEmailForm: (form: any) => void;
  resetSent: boolean;
  handleGuestLogin: () => void;
  handleEmailAuth: (mode: "login" | "signup") => void;
  handleForgotPassword: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, target: "guest" | "profile" | "email") => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({
  isLoggedIn,
  isLoggingIn,
  loginMode,
  setLoginMode,
  loginError,
  guestUsername,
  setGuestUsername,
  guestAvatar,
  emailForm,
  setEmailForm,
  resetSent,
  handleGuestLogin,
  handleEmailAuth,
  handleForgotPassword,
  handleFileChange,
}) => {
  const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=default";

  if (isLoggedIn) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 md:p-12 bg-[#020617] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-indigo-600/10 rounded-[2rem] border border-indigo-500/20 mb-4">
            <LogIn size={40} className="text-indigo-500" />
          </div>
          <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter">
            Scene
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">
            Panhandle Pop-Up Meets
          </p>
        </div>

        {loginMode === "initial" ? (
          <div className="space-y-4">
            <div className="p-8 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl space-y-6">
              <div className="space-y-4">
                <button
                  onClick={() => setLoginMode("email-login")}
                  className="w-full flex items-center justify-center gap-4 bg-white text-slate-950 px-10 py-5 rounded-[2rem] font-black shadow-xl hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <Mail size={20} /> Sign In with Email
                </button>
                <button
                  onClick={() => setLoginMode("email-signup")}
                  className="w-full flex items-center justify-center gap-4 bg-slate-800 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl hover:bg-slate-700 active:scale-95 transition-all border border-white/5"
                >
                  <UserPlus size={20} /> Create Profile
                </button>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-[#020617] px-4 text-slate-600">
                    Or Quick Entry
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <img
                      src={guestAvatar || DEFAULT_AVATAR}
                      className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-800 shadow-2xl group-hover:opacity-75 transition-opacity"
                    />
                    <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Plus className="text-white" size={24} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "guest")}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter Guest Handle..."
                    value={guestUsername}
                    onChange={(e) => setGuestUsername(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-center text-sm font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                  />
                </div>
                <button
                  onClick={handleGuestLogin}
                  disabled={!guestUsername.trim()}
                  className="w-full py-5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest border border-indigo-500/20 transition-all disabled:opacity-30"
                >
                  Enter as Guest
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setLoginMode("initial")}
              className="text-slate-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              <Plus className="rotate-45" size={14} /> Back
            </button>

            <div className="space-y-4">
              {loginMode === "email-signup" && (
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <img
                      src={emailForm.avatar || DEFAULT_AVATAR}
                      className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-800 shadow-2xl group-hover:opacity-75 transition-opacity"
                    />
                    <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Plus className="text-white" size={24} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "email")}
                      />
                    </label>
                  </div>
                  <p className="text-[8px] text-slate-600 font-black uppercase mt-2 tracking-widest">
                    Upload Profile Photo
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {loginMode === "email-signup" && (
                  <div className="relative group">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={emailForm.name}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, name: e.target.value })
                      }
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                )}
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={emailForm.email}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, email: e.target.value })
                    }
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors"
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={emailForm.password}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, password: e.target.value })
                    }
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {loginMode === "email-login" && (
                <div className="flex items-center justify-between px-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={emailForm.rememberMe}
                        onChange={(e) =>
                          setEmailForm({
                            ...emailForm,
                            rememberMe: e.target.checked,
                          })
                        }
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-slate-700 rounded-md bg-slate-800/50 peer-checked:bg-indigo-600 peer-checked:border-indigo-500 transition-all"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                      Remember Me
                    </span>
                  </label>
                  <button
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {resetSent && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2">
                  Password reset link sent to your email!
                </div>
              )}

              <button
                onClick={() => handleEmailAuth(loginMode === "email-login" ? "login" : "signup")}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl active:scale-95 border border-white/5 mt-4 disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : (loginMode === "email-login" ? "Sign In" : "Create Profile")}
              </button>

              <p className="text-center text-slate-500 text-xs font-bold mt-4">
                {loginMode === "email-login" ? "Don't have a profile?" : "Already have a profile?"}
                <button
                  onClick={() => setLoginMode(loginMode === "email-login" ? "email-signup" : "email-login")}
                  className="text-indigo-400 hover:text-indigo-300 ml-2 underline"
                >
                  {loginMode === "email-login" ? "Create one now" : "Sign in instead"}
                </button>
              </p>
            </div>
          </div>
        )}

        {loginError && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2">
            {loginError}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AuthComponent);
