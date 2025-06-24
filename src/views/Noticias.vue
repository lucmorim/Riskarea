<template>
    <ion-page>
        <ion-content class="ion-padding">
            <ion-card>
                <ion-card-header>
                    <ion-card-title>Card Title</ion-card-title>
                    <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                    Here's a small text description for the card content. Nothing more, nothing less.
                </ion-card-content>

                <ion-button fill="clear">Action 1</ion-button>
                <ion-button fill="clear">Action 2</ion-button>
            </ion-card>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle
} from '@ionic/vue';

</script>

<style scoped>
.about-container {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.about-card {
    background: var(--ion-color-light);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h2 {
    color: var(--ion-color-primary);
    font-size: 1.8em;
    margin-bottom: 10px;
}

p {
    color: var(--ion-color-dark);
    line-height: 1.6;
    margin-bottom: 15px;
}

.highlight {
    color: var(--ion-color-danger);
    font-weight: bold;
    margin: 20px 0;
}

.small-text {
    font-size: 0.9em;
    margin-top: 20px;
}

ion-card {
    margin-top: 60px;
}
</style>