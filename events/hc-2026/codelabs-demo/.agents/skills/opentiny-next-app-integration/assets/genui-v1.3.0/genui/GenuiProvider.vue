<script setup lang="ts">
import { GenuiConfigProvider } from '@opentiny/genui-sdk-vue/config-provider'
import { materials } from '@opentiny/genui-sdk-materials-vue-opentiny-vue/materials'
import { getCurrentInstance } from 'vue'

const props = defineProps<{
  id?: string
}>()

const instance = getCurrentInstance()
const providerId = props.id ?? `tiny-robot-genui-${instance?.uid ?? 'provider'}`
</script>

<template>
  <GenuiConfigProvider :id="providerId" :materials="materials">
    <slot />
  </GenuiConfigProvider>
</template>
