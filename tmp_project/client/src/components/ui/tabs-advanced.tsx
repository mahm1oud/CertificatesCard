import React, { useState } from 'react';
import { ScrollArea } from './scroll-area';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabContentProps {
  children: React.ReactNode;
  className?: string;
  id: string;
}

/**
 * مكون لعرض محتوى التاب
 */
export function TabContent({ children, className, id }: TabContentProps) {
  return (
    <div className={cn('p-4 h-full', className)}>
      <ScrollArea className="h-full">
        {children}
      </ScrollArea>
    </div>
  );
}

interface TabPanelProps {
  tabs: Tab[];
  defaultTab?: string;
  children: React.ReactNode;
  variant?: 'default' | 'sidebar' | 'underline';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
  onTabChange?: (tabId: string) => void;
}

/**
 * مكون متقدم للتبويب يدعم أنماط متعددة واتجاهات مختلفة
 */
export function TabPanel({
  tabs,
  defaultTab,
  children,
  variant = 'default',
  orientation = 'horizontal',
  className,
  tabClassName,
  contentClassName,
  onTabChange
}: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };
  
  // تحديد أنماط التبويب بناء على المتغيرات
  const getTabStyle = (tabId: string) => {
    const isActive = activeTab === tabId;
    
    const baseTabClasses = cn(
      'flex items-center transition-all duration-200 cursor-pointer font-medium',
      orientation === 'horizontal' ? 'py-2 px-4' : 'p-3',
      tabClassName
    );
    
    switch (variant) {
      case 'sidebar':
        return cn(
          baseTabClasses,
          'border-r-2 border-transparent',
          isActive 
            ? 'border-r-primary text-primary bg-primary/5' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        );
      case 'underline':
        return cn(
          baseTabClasses,
          orientation === 'horizontal' 
            ? 'border-b-2 border-transparent' 
            : 'border-r-2 border-transparent',
          isActive 
            ? orientation === 'horizontal' 
              ? 'border-b-primary text-primary' 
              : 'border-r-primary text-primary'
            : 'text-gray-500 hover:text-gray-700'
        );
      default:
        return cn(
          baseTabClasses,
          'rounded-md border border-transparent',
          isActive 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        );
    }
  };
  
  // تخطيط اتجاهي للتبويب
  const tabsContainerClasses = cn(
    'flex',
    orientation === 'horizontal' 
      ? 'flex-row border-b' 
      : 'flex-col h-full',
    className
  );
  
  // العثور على المحتوى النشط للتاب الحالي
  const activeContent = React.Children.toArray(children).find(
    (child) => 
      React.isValidElement(child) && 
      child.props.id === activeTab
  );
  
  return (
    <div className={cn('flex', orientation === 'horizontal' ? 'flex-col' : 'flex-row h-full')}>
      <div className={tabsContainerClasses}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={getTabStyle(tab.id)}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
      
      <div className={cn('flex-1', contentClassName)}>
        {activeContent}
      </div>
    </div>
  );
}