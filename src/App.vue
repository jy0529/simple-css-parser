<template>
  <div id="container">
    <textarea id="editor" v-model="source"></textarea>
    <pre id="output"></pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref, watchEffect } from 'vue';
import { parse } from './parser';

export default defineComponent({
  name: 'App',
  setup() {
    let source: Ref = ref('');

    onMounted(() => {
      source.value = `
        h1, h2, h3 { margin: auto; color: #cc0000; }
        div.note { margin-bottom: 20px; padding: 10px; }
        #answer { display: none; }
      `;

      watchEffect(() => {
        let output = document.getElementById('output');
        if (output !== null) {
          try {
            output.innerHTML = JSON.stringify(parse(source.value), null, 2);
          } catch (error) {
            output.innerHTML = error;
          }
        }
      });
    });

    return {
      source,
    }
  }
})
</script>

<style>
html, body{
  width: 100%;
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 20px 0;
  height: 100%;
}
#container {
  display: flex;
  width: 100%;
  height: 90%;
  overflow-y: scroll;
}
#editor {
  flex: none;
  width: 40%;
  resize: none;
  overflow-y: scroll;
}
#output {
  flex: 1;
  border: 2px solid black;
  margin-right: 10px;
  overflow-y: scroll;
  margin: 0;
}
</style>
