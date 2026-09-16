import {
  BubbleRendererMatchPriority,
  useMessageContent,
  type BubbleContentRendererMatch,
  type BubbleContentRendererProps,
} from '@opentiny/tiny-robot'
import { defineAsyncComponent, defineComponent, h, type ComputedRef } from 'vue'


const GenuiCard = defineAsyncComponent(async () => {
  const [{ GenuiRenderer: Renderer }, { default: Provider }] = await Promise.all([
    import('@opentiny/genui-sdk-vue/renderer'),
    import('./GenuiProvider.vue'),
  ])

  return defineComponent({
    name: 'GenuiCard',
    props: {
      content: { type: String, required: true },
      generating: { type: Boolean, default: false },
    },
    setup(props) {
      return () =>
        h(Provider, null, {
          default: () => h(Renderer, { content: props.content, generating: props.generating }),
        })
    },
  })
})

interface SchemaCardContent {
  type: 'schema-card'
  content: string
}

export function createGenuiRendererMatch(isGenerating: ComputedRef<boolean>): BubbleContentRendererMatch {
  return {
    find: (_, content) => content.type === 'schema-card',
    renderer: (props: BubbleContentRendererProps) => {
      const { content } = useMessageContent(props)
      const schemaCard = content.value as SchemaCardContent

      return h(GenuiCard, {
        content: schemaCard.content,
        generating: isGenerating.value,
      })
    },
    priority: BubbleRendererMatchPriority.CONTENT,
  }
}
