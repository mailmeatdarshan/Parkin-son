import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, X, UserCircle, Command, CalendarDays, Timer, BarChart2, Award, Settings2, ChevronsUpDown } from 'lucide-react';
import { apiFetch } from '../../apiClient';

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
        <div style={{ padding: 0, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button 
                onClick={() => {
                    navigate(`/${item.name.toLowerCase()}`);
                    if (isMobile && onClose) onClose();
                }} 
                onMouseEnter={() => setHoveredItem(item.name)}
                style={{ 
                    position: 'relative', 
                    width: 'calc(100% - 32px)', 
                    height: 'auto',
                    padding: isMobile ? '10px 16px' : '12px 20px', 
                    borderRadius: 12, 
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    fontSize: isMobile ? 14 : 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
                    border: 'none', outline: 'none',
                    backgroundColor: isActive ? '#2A2A2A' : isHovered ? 'rgba(255,255,255,0.06)' : 'transparent', 
                    color: isActive || isHovered ? '#FFFFFF' : '#8A8A8E',
                    margin: '2px 16px'
                }}
                className="group"
            >
                {isActive && (
                    <motion.div
                        layoutId="active-indicator"
                        style={{ 
                            position: 'absolute', 
                            left: 0, 
                            bottom: 0, 
                            top: 0,
                            width: 3, 
                            height: '100%',
                            borderRadius: 0,
                            backgroundColor: '#3B82F6', 
                            zIndex: 10 
                        }}
                    />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 10 }}>
                    <Icon size={isMobile ? 18 : 18} className={`transition-transform duration-300 ${isActive || isHovered ? 'scale-110' : ''}`} />
                    <span>{item.name}</span>
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

const getRandomAvatar = (name) => {
    const avatarCount = 4;
    let hash = 0;
    for (let i = 0; i < (name || 'U').length; i++) {
        hash = (name || 'U').charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = (Math.abs(hash) % avatarCount) + 1;
    return `/avatars/avatar${index}.png`;
};

let globalSidebarOpen = false;

const SidebarMenu = React.memo(({ activePage, navigate, isMobile, onClose }) => {
    const [hoveredItem, setHoveredItem] = useState(activePage);

    useEffect(() => {
        setHoveredItem(activePage);
    }, [activePage]);

    return (
        <div 
            style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', margin: '0 -24px', alignItems: 'stretch' }} 
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
                            <div style={{ padding: '0 24px', margin: '8px 0', width: 'auto' }}>
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
    const [profile, setProfile] = useState(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiFetch("/api/auth/me", { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.user);
                }
            } catch (err) {}
        };
        fetchProfile();
    }, []);

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

       const handleLogout = async () => {
        try {
            const res = await apiFetch("/api/auth/logout", { method: "POST", credentials: "include" });
            if (res.ok) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace("/login");
            }
        } catch (error) { 
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace("/login"); 
        }
    };

    const hasRealImage = profile?.imageUrl && profile.imageUrl.trim() !== '' && !profile.imageUrl.includes('default.png') && !profile.imageUrl.includes('default_avatar');
    const imgUrl = hasRealImage ? profile.imageUrl : (profile ? getRandomAvatar(profile.name) : null);

    const sidebarWidth = isMobile ? 260 : 280;

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
                    backdropFilter: 'blur(4px)',
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
                    padding: isMobile ? '20px 20px' : 24, 
                    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', 
                    boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
                    overflowY: 'auto'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 28, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src="/parkinson.svg" alt="Parkin'son Logo" style={{ width: 26, height: 26 }} />
                        <span style={{ color: '#D1D5DB', fontSize: 20, fontWeight: 700, letterSpacing: '0.15em', fontFamily: "'Pixeloid', sans-serif" }}>Parkin'son</span>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        style={{ padding: 6, color: '#9CA3AF', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} 
                        className="hover:text-white hover:bg-white/10 transition-all"
                        aria-label="Close Navigation"
                    >
                        <X size={18} />
                    </button>
                </div>
                
                <SidebarMenu activePage={activePage} navigate={navigate} isMobile={isMobile} onClose={() => setIsOpen(false)} />

                <div style={{ marginTop: 'auto', paddingTop: 20, width: '100%' }}>
                    <button 
                        onClick={handleLogout}
                        title="Click to logout"
                        style={{ 
                            width: '100%',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '10px 12px', 
                            borderRadius: 12, 
                            backgroundColor: '#222224', 
                            border: '1px solid #2C2C2E',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left'
                        }}
                        className="hover:bg-white/10 group"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                            {imgUrl ? (
                                <img 
                                    src={imgUrl} 
                                    alt="User" 
                                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                                    onError={(e) => { 
                                        e.target.style.display = 'none'; 
                                        e.target.nextSibling.style.display = 'flex'; 
                                    }} 
                                />
                            ) : null}
                            <div style={{ display: imgUrl ? 'none' : 'flex', width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120, fontFamily: "'Inter', sans-serif" }}>
                                    {profile?.name || 'User Name'}
                                </span>
                                <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120, fontFamily: "'Inter', sans-serif" }}>
                                    {profile?.email || 'user@example.com'}
                                </span>
                            </div>
                        </div>
                        <div style={{ color: '#6B7280', flexShrink: 0, paddingRight: 2 }} className="group-hover:text-white transition-colors">
                            <ChevronsUpDown size={16} strokeWidth={2.5} />
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
};

export default React.memo(Sidebar);
