import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { AppIcon } from '../components/icons/AppIcon';
import { StrategyIcon, AssetsIcon, CampaignIcon, ContentIcon, SeoIcon, AdvisorIcon } from '../components/icons/TabIcons';
import { CheckIcon } from '../components/icons/CheckIcon';
import { CrossIcon } from '../components/icons/CrossIcon';
import { TwitterIcon, LinkedInIcon, GithubIcon } from '../components/icons/SocialIcons';
import ThemeToggle from '../components/ThemeToggle';
import { ChevronDownIcon } from '../components/icons/ChevronIcons';
import { MenuIcon } from '../components/icons/MenuIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import LiveDemo from '../components/LiveDemo';

// Custom hook for scroll-triggered animations
const useScrollAnimation = () => {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const targets = document.querySelectorAll('.section-fade-in');
        targets.forEach((target) => observer.observe(target));

        return () => targets.forEach((target) => observer.unobserve(target));
    }, []);
};

const MandalaIllustration: React.FC = () => (
    <div className="relative w-full max-w-lg mx-auto aspect-square">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Outer circles */}
            <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-primary/30" />
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-secondary/30" />
            
            {/* Mandala Petals */}
            {[...Array(12)].map((_, i) => (
                <path
                    key={`outer-petal-${i}`}
                    d="M100 5 Q110 20 100 35 Q90 20 100 5 Z"
                    fill="currentColor"
                    className="text-primary/20"
                    transform={`rotate(${i * 30}, 100, 100)`}
                />
            ))}
            {[...Array(8)].map((_, i) => (
                <path
                    key={`inner-petal-${i}`}
                    d="M100 25 Q108 40 100 55 Q92 40 100 25 Z"
                    fill="currentColor"
                    className="text-secondary/20"
                    transform={`rotate(${i * 45}, 100, 100)`}
                />
            ))}

            {/* AI Core */}
            <circle cx="100" cy="100" r="20" fill="currentColor" className="text-primary" />
            <circle cx="100" cy="100" r="15" fill="none" stroke="white" strokeWidth="1" className="opacity-50" />
            
            {/* Radiating lines - data */}
            {[...Array(24)].map((_, i) => (
                <line
                    key={`line-${i}`}
                    x1="100"
                    y1="100"
                    x2={100 + 75 * Math.cos((i * 15 * Math.PI) / 180)}
                    y2={100 + 75 * Math.sin((i * 15 * Math.PI) / 180)}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-primary/50 animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                />
            ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <AppIcon className="w-16 h-16 text-white" />
        </div>
    </div>
);

const PrincipleCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; ref?: React.Ref<HTMLDivElement> }> = React.forwardRef(({ icon, title, subtitle, children }, ref) => (
  <div ref={ref} className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group text-center">
    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold font-heading mt-5">{title}</h3>
    <p className="text-sm font-semibold text-primary">{subtitle}</p>
    <p className="mt-3 text-secondary-text-light dark:text-secondary-text-dark text-sm leading-6">{children}</p>
  </div>
));

const FaqItem: React.FC<{ question: string; answer: string; }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-border-light dark:border-border-dark py-5">
            <button
                className="w-full flex justify-between items-center text-left text-lg font-semibold"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>{question}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'}`}>
                 <div className="overflow-hidden">
                    <p className="text-secondary-text-light dark:text-secondary-text-dark text-sm leading-6">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
};


