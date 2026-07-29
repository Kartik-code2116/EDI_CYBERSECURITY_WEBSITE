import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import Footer from '../components/layout/Footer';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }} className={className}>
      {children}
    </motion.div>
  );
}

const features = [
  { icon: '🔗', title: 'URL Threat Detection', desc: 'Paste any URL and get instant AI-powered analysis. Detect phishing, malware, and suspicious redirect chains in under 2 seconds.' },
  { icon: '📄', title: 'PDF Document Scanning', desc: 'Upload PDF files up to 20MB. Detect hidden scripts, embedded URLs, macro payloads, and malicious JavaScript injections.' },
  { icon: '📝', title: 'DOCX File Analysis', desc: 'Deep scan Word documents for macro viruses, hidden objects, and embedded threat indicators using machine learning.' },
  { icon: '📊', title: 'Detailed Reports', desc: 'Generate comprehensive PDF security reports with threat scores, AI explanations, and professional recommendations.' },
  { icon: '🛡️', title: 'Real-time Protection', desc: 'Continuous monitoring with instant threat classification. Get notified immediately when risks are detected.' },
  { icon: '🔐', title: 'Secure & Private', desc: 'Enterprise-grade JWT authentication, role-based access control, and encrypted data handling for maximum security.' },
];

const steps = [
  { n: '01', title: 'Submit', desc: 'Enter a URL or upload a PDF/DOCX document through our intuitive interface.' },
  { n: '02', title: 'AI Analyzes', desc: 'Our neural network models process the input using advanced threat intelligence databases.' },
  { n: '03', title: 'Get Results', desc: 'Receive a detailed threat score, risk assessment, and actionable recommendations.' },
  { n: '04', title: 'Download Report', desc: 'Export a professional PDF security report for your records or compliance needs.' },
];

const stats = [
  { value: 2500000, suffix: '+', label: 'URLs Analyzed' },
  { value: 98, suffix: '%', label: 'Detection Accuracy' },
  { value: 150000, suffix: '+', label: 'Documents Scanned' },
  { value: 500, suffix: '+', label: 'Organizations Protected' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'CISO, TechCorp', avatar: 'SC', text: 'CyberShield AI reduced our phishing incidents by 94%. The URL analyzer catches threats that our traditional tools miss completely.' },
  { name: 'Marcus Williams', role: 'Security Engineer, FinBank', avatar: 'MW', text: 'The document analysis feature is a game-changer. We scan every incoming PDF automatically before it reaches our employees.' },
  { name: 'Priya Sharma', role: 'IT Director, MedTech', avatar: 'PS', text: 'The dashboard charts give us a clear picture of our threat landscape. Incredible tool for any security-conscious organization.' },
];

