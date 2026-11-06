import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, UserCircle, Command, CalendarDays, Timer, BarChart2, Award, Settings2 } from 'lucide-react';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

const SIDEBAR_ITEMS = [
    { name: 'Profile', icon: UserCircle },
    { name: 'Workspace', icon: Command },
    { name: 'Calendar', icon: CalendarDays },
    { name: 'Stopwatch', icon: Timer },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Leaderboard', icon: Award },
    { name: 'Settings', icon: Settings2 }
];

const SidebarItem = React.memo(({ item, isActive, isHovered, setHoveredItem, navigate, isMobile, onClose }) => {
    const Icon = item.icon;
    return (
        <div style={{ padding: isMobile ? '8px 12px' : '0', display: 'flex', justifyContent: 'center' }}>
            <button 
                onClick={() => {
                    navigate(`/${item.name.toLowerCase()}`);
                    if (isMobile && onClose) onClose();
                }} 
                onMouseEnter={() => setHoveredItem(item.name)}
                style={{ 
                    position: 'relative', 
                    width: isMobile ? '48px' : 'calc(100% - 32px)', 
                    height: isMobile ? '48px' : 'auto',
                    padding: isMobile ? '0' : '12px 20px', 
                    borderRadius: 12, 
                    display: 'flex',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    alignItems: 'center',
                    fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
                    border: 'none', outline: 'none',
                    backgroundColor: isActive ? '#2A2A2A' : isHovered ? 'rgba(255,255,255,0.06)' : 'transparent', 
                    color: isActive || isHovered ? '#FFFFFF' : '#8A8A8E',
                    margin: isMobile ? '0' : '2px 16px'
                }}
                className="group"
            >
                {isActive && (
                    <motion.div
                        layoutId={isMobile ? "mobile-active-indicator" : "active-indicator"}
                        style={{ 
                            position: 'absolute', 
                            left: isMobile ? '50%' : 0, 
                            bottom: isMobile ? -6 : 0, 
                            top: isMobile ? 'auto' : 0,
                            transform: isMobile ? 'translateX(-50%)' : 'none',
                            width: isMobile ? 4 : 3, 
                            height: isMobile ? 4 : '100%',
                            borderRadius: isMobile ? '50%' : 0,
                            backgroundColor: '#3B82F6', 
                            boxShadow: isMobile ? '0 0 8px #3B82F6' : 'none',
                            zIndex: 10 
                        }}
                    />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 10 }}>
                    <Icon size={isMobile ? 22 : 18} className={`transition-transform duration-300 ${isActive || isHovered ? 'scale-110' : ''}`} />
                    {!isMobile && <span>{item.name}</span>}
                </div>
            </button>
        </div>
    );
});


const CustomSidebarIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="5" x2="6" y2="19" />
        <line x1="12" y1="5" x2="12" y2="19" />
        <path d="M18 5v14l3-2.5V7.5z" />
    </svg>
);


let globalSidebarOpen = false;

const SidebarMenu = React.memo(({ activePage, navigate, isMobile, onClose }) => {
    const [hoveredItem, setHoveredItem] = useState(activePage);

    useEffect(() => {
        setHoveredItem(activePage);
    }, [activePage]);

    return (
        <div 
            style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', margin: isMobile ? '0' : '0 -24px', alignItems: isMobile ? 'center' : 'stretch', gap: isMobile ? 8 : 0 }} 
            onMouseLeave={() => setHoveredItem(activePage)} 
        >
            {SIDEBAR_ITEMS.map((item) => {
                const isActive = item.name === activePage;
                const isHovered = item.name === hoveredItem;
                return (
                    <React.Fragment key={item.name}>
                        <SidebarItem 
                            item={item} 
                            isActive={isActive} 
                            isHovered={isHovered} 
                            setHoveredItem={setHoveredItem} 
                            navigate={navigate} 
                            isMobile={isMobile}
                            onClose={onClose}
                        />
                        {item.name === 'Stopwatch' && (
                            <div style={{ padding: isMobile ? '0' : '0 24px', margin: '8px 0', width: isMobile ? '32px' : 'auto' }}>
                                <hr style={{ 
                                    border: 'none', 
                                    borderTop: '2px solid rgba(255,255,255,0.08)', 
                                    borderRadius: '4px' 
                                }} />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
});

const Sidebar = ({ activePage }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(globalSidebarOpen);
    const sidebarRef = useRef(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        globalSidebarOpen = isOpen;
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, isMobile]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const sidebarWidth = isMobile ? 80 : 280;

    return (
        <>
            <button 
                onMouseEnter={() => setIsOpen(true)}
                onClick={() => setIsOpen(true)}
                style={{ 
                    position: 'fixed', top: isMobile ? 12 : 24, left: isMobile ? 12 : 24, zIndex: 40, width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 12, 
                    backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', 
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    opacity: isOpen ? 0 : 1, pointerEvents: isOpen ? 'none' : 'auto'
                }}
                className="hover:scale-105 hover:bg-white/10"
                aria-label="Open Navigation"
            >
                <CustomSidebarIcon />
            </button>

            <div 
                onClick={() => setIsOpen(false)}
                style={{ 
                    position: 'fixed', inset: 0, zIndex: 40, 
                    backgroundColor: 'rgba(0,0,0,0.6)', 
                    backdropFilter: 'blur(3px)',
                    display: isOpen ? 'block' : 'none' 
                }}
            />

            <div 
                ref={sidebarRef} 
                onMouseLeave={() => !isMobile && setIsOpen(false)} 
                style={{ 
                    position: 'fixed', top: 0, left: 0, height: '100vh', width: sidebarWidth, 
                    backgroundColor: '#1C1C1E', 
                    borderRight: '1px solid #2C2C2E', zIndex: 50, 
                    padding: isMobile ? '24px 0' : 24, 
                    display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'stretch',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', 
                    boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
                    overflowY: 'auto'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', marginTop: 8, marginBottom: 32, width: '100%', padding: isMobile ? '0 12px' : 0 }}>
                    {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src="/parkinson.svg" alt="Parkin'son Logo" style={{ width: 26, height: 26 }} />
                            <span style={{ color: '#D1D5DB', fontSize: 22, fontWeight: 700, letterSpacing: '0.15em', fontFamily: "'Pixeloid', sans-serif" }}>Parkin'son</span>
                        </div>
                    )}
                    {isMobile ? (
                        <button 
                            onClick={() => setIsOpen(false)} 
                            style={{ padding: 8, color: '#6B7280', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} 
                            className="hover:text-white hover:bg-white/10 transition-all"
                            aria-label="Close Navigation"
                        >
                            <X size={18} />
                        </button>
                    ) : (
                        <button onClick={() => setIsOpen(false)} style={{ padding: 8, color: '#6B7280', cursor: 'pointer', background: 'none', border: 'none', borderRadius: 8 }} className="hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>
                
                <SidebarMenu activePage={activePage} navigate={navigate} isMobile={isMobile} onClose={() => setIsOpen(false)} />


            </div>
        </>
    );
};

export default React.memo(Sidebar);