export default function LandingPage() {
    const { login, setPublicPage, scrollToHash, setScrollToHash } = useAppContext();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    useScrollAnimation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
       if (scrollToHash) {
           const targetElement = document.getElementById(scrollToHash);
           if (targetElement) {
               // The page might need a moment to render after the state change.
               setTimeout(() => {
                   targetElement.scrollIntoView({ behavior: 'smooth' });
                   setScrollToHash(null); // Reset after scrolling
               }, 100);
           } else {
              setScrollToHash(null); // Reset if element not found
           }
       }
   }, [scrollToHash, setScrollToHash]);

    const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href')?.substring(1);
        if (targetId) {
            if (targetId === 'about') {
                setPublicPage('about');
                setIsMobileMenuOpen(false);
                return;
            }
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setIsMobileMenuOpen(false); // Close mobile menu on click
    };

    return (
        <div className="bg-light dark:bg-dark text-primary-text-light dark:text-primary-text-dark font-sans min-h-screen">
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-light/80 dark:bg-dark/80 backdrop-blur-lg border-b border-border-light dark:border-border-dark shadow-sm' : ''}`}>
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <a href="#!" onClick={handleLogoClick} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                            <AppIcon className="w-6 h-6 text-white"/>
                        </div>
                        <h1 className="text-xl font-bold font-heading">Yugn AI</h1>
                    </a>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">
                        <a href="#niti" onClick={handleNavClick} className="hover:text-primary transition-colors">Our Niti</a>
                        <a href="#demo" onClick={handleNavClick} className="hover:text-primary transition-colors">Live Demo</a>
                        <a href="#capabilities" onClick={handleNavClick} className="hover:text-primary transition-colors">Capabilities</a>
                        <a href="#faq" onClick={handleNavClick} className="hover:text-primary transition-colors">FAQ</a>
                        <a href="#about" onClick={handleNavClick} className="hover:text-primary transition-colors">About Us</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                         <button onClick={login} className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-md shadow-primary/20">
                            Start Your Journey
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2" aria-label="Toggle menu">
                            {isMobileMenuOpen ? <CrossIcon className="w-6 h-6"/> : <MenuIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>
                {/* Mobile Menu */}
                <div className={`transition-all duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <nav className="container mx-auto px-6 pb-4 flex flex-col items-center gap-4 text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">
                        <a href="#niti" onClick={handleNavClick} className="hover:text-primary transition-colors w-full text-center py-2">Our Niti</a>
                        <a href="#demo" onClick={handleNavClick} className="hover:text-primary transition-colors w-full text-center py-2">Live Demo</a>
                        <a href="#capabilities" onClick={handleNavClick} className="hover:text-primary transition-colors w-full text-center py-2">Capabilities</a>
                        <a href="#faq" onClick={handleNavClick} className="hover:text-primary transition-colors w-full text-center py-2">FAQ</a>
                        <a href="#about" onClick={handleNavClick} className="hover:text-primary transition-colors w-full text-center py-2">About Us</a>
                        <button onClick={login} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl w-full mt-2">
                           Start Your Journey
                        </button>
                    </nav>
                </div>
            </header>
            
            <main>
                {/* Hero Section */}
                <section className="pt-40 pb-20 relative overflow-hidden bg-light dark:bg-dark">
                    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <div className="animate-fade-in-up text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight">
                                Great marketing isn't just data. <span className="text-primary">It's wisdom.</span>
                            </h1>
                            <p className="mt-6 text-lg text-secondary-text-light dark:text-secondary-text-dark">
                               Yugn AI is more than a tool. It's the culmination of a lifelong quest for answers, blending cutting-edge technology with the timeless wisdom of human connection. Forged in India, for the world.
                            </p>
                             <div className="mt-8 border-l-4 border-primary/50 pl-6 py-2 section-fade-in">
                                <p className="text-secondary-text-light dark:text-secondary-text-dark italic">"My journey has taught me that technology must serve humanity. Yugn AI is my answer to the question: 'How can we build marketing that respects people and builds lasting relationships?'"</p>
                                <p className="mt-2 font-semibold">- The Founder</p>
                            </div>
                            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                                <button onClick={login} className="flex items-center gap-3 bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-xl text-lg shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 duration-300">
                                    Discover the Yugn Way
                                </button>
                            </div>
                        </div>
                        <div className="relative animate-fade-in-down hidden md:block">
                           <MandalaIllustration />
                        </div>
                    </div>
                </section>
                
                {/* Guiding Principles (Niti) Section */}
                <section id="niti" className="py-20 bg-surface-light dark:bg-surface-dark/50 scroll-mt-20">
                    <div className="container mx-auto px-6 section-fade-in">
                        <div className="text-center mb-16 max-w-2xl mx-auto">
                             <h2 className="text-3xl md:text-4xl font-bold font-heading mt-2">Our Guiding Niti (नीति)</h2>
                            <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark">
                                Niti is the Sanskrit word for wisdom, ethics, and guidance. It is the soul of our technology, built on three core principles that honor our human and Indian roots.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                             <PrincipleCard icon={<BrainIcon className="w-8 h-8"/>} title="Jigyasa (जिज्ञासा)" subtitle="The Quest for Answers">
                                A relentless curiosity. Our AI is designed to question the unquestioned, constantly exploring new data and perspectives to find the deepest insights for your brand.
                            </PrincipleCard>
                             <PrincipleCard icon={<UsersIcon className="w-8 h-8"/>} title="Sambandha (सम्बन्ध)" subtitle="The Sanctity of Connection">
                                Respect for every relationship. We build technology that fosters genuine connection, honoring the trust between you and your community, just as we honor the wisdom of our elders.
                            </PrincipleCard>
                             <PrincipleCard icon={<CheckIcon className="w-8 h-8"/>} title="Satya (सत्य)" subtitle="Truth in Technology">
                                Integrity in action. A commitment to transparent, ethical AI that empowers human creativity, not replaces it. Proudly built with human values at its core.
                            </PrincipleCard>
                        </div>
                    </div>
                </section>

                {/* Live Demo Section */}
                <section id="demo" className="py-20 scroll-mt-20">
                    <div className="container mx-auto px-6 section-fade-in">
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                             <h2 className="text-3xl md:text-4xl font-bold font-heading mt-2">From Niti to Action: See Your Strategy Come to Life</h2>
                            <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark">
                                Our principles aren't just words—they're coded into the very fabric of our platform. See how Yugn AI transforms philosophy into a powerful, intuitive marketing command center.
                            </p>
                        </div>
                        <div className="h-[500px] max-w-4xl mx-auto">
                            <LiveDemo />
                        </div>
                    </div>
                </section>

                {/* Capabilities Section */}
                <section id="capabilities" className="py-20 scroll-mt-20">
                    <div className="container mx-auto px-6 section-fade-in">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-heading mt-2">An Integrated Marketing Command Center</h2>
                            <p className="mt-4 max-w-xl mx-auto text-secondary-text-light dark:text-secondary-text-dark">
                                Every tool you need, intelligently connected to your core philosophy.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <PrincipleCard icon={<StrategyIcon className="w-6 h-6" />} title="Unified Strategic Planning" subtitle="Clarity of Vision">
                                Generate comprehensive marketing plans that align your entire team, from target personas to budget allocation.
                            </PrincipleCard>
                            <PrincipleCard icon={<AssetsIcon className="w-6 h-6" />} title="Creative Intelligence" subtitle="Resonance Before Release">
                                Get objective, AI-powered feedback on ad creatives to ensure every asset is optimized for performance before launch.
                            </PrincipleCard>
                            <PrincipleCard icon={<CampaignIcon className="w-6 h-6" />} title="Actionable Analytics" subtitle="Wisdom from Data">
                                Move beyond raw data. Get AI-driven optimization suggestions and performance forecasts to maximize your impact.
                            </PrincipleCard>
                            <PrincipleCard icon={<ContentIcon className="w-6 h-6" />} title="On-Brand Content Engine" subtitle="Your Authentic Voice">
                                Create high-quality marketing copy that's always aligned with your brand voice, strategic goals, and target personas.
                            </PrincipleCard>
                            <PrincipleCard icon={<SeoIcon className="w-6 h-6" />} title="Competitive SEO Audits" subtitle="Understand the Landscape">
                                Analyze your digital footprint against competitors. Receive a prioritized action plan to elevate your search presence.
                            </PrincipleCard>
                            <PrincipleCard icon={<AdvisorIcon className="w-6 h-6" />} title="On-Demand Strategic Advisor" subtitle="Your AI Guru">
                                Get proactive advice and real-time answers to complex marketing questions, backed by live web data.
                            </PrincipleCard>
                        </div>
                    </div>
                </section>
                
                <section id="faq" className="py-20 scroll-mt-20 bg-surface-light dark:bg-surface-dark/50">
                    <div className="container mx-auto px-6 max-w-3xl section-fade-in">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-heading mt-2">Your Questions, Answered</h2>
                        </div>
                        <div>
                            <FaqItem
                                question="How is my data and interaction with the AI secured?"
                                answer="We take a multi-layered approach to security. First, all your project data is stored locally in your browser, not on our servers. Second, the API key is managed as a secure environment variable by the platform; it is never stored in your browser or exposed in the client-side code. Third, we employ strict instructions within our AI prompts to prevent malicious use. Finally, all AI responses are rigorously sanitized before being displayed to protect against vulnerabilities like Cross-Site Scripting (XSS)."
                            />
                            <FaqItem
                                question="Do I need to provide my own API key?"
                                answer="No, Yugn AI Hub is an all-inclusive platform. We manage API access securely, so you can start generating insights immediately without any complex setup or needing to handle your own API keys."
                            />
                            <FaqItem
                                question="What makes Yugn AI different from other AI tools?"
                                answer="Our difference lies in our 'Niti' or philosophy. Yugn AI is an integrated platform designed to be a strategic partner, not just a single-task tool. Our insights are grounded in real-time web data and guided by a commitment to ethical, human-centric marketing."
                            />
                            <FaqItem
                                question="Can I use this for multiple clients or projects?"
                                answer="Yes! Yugn AI is built with a project-based structure. You can easily create, manage, and switch between different projects, keeping all the marketing data for each client or campaign completely separate and organized."
                            />
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6 section-fade-in">
                        <div className="relative rounded-2xl bg-gradient-to-br from-primary to-secondary p-12 text-center text-white overflow-hidden">
                            <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/10"></div>
                            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/10"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold font-heading">Begin Your Journey to Wiser Marketing</h2>
                                <p className="mt-4 max-w-xl mx-auto text-white/80">
                                    Join us and let Yugn AI co-pilot your journey to marketing excellence.
                                </p>
                                <button onClick={login} className="mt-8 flex items-center gap-3 mx-auto bg-white hover:bg-slate-100 text-primary font-bold py-4 px-10 rounded-xl text-lg shadow-2xl transition-all hover:-translate-y-1.5 duration-300">
                                    Start Your Journey
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-surface-light dark:bg-surface-dark/50 border-t border-border-light dark:border-border-dark">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                                <AppIcon className="w-5 h-5 text-white"/>
                            </div>
                            <span className="font-semibold font-heading">Yugn AI</span>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">&copy; {new Date().getFullYear()} Yugn AI. All rights reserved.</p>
                             <p className="text-xs text-subtle-text-light dark:text-subtle-text-dark mt-1">Made with ❤️ in India</p>
                        </div>
                        <div className="flex items-center gap-4 text-secondary-text-light dark:text-secondary-text-dark">
                            <a href="#!" onClick={(e) => e.preventDefault()} className="hover:text-primary"><TwitterIcon className="w-5 h-5"/></a>
                            <a href="#!" onClick={(e) => e.preventDefault()} className="hover:text-primary"><LinkedInIcon className="w-5 h-5"/></a>
                            <a href="#!" onClick={(e) => e.preventDefault()} className="hover:text-primary"><GithubIcon className="w-5 h-5"/></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}