export default function Landing() {
  return (
    <div className="cyber-grid-bg min-h-screen">
      {/* ── Navbar ──────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{ background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>🛡️</div>
            <span className="font-bold text-white">CyberShield <span className="text-gradient-cyber">AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'How It Works', 'Statistics', 'Testimonials'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="text-gray-400 hover:text-cyber-cyan text-sm transition-colors">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-outline-cyber text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-cyber text-white text-sm px-4 py-2 rounded-xl">Get Started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-20 -left-40 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-0 -right-40 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
            AI-Powered Security Platform — Next Generation Protection
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
            Detect Cyber Threats
            <br />
            <span className="text-gradient-cyber">Before They Strike</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            AI-powered analysis of URLs, PDF documents, and DOCX files. 
            Get instant threat scores, detailed explanations, and professional security reports.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-cyber text-white text-base px-8 py-4 rounded-xl inline-flex items-center gap-2">
              🚀 Start Free Analysis
            </Link>
            <Link to="/login" className="btn-outline-cyber text-base px-8 py-4 rounded-xl inline-flex items-center gap-2">
              🔐 Sign In
            </Link>
          </motion.div>

          {/* Floating badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-3">
            {['✓ No credit card required', '✓ Instant results', '✓ PDF reports', '✓ 99.9% uptime'].map(b => (
              <span key={b} className="text-sm text-gray-500 flex items-center gap-1">{b}</span>
            ))}
          </motion.div>

          {/* Hero visual */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-16 relative max-w-4xl mx-auto">
            <div className="glass-card p-6 relative overflow-hidden" style={{ boxShadow: '0 0 80px rgba(0,212,255,0.1)' }}>
              {/* Scan line animation */}
              <div className="scan-line" />
              <div className="grid grid-cols-3 gap-4 text-left">
                {['🔗 URL Analysis', '📄 PDF Scan', '📝 DOCX Scan'].map((label, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/3 border border-white/5">
                    <div className="text-sm font-medium text-gray-300 mb-3">{label}</div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ background: ['linear-gradient(90deg,#00ff88,#00d4ff)', 'linear-gradient(90deg,#ff3366,#ff8800)', 'linear-gradient(90deg,#ffcc00,#ff8800)'][i] }}
                          initial={{ width: 0 }} animate={{ width: ['72%', '88%', '45%'][i] }} transition={{ duration: 1.5, delay: 1 + i * 0.3 }} />
                      </div>
                      <div className="text-xs font-mono" style={{ color: ['#00ff88', '#ff3366', '#ffcc00'][i] }}>
                        {['SAFE', 'MALICIOUS', 'WARNING'][i]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-cyber-cyan text-sm font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-4xl font-bold text-white mt-3">Everything You Need for <br /><span className="text-gradient-cyber">Threat Intelligence</span></h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Comprehensive security analysis powered by state-of-the-art AI models trained on millions of threat samples.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div whileHover={{ scale: 1.02, y: -6 }} transition={{ duration: 0.2 }}
                  className="glass-card p-6 h-full hover:border-cyber-cyan/20 hover:shadow-cyber transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(0,212,255,0.2)' }}>
                    {f.icon}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────── */}
      <section id="how-it-works" className="py-24" style={{ background: 'rgba(13,31,60,0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-cyber-purple-light text-sm font-semibold uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl font-bold text-white mt-3">From Input to <span className="text-gradient-cyber">Insight</span> in Seconds</h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="absolute top-8 left-1/4 right-1/4 h-px hidden lg:block"
              style={{ background: 'linear-gradient(90deg, transparent, #00d4ff40, transparent)' }} />
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="glass-card p-6 text-center relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-4 text-cyber-cyan"
                    style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(0,212,255,0.3)' }}>
                    {s.n}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Statistics ───────────────────────────── */}
      <section id="statistics" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-cyber-green text-sm font-semibold uppercase tracking-widest">By the Numbers</span>
            <h2 className="text-4xl font-bold text-white mt-3">Trusted Security at <span className="text-gradient-safe">Scale</span></h2>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div whileHover={{ scale: 1.05 }} className="glass-card p-8 text-center hover:shadow-cyber transition-all duration-300">
                  <p className="text-4xl font-extrabold font-mono text-gradient-cyber">
                    <AnimatedNumber target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-gray-400 text-sm mt-2 font-medium">{s.label}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────── */}
      <section id="testimonials" className="py-24" style={{ background: 'rgba(13,31,60,0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-cyber-cyan text-sm font-semibold uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-bold text-white mt-3">Trusted by Security <span className="text-gradient-cyber">Professionals</span></h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <motion.div whileHover={{ y: -6 }} className="glass-card p-6 h-full hover:border-cyber-cyan/20 hover:shadow-cyber transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>{t.avatar}</div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                  <div className="text-cyber-cyan text-2xl mb-2">"</div>
                  <p className="text-gray-400 text-sm leading-relaxed">{t.text}</p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, j) => <span key={j} className="text-cyber-yellow text-sm">★</span>)}
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <div className="glass-card p-12 relative overflow-hidden" style={{ boxShadow: '0 0 100px rgba(0,212,255,0.1)' }}>
              <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }} />
              <div className="relative z-10">
                <div className="text-6xl mb-6 animate-float">🛡️</div>
                <h2 className="text-4xl font-extrabold text-white mb-4">Start Protecting Your <br /><span className="text-gradient-cyber">Digital Assets Today</span></h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join thousands of security professionals using CyberShield AI to detect and neutralize threats before they cause damage.</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/register" className="btn-cyber text-white text-base px-10 py-4 rounded-xl inline-flex items-center gap-2">
                    🚀 Create Free Account
                  </Link>
                  <Link to="/login" className="btn-outline-cyber text-base px-8 py-4 rounded-xl inline-flex items-center gap-2">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
