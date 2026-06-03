import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User2, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "@/data/api";
import mengoLogo from "@/assets/mengo-logo.png";

export type AdminRole = "viewer" | "full_admin";

const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const result = await adminLogin(username, password);
      sessionStorage.setItem("adminRole", result.role);
      sessionStorage.setItem("adminUser", result.username);
      sessionStorage.setItem("authToken", result.token);
      navigate("/evote/admin");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-primary/5 blur-3xl opacity-50 dark:opacity-20" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl opacity-50 dark:opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
            <img
              src={mengoLogo}
              alt="Mengo Senior School"
              className="w-10 h-10 object-contain"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
          MSS E-Voting System
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-800">
          
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Administrator Sign In</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Restricted access — authorised personnel only</p>
            </div>
          </div>

          <div className="space-y-5 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User2 className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Enter username"
                  className="block w-full pl-11 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors sm:text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="block w-full pl-11 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors sm:text-sm"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6"
              >
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
          Secure Internal System
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
