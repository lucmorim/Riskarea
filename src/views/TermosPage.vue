<template>
    <ion-page>
        <ion-content :fullscreen="true" class="termo-content">
            <div class="termo-wrapper">
                <div class="termo-container">
                    <h1>📄 Termos de Uso</h1>

                    <p>
                        O <strong>RiskAlert</strong> utiliza dados públicos da internet para alertar sobre áreas de
                        risco.
                        Essas informações <strong>não são oficiais</strong> e podem conter erros ou estar
                        desatualizadas.
                    </p>

                    <p>
                        Ao utilizar o aplicativo, você concorda em fazê-lo por sua conta e risco, reconhecendo que o
                        conteúdo é meramente informativo.
                    </p>

                    <p>
                        O aplicativo respeita sua privacidade e utiliza sua localização apenas para fornecer os alertas.
                    </p>

                    <ion-button expand="block" color="success" @click="aceitarTermo">
                        ✅ Aceito os Termos de Uso
                    </ion-button>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { Preferences } from '@capacitor/preferences';
import { useRouter } from 'vue-router';
import { usePermissions } from '@/composables/usePermissions';

const router = useRouter();

const aceitarTermo = async () => {
    await Preferences.set({ key: 'aceitou_termos', value: 'true' });
    const permission = await usePermissions();
    if (permission) {
        router.replace('/tabs/mapa');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }else{
        window.location.reload();
    }
};
</script>

<style scoped>
.termo-content {
    --background: #f4f5f8;
    display: flex;
}

.termo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
}

.termo-container {
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 700px;
    width: 100%;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.termo-container h1 {
    font-size: 1.8rem;
    color: var(--ion-color-primary);
    margin-bottom: 16px;
}

.termo-container p {
    text-align: left;
    color: #333;
    line-height: 1.6;
    margin-bottom: 12px;
}
</style>