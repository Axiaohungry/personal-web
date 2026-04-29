<script setup>
defineProps({
  language: {
    type: String,
    default: 'javascript',
  },
  code: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <figure class="study-code-block study-surface">
    <div class="study-code-block__header">
      <span class="study-code-block__language">{{ language }}</span>
      <span v-if="caption" class="study-code-block__caption">{{ caption }}</span>
    </div>
    <pre class="study-code-block__pre"><code class="study-code-block__code">{{ code }}</code></pre>
  </figure>
</template>
