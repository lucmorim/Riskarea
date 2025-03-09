import { ref } from "vue";

const logs = ref<string[]>([]);

export function useLog() {
  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    logs.value.unshift(`[${timestamp}] ${message}`);
    console.log(`[LOG] ${message}`);
  }

  return { logs, addLog };
}
