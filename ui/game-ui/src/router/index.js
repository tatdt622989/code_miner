import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

const routes = [
  {
    path: '/user/:userId',
    name: 'UserProfile',
    component: App
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
