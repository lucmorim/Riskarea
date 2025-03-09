const baseUrl = import.meta.env.VITE_API_URL;

export async function useGetRequest(endpoint: string) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Erro na requisição GET:", error);
    return null;
  }
}

export async function usePostRequest(endpoint: string, body: any, headers: Record<string, string> = {}) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers // ✅ Permite adicionar headers personalizados
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json(); // ✅ Retorna os dados da resposta
  } catch (error) {
    console.error("❌ Erro na requisição POST:", error);
    return null;
  }
}

