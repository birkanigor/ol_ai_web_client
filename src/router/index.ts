import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import PortalLayout from '../layouts/PortalLayout.vue'
import TasksView from '../views/TasksView.vue'
import AdminView from '../views/AdminView.vue'
import CustomersView from '../views/CustomersView.vue'
import ReportsView from '../views/ReportsView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/',
    component: PortalLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tasks',
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: TasksView,
      },
      {
        path: 'customers',
        name: 'Customers',
        component: CustomersView,
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsView,
      },
      {
        path: 'admin',
        name: 'Admin',
        component: AdminView,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/tasks',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const isAuthenticated = sessionStorage.getItem('auth') === 'true'

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && isAuthenticated) {
    return { name: 'Tasks' }
  }
})

export default router
