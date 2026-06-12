'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { supabase, isSupabaseConfigured } from '@/services/db/client';
import {
  Lock, Mail, User, Shield, KeyRound, AlertCircle, ArrowRight,
  Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { switchRole, allProfiles } = useApp();
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'verification'>('login');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in (mock), or just routing:
  const handleQuickSignIn = (roleKey: 'super_admin' | 'org_admin' | 'project_manager' | 'team_member' | 'client') => {
    setLoading(true);
    setTimeout(() => {
      switchRole(roleKey);
      setLoading(false);
      if (roleKey === 'client') {
        router.push('/client');
      } else {
        router.push('/dashboard');
      }
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        if (view === 'login') {
          const { error } = await supabase!.auth.signInWithPassword({ email, password });
          if (error) throw error;
          router.push('/dashboard');
        } else if (view === 'signup') {
          const { error } = await supabase!.auth.signUp({
            email,
            password,
            options: {
              data: { name, designation }
            }
          });
          if (error) throw error;
          setView('verification');
        } else if (view === 'forgot') {
          const { error } = await supabase!.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth?view=reset`
          });
          if (error) throw error;
          setSuccessMsg('Reset password instructions sent to your email.');
        }
      } catch (err: any) {
        setError(err.message || 'Authentication operation failed.');
      } finally {
        setLoading(false);
      }
    } else {
      // Mock flow when Supabase is unconfigured
      setTimeout(() => {
        setLoading(false);
        if (view === 'login') {
          // Attempt to match mock profile
          const matchedProfile = allProfiles.find(p => p.email === email);
          if (matchedProfile) {
            if (matchedProfile.id === 'usr-client') {
              handleQuickSignIn('client');
            } else if (matchedProfile.id === 'usr-team-member-1') {
              handleQuickSignIn('team_member');
            } else if (matchedProfile.id === 'usr-project-manager') {
              handleQuickSignIn('project_manager');
            } else {
              handleQuickSignIn('org_admin');
            }
          } else {
            // Log in as org admin by default
            handleQuickSignIn('org_admin');
          }
        } else if (view === 'signup') {
          setSuccessMsg('Registration successful! Check your email (Simulated).');
          setView('login');
        } else if (view === 'forgot') {
          setSuccessMsg('Reset instructions dispatched to email (Simulated).');
        }
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden">

      {/* Background visual designs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

      {/* Left side: Premium info panel */}
      <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative border-r border-slate-900 bg-slate-950/40 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-md">
            P
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-tight">PMSA7</span>
        </div>

        <div className="space-y-6 my-auto max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Agile Suite
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-none">
            Sheikho & Tolvi LLC - Your Project Partner Application
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Unify codeboards, timesheets, sprints, client portals, and productivity metrics in a single, high-fidelity corporate command console.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-200">10x</span>
              <span className="text-xs text-slate-500">Faster Board Loading</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-200">Zero</span>
              <span className="text-xs text-slate-500">Config Setup Delay</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600 flex items-center justify-between">
          <span>© 2026 Acme Corp. All rights reserved.</span>
          <span className="hover:text-slate-400 cursor-pointer">Terms & Security</span>
        </div>
      </div>

      {/* Right side: Form Portal */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 z-10">
        <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">

          <div className="mb-6 flex flex-col items-center text-center md:items-start md:text-left">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-md mb-3 md:hidden">
              P
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              {view === 'login' && 'Sign in to workspace'}
              {view === 'signup' && 'Create your account'}
              {view === 'forgot' && 'Reset your password'}
              {view === 'verification' && 'Confirm your email'}
            </h2>
            <p className="text-slate-400 text-xs mt-1 leading-normal">
              {view === 'login' && 'Enter your credentials or select a sandbox profile below.'}
              {view === 'signup' && 'Fill out your profile details to join the organization.'}
              {view === 'forgot' && 'Provide your email address to receive recovery instructions.'}
              {view === 'verification' && 'Please confirm the verification code sent to your email.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {view === 'verification' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs text-slate-400">A verification link was generated. Click below to continue.</span>
                <button
                  onClick={() => setView('login')}
                  className="w-full mt-4 py-2 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'signup' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alice Johnson"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-10 pr-4 py-3 text-slate-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Designation</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="Product Manager"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-10 pr-4 py-3 text-slate-200"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-10 pr-4 py-3 text-slate-200"
                    required
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-10 pr-4 py-3 text-slate-200"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-primary/10 mt-2"
              >
                {loading ? 'Processing...' : (
                  <>
                    <span>
                      {view === 'login' && 'Sign In'}
                      {view === 'signup' && 'Create Account'}
                      {view === 'forgot' && 'Send Recovery Instructions'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* View Toggles */}
          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-4 flex items-center justify-center gap-1.5">
            {view === 'login' ? (
              <>
                <span>New to PMSA7?</span>
                <button onClick={() => setView('signup')} className="font-bold text-primary hover:underline">
                  Create account
                </button>
              </>
            ) : (
              <button onClick={() => setView('login')} className="font-bold text-primary hover:underline">
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
