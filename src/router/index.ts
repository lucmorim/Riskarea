import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/mapa'
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
      {
        path: 'news',
        component: () => import('@/views/News.vue')
      },
      {
        path: 'config',
        component: () => import('@/views/Config.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
