import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';
import { Preferences } from '@capacitor/preferences';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/mapa'
  },
  {
    path: '/termos',
    component: () => import('@/views/TermosPage.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/mapa'
      },
      {
        path: 'mapa',
        component: () => import('@/views/Mapa.vue')
      },
      // {
      //   path: 'news',
      //   component: () => import('@/views/News.vue')
      // },
      {
        path: 'config',
        component: () => import('@/views/Config.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 🔐 Redirecionamento para Termos se ainda não aceitou
router.beforeEach(async (to, from, next) => {
  const { value } = await Preferences.get({ key: 'aceitou_termos' });

  // Se ainda não aceitou e não está tentando acessar a página de termos
  if (value !== 'true' && to.path !== '/termos') {
    return next('/termos');
  }

  next();
});

export default router;
