import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { AppIcon } from '../components/icons/AppIcon';
import { TwitterIcon, LinkedInIcon, GithubIcon } from '../components/icons/SocialIcons';
import ThemeToggle from '../components/ThemeToggle';
import { MenuIcon } from '../components/icons/MenuIcon';
import { CrossIcon } from '../components/icons/CrossIcon';
import { BrainIcon } from '../components/icons/BrainIcon';

const AboutIllustration: React.FC = () => (
    <div className="relative w-full max-w-sm mx-auto aspect-square">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Lotus Petals - Tradition */}
            {[...Array(8)].map((_, i) => (
                <path
                    key={`lotus-petal-${i}`}
                    d="M100 20 C 80 40, 80 70, 100 90 C 120 70, 120 40, 100 20 Z"
                    fill="currentColor"
                    className="text-secondary/10"
                    transform={`rotate(${i * 45}, 100, 100) scale(0.9)`}
                />
            ))}
            {/* Circuit Lines - Technology */}
            <path d="M 50 50 L 50 70 L 70 70 M 50 90 L 50 110 L 70 110" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary/40"/>
            <path d="M 150 150 L 150 130 L 130 130 M 150 110 L 150 90 L 130 90" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary/40"/>
            <circle cx="70" cy="70" r="3" fill="currentColor" className="text-primary"/>
            <circle cx="70" cy="110" r="3" fill="currentColor" className="text-primary"/>
            <circle cx="130" cy="130" r="3" fill="currentColor" className="text-primary"/>
            <circle cx="130" cy="90" r="3" fill="currentColor" className="text-primary"/>

            {/* Central Icon */}
            <g transform="translate(75, 75) scale(0.25)">
                 <BrainIcon className="text-primary" />
            </g>
        </svg>
    </div>
);


const AboutPage: React.FC = () => {
    const { setPublicPage, login, setScrollToHash } = useAppContext();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash?: string) => {
        e.preventDefault();
        if (hash) {
            setScrollToHash(hash);
        }
        setPublicPage('landing');
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="bg-light dark:bg-dark text-primary-text-light dark:text-primary-text-dark font-sans min-h-screen flex flex-col">
             <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-light/80 dark:bg-dark/80 backdrop-blur-lg border-b border-border-light dark:border-border-dark shadow-sm' : ''}`}>
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <a href="#!" onClick={(e) => handleNavClick(e)} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                            <AppIcon className="w-6 h-6 text-white"/>
                        </div>
                        <h1 className="text-xl font-bold font-heading">Yugn AI</h1>
                    </a>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">
                        <a href="#niti" onClick={(e) => handleNavClick(e, 'niti')} className="hover:text-primary transition-colors">Our Niti</a>
                        <a href="#demo" onClick={(e) => handleNavClick(e, 'demo')} className="hover:text-primary transition-colors">Live Demo</a>
                        <a href="#capabilities" onClick={(e) => handleNavClick(e, 'capabilities')} className="hover:text-primary transition-colors">Capabilities</a>
                        <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="hover:text-primary transition-colors">FAQ</a>
                        <span className="text-primary font-bold">About Us</span>
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
                <div className={`transition-all duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <nav className="container mx-auto px-6 pb-4 flex flex-col items-center gap-4 text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">
                       <a href="#niti" onClick={(e) => handleNavClick(e, 'niti')} className="hover:text-primary transition-colors w-full text-center py-2">Our Niti</a>
                       <a href="#demo" onClick={(e) => handleNavClick(e, 'demo')} className="hover:text-primary transition-colors w-full text-center py-2">Live Demo</a>
                       <a href="#capabilities" onClick={(e) => handleNavClick(e, 'capabilities')} className="hover:text-primary transition-colors w-full text-center py-2">Capabilities</a>
                       <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="hover:text-primary transition-colors w-full text-center py-2">FAQ</a>
                       <span className="text-primary font-bold w-full text-center py-2">About Us</span>
                       <button onClick={login} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl w-full mt-2">
                           Start Your Journey
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-grow pt-24">
                <section id="about" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold font-heading mt-2">Our Story: A Single Conversation Sparked a New Era</h2>
                             <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark">
                                Rooted in a moment of inspiration, built for the global marketer.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                            <div className="animate-fade-in-down">
                                <AboutIllustration />
                            </div>
                            <div className="space-y-6 text-secondary-text-light dark:text-secondary-text-dark leading-7">
                                <p>
                                    Yugn AI wasn't born in a boardroom; it was conceived in a single, transformative conversation. Our founder was speaking with an industry leader about the future—a future where AI would redefine the landscape of business and marketing. As they talked of this inevitable shift, a simple but powerful question emerged:
                                </p>
                                <blockquote className="border-l-4 border-primary pl-6 py-2 bg-slate-50 dark:bg-surface-dark/40 rounded-r-lg">
                                    <p className="text-lg italic font-semibold text-primary-text-light dark:text-primary-text-dark">
                                        "What if we could create an AI tool that empowers anyone, anywhere, to build a world-class marketing strategy for their product?"
                                    </p>
                                </blockquote>
                                <p>
                                    That question was the spark. 'Yugn'—a Sanskrit word for a new era—became our mission. We set out to build not just another tool, but a strategic partner that demystifies marketing and makes elite-level strategy accessible to all.
                                </p>
                                <p>
                                    We believe great marketing is an act of service. It’s about understanding people and building relationships on truth (Satya). Yugn AI is our commitment to this philosophy—a platform born from a single moment of inspiration and built to empower you to do your most meaningful work.
                                </p>
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
};

export default AboutPage;