import React from 'react';
import { Home, Gamepad2, Calendar, Trophy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sound } from '../services/soundService';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { path: '/', label: 'Home', icon: Home, isActive: pathname === '/' },
    {
      path: '/games',
      label: 'Games',
      icon: Gamepad2,
      isActive: pathname.startsWith('/games'),
      action: () => {
        if (pathname === '/') {
          const el = document.getElementById('games-grid');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/');
          setTimeout(() => {
            const el = document.getElementById('games-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      },
    },
    { path: '/daily', label: 'Daily', icon: Calendar, isActive: pathname === '/daily' },
    { path: '/progress', label: 'Progress', icon: Trophy, isActive: pathname === '/progress' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07111F]/95 backdrop-blur-lg border-t border-[rgba(130,180,220,0.15)] px-2 sm:px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => {
              sound.playClick();
              if (item.action) {
                item.action();
              } else {
                navigate(item.path);
              }
            }}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] rounded-lg transition-colors py-1 cursor-pointer ${
              item.isActive ? 'text-[#56E6D0]' : 'text-[#91A7BF] hover:text-[#F1F7FF]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
