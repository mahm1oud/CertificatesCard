import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  BarChart3Icon, 
  UsersIcon, 
  FileIcon, 
  BookTemplateIcon,
  CalendarIcon,
  ChevronRightIcon,
  CheckCircle2Icon
} from 'lucide-react';

// Custom icons
const CertificateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="15" x2="13" y2="15" />
    <path d="M17 21l-5-5-5 5M7 4v4h4" />
  </svg>
);

const TemplateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="7" y="7" width="10" height="5" rx="1" />
    <rect x="7" y="14" width="10" height="3" rx="1" />
  </svg>
);

// Interface for dashboard stats
interface DashboardStats {
  totalUsers: number;
  totalCategories: number;
  totalTemplates: number;
  totalCertificates: number;
  totalCards: number;
  newUsersThisWeek: number;
  newCardsThisWeek: number;
  newCertificatesThisWeek: number;
  userGrowth: number;
  cardGrowth: number;
  certificateGrowth: number;
}

// Interface for recent items
interface RecentItem {
  id: number;
  title: string;
  createdAt: string;
  imageUrl?: string;
  status?: string;
  user?: {
    id: number;
    username: string;
  };
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  
  // Fetch dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });
  
  // Fetch recent certificates
  const { data: recentCertificates = [], isLoading: isCertificatesLoading } = useQuery({
    queryKey: ['/api/admin/certificates/recent'],
    queryFn: async () => {
      const response = await fetch('/api/admin/certificates/recent');
      if (!response.ok) throw new Error('Failed to fetch recent certificates');
      return response.json();
    }
  });
  
  // Fetch recent cards
  const { data: recentCards = [], isLoading: isCardsLoading } = useQuery({
    queryKey: ['/api/admin/cards/recent'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cards/recent');
      if (!response.ok) throw new Error('Failed to fetch recent cards');
      return response.json();
    }
  });
  
  // Fetch recent users
  const { data: recentUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/admin/users/recent'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users/recent');
      if (!response.ok) throw new Error('Failed to fetch recent users');
      return response.json();
    }
  });
  
  // Format date to locale string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('admin.dashboard.title')}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
      
      {isStatsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.stats.users')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats?.totalUsers || 0}</div>
              <div className="flex items-center pt-1">
                {(stats?.userGrowth || 0) > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (stats?.userGrowth || 0) < 0 ? (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <span className="w-4 h-4 inline-block mr-1"></span>
                )}
                <span className={`text-xs ${(stats?.userGrowth || 0) > 0 ? 'text-green-500' : (stats?.userGrowth || 0) < 0 ? 'text-red-500' : ''}`}>
                  {Math.abs(stats?.userGrowth || 0)}% {t('admin.dashboard.stats.weekChange')}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.stats.certificates')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats?.totalCertificates || 0}</div>
              <div className="flex items-center pt-1">
                {(stats?.certificateGrowth || 0) > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (stats?.certificateGrowth || 0) < 0 ? (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <span className="w-4 h-4 inline-block mr-1"></span>
                )}
                <span className={`text-xs ${(stats?.certificateGrowth || 0) > 0 ? 'text-green-500' : (stats?.certificateGrowth || 0) < 0 ? 'text-red-500' : ''}`}>
                  {Math.abs(stats?.certificateGrowth || 0)}% {t('admin.dashboard.stats.weekChange')}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.stats.cards')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats?.totalCards || 0}</div>
              <div className="flex items-center pt-1">
                {(stats?.cardGrowth || 0) > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (stats?.cardGrowth || 0) < 0 ? (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <span className="w-4 h-4 inline-block mr-1"></span>
                )}
                <span className={`text-xs ${(stats?.cardGrowth || 0) > 0 ? 'text-green-500' : (stats?.cardGrowth || 0) < 0 ? 'text-red-500' : ''}`}>
                  {Math.abs(stats?.cardGrowth || 0)}% {t('admin.dashboard.stats.weekChange')}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.stats.templates')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats?.totalTemplates || 0}</div>
              <div className="flex items-center pt-1">
                <span className="w-4 h-4 inline-block mr-1"></span>
                <span className="text-xs">
                  {stats?.totalCategories || 0} {t('admin.dashboard.stats.categories')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue="certificates" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="certificates">{t('admin.dashboard.recent.certificates')}</TabsTrigger>
          <TabsTrigger value="cards">{t('admin.dashboard.recent.cards')}</TabsTrigger>
          <TabsTrigger value="users">{t('admin.dashboard.recent.users')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.recent.certificates')}</CardTitle>
              <CardDescription>
                {t('admin.dashboard.recent.certificatesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCertificatesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-10 w-10 bg-muted-foreground/20 rounded"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCertificates.map((cert: RecentItem) => (
                    <div key={cert.id} className="flex items-center gap-4">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                        {cert.imageUrl ? (
                          <img src={cert.imageUrl} alt={cert.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{cert.title}</p>
                          <div className={`px-2 py-0.5 text-xs rounded-full ${
                            cert.status === 'active' ? 'bg-green-100 text-green-800' : 
                            cert.status === 'expired' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cert.status || 'active'}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {formatDate(cert.createdAt)}
                          {cert.user && (
                            <>
                              <span className="mx-1">•</span>
                              <UsersIcon className="mr-1 h-3 w-3" />
                              {cert.user.username}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                {t('admin.dashboard.viewAll')}
                <ChevronRightIcon className="mr-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.recent.cards')}</CardTitle>
              <CardDescription>
                {t('admin.dashboard.recent.cardsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCardsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-10 w-10 bg-muted-foreground/20 rounded"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCards.map((card: RecentItem) => (
                    <div key={card.id} className="flex items-center gap-4">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{card.title}</p>
                          <div className={`px-2 py-0.5 text-xs rounded-full ${
                            card.status === 'active' ? 'bg-green-100 text-green-800' : 
                            card.status === 'draft' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {card.status || 'active'}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {formatDate(card.createdAt)}
                          {card.user && (
                            <>
                              <span className="mx-1">•</span>
                              <UsersIcon className="mr-1 h-3 w-3" />
                              {card.user.username}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                {t('admin.dashboard.viewAll')}
                <ChevronRightIcon className="mr-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.recent.users')}</CardTitle>
              <CardDescription>
                {t('admin.dashboard.recent.usersDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-muted-foreground/20"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUsers.map((user: RecentItem) => (
                    <div key={user.id} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{user.title.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{user.title}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                {t('admin.dashboard.viewAll')}
                <ChevronRightIcon className="mr-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}