import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CameraIcon, SparklesIcon, ChevronRightIcon, WandIcon, WindIcon, GridIcon, AnimationIcon, LayersIcon } from './Icons';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt-BR' : 'en';
    i18n.changeLanguage(newLang);
  };

  const tools = [
    {
      id: 'framesnap',
      path: '/framesnap',
      icon: <CameraIcon />,
      title: t('tool.framesnap.title'),
      desc: t('tool.framesnap.desc'),
      hoverBorder: 'hover:border-indigo-500/50',
      hoverShadow: 'hover:shadow-indigo-500/10',
      gradientFrom: 'from-indigo-500/5',
      gradientTo: 'to-purple-500/5',
      iconBgHover: 'group-hover:bg-indigo-500/20',
      iconTextHover: 'group-hover:text-indigo-400',
      titleHover: 'group-hover:text-indigo-300',
      textColor: 'text-indigo-400'
    },
    {
      id: 'bg-remover',
      path: '/bg-remover',
      icon: <WandIcon />,
      title: t('tool.bgremover.title'),
      desc: t('tool.bgremover.desc'),
      hoverBorder: 'hover:border-emerald-500/50',
      hoverShadow: 'hover:shadow-emerald-500/10',
      gradientFrom: 'from-emerald-500/5',
      gradientTo: 'to-teal-500/5',
      iconBgHover: 'group-hover:bg-emerald-500/20',
      iconTextHover: 'group-hover:text-emerald-400',
      titleHover: 'group-hover:text-emerald-300',
      textColor: 'text-emerald-400'
    },
    {
      id: 'smart-warp',
      path: '/smart-warp',
      icon: <WindIcon />,
      title: t('tool.smartwarp.title'),
      desc: t('tool.smartwarp.desc'),
      hoverBorder: 'hover:border-amber-500/50',
      hoverShadow: 'hover:shadow-amber-500/10',
      gradientFrom: 'from-amber-500/5',
      gradientTo: 'to-orange-500/5',
      iconBgHover: 'group-hover:bg-amber-500/20',
      iconTextHover: 'group-hover:text-amber-400',
      titleHover: 'group-hover:text-amber-300',
      textColor: 'text-amber-400'
    },
    {
      id: 'pixel-art',
      path: '/pixel-art',
      icon: <GridIcon />,
      title: t('tool.pixelart.title'),
      desc: t('tool.pixelart.desc'),
      hoverBorder: 'hover:border-pink-500/50',
      hoverShadow: 'hover:shadow-pink-500/10',
      gradientFrom: 'from-pink-500/5',
      gradientTo: 'to-red-500/5',
      iconBgHover: 'group-hover:bg-pink-500/20',
      iconTextHover: 'group-hover:text-pink-400',
      titleHover: 'group-hover:text-pink-300',
      textColor: 'text-pink-400'
    },
    {
      id: 'sprite-animator',
      path: '/sprite-animator',
      icon: <AnimationIcon />,
      title: t('tool.spriteanimator.title'),
      desc: t('tool.spriteanimator.desc'),
      hoverBorder: 'hover:border-purple-500/50',
      hoverShadow: 'hover:shadow-purple-500/10',
      gradientFrom: 'from-purple-500/5',
      gradientTo: 'to-fuchsia-500/5',
      iconBgHover: 'group-hover:bg-purple-500/20',
      iconTextHover: 'group-hover:text-purple-400',
      titleHover: 'group-hover:text-purple-300',
      textColor: 'text-purple-400'
    },
    {
      id: 'image-enhancer',
      path: '/image-enhancer',
      icon: <SparklesIcon />,
      title: t('tool.imageenhancer.title'),
      desc: t('tool.imageenhancer.desc'),
      hoverBorder: 'hover:border-cyan-500/50',
      hoverShadow: 'hover:shadow-cyan-500/10',
      gradientFrom: 'from-cyan-500/5',
      gradientTo: 'to-teal-500/5',
      iconBgHover: 'group-hover:bg-cyan-500/20',
      iconTextHover: 'group-hover:text-cyan-400',
      titleHover: 'group-hover:text-cyan-300',
      textColor: 'text-cyan-400'
    },
    {
      id: 'animation-maker',
      path: '/animation-maker',
      icon: <AnimationIcon />,
      title: t('tool.animationmaker.title'),
      desc: t('tool.animationmaker.desc'),
      hoverBorder: 'hover:border-rose-500/50',
      hoverShadow: 'hover:shadow-rose-500/10',
      gradientFrom: 'from-rose-500/5',
      gradientTo: 'to-orange-500/5',
      iconBgHover: 'group-hover:bg-rose-500/20',
      iconTextHover: 'group-hover:text-rose-400',
      titleHover: 'group-hover:text-rose-300',
      textColor: 'text-rose-400'
    },
    {
      id: 'batch-bg-remover',
      path: '/batch-bg-remover',
      icon: <LayersIcon />,
      title: t('tool.batchbgremover.title'),
      desc: t('tool.batchbgremover.desc'),
      hoverBorder: 'hover:border-indigo-500/50',
      hoverShadow: 'hover:shadow-indigo-500/10',
      gradientFrom: 'from-indigo-500/5',
      gradientTo: 'to-purple-500/5',
      iconBgHover: 'group-hover:bg-indigo-500/20',
      iconTextHover: 'group-hover:text-indigo-400',
      titleHover: 'group-hover:text-indigo-300',
      textColor: 'text-indigo-400'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-20 animate-fade-in relative">
      
      <div className="absolute top-0 right-4 sm:right-8 flex gap-2 z-10">
        <button 
          onClick={toggleLanguage}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2 shadow-lg"
        >
          {i18n.language === 'en' ? '🇺🇸 EN' : '🇧🇷 PT-BR'}
        </button>
      </div>

      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 px-4 mt-8 sm:mt-0">
        {t('home.welcome')}
      </h2>
      <p className="text-slate-400 text-base sm:text-lg text-center max-w-2xl mb-8 sm:mb-12 px-4">
        {t('home.description')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl">
        {tools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => navigate(tool.path)}
            className={`group relative bg-slate-900 border border-slate-800 ${tool.hoverBorder} rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl ${tool.hoverShadow} hover:-translate-y-1 active:scale-95`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradientFrom} ${tool.gradientTo} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative">
              <div className={`w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 ${tool.iconBgHover} ${tool.iconTextHover} transition-colors`}>
                {tool.icon}
              </div>
              <h3 className={`text-xl font-bold text-white mb-2 ${tool.titleHover} transition-colors`}>
                {tool.title}
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {tool.desc}
              </p>
              <div className={`flex items-center ${tool.textColor} font-medium text-sm group-hover:gap-2 transition-all`}>
                <span>{t('tool.launch')}</span>
                <ChevronRightIcon />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
