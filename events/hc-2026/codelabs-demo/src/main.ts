import { initializeBuiltinWebMCP } from '@opentiny/next-sdk'
import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import { registerOrderTools } from './business/orders'
import { initializePageTool } from './tiny-robot-chat/pagetool/pagetool-init'
import './style.css'

initializeBuiltinWebMCP()
initializePageTool()
registerOrderTools(router)

const app = createApp(App)

app.use(router)
app.mount('#app')
